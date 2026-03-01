import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { journalLines, journalEntries, chartOfAccounts, accountTypes } from "@/lib/db/schema";
import { eq, and, sql, lte, gte } from "drizzle-orm";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");     // YYYY-MM-DD

  try {
    const conditions = [
      eq(journalLines.organizationId, orgId),
    ];
    if (from) conditions.push(gte(journalEntries.entryDate, from));
    if (to) conditions.push(lte(journalEntries.entryDate, to));

    const rows = await db
      .select({
        accountId: chartOfAccounts.id,
        accountCode: chartOfAccounts.code,
        accountName: chartOfAccounts.name,
        category: accountTypes.category,
        typeName: accountTypes.name,
        normalBalance: accountTypes.normalBalance,
        displayOrder: accountTypes.displayOrder,
        totalDebit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyDebit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyCredit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, and(
        eq(journalLines.journalEntryId, journalEntries.id),
        eq(journalEntries.status, "posted")
      ))
      .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
      .innerJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
      .where(and(...conditions))
      .groupBy(
        chartOfAccounts.id,
        chartOfAccounts.code,
        chartOfAccounts.name,
        accountTypes.category,
        accountTypes.name,
        accountTypes.normalBalance,
        accountTypes.displayOrder
      )
      .orderBy(accountTypes.displayOrder, chartOfAccounts.code);

    // Organize by category for P&L and BS
    const revenue: { code: string; name: string; amount: number }[] = [];
    const expense: { code: string; name: string; amount: number }[] = [];
    const asset: { code: string; name: string; amount: number }[] = [];
    const liability: { code: string; name: string; amount: number }[] = [];
    const equity: { code: string; name: string; amount: number }[] = [];

    for (const r of rows) {
      const debit = parseFloat(r.totalDebit);
      const credit = parseFloat(r.totalCredit);
      // Balance = debit - credit for debit-normal accounts, credit - debit for credit-normal
      const balance = r.normalBalance === "debit" ? debit - credit : credit - debit;
      if (Math.abs(balance) < 0.005) continue; // skip zero-balance accounts

      const entry = { code: r.accountCode, name: r.accountName, amount: balance };

      switch (r.category) {
        case "revenue": revenue.push(entry); break;
        case "expense": expense.push(entry); break;
        case "asset": asset.push(entry); break;
        case "liability": liability.push(entry); break;
        case "equity": equity.push(entry); break;
      }
    }

    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expense.reduce((s, r) => s + r.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    const totalAssets = asset.reduce((s, r) => s + r.amount, 0);
    const totalLiabilities = liability.reduce((s, r) => s + r.amount, 0);
    const totalEquity = equity.reduce((s, r) => s + r.amount, 0);

    return NextResponse.json({
      pnl: { revenue, expense, totalRevenue, totalExpenses, netIncome },
      bs: { asset, liability, equity, totalAssets, totalLiabilities, totalEquity, retainedEarnings: netIncome },
    });
  } catch (err) {
    console.error("GET /api/accounting/report-data error:", err);
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}
