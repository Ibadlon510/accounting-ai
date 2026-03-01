import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db, organizations, userRoles } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { PLANS } from "@/lib/billing/plans";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // Verify user belongs to org
    const [role] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, orgId)))
      .limit(1);

    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [org] = await db
      .select({
        subscriptionPlan: organizations.subscriptionPlan,
        tokenBalance: organizations.tokenBalance,
        freeAiDocsUsed: organizations.freeAiDocsUsed,
        freeAiStatementsUsed: organizations.freeAiStatementsUsed,
        maxUsers: organizations.maxUsers,
        extraSeats: organizations.extraSeats,
        stripeCustomerId: organizations.stripeCustomerId,
        stripeSubscriptionId: organizations.stripeSubscriptionId,
        subscriptionStatus: organizations.subscriptionStatus,
        currentPeriodEnd: organizations.currentPeriodEnd,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Count current users in org
    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)::int` })
      .from(userRoles)
      .where(eq(userRoles.organizationId, orgId));

    const plan = PLANS[org.subscriptionPlan as keyof typeof PLANS] || PLANS.FREE;
    const isOwnerOrAdmin = ["owner", "admin"].includes(role.role);

    return NextResponse.json({
      plan: org.subscriptionPlan,
      planDetails: {
        name: plan.name,
        monthlyTokens: plan.monthlyTokens,
        journalEntriesPerMonth: plan.journalEntriesPerMonth,
        features: plan.features,
      },
      tokenBalance: org.tokenBalance,
      freeAiDocsUsed: org.freeAiDocsUsed,
      freeAiStatementsUsed: org.freeAiStatementsUsed,
      maxUsers: org.maxUsers + org.extraSeats,
      currentUsers: userCount,
      hasStripeCustomer: !!org.stripeCustomerId,
      hasActiveSubscription: !!org.stripeSubscriptionId && org.subscriptionStatus === "active",
      subscriptionStatus: org.subscriptionStatus,
      currentPeriodEnd: org.currentPeriodEnd,
      canManageBilling: isOwnerOrAdmin,
    });
  } catch (error) {
    console.error("Billing status error:", error);
    console.error("Billing status error detail:", (error as Record<string, unknown>)?.message, (error as Record<string, unknown>)?.code, (error as Record<string, unknown>)?.column);
    return NextResponse.json({ error: "Failed to fetch billing status" }, { status: 500 });
  }
}
