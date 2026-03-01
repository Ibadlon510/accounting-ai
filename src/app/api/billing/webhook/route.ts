import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { db, organizations } from "@/lib/db";
import { eq } from "drizzle-orm";
import { refillTokens, addTopUpTokens } from "@/lib/billing/token-refill";
import { PLANS, STRIPE_PRICES } from "@/lib/billing/plans";
import type Stripe from "stripe";
import { createNotification } from "@/lib/notifications/create";

// Disable Next.js body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const priceKey = session.metadata?.priceKey;

        if (!orgId) break;

        if (priceKey === "TOKEN_TOPUP") {
          // One-time token top-up
          await addTopUpTokens(orgId, PLANS.PRO.topUpTokens);
          await createNotification({
            orgId,
            category: "billing",
            title: "Tokens Added",
            message: `${PLANS.PRO.topUpTokens} AI tokens have been added to your balance.`,
            icon: "CreditCard",
          }).catch(() => {});
        } else if (session.subscription) {
          // New subscription created
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const firstItem = subscription.items.data[0];

          await db
            .update(organizations)
            .set({
              subscriptionPlan: "PRO",
              stripeSubscriptionId: subscriptionId,
              stripePriceId: firstItem?.price.id || null,
              subscriptionStatus: subscription.status,
              currentPeriodEnd: firstItem?.current_period_end
                ? new Date(firstItem.current_period_end * 1000)
                : null,
              tokenBalance: PLANS.PRO.monthlyTokens,
              maxUsers: PLANS.PRO.maxUsers,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId));

          await createNotification({
            orgId,
            category: "billing",
            title: "Welcome to Pro!",
            message: `Your Pro subscription is active. You now have ${PLANS.PRO.monthlyTokens} AI tokens and unlimited features.`,
            icon: "CreditCard",
            actionUrl: "/settings",
            actionLabel: "View Plan",
          }).catch(() => {});
        }
        break;
      }

      case "invoice.paid": {
        // Monthly renewal — refill tokens
        const invoice = event.data.object as Stripe.Invoice;
        const subDetails = invoice.parent?.subscription_details;
        const subscriptionId =
          typeof subDetails?.subscription === "string"
            ? subDetails.subscription
            : subDetails?.subscription?.id;

        if (!subscriptionId) break;

        // Find org by subscription ID
        const [org] = await db
          .select({ id: organizations.id, subscriptionPlan: organizations.subscriptionPlan })
          .from(organizations)
          .where(eq(organizations.stripeSubscriptionId, subscriptionId))
          .limit(1);

        if (org) {
          await refillTokens(org.id, org.subscriptionPlan as keyof typeof PLANS);
          await createNotification({
            orgId: org.id,
            category: "billing",
            title: "Tokens Refreshed",
            message: "Your monthly AI token balance has been refilled.",
            icon: "CreditCard",
          }).catch(() => {});
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;
        if (!orgId) break;

        const subFirstItem = subscription.items.data[0];
        const updates: Record<string, unknown> = {
          subscriptionStatus: subscription.status,
          currentPeriodEnd: subFirstItem?.current_period_end
            ? new Date(subFirstItem.current_period_end * 1000)
            : null,
          stripePriceId: subFirstItem?.price.id || null,
          updatedAt: new Date(),
        };

        // Check for extra seats
        const seatItem = subscription.items.data.find(
          (item) => item.price.id === STRIPE_PRICES.EXTRA_SEAT
        );
        if (seatItem) {
          updates.extraSeats = seatItem.quantity || 0;
        }

        await db
          .update(organizations)
          .set(updates)
          .where(eq(organizations.id, orgId));
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;
        if (!orgId) break;

        // Downgrade to FREE
        await db
          .update(organizations)
          .set({
            subscriptionPlan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            subscriptionStatus: "canceled",
            currentPeriodEnd: null,
            tokenBalance: 0,
            maxUsers: PLANS.FREE.maxUsers,
            extraSeats: 0,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, orgId));

        await createNotification({
          orgId,
          category: "billing",
          title: "Subscription Canceled",
          message: "Your Pro subscription has ended. You're now on the Free plan.",
          icon: "CreditCard",
          actionUrl: "/settings",
          actionLabel: "Resubscribe",
        }).catch(() => {});
        break;
      }

      default:
        // Unhandled event type — just acknowledge
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
