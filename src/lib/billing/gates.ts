import { db, organizations, journalEntries, userRoles } from "@/lib/db";
import { eq, and, sql, gte } from "drizzle-orm";
import { PLANS } from "./plans";

export type GateResult =
  | { allowed: true }
  | { allowed: false; reason: string; upgradeRequired: boolean };

/**
 * Check if an org can create more journal entries this month.
 * FREE plan: 25/month. PRO plan: unlimited.
 */
export async function canCreateJournalEntry(
  orgId: string
): Promise<GateResult> {
  const [org] = await db
    .select({ subscriptionPlan: organizations.subscriptionPlan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return { allowed: false, reason: "Organization not found", upgradeRequired: false };

  const plan = PLANS[org.subscriptionPlan as keyof typeof PLANS];
  if (!plan) return { allowed: true }; // ARCHIVE or unknown — allow
  if (plan.journalEntriesPerMonth === null) return { allowed: true }; // unlimited

  // Count JEs created this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.organizationId, orgId),
        gte(journalEntries.createdAt, startOfMonth)
      )
    );

  if (count >= plan.journalEntriesPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your ${plan.journalEntriesPerMonth} journal entries/month limit on the Free plan.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Check if an org can process AI documents (doc scan).
 * FREE plan: 5 lifetime. PRO plan: uses tokens (1 token per doc).
 */
export async function canProcessDocument(orgId: string): Promise<GateResult> {
  const [org] = await db
    .select({
      subscriptionPlan: organizations.subscriptionPlan,
      freeAiDocsUsed: organizations.freeAiDocsUsed,
      tokenBalance: organizations.tokenBalance,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return { allowed: false, reason: "Organization not found", upgradeRequired: false };

  const plan = PLANS[org.subscriptionPlan as keyof typeof PLANS];
  if (!plan) return { allowed: true };

  if (org.subscriptionPlan === "FREE") {
    if (plan.freeAiDocs !== null && org.freeAiDocsUsed >= plan.freeAiDocs) {
      return {
        allowed: false,
        reason: `You've used all ${plan.freeAiDocs} free AI document scans. Upgrade to Pro for unlimited processing.`,
        upgradeRequired: true,
      };
    }
    return { allowed: true };
  }

  // PRO: check token balance
  if (org.tokenBalance <= 0) {
    return {
      allowed: false,
      reason: "You're out of AI tokens. Purchase a top-up or wait for your monthly refresh.",
      upgradeRequired: false,
    };
  }

  return { allowed: true };
}

/**
 * Check if an org can import a bank statement via AI.
 * FREE plan: 1 lifetime. PRO plan: uses tokens (5 tokens per statement).
 */
export async function canImportStatement(orgId: string): Promise<GateResult> {
  const [org] = await db
    .select({
      subscriptionPlan: organizations.subscriptionPlan,
      freeAiStatementsUsed: organizations.freeAiStatementsUsed,
      tokenBalance: organizations.tokenBalance,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return { allowed: false, reason: "Organization not found", upgradeRequired: false };

  if (org.subscriptionPlan === "FREE") {
    const plan = PLANS.FREE;
    if (
      plan.freeAiStatements !== null &&
      org.freeAiStatementsUsed >= plan.freeAiStatements
    ) {
      return {
        allowed: false,
        reason: `You've used your free AI bank statement import. Upgrade to Pro for unlimited imports.`,
        upgradeRequired: true,
      };
    }
    return { allowed: true };
  }

  // PRO: check token balance (5 tokens per statement)
  if (org.tokenBalance < 5) {
    return {
      allowed: false,
      reason: "Not enough AI tokens for bank statement import (requires 5 tokens).",
      upgradeRequired: false,
    };
  }

  return { allowed: true };
}

/**
 * Check if an org can add more users.
 * FREE: 1 user. PRO: 2 base + extra seats purchased.
 */
export async function canAddUser(orgId: string): Promise<GateResult> {
  const [org] = await db
    .select({
      subscriptionPlan: organizations.subscriptionPlan,
      maxUsers: organizations.maxUsers,
      extraSeats: organizations.extraSeats,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return { allowed: false, reason: "Organization not found", upgradeRequired: false };

  const totalAllowed = org.maxUsers + org.extraSeats;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userRoles)
    .where(eq(userRoles.organizationId, orgId));

  if (count >= totalAllowed) {
    if (org.subscriptionPlan === "FREE") {
      return {
        allowed: false,
        reason: "Free plan is limited to 1 user. Upgrade to Pro for multi-user access.",
        upgradeRequired: true,
      };
    }
    return {
      allowed: false,
      reason: `You've reached your ${totalAllowed}-user limit. Add more seats in Billing Settings.`,
      upgradeRequired: false,
    };
  }

  return { allowed: true };
}

/**
 * Consume 1 AI token. Call after a successful AI operation on PRO plan.
 */
export async function consumeToken(
  orgId: string,
  amount: number = 1
): Promise<void> {
  await db
    .update(organizations)
    .set({
      tokenBalance: sql`GREATEST(${organizations.tokenBalance} - ${amount}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * Increment free AI doc usage counter (FREE plan only).
 */
export async function incrementFreeDocUsage(orgId: string): Promise<void> {
  await db
    .update(organizations)
    .set({
      freeAiDocsUsed: sql`${organizations.freeAiDocsUsed} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * Increment free AI statement usage counter (FREE plan only).
 */
export async function incrementFreeStatementUsage(
  orgId: string
): Promise<void> {
  await db
    .update(organizations)
    .set({
      freeAiStatementsUsed: sql`${organizations.freeAiStatementsUsed} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}
