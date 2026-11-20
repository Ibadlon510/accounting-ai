import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  bills,
  billLines,
  suppliers,
  chartOfAccounts,
  journalEntries,
  journalLines,
  organizations,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";
import {
  applyBillStockIn,
  resolveBillLineDebitAccount,
} from "@/lib/inventory/stock-movements";

type DbClient = typeof db;
type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function createBillJournalEntry(
  orgId: string,
  billId: string,
  client: DbClient | TxClient = db
) {
  const [bill] = await (client as DbClient)
    .select({
      id: bills.id,
      billNumber: bills.billNumber,
      supplierId: bills.supplierId,
      issueDate: bills.issueDate,
      subtotal: bills.subtotal,
      taxAmount: bills.taxAmount,
      total: bills.total,
      currency: bills.currency,
      journalEntryId: bills.journalEntryId,
    })
    .from(bills)
    .where(and(eq(bills.id, billId), eq(bills.organizationId, orgId)))
    .limit(1);

  if (!bill || bill.journalEntryId) return; // already has JE

  const [org] = await (client as DbClient)
    .select({ isVatRegistered: organizations.isVatRegistered })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const [supp] = await (client as DbClient)
    .select({ name: suppliers.name })
    .from(suppliers)
    .where(eq(suppliers.id, bill.supplierId))
    .limit(1);
  const supplierName = supp?.name ?? "Supplier";

  const total = parseFloat(bill.total ?? "0");
  if (total <= 0) return;

  // Get bill lines for per-line GL posting
  const lines = await (client as DbClient)
    .select({
      description: billLines.description,
      amount: billLines.amount,
      taxAmount: billLines.taxAmount,
      taxCode: billLines.taxCode,
      accountId: billLines.accountId,
      itemId: billLines.itemId,
    })
    .from(billLines)
    .where(eq(billLines.billId, billId))
    .orderBy(billLines.lineOrder);

  const periodId = await resolveOrCreatePeriod(orgId, bill.issueDate, client);
  if (!periodId) return;

  const [defaultExpenseAccount] = await (client as DbClient)
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "6300")))
    .limit(1);
  const [vatInputAccount] = await (client as DbClient)
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1450")))
    .limit(1);
  const [apAccount] = await (client as DbClient)
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2010")))
    .limit(1);

  if (!apAccount) return;

  const ym = bill.issueDate.slice(0, 7).replace("-", "");
  const [entryCountRow] = await (client as DbClient)
    .select({ c: count() })
    .from(journalEntries)
    .where(eq(journalEntries.organizationId, orgId));
  const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
  const entryNumber = `JE-${ym}-${seq}`;

  const [je] = await (client as DbClient)
    .insert(journalEntries)
    .values({
      organizationId: orgId,
      periodId,
      entryNumber,
      entryDate: bill.issueDate,
      description: `Bill ${bill.billNumber} — ${supplierName}`,
      reference: bill.id,
      sourceType: "bill",
      sourceId: bill.id,
      status: "posted",
      currency: bill.currency ?? "AED",
      totalDebit: String(total),
      totalCredit: String(total),
      postedAt: new Date(),
    })
    .returning({ id: journalEntries.id });

  if (!je) return;

  const jl: (typeof journalLines.$inferInsert)[] = [];
  const cur = bill.currency ?? "AED";
  let lineOrder = 1;

  for (const l of lines) {
    const resolved = await resolveBillLineDebitAccount({
      organizationId: orgId,
      itemId: l.itemId,
      fallbackExpenseAccountId: l.accountId || defaultExpenseAccount?.id,
      tx: client,
    });
    const lineGl = resolved.accountId;
    const net = parseFloat(l.amount ?? "0");
    const tax = parseFloat(l.taxAmount ?? "0");
    if (net > 0 && lineGl) {
      jl.push({
        journalEntryId: je.id,
        organizationId: orgId,
        accountId: lineGl,
        description: resolved.isStock
          ? `Inventory — ${resolved.itemName ?? (l.description?.trim() || "stock")}`
          : `${supplierName} — ${l.description?.trim() || "expense"}`,
        debit: String(net),
        credit: "0",
        currency: cur,
        baseCurrencyDebit: String(net),
        baseCurrencyCredit: "0",
        lineOrder: lineOrder++,
      });
    }
    if (org?.isVatRegistered && tax > 0 && vatInputAccount) {
      jl.push({
        journalEntryId: je.id,
        organizationId: orgId,
        accountId: vatInputAccount.id,
        description: `VAT input — ${l.description?.trim() || supplierName}`,
        debit: String(tax),
        credit: "0",
        currency: cur,
        baseCurrencyDebit: String(tax),
        baseCurrencyCredit: "0",
        taxCode: l.taxCode || "SR",
        taxAmount: String(tax),
        lineOrder: lineOrder++,
      });
    }
  }

  // Credit: Accounts Payable
  jl.push({
    journalEntryId: je.id,
    organizationId: orgId,
    accountId: apAccount.id,
    description: `Payable — ${supplierName}`,
    debit: "0",
    credit: String(total),
    currency: cur,
    baseCurrencyDebit: "0",
    baseCurrencyCredit: String(total),
    lineOrder: lineOrder++,
  });

  if (jl.length > 0) await (client as DbClient).insert(journalLines).values(jl);
  await (client as DbClient)
    .update(bills)
    .set({ journalEntryId: je.id })
    .where(eq(bills.id, bill.id));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Bill ID required" }, { status: 400 });

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;
  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const allowedStatuses = ["draft", "received", "paid", "partial", "overdue", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select({
        id: bills.id,
        status: bills.status,
        journalEntryId: bills.journalEntryId,
        billNumber: bills.billNumber,
      })
      .from(bills)
      .where(and(eq(bills.id, id), eq(bills.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const shouldPost = status === "received" && existing.status === "draft";

    let updated: { id: string; billNumber: string; status: string } | undefined;

    if (shouldPost) {
      // Status + AP/expense-or-inventory JE + stock in / weighted avg in one transaction
      updated = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(bills)
          .set({ status })
          .where(and(eq(bills.id, id), eq(bills.organizationId, orgId)))
          .returning({
            id: bills.id,
            billNumber: bills.billNumber,
            status: bills.status,
          });

        if (!existing.journalEntryId) {
          await createBillJournalEntry(orgId, id, tx);
        }

        await applyBillStockIn({
          organizationId: orgId,
          billId: id,
          billNumber: existing.billNumber,
          tx,
        });

        return row;
      });
    } else {
      const [row] = await db
        .update(bills)
        .set({ status })
        .where(and(eq(bills.id, id), eq(bills.organizationId, orgId)))
        .returning({
          id: bills.id,
          billNumber: bills.billNumber,
          status: bills.status,
        });
      updated = row;
    }

    return NextResponse.json({ bill: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update bill";
    console.error("Bill PATCH error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
