import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  creditNotes,
  creditNoteLines,
  customers,
  suppliers,
  invoices,
  bills,
  chartOfAccounts,
  journalEntries,
  journalLines,
} from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "sales" or "purchase"

  try {
    const baseQuery = db
      .select({
        id: creditNotes.id,
        creditNoteNumber: creditNotes.creditNoteNumber,
        creditNoteType: creditNotes.creditNoteType,
        date: creditNotes.date,
        customerId: creditNotes.customerId,
        customerName: customers.name,
        supplierId: creditNotes.supplierId,
        supplierName: suppliers.name,
        invoiceId: creditNotes.invoiceId,
        billId: creditNotes.billId,
        reason: creditNotes.reason,
        subtotal: creditNotes.subtotal,
        taxAmount: creditNotes.taxAmount,
        total: creditNotes.total,
        currency: creditNotes.currency,
        status: creditNotes.status,
        journalEntryId: creditNotes.journalEntryId,
        createdAt: creditNotes.createdAt,
      })
      .from(creditNotes)
      .leftJoin(customers, eq(creditNotes.customerId, customers.id))
      .leftJoin(suppliers, eq(creditNotes.supplierId, suppliers.id))
      .where(
        type
          ? and(eq(creditNotes.organizationId, orgId), eq(creditNotes.creditNoteType, type))
          : eq(creditNotes.organizationId, orgId)
      )
      .orderBy(desc(creditNotes.date), desc(creditNotes.createdAt));

    const rows = await baseQuery;
    return NextResponse.json({ creditNotes: rows });
  } catch (err) {
    console.error("GET /api/accounting/credit-notes error:", err);
    return NextResponse.json({ error: "Failed to fetch credit notes" }, { status: 500 });
  }
}

type LineInput = {
  description: string;
  accountId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
};

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    creditNoteType: "sales" | "purchase";
    date: string;
    customerId?: string;
    supplierId?: string;
    invoiceId?: string;
    billId?: string;
    reason?: string;
    currency?: string;
    lines: LineInput[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { creditNoteType, date, currency = "AED", lines } = body;

  if (!creditNoteType || !date || !lines || lines.length === 0) {
    return NextResponse.json({ error: "Missing: creditNoteType, date, lines" }, { status: 400 });
  }

  if (creditNoteType === "sales" && !body.customerId) {
    return NextResponse.json({ error: "Customer is required for sales credit notes" }, { status: 400 });
  }
  if (creditNoteType === "purchase" && !body.supplierId) {
    return NextResponse.json({ error: "Supplier is required for purchase credit notes" }, { status: 400 });
  }

  const subtotal = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const taxAmount = lines.reduce((s, l) => s + (l.taxAmount || 0), 0);
  const total = subtotal + taxAmount;
  if (total <= 0) return NextResponse.json({ error: "Total must be > 0" }, { status: 400 });

  // Resolve entity name
  let entityName = "";
  if (creditNoteType === "sales" && body.customerId) {
    const [c] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, body.customerId)).limit(1);
    entityName = c?.name ?? "Customer";
  } else if (creditNoteType === "purchase" && body.supplierId) {
    const [s] = await db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.id, body.supplierId)).limit(1);
    entityName = s?.name ?? "Supplier";
  }

  try {
    // Generate credit note number
    const prefix = creditNoteType === "sales" ? "SCN" : "PCN";
    const ym = date.slice(0, 7).replace("-", "");
    const [countRow] = await db.select({ c: count() }).from(creditNotes).where(eq(creditNotes.organizationId, orgId));
    const seq = (Number(countRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const creditNoteNumber = `${prefix}-${ym}-${seq}`;

    // Insert credit note
    const [cn] = await db
      .insert(creditNotes)
      .values({
        organizationId: orgId,
        creditNoteNumber,
        creditNoteType,
        date,
        customerId: body.customerId || null,
        supplierId: body.supplierId || null,
        invoiceId: body.invoiceId || null,
        billId: body.billId || null,
        reason: body.reason?.trim() || null,
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        total: String(total),
        currency,
        status: "confirmed",
      })
      .returning({ id: creditNotes.id });

    if (!cn) return NextResponse.json({ error: "Failed to create credit note" }, { status: 500 });

    // Insert lines
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await db.insert(creditNoteLines).values({
        creditNoteId: cn.id,
        description: l.description.trim(),
        accountId: l.accountId,
        quantity: String(l.quantity ?? 1),
        unitPrice: String(l.unitPrice ?? 0),
        amount: String(l.amount ?? 0),
        taxRate: String(l.taxRate ?? 5),
        taxAmount: String(l.taxAmount ?? 0),
        lineOrder: i + 1,
      });
    }

    // Create journal entry
    // Sales CN: Dr Revenue, Cr AR (reverses original invoice JE)
    // Purchase CN: Dr AP, Cr Expense (reverses original bill JE)
    const periodId = await resolveOrCreatePeriod(orgId, date);
    let journalEntryId: string | null = null;

    if (periodId) {
      const [entryCountRow] = await db.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
      const jeSeq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
      const entryNumber = `JE-${ym}-${jeSeq}`;

      const [je] = await db
        .insert(journalEntries)
        .values({
          organizationId: orgId,
          periodId,
          entryNumber,
          entryDate: date,
          description: `Credit Note ${creditNoteNumber} — ${entityName}`,
          reference: cn.id,
          sourceType: "credit_note",
          sourceId: cn.id,
          status: "posted",
          currency,
          totalDebit: String(total),
          totalCredit: String(total),
          postedAt: new Date(),
        })
        .returning({ id: journalEntries.id });

      if (je) {
        journalEntryId = je.id;
        const jl: (typeof journalLines.$inferInsert)[] = [];
        let lineOrder = 1;

        if (creditNoteType === "sales") {
          // Dr Revenue (or line accounts), Dr VAT Output → Cr AR
          const [arAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1210"))).limit(1);
          const [vatAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2200"))).limit(1);

          for (const l of lines) {
            const net = Number(l.amount) || 0;
            const tax = Number(l.taxAmount) || 0;
            if (net > 0) {
              jl.push({
                journalEntryId: je.id, organizationId: orgId, accountId: l.accountId,
                description: `CN Revenue reversal — ${l.description.trim()}`,
                debit: String(net), credit: "0", currency,
                baseCurrencyDebit: String(net), baseCurrencyCredit: "0", lineOrder: lineOrder++,
              });
            }
            if (tax > 0 && vatAccount) {
              jl.push({
                journalEntryId: je.id, organizationId: orgId, accountId: vatAccount.id,
                description: `CN VAT output reversal — ${l.description.trim()}`,
                debit: String(tax), credit: "0", currency,
                baseCurrencyDebit: String(tax), baseCurrencyCredit: "0",
                taxCode: "VAT5", taxAmount: String(tax), lineOrder: lineOrder++,
              });
            }
          }
          if (arAccount) {
            jl.push({
              journalEntryId: je.id, organizationId: orgId, accountId: arAccount.id,
              description: `CN AR reversal — ${entityName}`,
              debit: "0", credit: String(total), currency,
              baseCurrencyDebit: "0", baseCurrencyCredit: String(total), lineOrder: lineOrder++,
            });
          }
        } else {
          // Purchase CN: Dr AP → Cr Expense (line accounts), Cr VAT Input
          const [apAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "2010"))).limit(1);
          const [vatInputAccount] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1450"))).limit(1);

          if (apAccount) {
            jl.push({
              journalEntryId: je.id, organizationId: orgId, accountId: apAccount.id,
              description: `CN AP reversal — ${entityName}`,
              debit: String(total), credit: "0", currency,
              baseCurrencyDebit: String(total), baseCurrencyCredit: "0", lineOrder: lineOrder++,
            });
          }
          for (const l of lines) {
            const net = Number(l.amount) || 0;
            const tax = Number(l.taxAmount) || 0;
            if (net > 0) {
              jl.push({
                journalEntryId: je.id, organizationId: orgId, accountId: l.accountId,
                description: `CN Expense reversal — ${l.description.trim()}`,
                debit: "0", credit: String(net), currency,
                baseCurrencyDebit: "0", baseCurrencyCredit: String(net), lineOrder: lineOrder++,
              });
            }
            if (tax > 0 && vatInputAccount) {
              jl.push({
                journalEntryId: je.id, organizationId: orgId, accountId: vatInputAccount.id,
                description: `CN VAT input reversal — ${l.description.trim()}`,
                debit: "0", credit: String(tax), currency,
                baseCurrencyDebit: "0", baseCurrencyCredit: String(tax),
                taxCode: "VAT5", taxAmount: String(tax), lineOrder: lineOrder++,
              });
            }
          }
        }

        if (jl.length > 0) await db.insert(journalLines).values(jl);
      }
    }

    // Update credit note with JE id
    if (journalEntryId) {
      await db.update(creditNotes).set({ journalEntryId }).where(eq(creditNotes.id, cn.id));
    }

    // If linked to invoice/bill, reduce amount due
    if (creditNoteType === "sales" && body.invoiceId) {
      const [inv] = await db.select({ amountDue: invoices.amountDue }).from(invoices).where(eq(invoices.id, body.invoiceId)).limit(1);
      if (inv) {
        const newDue = Math.max(0, parseFloat(inv.amountDue ?? "0") - total);
        await db.update(invoices).set({ amountDue: String(newDue) }).where(eq(invoices.id, body.invoiceId));
      }
    }
    if (creditNoteType === "purchase" && body.billId) {
      const [bill] = await db.select({ amountDue: bills.amountDue }).from(bills).where(eq(bills.id, body.billId)).limit(1);
      if (bill) {
        const newDue = Math.max(0, parseFloat(bill.amountDue ?? "0") - total);
        await db.update(bills).set({ amountDue: String(newDue) }).where(eq(bills.id, body.billId));
      }
    }

    return NextResponse.json({ ok: true, creditNote: { id: cn.id, creditNoteNumber } });
  } catch (err) {
    console.error("POST /api/accounting/credit-notes error:", err);
    return NextResponse.json({ error: "Failed to create credit note" }, { status: 500 });
  }
}
