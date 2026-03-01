import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { journalLines, journalEntries, chartOfAccounts, accountTypes } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        accountId: journalLines.accountId,
        accountCode: chartOfAccounts.code,
        accountName: chartOfAccounts.name,
        accountCategory: accountTypes.category,
        normalBalance: accountTypes.normalBalance,
        displayOrder: accountTypes.displayOrder,
        totalDebit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyDebit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyCredit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, and(eq(journalLines.journalEntryId, journalEntries.id), eq(journalEntries.status, "posted")))
      .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
      .innerJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
      .where(eq(journalLines.organizationId, orgId))
      .groupBy(
        journalLines.accountId,
        chartOfAccounts.code,
        chartOfAccounts.name,
        accountTypes.category,
        accountTypes.normalBalance,
        accountTypes.displayOrder
      )
      .orderBy(accountTypes.displayOrder, chartOfAccounts.code);

    const result = rows.map((r) => ({
      accountId: r.accountId,
      accountCode: r.accountCode,
      accountName: r.accountName,
      accountCategory: r.accountCategory,
      normalBalance: r.normalBalance,
      debit: parseFloat(r.totalDebit),
      credit: parseFloat(r.totalCredit),
    }));

    return NextResponse.json({ rows: result });
  } catch (err) {
    console.error("GET /api/accounting/trial-balance error:", err);
    return NextResponse.json({ error: "Failed to fetch trial balance" }, { status: 500 });
  }
}
