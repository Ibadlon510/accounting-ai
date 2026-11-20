import { db } from "@/lib/db";
import {
  accountTypes,
  bills,
  chartOfAccounts,
  invoices,
  journalEntries,
  journalLines,
  projects,
} from "@/lib/db/schema";
import { AccountingError } from "@/lib/accounting/engine";
import { and, desc, eq, gte, inArray, isNotNull, lte, ne, sql } from "drizzle-orm";

export type ProjectRow = typeof projects.$inferSelect;
export type ProjectKind = "project" | "cost_centre";
export type ProjectStatus = "active" | "completed" | "archived";

export type CreateProjectInput = {
  organizationId: string;
  name: string;
  code?: string | null;
  kind?: ProjectKind;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

export type UpdateProjectInput = {
  name?: string;
  code?: string | null;
  kind?: ProjectKind;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  notes?: string | null;
};

export type AssignTargetType = "invoice" | "bill" | "journal_line";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeCode(code: string | null | undefined): string | null {
  if (code == null) return null;
  const trimmed = code.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export function mapProject(row: ProjectRow) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    kind: row.kind as ProjectKind,
    status: row.status as ProjectStatus,
    startDate: row.startDate,
    endDate: row.endDate,
    description: row.description,
    notes: row.notes,
    createdBy: row.createdBy,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

async function assertUniqueCode(
  organizationId: string,
  code: string | null,
  excludeId?: string
) {
  if (!code) return;
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.organizationId, organizationId), eq(projects.code, code)))
    .limit(2);
  const conflict = rows.find((r) => r.id !== excludeId);
  if (conflict) {
    throw new AccountingError(`Project code "${code}" is already in use`);
  }
}

export async function getProject(organizationId: string, projectId: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
    .limit(1);
  return row ? mapProject(row) : null;
}

export async function listProjects(organizationId: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, organizationId))
    .orderBy(desc(projects.updatedAt), desc(projects.createdAt));
  return rows.map(mapProject);
}

export async function createProject(input: CreateProjectInput) {
  const name = input.name.trim();
  if (!name) throw new AccountingError("Project name is required");

  const kind = input.kind ?? "project";
  if (kind !== "project" && kind !== "cost_centre") {
    throw new AccountingError("Kind must be project or cost_centre");
  }

  const status = input.status ?? "active";
  if (!["active", "completed", "archived"].includes(status)) {
    throw new AccountingError("Invalid project status");
  }

  const code = normalizeCode(input.code);
  await assertUniqueCode(input.organizationId, code);

  const startDate = input.startDate || null;
  const endDate = input.endDate || null;
  if (startDate && endDate && startDate > endDate) {
    throw new AccountingError("Start date must be on or before end date");
  }

  const [created] = await db
    .insert(projects)
    .values({
      organizationId: input.organizationId,
      name,
      code,
      kind,
      status,
      startDate,
      endDate,
      description: input.description?.trim() || null,
      notes: input.notes?.trim() || null,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  return mapProject(created);
}

export async function updateProject(
  organizationId: string,
  projectId: string,
  input: UpdateProjectInput
) {
  const existing = await getProject(organizationId, projectId);
  if (!existing) throw new AccountingError("Project not found");

  const name =
    input.name !== undefined ? input.name.trim() || existing.name : existing.name;
  if (!name) throw new AccountingError("Project name is required");

  const kind = input.kind ?? existing.kind;
  if (kind !== "project" && kind !== "cost_centre") {
    throw new AccountingError("Kind must be project or cost_centre");
  }

  const status = input.status ?? existing.status;
  if (!["active", "completed", "archived"].includes(status)) {
    throw new AccountingError("Invalid project status");
  }

  const code =
    input.code !== undefined ? normalizeCode(input.code) : existing.code;
  await assertUniqueCode(organizationId, code, projectId);

  const startDate =
    input.startDate !== undefined ? input.startDate || null : existing.startDate;
  const endDate =
    input.endDate !== undefined ? input.endDate || null : existing.endDate;
  if (startDate && endDate && startDate > endDate) {
    throw new AccountingError("Start date must be on or before end date");
  }

  const [updated] = await db
    .update(projects)
    .set({
      name,
      code,
      kind,
      status,
      startDate,
      endDate,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : existing.description,
      notes:
        input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
    .returning();

  return mapProject(updated);
}

export async function deleteProject(organizationId: string, projectId: string) {
  // Clear tags first so deletes succeed even if FKs are RESTRICT somewhere.
  await db
    .update(journalLines)
    .set({ projectId: null })
    .where(
      and(
        eq(journalLines.organizationId, organizationId),
        eq(journalLines.projectId, projectId)
      )
    );
  await db
    .update(invoices)
    .set({ projectId: null, updatedAt: new Date() })
    .where(
      and(eq(invoices.organizationId, organizationId), eq(invoices.projectId, projectId))
    );
  await db
    .update(bills)
    .set({ projectId: null, updatedAt: new Date() })
    .where(and(eq(bills.organizationId, organizationId), eq(bills.projectId, projectId)));

  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
    .returning({ id: projects.id });
  if (!deleted) throw new AccountingError("Project not found");
  return { id: deleted.id };
}

export async function assertProjectInOrg(organizationId: string, projectId: string) {
  const project = await getProject(organizationId, projectId);
  if (!project) throw new AccountingError("Project not found");
  return project;
}

/**
 * Tag an invoice, bill, or journal line with a project.
 * For invoices/bills that already have a posted journal entry, also stamp
 * project_id onto that entry's journal lines so P&L picks them up.
 */
export async function assignProjectToActivity(
  organizationId: string,
  projectId: string,
  targetType: AssignTargetType,
  targetId: string
) {
  await assertProjectInOrg(organizationId, projectId);

  if (targetType === "invoice") {
    const [inv] = await db
      .select({
        id: invoices.id,
        journalEntryId: invoices.journalEntryId,
      })
      .from(invoices)
      .where(and(eq(invoices.id, targetId), eq(invoices.organizationId, organizationId)))
      .limit(1);
    if (!inv) throw new AccountingError("Invoice not found");

    await db
      .update(invoices)
      .set({ projectId, updatedAt: new Date() })
      .where(eq(invoices.id, inv.id));

    if (inv.journalEntryId) {
      await db
        .update(journalLines)
        .set({ projectId })
        .where(
          and(
            eq(journalLines.organizationId, organizationId),
            eq(journalLines.journalEntryId, inv.journalEntryId)
          )
        );
    }

    return { type: targetType, id: inv.id, projectId };
  }

  if (targetType === "bill") {
    const [bill] = await db
      .select({
        id: bills.id,
        journalEntryId: bills.journalEntryId,
      })
      .from(bills)
      .where(and(eq(bills.id, targetId), eq(bills.organizationId, organizationId)))
      .limit(1);
    if (!bill) throw new AccountingError("Bill not found");

    await db
      .update(bills)
      .set({ projectId, updatedAt: new Date() })
      .where(eq(bills.id, bill.id));

    if (bill.journalEntryId) {
      await db
        .update(journalLines)
        .set({ projectId })
        .where(
          and(
            eq(journalLines.organizationId, organizationId),
            eq(journalLines.journalEntryId, bill.journalEntryId)
          )
        );
    }

    return { type: targetType, id: bill.id, projectId };
  }

  if (targetType === "journal_line") {
    const [line] = await db
      .select({ id: journalLines.id })
      .from(journalLines)
      .where(
        and(
          eq(journalLines.id, targetId),
          eq(journalLines.organizationId, organizationId)
        )
      )
      .limit(1);
    if (!line) throw new AccountingError("Journal line not found");

    await db
      .update(journalLines)
      .set({ projectId })
      .where(eq(journalLines.id, line.id));

    return { type: targetType, id: line.id, projectId };
  }

  throw new AccountingError("Invalid assignment target");
}

/**
 * Project P&L / income vs cost from tagged activity.
 *
 * Income:
 *  - Posted journal lines tagged with this project on revenue accounts
 *    (credit − debit / credit-normal balance)
 *  - Plus invoice subtotals tagged with this project when the invoice has no
 *    posted journal entry yet (or its JE lines are not tagged) — avoids waiting
 *    for posting while still counting document-level income.
 *
 * Cost:
 *  - Posted journal lines tagged with this project on expense accounts
 *    (debit − credit / debit-normal balance)
 *  - Plus bill subtotals tagged with this project under the same “untagged JE”
 *    fallback rule.
 *
 * Journal line totals are the ledger source of truth when present; document
 * amounts fill gaps for draft/unposted tagged invoices and bills.
 */
export async function getProjectPnL(
  organizationId: string,
  projectId: string,
  opts?: { from?: string | null; to?: string | null }
) {
  const project = await getProject(organizationId, projectId);
  if (!project) throw new AccountingError("Project not found");

  const from = opts?.from || null;
  const to = opts?.to || null;

  const jlConditions = [
    eq(journalLines.organizationId, organizationId),
    eq(journalLines.projectId, projectId),
    eq(journalEntries.status, "posted"),
    inArray(accountTypes.category, ["revenue", "expense"]),
  ];
  if (from) jlConditions.push(gte(journalEntries.entryDate, from));
  if (to) jlConditions.push(lte(journalEntries.entryDate, to));

  const lineRows = await db
    .select({
      accountId: chartOfAccounts.id,
      accountCode: chartOfAccounts.code,
      accountName: chartOfAccounts.name,
      category: accountTypes.category,
      normalBalance: accountTypes.normalBalance,
      totalDebit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyDebit}), 0)`,
      totalCredit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyCredit}), 0)`,
    })
    .from(journalLines)
    .innerJoin(
      journalEntries,
      eq(journalLines.journalEntryId, journalEntries.id)
    )
    .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
    .innerJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
    .where(and(...jlConditions))
    .groupBy(
      chartOfAccounts.id,
      chartOfAccounts.code,
      chartOfAccounts.name,
      accountTypes.category,
      accountTypes.normalBalance
    )
    .orderBy(chartOfAccounts.code);

  const incomeAccounts: { code: string; name: string; amount: number }[] = [];
  const costAccounts: { code: string; name: string; amount: number }[] = [];

  for (const row of lineRows) {
    const debit = parseFloat(row.totalDebit);
    const credit = parseFloat(row.totalCredit);
    const amount =
      row.normalBalance === "debit" ? debit - credit : credit - debit;
    if (Math.abs(amount) < 0.005) continue;
    const entry = {
      code: row.accountCode,
      name: row.accountName,
      amount: roundMoney(amount),
    };
    if (row.category === "revenue") incomeAccounts.push(entry);
    else if (row.category === "expense") costAccounts.push(entry);
  }

  const journalIncome = roundMoney(
    incomeAccounts.reduce((s, a) => s + a.amount, 0)
  );
  const journalCost = roundMoney(
    costAccounts.reduce((s, a) => s + a.amount, 0)
  );

  // Tagged invoices / bills for activity listing + unposted fallback income/cost
  const invConditions = [
    eq(invoices.organizationId, organizationId),
    eq(invoices.projectId, projectId),
    ne(invoices.status, "cancelled"),
  ];
  if (from) invConditions.push(gte(invoices.issueDate, from));
  if (to) invConditions.push(lte(invoices.issueDate, to));

  const taggedInvoices = await db
    .select({
      id: invoices.id,
      number: invoices.invoiceNumber,
      issueDate: invoices.issueDate,
      status: invoices.status,
      subtotal: invoices.subtotal,
      total: invoices.total,
      journalEntryId: invoices.journalEntryId,
    })
    .from(invoices)
    .where(and(...invConditions))
    .orderBy(desc(invoices.issueDate));

  const billConditions = [
    eq(bills.organizationId, organizationId),
    eq(bills.projectId, projectId),
    ne(bills.status, "cancelled"),
  ];
  if (from) billConditions.push(gte(bills.issueDate, from));
  if (to) billConditions.push(lte(bills.issueDate, to));

  const taggedBills = await db
    .select({
      id: bills.id,
      number: bills.billNumber,
      issueDate: bills.issueDate,
      status: bills.status,
      subtotal: bills.subtotal,
      total: bills.total,
      journalEntryId: bills.journalEntryId,
    })
    .from(bills)
    .where(and(...billConditions))
    .orderBy(desc(bills.issueDate));

  // Which posted JE ids already contribute via tagged journal lines?
  const taggedJeIds = new Set<string>();
  if (taggedInvoices.some((i) => i.journalEntryId) || taggedBills.some((b) => b.journalEntryId)) {
    const jeIds = [
      ...taggedInvoices.map((i) => i.journalEntryId).filter(Boolean),
      ...taggedBills.map((b) => b.journalEntryId).filter(Boolean),
    ] as string[];
    if (jeIds.length) {
      const stamped = await db
        .select({
          journalEntryId: journalLines.journalEntryId,
        })
        .from(journalLines)
        .where(
          and(
            eq(journalLines.organizationId, organizationId),
            eq(journalLines.projectId, projectId),
            inArray(journalLines.journalEntryId, jeIds),
            isNotNull(journalLines.projectId)
          )
        );
      for (const s of stamped) taggedJeIds.add(s.journalEntryId);
    }
  }

  let documentIncome = 0;
  const invoiceActivity = taggedInvoices.map((inv) => {
    const subtotal = parseFloat(inv.subtotal ?? "0");
    const countedInJournal =
      !!inv.journalEntryId && taggedJeIds.has(inv.journalEntryId);
    if (!countedInJournal && inv.status !== "draft") {
      documentIncome += subtotal;
    }
    return {
      id: inv.id,
      number: inv.number,
      issueDate: inv.issueDate,
      status: inv.status,
      subtotal: roundMoney(subtotal),
      total: roundMoney(parseFloat(inv.total ?? "0")),
      countedInJournal,
    };
  });
  documentIncome = roundMoney(documentIncome);

  let documentCost = 0;
  const billActivity = taggedBills.map((bill) => {
    const subtotal = parseFloat(bill.subtotal ?? "0");
    const countedInJournal =
      !!bill.journalEntryId && taggedJeIds.has(bill.journalEntryId);
    if (!countedInJournal && bill.status !== "draft") {
      documentCost += subtotal;
    }
    return {
      id: bill.id,
      number: bill.number,
      issueDate: bill.issueDate,
      status: bill.status,
      subtotal: roundMoney(subtotal),
      total: roundMoney(parseFloat(bill.total ?? "0")),
      countedInJournal,
    };
  });
  documentCost = roundMoney(documentCost);

  const totalIncome = roundMoney(journalIncome + documentIncome);
  const totalCost = roundMoney(journalCost + documentCost);
  const netProfit = roundMoney(totalIncome - totalCost);

  return {
    project,
    from,
    to,
    summary: {
      journalIncome,
      journalCost,
      documentIncome,
      documentCost,
      totalIncome,
      totalCost,
      netProfit,
      marginPercent:
        Math.abs(totalIncome) < 0.005
          ? null
          : roundMoney((netProfit / totalIncome) * 100),
    },
    incomeAccounts,
    costAccounts,
    invoices: invoiceActivity,
    bills: billActivity,
  };
}
