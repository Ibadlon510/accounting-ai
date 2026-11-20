import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoicePaymentLinks } from "@/lib/db/schema";
import { settleInvoicePaymentLink } from "@/lib/payment-links/settle";

/**
 * Handle Stripe checkout.session.completed for invoice payment links.
 * Returns null when the session is not an invoice payment (SaaS billing, etc.).
 */
export async function handleInvoicePaymentCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<{ settled: boolean; alreadySettled?: boolean; paymentLinkId?: string } | null> {
  if (session.metadata?.purpose !== "invoice_payment") {
    return null;
  }

  const orgId = session.metadata.orgId;
  const paymentLinkId = session.metadata.paymentLinkId;
  if (!orgId || !paymentLinkId) {
    console.error("[payment-links] checkout.session.completed missing orgId/paymentLinkId");
    return { settled: false };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Prefer looking up by session id if metadata id is stale
  const [bySession] = session.id
    ? await db
        .select({ id: invoicePaymentLinks.id })
        .from(invoicePaymentLinks)
        .where(
          and(
            eq(invoicePaymentLinks.organizationId, orgId),
            eq(invoicePaymentLinks.stripeCheckoutSessionId, session.id)
          )
        )
        .limit(1)
    : [];

  const linkId = bySession?.id ?? paymentLinkId;

  const amountMajor =
    typeof session.amount_total === "number" && session.amount_total >= 0
      ? session.amount_total / 100
      : undefined;

  const result = await settleInvoicePaymentLink({
    paymentLinkId: linkId,
    organizationId: orgId,
    providerEventId: stripeEventId,
    stripePaymentIntentId: paymentIntentId,
    amount: amountMajor,
    paidAt: new Date(),
  });

  return {
    settled: !result.alreadySettled,
    alreadySettled: result.alreadySettled,
    paymentLinkId: result.paymentLinkId,
  };
}
