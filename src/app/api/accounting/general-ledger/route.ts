import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { journalLines, journalEntries, chartOfAccounts, accountTypes } from "@/lib/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    // Return account balances summary
    const rows = await db
      .select({
        accountId: journalLines.accountId,
        totalDebit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyDebit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyCredit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, and(eq(journalLines.journalEntryId, journalEntries.id), eq(journalEntries.status, "posted")))
      .where(eq(journalLines.organizationId, orgId))
      .groupBy(journalLines.accountId);

    const balances: Record<string, number> = {};
    for (const r of rows) {
      balances[r.accountId] = parseFloat(r.totalDebit) - parseFloat(r.totalCredit);
    }
    return NextResponse.json({ balances });
  }

  // Return ledger entries for a specific account
  try {
    const entries = await db
      .select({
        date: journalEntries.entryDate,
        entryNumber: journalEntries.entryNumber,
        description: journalLines.description,
        reference: journalEntries.reference,
        debit: journalLines.baseCurrencyDebit,
        credit: journalLines.baseCurrencyCredit,
      })
      .from(journalLines)
      .innerJoin(journalEntries, and(eq(journalLines.journalEntryId, journalEntries.id), eq(journalEntries.status, "posted")))
      .where(and(eq(journalLines.organizationId, orgId), eq(journalLines.accountId, accountId)))
      .orderBy(asc(journalEntries.entryDate), asc(journalEntries.entryNumber));

    // Compute running balance
    let balance = 0;
    const result = entries.map((e) => {
      const debit = parseFloat(e.debit ?? "0");
      const credit = parseFloat(e.credit ?? "0");
      balance += debit - credit;
      return {
        date: e.date,
        entryNumber: e.entryNumber,
        description: e.description,
        reference: e.reference,
        debit,
        credit,
        balance,
      };
    });

    return NextResponse.json({ entries: result });
  } catch (err) {
    console.error("GET /api/accounting/general-ledger error:", err);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}
