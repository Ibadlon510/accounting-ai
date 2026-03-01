import { db, organizations } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PLANS, type PlanKey } from "./plans";

/**
 * Refill an organization's token balance to their plan's monthly allocation.
 * Called on invoice.paid webhook (monthly subscription renewal).
 * Unused tokens do NOT roll over — balance is reset to plan limit.
 */
export async function refillTokens(orgId: string, plan: PlanKey): Promise<void> {
  const planConfig = PLANS[plan];
  if (!planConfig || planConfig.monthlyTokens === 0) return;

  await db
    .update(organizations)
    .set({
      tokenBalance: planConfig.monthlyTokens,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * Add top-up tokens to an organization's balance (stacks on top of monthly).
 * Called when a one-time top-up checkout completes.
 */
export async function addTopUpTokens(
  orgId: string,
  amount: number
): Promise<void> {
  // Use raw SQL for atomic increment
  const { sql } = await import("drizzle-orm");
  await db
    .update(organizations)
    .set({
      tokenBalance: sql`${organizations.tokenBalance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}
