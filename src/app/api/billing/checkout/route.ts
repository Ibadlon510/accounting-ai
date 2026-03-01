import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db, organizations, userRoles } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getStripe } from "@/lib/billing/stripe";
import { STRIPE_PRICES, STRIPE_LAUNCH_COUPON } from "@/lib/billing/plans";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, priceKey, successUrl, cancelUrl } = await request.json();
    if (!orgId || !priceKey) {
      return NextResponse.json(
        { error: "Missing orgId or priceKey" },
        { status: 400 }
      );
    }

    // Verify user belongs to this org and is owner/admin
    const [role] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, orgId)))
      .limit(1);

    if (!role || !["owner", "admin"].includes(role.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the org
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Resolve Stripe price ID
    const stripePriceId = STRIPE_PRICES[priceKey as keyof typeof STRIPE_PRICES];
    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Invalid price key" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Create or reuse Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { orgId: org.id },
        name: org.name,
        email: org.email || undefined,
      });
      customerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(organizations.id, orgId));
    }

    // Determine if this is a subscription or one-time purchase
    const isTopUp = priceKey === "TOKEN_TOPUP";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isTopUp ? "payment" : "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl || `${siteUrl}/dashboard/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}/dashboard/settings?tab=billing&canceled=true`,
      metadata: { orgId: org.id, priceKey },
      ...((!isTopUp && STRIPE_LAUNCH_COUPON) ? { discounts: [{ coupon: STRIPE_LAUNCH_COUPON }] } : {}),
      subscription_data: isTopUp
        ? undefined
        : { metadata: { orgId: org.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
