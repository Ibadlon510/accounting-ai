import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankTransactions, bankAccounts, chartOfAccounts, journalEntries, journalLines } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: bankTransactions.id,
        bankAccountId: bankTransactions.bankAccountId,
        transactionDate: bankTransactions.transactionDate,
        description: bankTransactions.description,
        amount: bankTransactions.amount,
        type: bankTransactions.type,
        reference: bankTransactions.reference,
        transferReference: bankTransactions.transferReference,
      })
      .from(bankTransactions)
      .where(and(eq(bankTransactions.organizationId, orgId), eq(bankTransactions.type, "credit")))
      .orderBy(desc(bankTransactions.transactionDate));

    const credits = rows.filter((r) => r.transferReference);
    const refs = [...new Set(credits.map((r) => r.transferReference).filter(Boolean))] as string[];

    const pairs: { id: string; date: string; fromAccountId: string; fromAccountName: string; toAccountId: string; toAccountName: string; amount: number; reference: string | null }[] = [];

    const accts = await db.select({ id: bankAccounts.id, accountName: bankAccounts.accountName }).from(bankAccounts).where(eq(bankAccounts.organizationId, orgId));
    const accountMap = new Map(accts.map((a) => [a.id, a.accountName]));

    for (const ref of refs) {
      const creditRows = credits.filter((r) => r.transferReference === ref);
      const [credit] = creditRows;
      if (!credit) continue;

      const debitRows = await db
        .select({
          id: bankTransactions.id,
          bankAccountId: bankTransactions.bankAccountId,
          transactionDate: bankTransactions.transactionDate,
          amount: bankTransactions.amount,
        })
        .from(bankTransactions)
        .where(
          and(
            eq(bankTransactions.organizationId, orgId),
            eq(bankTransactions.type, "debit"),
            eq(bankTransactions.transferReference, ref)
          )
        )
        .limit(1);

      const [debit] = debitRows;
      if (!debit || !credit.bankAccountId || !debit.bankAccountId) continue;

      pairs.push({
        id: credit.id,
        date: credit.transactionDate ?? "",
        fromAccountId: debit.bankAccountId,
        fromAccountName: accountMap.get(debit.bankAccountId) ?? "",
        toAccountId: credit.bankAccountId,
        toAccountName: accountMap.get(credit.bankAccountId) ?? "",
        amount: parseFloat(credit.amount ?? "0"),
        reference: credit.reference,
      });
    }

    pairs.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

    return NextResponse.json({ transfers: pairs });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load transfers";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type TransferBody = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  reference?: string;
};

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: TransferBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fromAccountId, toAccountId, amount, date, reference } = body;
  if (!fromAccountId || !toAccountId || typeof amount !== "number" || amount <= 0 || !date) {
    return NextResponse.json({ error: "Missing or invalid: fromAccountId, toAccountId, amount, date" }, { status: 400 });
  }

  if (fromAccountId === toAccountId) {
    return NextResponse.json({ error: "From and to accounts must be different" }, { status: 400 });
  }

  const [fromAcc, toAcc] = await Promise.all([
    db.select().from(bankAccounts).where(and(eq(bankAccounts.id, fromAccountId), eq(bankAccounts.organizationId, orgId))).limit(1),
    db.select().from(bankAccounts).where(and(eq(bankAccounts.id, toAccountId), eq(bankAccounts.organizationId, orgId))).limit(1),
  ]);

  if (!fromAcc[0] || !toAcc[0]) {
    return NextResponse.json({ error: "Invalid bank accounts" }, { status: 400 });
  }

  const fromBalance = parseFloat(fromAcc[0].currentBalance ?? "0");
  if (amount > fromBalance) {
    return NextResponse.json({ error: `Insufficient balance. Available: ${fromAcc[0].currency ?? "AED"} ${fromBalance.toFixed(2)}` }, { status: 400 });
  }

  const transferRef = `TRF-${date.slice(0, 7).replace("-", "")}-${Date.now().toString(36).toUpperCase()}`;

  try {
    await db.transaction(async (tx) => {
    await tx.insert(bankTransactions).values([
      {
        organizationId: orgId,
        bankAccountId: fromAccountId,
        transactionDate: date,
        description: `Transfer to ${toAcc[0].accountName}`,
        amount: String(amount),
        type: "debit",
        reference: reference ?? transferRef,
        category: "inter_account_transfer",
        transferReference: transferRef,
      },
      {
        organizationId: orgId,
        bankAccountId: toAccountId,
        transactionDate: date,
        description: `Transfer from ${fromAcc[0].accountName}`,
        amount: String(amount),
        type: "credit",
        reference: reference ?? transferRef,
        category: "inter_account_transfer",
        transferReference: transferRef,
      },
    ]);

    const fromBal = parseFloat(fromAcc[0].currentBalance ?? "0") - amount;
    const toBal = parseFloat(toAcc[0].currentBalance ?? "0") + amount;
    await tx.update(bankAccounts).set({ currentBalance: String(fromBal) }).where(eq(bankAccounts.id, fromAccountId));
    await tx.update(bankAccounts).set({ currentBalance: String(toBal) }).where(eq(bankAccounts.id, toAccountId));

    const fromLedgerId = fromAcc[0].ledgerAccountId;
    const toLedgerId = toAcc[0].ledgerAccountId;
    if (fromLedgerId && toLedgerId) {
      const periodId = await resolveOrCreatePeriod(orgId, date, tx);
      if (periodId) {
        const [entryCountRow] = await tx.select({ c: count() }).from(journalEntries).where(eq(journalEntries.organizationId, orgId));
        const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
        const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
        const [je] = await tx
          .insert(journalEntries)
          .values({
            organizationId: orgId,
            periodId,
            entryNumber,
            entryDate: date,
            description: `Transfer ${fromAcc[0].accountName} → ${toAcc[0].accountName}`,
            reference: transferRef,
            sourceType: "transfer",
            sourceId: null,
            status: "posted",
            currency: "AED",
            totalDebit: String(amount),
            totalCredit: String(amount),
            postedAt: new Date(),
          })
          .returning();

        if (je) {
          await tx.insert(journalLines).values([
            { journalEntryId: je.id, organizationId: orgId, accountId: toLedgerId, description: `Transfer to ${toAcc[0].accountName}`, debit: String(amount), credit: "0", currency: "AED", baseCurrencyDebit: String(amount), baseCurrencyCredit: "0", lineOrder: 1 },
            { journalEntryId: je.id, organizationId: orgId, accountId: fromLedgerId, description: `Transfer from ${fromAcc[0].accountName}`, debit: "0", credit: String(amount), currency: "AED", baseCurrencyDebit: "0", baseCurrencyCredit: String(amount), lineOrder: 2 },
          ]);
        }
      }
    }
    });
    return NextResponse.json({ ok: true, transferReference: transferRef });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create transfer";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
