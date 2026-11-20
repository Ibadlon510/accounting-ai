import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  consolidationGroups,
  consolidationGroupMembers,
  consolidationEliminationRules,
  organizations,
  userRoles,
  journalLines,
  journalEntries,
  chartOfAccounts,
  accountTypes,
} from "@/lib/db/schema";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";

export const CONSOLIDATION_LIMITATIONS = [
  "MVP aggregates posted journal lines by matching chart-of-accounts code (preferred) or normalized account name.",
  "No foreign-currency translation — each org’s base-currency amounts are summed as-is.",
  "Intercompany eliminations are not applied (rules table is a stub; see TODO).",
  "No ownership percentage or non-controlling interest adjustments.",
  "Accounts that do not share a code/name across companies appear as separate consolidated lines.",
  "Archived (read-only) member organizations are included in reports; group membership writes remain gated.",
] as const;

export type ConsolidationGroupRecord = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    subscriptionPlan: string;
    currency: string;
    createdAt: Date;
  }>;
  eliminationRules: Array<{
    id: string;
    name: string;
    description: string | null;
    ruleType: string;
    isActive: boolean;
    config: unknown;
  }>;
};

function normalizeAccountName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function mappingKey(code: string, name: string): string {
  const c = code.trim();
  if (c) return `code:${c}`;
  return `name:${normalizeAccountName(name)}`;
}

export async function assertUserHasRoleInOrg(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const [role] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.organizationId, organizationId)
      )
    )
    .limit(1);
  return Boolean(role);
}

export async function assertUserHasRoleInOrgs(
  userId: string,
  organizationIds: string[]
): Promise<{ ok: true } | { ok: false; missing: string[] }> {
  if (organizationIds.length === 0) return { ok: true };
  const roles = await db
    .select({ organizationId: userRoles.organizationId })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        inArray(userRoles.organizationId, organizationIds)
      )
    );
  const have = new Set(roles.map((r) => r.organizationId));
  const missing = organizationIds.filter((id) => !have.has(id));
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

export async function getAccessibleOrgIds(userId: string): Promise<string[]> {
  const roles = await db
    .select({ organizationId: userRoles.organizationId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  return roles.map((r) => r.organizationId);
}

export async function loadGroupWithMembers(
  groupId: string
): Promise<ConsolidationGroupRecord | null> {
  const [group] = await db
    .select()
    .from(consolidationGroups)
    .where(eq(consolidationGroups.id, groupId))
    .limit(1);
  if (!group) return null;

  const members = await db
    .select({
      id: consolidationGroupMembers.id,
      organizationId: consolidationGroupMembers.organizationId,
      organizationName: organizations.name,
      subscriptionPlan: organizations.subscriptionPlan,
      currency: organizations.currency,
      createdAt: consolidationGroupMembers.createdAt,
    })
    .from(consolidationGroupMembers)
    .innerJoin(
      organizations,
      eq(consolidationGroupMembers.organizationId, organizations.id)
    )
    .where(eq(consolidationGroupMembers.groupId, groupId));

  const eliminationRules = await db
    .select({
      id: consolidationEliminationRules.id,
      name: consolidationEliminationRules.name,
      description: consolidationEliminationRules.description,
      ruleType: consolidationEliminationRules.ruleType,
      isActive: consolidationEliminationRules.isActive,
      config: consolidationEliminationRules.config,
    })
    .from(consolidationEliminationRules)
    .where(eq(consolidationEliminationRules.groupId, groupId));

  return {
    ...group,
    members,
    eliminationRules,
  };
}

/**
 * Ensure the current user can access the group: role in owning org and every member org.
 */
export async function requireGroupAccess(
  groupId: string
): Promise<
  | { group: ConsolidationGroupRecord; userId: string }
  | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await loadGroupWithMembers(groupId);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const orgIds = [
    group.organizationId,
    ...group.members.map((m) => m.organizationId),
  ];
  const unique = [...new Set(orgIds)];
  const access = await assertUserHasRoleInOrgs(session.user.id, unique);
  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          "You must have a role in the owning organization and every member company to access this consolidation group.",
        missingOrganizationIds: access.missing,
      },
      { status: 403 }
    );
  }

  return { group, userId: session.user.id };
}

export async function listGroupsForOrg(
  ownerOrgId: string,
  userId: string
): Promise<ConsolidationGroupRecord[]> {
  const rows = await db
    .select()
    .from(consolidationGroups)
    .where(eq(consolidationGroups.organizationId, ownerOrgId))
    .orderBy(consolidationGroups.createdAt);

  const result: ConsolidationGroupRecord[] = [];
  for (const row of rows) {
    const full = await loadGroupWithMembers(row.id);
    if (!full) continue;
    const orgIds = [
      full.organizationId,
      ...full.members.map((m) => m.organizationId),
    ];
    const access = await assertUserHasRoleInOrgs(userId, [...new Set(orgIds)]);
    if (access.ok) result.push(full);
  }
  return result;
}

export async function createGroup(input: {
  organizationId: string;
  name: string;
  description?: string | null;
  createdBy: string;
  memberOrganizationIds?: string[];
}): Promise<ConsolidationGroupRecord> {
  const memberIds = [
    ...new Set(
      (input.memberOrganizationIds ?? []).filter(
        (id) => id && id !== input.organizationId
      )
    ),
  ];

  // Always include owning org as a member for reporting.
  const allMembers = [input.organizationId, ...memberIds];
  const access = await assertUserHasRoleInOrgs(input.createdBy, allMembers);
  if (!access.ok) {
    throw new Error(
      "You must have a role in every company you add to the consolidation group."
    );
  }

  const [group] = await db
    .insert(consolidationGroups)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      description: input.description ?? null,
      createdBy: input.createdBy,
    })
    .returning();

  await db.insert(consolidationGroupMembers).values(
    allMembers.map((organizationId) => ({
      groupId: group.id,
      organizationId,
    }))
  );

  // Stub default elimination rule (inactive).
  // TODO: implement intercompany elimination application in report generation.
  await db.insert(consolidationEliminationRules).values({
    groupId: group.id,
    name: "Intercompany eliminations (stub)",
    description:
      "Placeholder for future intercompany sales/balances eliminations. Not applied in MVP aggregation.",
    ruleType: "intercompany",
    isActive: false,
    config: { todo: true },
  });

  const full = await loadGroupWithMembers(group.id);
  if (!full) throw new Error("Failed to load created group");
  return full;
}

export async function updateGroup(
  groupId: string,
  patch: { name?: string; description?: string | null }
): Promise<ConsolidationGroupRecord> {
  const [updated] = await db
    .update(consolidationGroups)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(consolidationGroups.id, groupId))
    .returning();

  if (!updated) throw new Error("Group not found");
  const full = await loadGroupWithMembers(groupId);
  if (!full) throw new Error("Group not found");
  return full;
}

export async function deleteGroup(groupId: string): Promise<void> {
  await db
    .delete(consolidationGroups)
    .where(eq(consolidationGroups.id, groupId));
}

export async function addGroupMember(input: {
  groupId: string;
  organizationId: string;
  userId: string;
}): Promise<ConsolidationGroupRecord> {
  const hasRole = await assertUserHasRoleInOrg(
    input.userId,
    input.organizationId
  );
  if (!hasRole) {
    throw new Error(
      "You must have a role in the company before adding it to the group."
    );
  }

  const [existing] = await db
    .select({ id: consolidationGroupMembers.id })
    .from(consolidationGroupMembers)
    .where(
      and(
        eq(consolidationGroupMembers.groupId, input.groupId),
        eq(consolidationGroupMembers.organizationId, input.organizationId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(consolidationGroupMembers).values({
      groupId: input.groupId,
      organizationId: input.organizationId,
    });
  }

  const full = await loadGroupWithMembers(input.groupId);
  if (!full) throw new Error("Group not found");
  return full;
}

export async function removeGroupMember(
  groupId: string,
  organizationId: string,
  ownerOrganizationId: string
): Promise<ConsolidationGroupRecord> {
  if (organizationId === ownerOrganizationId) {
    throw new Error("Cannot remove the owning organization from the group.");
  }
  await db
    .delete(consolidationGroupMembers)
    .where(
      and(
        eq(consolidationGroupMembers.groupId, groupId),
        eq(consolidationGroupMembers.organizationId, organizationId)
      )
    );
  const full = await loadGroupWithMembers(groupId);
  if (!full) throw new Error("Group not found");
  return full;
}

type AggregateRow = {
  key: string;
  accountCode: string;
  accountName: string;
  accountCategory: string;
  normalBalance: string;
  displayOrder: number;
  debit: number;
  credit: number;
  balance: number;
  orgBreakdown: Array<{
    organizationId: string;
    organizationName: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
};

async function aggregateMemberJournals(input: {
  members: ConsolidationGroupRecord["members"];
  from?: string | null;
  to?: string | null;
}): Promise<AggregateRow[]> {
  const map = new Map<string, AggregateRow>();

  for (const member of input.members) {
    const conditions = [
      eq(journalLines.organizationId, member.organizationId),
    ];
    if (input.from) conditions.push(gte(journalEntries.entryDate, input.from));
    if (input.to) conditions.push(lte(journalEntries.entryDate, input.to));

    const rows = await db
      .select({
        accountCode: chartOfAccounts.code,
        accountName: chartOfAccounts.name,
        accountCategory: accountTypes.category,
        normalBalance: accountTypes.normalBalance,
        displayOrder: accountTypes.displayOrder,
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
      .innerJoin(
        chartOfAccounts,
        eq(journalLines.accountId, chartOfAccounts.id)
      )
      .innerJoin(
        accountTypes,
        eq(chartOfAccounts.accountTypeId, accountTypes.id)
      )
      .where(and(...conditions))
      .groupBy(
        chartOfAccounts.code,
        chartOfAccounts.name,
        accountTypes.category,
        accountTypes.normalBalance,
        accountTypes.displayOrder
      );

    for (const r of rows) {
      const debit = parseFloat(r.totalDebit);
      const credit = parseFloat(r.totalCredit);
      if (Math.abs(debit) < 0.0005 && Math.abs(credit) < 0.0005) continue;

      const key = mappingKey(r.accountCode, r.accountName);
      const balance =
        r.normalBalance === "debit" ? debit - credit : credit - debit;

      const existing = map.get(key);
      const breakdown = {
        organizationId: member.organizationId,
        organizationName: member.organizationName,
        debit,
        credit,
        balance,
      };

      if (!existing) {
        map.set(key, {
          key,
          accountCode: r.accountCode,
          accountName: r.accountName,
          accountCategory: r.accountCategory,
          normalBalance: r.normalBalance,
          displayOrder: r.displayOrder,
          debit,
          credit,
          balance,
          orgBreakdown: [breakdown],
        });
      } else {
        // Prefer a non-empty code/name from the first org; keep display order min.
        existing.debit += debit;
        existing.credit += credit;
        existing.balance += balance;
        existing.displayOrder = Math.min(
          existing.displayOrder,
          r.displayOrder
        );
        existing.orgBreakdown.push(breakdown);
      }
    }
  }

  // TODO: apply consolidationEliminationRules when isActive (intercompany stub).

  return [...map.values()].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return a.accountCode.localeCompare(b.accountCode);
  });
}

export async function generateConsolidatedReports(input: {
  group: ConsolidationGroupRecord;
  from?: string | null;
  to?: string | null;
}) {
  const aggregated = await aggregateMemberJournals({
    members: input.group.members,
    from: input.from,
    to: input.to,
  });

  const trialBalance = aggregated.map((r) => ({
    accountCode: r.accountCode,
    accountName: r.accountName,
    accountCategory: r.accountCategory,
    normalBalance: r.normalBalance,
    debit: r.debit,
    credit: r.credit,
    orgBreakdown: r.orgBreakdown,
  }));

  const revenue: { code: string; name: string; amount: number }[] = [];
  const expense: { code: string; name: string; amount: number }[] = [];
  const asset: { code: string; name: string; amount: number }[] = [];
  const liability: { code: string; name: string; amount: number }[] = [];
  const equity: { code: string; name: string; amount: number }[] = [];

  for (const r of aggregated) {
    if (Math.abs(r.balance) < 0.005) continue;
    const entry = {
      code: r.accountCode,
      name: r.accountName,
      amount: r.balance,
    };
    switch (r.accountCategory) {
      case "revenue":
        revenue.push(entry);
        break;
      case "expense":
        expense.push(entry);
        break;
      case "asset":
        asset.push(entry);
        break;
      case "liability":
        liability.push(entry);
        break;
      case "equity":
        equity.push(entry);
        break;
    }
  }

  const totalRevenue = revenue.reduce((s, x) => s + x.amount, 0);
  const totalExpenses = expense.reduce((s, x) => s + x.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalAssets = asset.reduce((s, x) => s + x.amount, 0);
  const totalLiabilities = liability.reduce((s, x) => s + x.amount, 0);
  const totalEquity = equity.reduce((s, x) => s + x.amount, 0);

  return {
    method: "simple_coa_code_name_sum",
    limitations: [...CONSOLIDATION_LIMITATIONS],
    eliminationsApplied: false,
    period: { from: input.from ?? null, to: input.to ?? null },
    members: input.group.members.map((m) => ({
      organizationId: m.organizationId,
      name: m.organizationName,
      currency: m.currency,
      subscriptionPlan: m.subscriptionPlan,
      archived: m.subscriptionPlan === "ARCHIVE",
    })),
    trialBalance,
    pnl: {
      revenue,
      expense,
      totalRevenue,
      totalExpenses,
      netIncome,
    },
    bs: {
      asset,
      liability,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      retainedEarnings: netIncome,
    },
  };
}
