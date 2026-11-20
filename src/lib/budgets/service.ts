import { db } from "@/lib/db";
import {
  accountingPeriods,
  budgetLines,
  budgets,
  chartOfAccounts,
  accountTypes,
  fiscalYears,
  journalEntries,
  journalLines,
} from "@/lib/db/schema";
import { AccountingError, computeAccountBalance } from "@/lib/accounting/engine";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

export type BudgetRow = typeof budgets.$inferSelect;
export type BudgetLineRow = typeof budgetLines.$inferSelect;

export type BudgetLineInput = {
  id?: string;
  accountId: string;
  periodId?: string | null;
  amount: number;
  notes?: string | null;
  lineOrder?: number;
};

export type CreateBudgetInput = {
  organizationId: string;
  name: string;
  description?: string | null;
  fiscalYearId?: string | null;
  periodId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: "draft" | "active" | "closed";
  currency?: string;
  notes?: string | null;
  createdBy?: string | null;
  lines: BudgetLineInput[];
};

export type UpdateBudgetInput = {
  name?: string;
  description?: string | null;
  fiscalYearId?: string | null;
  periodId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: "draft" | "active" | "closed";
  currency?: string;
  notes?: string | null;
  lines?: BudgetLineInput[];
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function mapBudgetLine(
  row: BudgetLineRow,
  extras?: {
    accountCode?: string | null;
    accountName?: string | null;
    periodName?: string | null;
  }
) {
  return {
    id: row.id,
    budgetId: row.budgetId,
    accountId: row.accountId,
    accountCode: extras?.accountCode ?? null,
    accountName: extras?.accountName ?? null,
    periodId: row.periodId,
    periodName: extras?.periodName ?? null,
    amount: parseFloat(row.amount ?? "0"),
    notes: row.notes,
    lineOrder: row.lineOrder,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

export function mapBudget(row: BudgetRow, lines: ReturnType<typeof mapBudgetLine>[] = []) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    fiscalYearId: row.fiscalYearId,
    periodId: row.periodId,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    currency: row.currency,
    createdBy: row.createdBy,
    notes: row.notes,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    totalBudgeted: roundMoney(lines.reduce((s, l) => s + l.amount, 0)),
    lineCount: lines.length,
    lines,
  };
}

async function resolvePeriodDates(
  organizationId: string,
  periodId: string | null | undefined
): Promise<{ startDate: string; endDate: string; fiscalYearId: string | null } | null> {
  if (!periodId) return null;
  const [period] = await db
    .select({
      startDate: accountingPeriods.startDate,
      endDate: accountingPeriods.endDate,
      fiscalYearId: accountingPeriods.fiscalYearId,
    })
    .from(accountingPeriods)
    .where(
      and(
        eq(accountingPeriods.id, periodId),
        eq(accountingPeriods.organizationId, organizationId)
      )
    )
    .limit(1);
  if (!period) {
    throw new AccountingError("Accounting period not found");
  }
  return {
    startDate: period.startDate,
    endDate: period.endDate,
    fiscalYearId: period.fiscalYearId,
  };
}

async function assertAccountInOrg(organizationId: string, accountId: string) {
  const [account] = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.id, accountId),
        eq(chartOfAccounts.organizationId, organizationId)
      )
    )
    .limit(1);
  if (!account) {
    throw new AccountingError("Chart of accounts entry not found");
  }
}

async function assertPeriodInOrg(organizationId: string, periodId: string) {
  const [period] = await db
    .select({ id: accountingPeriods.id })
    .from(accountingPeriods)
    .where(
      and(
        eq(accountingPeriods.id, periodId),
        eq(accountingPeriods.organizationId, organizationId)
      )
    )
    .limit(1);
  if (!period) {
    throw new AccountingError("Accounting period not found");
  }
}

async function assertFiscalYearInOrg(organizationId: string, fiscalYearId: string) {
  const [fy] = await db
    .select({ id: fiscalYears.id })
    .from(fiscalYears)
    .where(
      and(eq(fiscalYears.id, fiscalYearId), eq(fiscalYears.organizationId, organizationId))
    )
    .limit(1);
  if (!fy) {
    throw new AccountingError("Fiscal year not found");
  }
}

function normalizeLines(lines: BudgetLineInput[]): BudgetLineInput[] {
  if (!lines.length) {
    throw new AccountingError("At least one budget line is required");
  }

  const seen = new Set<string>();
  return lines.map((line, index) => {
    if (!line.accountId) {
      throw new AccountingError("Each budget line needs an account");
    }
    const amount = Number(line.amount);
    if (!Number.isFinite(amount)) {
      throw new AccountingError("Budget line amount must be a number");
    }
    const periodKey = line.periodId ?? "";
    const key = `${line.accountId}:${periodKey}`;
    if (seen.has(key)) {
      throw new AccountingError(
        "Duplicate budget line for the same account and period"
      );
    }
    seen.add(key);
    return {
      ...line,
      amount: roundMoney(amount),
      periodId: line.periodId || null,
      notes: line.notes?.trim() ? line.notes.trim() : null,
      lineOrder: line.lineOrder ?? index,
    };
  });
}

async function loadLinesWithAccounts(budgetId: string, organizationId: string) {
  const rows = await db
    .select({
      line: budgetLines,
      accountCode: chartOfAccounts.code,
      accountName: chartOfAccounts.name,
      periodName: accountingPeriods.name,
    })
    .from(budgetLines)
    .innerJoin(chartOfAccounts, eq(budgetLines.accountId, chartOfAccounts.id))
    .leftJoin(accountingPeriods, eq(budgetLines.periodId, accountingPeriods.id))
    .where(
      and(
        eq(budgetLines.budgetId, budgetId),
        eq(budgetLines.organizationId, organizationId)
      )
    )
    .orderBy(asc(budgetLines.lineOrder), asc(chartOfAccounts.code));

  return rows.map((r) =>
    mapBudgetLine(r.line, {
      accountCode: r.accountCode,
      accountName: r.accountName,
      periodName: r.periodName,
    })
  );
}

export async function getBudget(organizationId: string, budgetId: string) {
  const [row] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.organizationId, organizationId)))
    .limit(1);
  if (!row) return null;
  const lines = await loadLinesWithAccounts(budgetId, organizationId);
  return mapBudget(row, lines);
}

export async function listBudgets(organizationId: string) {
  const rows = await db
    .select()
    .from(budgets)
    .where(eq(budgets.organizationId, organizationId))
    .orderBy(desc(budgets.startDate), desc(budgets.createdAt));

  const result = [];
  for (const row of rows) {
    const lines = await loadLinesWithAccounts(row.id, organizationId);
    result.push(mapBudget(row, lines));
  }
  return result;
}

export async function createBudget(input: CreateBudgetInput) {
  const name = input.name.trim();
  if (!name) throw new AccountingError("Budget name is required");

  const lines = normalizeLines(input.lines);
  for (const line of lines) {
    await assertAccountInOrg(input.organizationId, line.accountId);
    if (line.periodId) await assertPeriodInOrg(input.organizationId, line.periodId);
  }

  let startDate = input.startDate ?? null;
  let endDate = input.endDate ?? null;
  let fiscalYearId = input.fiscalYearId ?? null;
  const periodId = input.periodId ?? null;

  if (periodId) {
    const period = await resolvePeriodDates(input.organizationId, periodId);
    if (!period) throw new AccountingError("Accounting period not found");
    startDate = startDate || period.startDate;
    endDate = endDate || period.endDate;
    fiscalYearId = fiscalYearId || period.fiscalYearId;
  }

  if (!startDate || !endDate) {
    throw new AccountingError("Start date and end date are required");
  }
  if (startDate > endDate) {
    throw new AccountingError("Start date must be on or before end date");
  }
  if (fiscalYearId) {
    await assertFiscalYearInOrg(input.organizationId, fiscalYearId);
  }

  const status = input.status ?? "draft";
  if (!["draft", "active", "closed"].includes(status)) {
    throw new AccountingError("Invalid budget status");
  }

  const budget = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(budgets)
      .values({
        organizationId: input.organizationId,
        name,
        description: input.description?.trim() || null,
        fiscalYearId,
        periodId,
        startDate,
        endDate,
        status,
        currency: input.currency || "AED",
        createdBy: input.createdBy ?? null,
        notes: input.notes?.trim() || null,
      })
      .returning();

    await tx.insert(budgetLines).values(
      lines.map((line, index) => ({
        organizationId: input.organizationId,
        budgetId: created.id,
        accountId: line.accountId,
        periodId: line.periodId ?? null,
        amount: String(line.amount),
        notes: line.notes ?? null,
        lineOrder: line.lineOrder ?? index,
      }))
    );

    return created;
  });

  return getBudget(input.organizationId, budget.id);
}

export async function updateBudget(
  organizationId: string,
  budgetId: string,
  input: UpdateBudgetInput
) {
  const existing = await getBudget(organizationId, budgetId);
  if (!existing) throw new AccountingError("Budget not found");

  let startDate = input.startDate !== undefined ? input.startDate : existing.startDate;
  let endDate = input.endDate !== undefined ? input.endDate : existing.endDate;
  let fiscalYearId =
    input.fiscalYearId !== undefined ? input.fiscalYearId : existing.fiscalYearId;
  const periodId = input.periodId !== undefined ? input.periodId : existing.periodId;

  if (input.periodId) {
    const period = await resolvePeriodDates(organizationId, input.periodId);
    if (!period) throw new AccountingError("Accounting period not found");
    if (input.startDate === undefined) startDate = period.startDate;
    if (input.endDate === undefined) endDate = period.endDate;
    if (input.fiscalYearId === undefined) fiscalYearId = period.fiscalYearId;
  }

  if (!startDate || !endDate) {
    throw new AccountingError("Start date and end date are required");
  }
  if (startDate > endDate) {
    throw new AccountingError("Start date must be on or before end date");
  }
  if (fiscalYearId) {
    await assertFiscalYearInOrg(organizationId, fiscalYearId);
  }

  const status = input.status ?? existing.status;
  if (!["draft", "active", "closed"].includes(status)) {
    throw new AccountingError("Invalid budget status");
  }

  let normalizedLines: BudgetLineInput[] | null = null;
  if (input.lines) {
    normalizedLines = normalizeLines(input.lines);
    for (const line of normalizedLines) {
      await assertAccountInOrg(organizationId, line.accountId);
      if (line.periodId) await assertPeriodInOrg(organizationId, line.periodId);
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(budgets)
      .set({
        name: input.name !== undefined ? input.name.trim() || existing.name : existing.name,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : existing.description,
        fiscalYearId,
        periodId,
        startDate,
        endDate,
        status,
        currency: input.currency ?? existing.currency,
        notes:
          input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, budgetId), eq(budgets.organizationId, organizationId)));

    if (normalizedLines) {
      await tx
        .delete(budgetLines)
        .where(
          and(
            eq(budgetLines.budgetId, budgetId),
            eq(budgetLines.organizationId, organizationId)
          )
        );
      await tx.insert(budgetLines).values(
        normalizedLines.map((line, index) => ({
          organizationId,
          budgetId,
          accountId: line.accountId,
          periodId: line.periodId ?? null,
          amount: String(line.amount),
          notes: line.notes ?? null,
          lineOrder: line.lineOrder ?? index,
        }))
      );
    }
  });

  return getBudget(organizationId, budgetId);
}

export async function deleteBudget(organizationId: string, budgetId: string) {
  const [deleted] = await db
    .delete(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.organizationId, organizationId)))
    .returning({ id: budgets.id });
  if (!deleted) throw new AccountingError("Budget not found");
  return { id: deleted.id };
}

export async function addBudgetLine(
  organizationId: string,
  budgetId: string,
  input: BudgetLineInput
) {
  const budget = await getBudget(organizationId, budgetId);
  if (!budget) throw new AccountingError("Budget not found");

  const [line] = normalizeLines([
    ...budget.lines.map((l) => ({
      accountId: l.accountId,
      periodId: l.periodId,
      amount: l.amount,
      notes: l.notes,
      lineOrder: l.lineOrder,
    })),
    input,
  ]).slice(-1);

  await assertAccountInOrg(organizationId, line.accountId);
  if (line.periodId) await assertPeriodInOrg(organizationId, line.periodId);

  const [created] = await db
    .insert(budgetLines)
    .values({
      organizationId,
      budgetId,
      accountId: line.accountId,
      periodId: line.periodId ?? null,
      amount: String(line.amount),
      notes: line.notes ?? null,
      lineOrder: line.lineOrder ?? budget.lines.length,
    })
    .returning();

  await db
    .update(budgets)
    .set({ updatedAt: new Date() })
    .where(and(eq(budgets.id, budgetId), eq(budgets.organizationId, organizationId)));

  const mapped = await loadLinesWithAccounts(budgetId, organizationId);
  return mapped.find((l) => l.id === created.id)!;
}

export async function updateBudgetLine(
  organizationId: string,
  budgetId: string,
  lineId: string,
  input: Partial<BudgetLineInput>
) {
  const [existing] = await db
    .select()
    .from(budgetLines)
    .where(
      and(
        eq(budgetLines.id, lineId),
        eq(budgetLines.budgetId, budgetId),
        eq(budgetLines.organizationId, organizationId)
      )
    )
    .limit(1);
  if (!existing) throw new AccountingError("Budget line not found");

  const accountId = input.accountId ?? existing.accountId;
  const periodId =
    input.periodId !== undefined ? input.periodId || null : existing.periodId;
  const amount =
    input.amount !== undefined ? roundMoney(Number(input.amount)) : parseFloat(existing.amount);

  if (!Number.isFinite(amount)) {
    throw new AccountingError("Budget line amount must be a number");
  }
  await assertAccountInOrg(organizationId, accountId);
  if (periodId) await assertPeriodInOrg(organizationId, periodId);

  const siblings = await db
    .select()
    .from(budgetLines)
    .where(
      and(
        eq(budgetLines.budgetId, budgetId),
        eq(budgetLines.organizationId, organizationId)
      )
    );
  const conflict = siblings.find(
    (s) =>
      s.id !== lineId &&
      s.accountId === accountId &&
      (s.periodId ?? null) === (periodId ?? null)
  );
  if (conflict) {
    throw new AccountingError("Duplicate budget line for the same account and period");
  }

  await db
    .update(budgetLines)
    .set({
      accountId,
      periodId,
      amount: String(amount),
      notes:
        input.notes !== undefined
          ? input.notes?.trim() || null
          : existing.notes,
      lineOrder: input.lineOrder ?? existing.lineOrder,
      updatedAt: new Date(),
    })
    .where(eq(budgetLines.id, lineId));

  await db
    .update(budgets)
    .set({ updatedAt: new Date() })
    .where(and(eq(budgets.id, budgetId), eq(budgets.organizationId, organizationId)));

  const mapped = await loadLinesWithAccounts(budgetId, organizationId);
  return mapped.find((l) => l.id === lineId)!;
}

export async function deleteBudgetLine(
  organizationId: string,
  budgetId: string,
  lineId: string
) {
  const siblings = await db
    .select({ id: budgetLines.id })
    .from(budgetLines)
    .where(
      and(
        eq(budgetLines.budgetId, budgetId),
        eq(budgetLines.organizationId, organizationId)
      )
    );
  if (siblings.length <= 1) {
    throw new AccountingError("Budget must keep at least one line");
  }

  const [deleted] = await db
    .delete(budgetLines)
    .where(
      and(
        eq(budgetLines.id, lineId),
        eq(budgetLines.budgetId, budgetId),
        eq(budgetLines.organizationId, organizationId)
      )
    )
    .returning({ id: budgetLines.id });
  if (!deleted) throw new AccountingError("Budget line not found");

  await db
    .update(budgets)
    .set({ updatedAt: new Date() })
    .where(and(eq(budgets.id, budgetId), eq(budgets.organizationId, organizationId)));

  return { id: deleted.id };
}

type ActualKey = string;

function actualKey(accountId: string, from: string, to: string): ActualKey {
  return `${accountId}|${from}|${to}`;
}

/**
 * Variance report: budgeted amount vs actual from posted journal lines.
 * Actual uses normal-balance signed amount (debit-normal: Dr−Cr; credit-normal: Cr−Dr)
 * over the line period dates when set, otherwise the budget date range.
 */
export async function getBudgetVariance(organizationId: string, budgetId: string) {
  const budget = await getBudget(organizationId, budgetId);
  if (!budget) throw new AccountingError("Budget not found");

  const periodIds = [
    ...new Set(
      budget.lines.map((l) => l.periodId).filter((id): id is string => Boolean(id))
    ),
  ];
  const periodMap = new Map<string, { startDate: string; endDate: string; name: string }>();
  if (periodIds.length) {
    const periods = await db
      .select({
        id: accountingPeriods.id,
        name: accountingPeriods.name,
        startDate: accountingPeriods.startDate,
        endDate: accountingPeriods.endDate,
      })
      .from(accountingPeriods)
      .where(
        and(
          eq(accountingPeriods.organizationId, organizationId),
          inArray(accountingPeriods.id, periodIds)
        )
      );
    for (const p of periods) {
      periodMap.set(p.id, {
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
      });
    }
  }

  const ranges = budget.lines.map((line) => {
    const period = line.periodId ? periodMap.get(line.periodId) : null;
    return {
      line,
      from: period?.startDate ?? budget.startDate,
      to: period?.endDate ?? budget.endDate,
      periodName: period?.name ?? line.periodName,
    };
  });

  const accountIds = [...new Set(ranges.map((r) => r.line.accountId))];
  const actualByKey = new Map<ActualKey, number>();

  if (accountIds.length) {
    // Fetch all posted activity for these accounts within the union of ranges,
    // then filter per line date window in memory.
    const minFrom = ranges.reduce((m, r) => (r.from < m ? r.from : m), ranges[0].from);
    const maxTo = ranges.reduce((m, r) => (r.to > m ? r.to : m), ranges[0].to);

    const rows = await db
      .select({
        accountId: journalLines.accountId,
        entryDate: journalEntries.entryDate,
        normalBalance: accountTypes.normalBalance,
        totalDebit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyDebit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyCredit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(
        journalEntries,
        and(
          eq(journalLines.journalEntryId, journalEntries.id),
          eq(journalEntries.status, "posted")
        )
      )
      .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
      .innerJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
      .where(
        and(
          eq(journalLines.organizationId, organizationId),
          inArray(journalLines.accountId, accountIds),
          gte(journalEntries.entryDate, minFrom),
          lte(journalEntries.entryDate, maxTo)
        )
      )
      .groupBy(
        journalLines.accountId,
        journalEntries.entryDate,
        accountTypes.normalBalance
      );

    // Aggregate daily buckets into each line's date window
    for (const range of ranges) {
      let debit = 0;
      let credit = 0;
      let normal: "debit" | "credit" = "debit";
      for (const row of rows) {
        if (row.accountId !== range.line.accountId) continue;
        if (row.entryDate < range.from || row.entryDate > range.to) continue;
        debit += parseFloat(row.totalDebit);
        credit += parseFloat(row.totalCredit);
        normal = row.normalBalance === "credit" ? "credit" : "debit";
      }
      actualByKey.set(
        actualKey(range.line.accountId, range.from, range.to),
        computeAccountBalance(debit, credit, normal)
      );
    }
  }

  const lines = ranges.map(({ line, from, to, periodName }) => {
    const budgeted = line.amount;
    const actual = actualByKey.get(actualKey(line.accountId, from, to)) ?? 0;
    const variance = roundMoney(actual - budgeted);
    const variancePercent =
      Math.abs(budgeted) < 0.005 ? null : roundMoney((variance / budgeted) * 100);

    return {
      lineId: line.id,
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      periodId: line.periodId,
      periodName: periodName ?? null,
      startDate: from,
      endDate: to,
      budgeted,
      actual: roundMoney(actual),
      variance,
      variancePercent,
      isOverBudget: variance > 0.005,
      isUnderBudget: variance < -0.005,
    };
  });

  const totalBudgeted = roundMoney(lines.reduce((s, l) => s + l.budgeted, 0));
  const totalActual = roundMoney(lines.reduce((s, l) => s + l.actual, 0));
  const totalVariance = roundMoney(totalActual - totalBudgeted);
  const totalVariancePercent =
    Math.abs(totalBudgeted) < 0.005
      ? null
      : roundMoney((totalVariance / totalBudgeted) * 100);

  return {
    budget: {
      id: budget.id,
      name: budget.name,
      status: budget.status,
      currency: budget.currency,
      startDate: budget.startDate,
      endDate: budget.endDate,
      periodId: budget.periodId,
      fiscalYearId: budget.fiscalYearId,
    },
    summary: {
      totalBudgeted,
      totalActual,
      totalVariance,
      totalVariancePercent,
      lineCount: lines.length,
      overBudgetCount: lines.filter((l) => l.isOverBudget).length,
      underBudgetCount: lines.filter((l) => l.isUnderBudget).length,
    },
    lines,
  };
}
