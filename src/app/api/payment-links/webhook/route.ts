import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { handleInvoicePaymentCheckoutCompleted } from "@/lib/payment-links/handle-checkout-completed";
import { settleInvoicePaymentLink } from "@/lib/payment-links/settle";

export const runtime = "nodejs";

/**
 * Dedicated Stripe webhook for invoice payment-link settlements.
 * Prefer pointing a Stripe endpoint here (or reuse /api/billing/webhook which
 * also routes invoice_payment sessions).
 *
 * Stub provider: POST JSON
 *   { "type": "stub.payment.succeeded", "paymentLinkId", "organizationId" }
 * with header x-payment-links-stub-secret = PAYMENT_LINKS_STUB_SECRET
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const stubSecretHeader = request.headers.get("x-payment-links-stub-secret");

  // ── Stub webhook (provider-agnostic) ───────────────────────
  if (!signature && stubSecretHeader) {
    const expected = process.env.PAYMENT_LINKS_STUB_SECRET?.trim();
    if (!expected || stubSecretHeader !== expected) {
      return NextResponse.json({ error: "Invalid stub secret" }, { status: 401 });
    }

    let body: {
      type?: string;
      paymentLinkId?: string;
      organizationId?: string;
      eventId?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (body.type !== "stub.payment.succeeded") {
      return NextResponse.json({ error: "Unsupported stub event type" }, { status: 400 });
    }
    if (!body.paymentLinkId || !body.organizationId) {
      return NextResponse.json(
        { error: "paymentLinkId and organizationId are required" },
        { status: 400 }
      );
    }

    try {
      const result = await settleInvoicePaymentLink({
        paymentLinkId: body.paymentLinkId,
        organizationId: body.organizationId,
        providerEventId: body.eventId || `stub-wh:${body.paymentLinkId}:${Date.now()}`,
        paidAt: new Date(),
      });
      return NextResponse.json({ received: true, result });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Settlement failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // ── Stripe webhook ─────────────────────────────────────────
  const webhookSecret =
    process.env.STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET (or STRIPE_PAYMENT_LINKS_WEBHOOK_SECRET) is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Payment-links webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await handleInvoicePaymentCheckoutCompleted(session, event.id);
      return NextResponse.json({ received: true, result });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Payment-links webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
