import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  expenses,
  expenseLines,
  suppliers,
  bankAccounts,
  bankTransactions,
  chartOfAccounts,
  journalEntries,
  journalLines,
} from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: expenses.id,
        expenseNumber: expenses.expenseNumber,
        date: expenses.date,
        supplierId: expenses.supplierId,
        supplierName: expenses.supplierName,
        bankAccountId: expenses.bankAccountId,
        bankAccountName: bankAccounts.accountName,
        description: expenses.description,
        subtotal: expenses.subtotal,
        taxAmount: expenses.taxAmount,
        total: expenses.total,
        currency: expenses.currency,
        reference: expenses.reference,
        journalEntryId: expenses.journalEntryId,
        documentId: expenses.documentId,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(bankAccounts, eq(expenses.bankAccountId, bankAccounts.id))
      .where(eq(expenses.organizationId, orgId))
      .orderBy(desc(expenses.date), desc(expenses.createdAt));

    return NextResponse.json({ expenses: rows });
  } catch (err) {
    console.error("GET /api/purchases/expenses error:", err);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

type LineInput = {
  description: string;
  glAccountId: string;
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
    date: string;
    supplierId?: string;
    supplierName?: string;
    bankAccountId: string;
    description?: string;
    currency?: string;
    reference?: string;
    lines: LineInput[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, bankAccountId, currency = "AED", lines } = body;

  if (!date || !bankAccountId || !lines || lines.length === 0) {
    return NextResponse.json({ error: "Missing: date, bankAccountId, lines" }, { status: 400 });
  }

  // Validate bank account
  const [ba] = await db
    .select({ id: bankAccounts.id, ledgerAccountId: bankAccounts.ledgerAccountId, currentBalance: bankAccounts.currentBalance })
    .from(bankAccounts)
    .where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.organizationId, orgId)))
    .limit(1);
  if (!ba) return NextResponse.json({ error: "Invalid bank account" }, { status: 400 });

  // Resolve bank ledger account
  let cashAccountId = ba.ledgerAccountId;
  if (!cashAccountId) {
    const [cashAcct] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1010"))).limit(1);
    cashAccountId = cashAcct?.id ?? null;
  }
  if (!cashAccountId) {
    return NextResponse.json({ error: "No cash/bank ledger account found" }, { status: 400 });
  }

  // Validate GL accounts
  for (const line of lines) {
    if (!line.glAccountId || !line.description?.trim()) {
      return NextResponse.json({ error: "Each line needs description and GL account" }, { status: 400 });
    }
    const [gl] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.id, line.glAccountId), eq(chartOfAccounts.organizationId, orgId))).limit(1);
    if (!gl) return NextResponse.json({ error: `Invalid GL account: ${line.description}` }, { status: 400 });
  }

  const subtotal = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const taxAmount = lines.reduce((s, l) => s + (l.taxAmount || 0), 0);
  const total = subtotal + taxAmount;
  if (total <= 0) return NextResponse.json({ error: "Total must be > 0" }, { status: 400 });

  // Resolve supplier name
  let supplierName = body.supplierName?.trim() || "";
  if (body.supplierId && !supplierName) {
    const [supp] = await db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.id, body.supplierId)).limit(1);
    supplierName = supp?.name ?? "";
  }

  try {
    // Generate expense number
    const ym = date.slice(0, 7).replace("-", "");
    const [countRow] = await db.select({ c: count() }).from(expenses).where(eq(expenses.organizationId, orgId));
    const seq = (Number(countRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const expenseNumber = `EXP-${ym}-${seq}`;

    // Insert expense
    const [exp] = await db
      .insert(expenses)
      .values({
        organizationId: orgId,
        expenseNumber,
        date,
        supplierId: body.supplierId || null,
        supplierName,
        bankAccountId,
        description: body.description?.trim() || null,
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        total: String(total),
        currency,
        reference: body.reference?.trim() || null,
      })
      .returning({ id: expenses.id });

    if (!exp) return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });

    // Insert expense lines
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await db.insert(expenseLines).values({
        expenseId: exp.id,
        description: l.description.trim(),
        glAccountId: l.glAccountId,
        quantity: String(l.quantity ?? 1),
        unitPrice: String(l.unitPrice ?? 0),
        amount: String(l.amount ?? 0),
        taxRate: String(l.taxRate ?? 5),
        taxAmount: String(l.taxAmount ?? 0),
        lineOrder: i + 1,
      });
    }

    // Create journal entry: Dr Expense(s), Dr VAT Input, Cr Bank
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
          description: `Expense — ${supplierName || expenseNumber}`,
          reference: exp.id,
          sourceType: "expense",
          sourceId: exp.id,
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

        for (const l of lines) {
          const net = Number(l.amount) || 0;
          const tax = Number(l.taxAmount) || 0;
          if (net > 0) {
            jl.push({
              journalEntryId: je.id,
              organizationId: orgId,
              accountId: l.glAccountId,
              description: l.description.trim(),
              debit: String(net),
              credit: "0",
              currency,
              baseCurrencyDebit: String(net),
              baseCurrencyCredit: "0",
              lineOrder: lineOrder++,
            });
          }
          if (tax > 0) {
            const [vatInput] = await db.select({ id: chartOfAccounts.id }).from(chartOfAccounts).where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1450"))).limit(1);
            if (vatInput) {
              jl.push({
                journalEntryId: je.id,
                organizationId: orgId,
                accountId: vatInput.id,
                description: `VAT input — ${l.description.trim()}`,
                debit: String(tax),
                credit: "0",
                currency,
                baseCurrencyDebit: String(tax),
                baseCurrencyCredit: "0",
                taxCode: "VAT5",
                taxAmount: String(tax),
                lineOrder: lineOrder++,
              });
            }
          }
        }

        // Credit: Bank/Cash
        jl.push({
          journalEntryId: je.id,
          organizationId: orgId,
          accountId: cashAccountId!,
          description: `Payment — ${supplierName || expenseNumber}`,
          debit: "0",
          credit: String(total),
          currency,
          baseCurrencyDebit: "0",
          baseCurrencyCredit: String(total),
          lineOrder: lineOrder++,
        });

        if (jl.length > 0) await db.insert(journalLines).values(jl);
      }
    }

    // Update expense with journal entry id
    if (journalEntryId) {
      await db.update(expenses).set({ journalEntryId }).where(eq(expenses.id, exp.id));
    }

    // Create bank transaction (debit)
    await db.insert(bankTransactions).values({
      organizationId: orgId,
      bankAccountId,
      transactionDate: date,
      description: `Expense — ${supplierName || expenseNumber}`,
      amount: String(total),
      type: "debit",
      reference: exp.id,
      category: "expense",
    });

    // Update bank account balance
    const bal = parseFloat(ba.currentBalance ?? "0") - total;
    await db.update(bankAccounts).set({ currentBalance: String(bal) }).where(eq(bankAccounts.id, bankAccountId));

    return NextResponse.json({ ok: true, expense: { id: exp.id, expenseNumber } });
  } catch (err) {
    console.error("POST /api/purchases/expenses error:", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
