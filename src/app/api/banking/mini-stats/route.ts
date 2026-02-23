import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankAccounts, bankTransactions, chartOfAccounts, journalEntries, journalLines } from "@/lib/db/schema";
import { eq, and, sql, desc, inArray, notInArray } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accountRows = await db
      .select({
        id: bankAccounts.id,
        accountName: bankAccounts.accountName,
        currentBalance: bankAccounts.currentBalance,
      })
      .from(bankAccounts)
      .where(and(eq(bankAccounts.organizationId, orgId), eq(bankAccounts.isActive, true)));

    const txnRows = await db
      .select({
        count: sql<number>`count(*)::int`,
        reconciled: sql<number>`count(*) filter (where ${bankTransactions.isReconciled} = true)::int`,
        withSuggestion: sql<number>`count(*) filter (where ${bankTransactions.suggestedAccountId} is not null)::int`,
      })
      .from(bankTransactions)
      .where(eq(bankTransactions.organizationId, orgId));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = sixMonthsAgo.toISOString().slice(0, 10);

    const monthlyRows = await db
      .select({
        month: sql<string>`to_char(${bankTransactions.transactionDate}::date, 'YYYY-MM')`,
        credits: sql<string>`coalesce(sum(case when ${bankTransactions.type} = 'credit' then ${bankTransactions.amount}::numeric else 0 end), 0)`,
        debits: sql<string>`coalesce(sum(case when ${bankTransactions.type} = 'debit' then ${bankTransactions.amount}::numeric else 0 end), 0)`,
      })
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, orgId),
          sql`${bankTransactions.transactionDate}::date >= ${startDate}`
        )
      )
      .groupBy(sql`to_char(${bankTransactions.transactionDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${bankTransactions.transactionDate}::date, 'YYYY-MM')`);

    const recentTxns = await db
      .select({
        id: bankTransactions.id,
        description: bankTransactions.description,
        amount: bankTransactions.amount,
        type: bankTransactions.type,
        transactionDate: bankTransactions.transactionDate,
      })
      .from(bankTransactions)
      .where(eq(bankTransactions.organizationId, orgId))
      .orderBy(desc(bankTransactions.transactionDate))
      .limit(5);

    const largestTxns = await db
      .select({
        id: bankTransactions.id,
        description: bankTransactions.description,
        amount: bankTransactions.amount,
        type: bankTransactions.type,
        transactionDate: bankTransactions.transactionDate,
      })
      .from(bankTransactions)
      .where(eq(bankTransactions.organizationId, orgId))
      .orderBy(sql`abs(${bankTransactions.amount}::numeric) desc`)
      .limit(5);

    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthRows = await db
      .select({
        credits: sql<string>`coalesce(sum(case when ${bankTransactions.type} = 'credit' then ${bankTransactions.amount}::numeric else 0 end), 0)`,
        debits: sql<string>`coalesce(sum(case when ${bankTransactions.type} = 'debit' then ${bankTransactions.amount}::numeric else 0 end), 0)`,
      })
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.organizationId, orgId),
          sql`to_char(${bankTransactions.transactionDate}::date, 'YYYY-MM') = ${thisMonth}`
        )
      );

    const totalBalance = accountRows.reduce((s, r) => s + parseFloat(r.currentBalance ?? "0"), 0);
    const totalCount = txnRows[0]?.count ?? 0;
    const reconciledCount = txnRows[0]?.reconciled ?? 0;
    const reconciliationRate = totalCount > 0 ? (reconciledCount / totalCount) * 100 : 0;
    const pendingAiMatches = txnRows[0]?.withSuggestion ?? 0;
    const inThisMonth = parseFloat(thisMonthRows[0]?.credits ?? "0");
    const outThisMonth = parseFloat(thisMonthRows[0]?.debits ?? "0");

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = new Map(
      monthlyRows.map((r) => [
        r.month,
        {
          in: parseFloat(r.credits),
          out: parseFloat(r.debits),
        },
      ])
    );
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthlyCashFlow = last6Months.map((m) => {
      const [y, mo] = m.split("-");
      const label = monthNames[parseInt(mo, 10) - 1] + " " + y.slice(2);
      const data = monthlyMap.get(m) ?? { in: 0, out: 0 };
      return {
        month: label,
        in: data.in,
        out: data.out,
        net: data.in - data.out,
      };
    });

    const accountBalances = accountRows.map((r) => ({
      name: r.accountName,
      balance: parseFloat(r.currentBalance ?? "0"),
    }));

    // Partner-account sums: for each bank-transaction JE, sum the "other" (partner) GL amounts
    // e.g. Bank Charges, AR, AP, Owner's Equity — the counterpart of the bank line
    const bankLedgerIds = await db
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(
        and(
          eq(chartOfAccounts.organizationId, orgId),
          sql`${chartOfAccounts.code} ~ '^1[01][0-9]{2}$'` // 10xx, 11xx (Cash and Bank)
        )
      );
    const bankIds = bankLedgerIds.map((r) => r.id);
    let partnerRows: { code: string; name: string; amount: string }[] = [];

    if (bankIds.length > 0) {
      const jeWithBank = await db
        .selectDistinct({ journalEntryId: journalLines.journalEntryId })
        .from(journalLines)
        .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
        .where(
          and(
            eq(journalLines.organizationId, orgId),
            eq(journalEntries.status, "posted"),
            inArray(journalLines.accountId, bankIds)
          )
        );
      const jeIds = jeWithBank.map((r) => r.journalEntryId);
      if (jeIds.length > 0) {
        const rows = await db
          .select({
            code: chartOfAccounts.code,
            name: chartOfAccounts.name,
            amount: sql<string>`sum(${journalLines.baseCurrencyDebit}::numeric + ${journalLines.baseCurrencyCredit}::numeric)`,
          })
          .from(journalLines)
          .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
          .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
          .where(
            and(
              eq(journalLines.organizationId, orgId),
              eq(journalEntries.status, "posted"),
              notInArray(journalLines.accountId, bankIds),
              inArray(journalLines.journalEntryId, jeIds)
            )
          )
          .groupBy(chartOfAccounts.id, chartOfAccounts.code, chartOfAccounts.name)
          .orderBy(sql`sum(${journalLines.baseCurrencyDebit}::numeric + ${journalLines.baseCurrencyCredit}::numeric) desc`);
        partnerRows = rows;
      }
    }

    const chartOfAccountsSummary = partnerRows
      .map((r) => ({
        code: r.code,
        name: r.name,
        balance: parseFloat(r.amount ?? "0"),
      }))
      .filter((r) => Math.abs(r.balance) > 0.001);
    const chartOfAccountsTotal = chartOfAccountsSummary.reduce((s, r) => s + r.balance, 0);

    return NextResponse.json({
      totalBalance,
      accountCount: accountRows.length,
      unreconciledCount: totalCount - reconciledCount,
      reconciliationRate,
      inVsOutThisMonth: { in: inThisMonth, out: outThisMonth },
      pendingAiMatches,
      monthlyCashFlow,
      balanceTrend: monthlyCashFlow,
      accountBalances,
      recentTransactions: recentTxns.map((t) => ({
        id: t.id,
        description: t.description,
        amount: parseFloat(t.amount ?? "0"),
        type: t.type,
        date: t.transactionDate,
      })),
      largestTransactions: largestTxns.map((t) => ({
        id: t.id,
        description: t.description,
        amount: parseFloat(t.amount ?? "0"),
        type: t.type,
        date: t.transactionDate,
      })),
      chartOfAccountsSummary: {
        byAccount: chartOfAccountsSummary,
        total: chartOfAccountsTotal,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load banking mini stats";
    console.error("Banking mini-stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
