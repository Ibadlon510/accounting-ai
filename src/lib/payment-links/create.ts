import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bankAccounts,
  customers,
  invoicePaymentLinks,
  invoices,
} from "@/lib/db/schema";
import { getStripe } from "@/lib/billing/stripe";
import { getSiteUrl } from "@/lib/payment-links/site-url";
import { generateStubToken } from "@/lib/payment-links/tokens";

function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Convert major currency units to Stripe minor units (fils/cents). */
function toMinorUnits(amount: number, currency: string): number {
  const zeroDecimal = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
  const c = currency.toLowerCase();
  if (zeroDecimal.has(c)) return Math.round(amount);
  return Math.round(amount * 100);
}

export type CreatePaymentLinkInput = {
  organizationId: string;
  invoiceId: string;
  bankAccountId?: string | null;
  createdBy: string;
  expiresInHours?: number;
};

export type CreatedPaymentLink = {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  checkoutUrl: string | null;
  stripeCheckoutSessionId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  /** Only returned for stub provider — one-time raw token for share URL */
  stubRawToken?: string;
};

export async function createInvoicePaymentLink(
  input: CreatePaymentLinkInput
): Promise<CreatedPaymentLink> {
  const [inv] = await db
    .select({
      id: invoices.id,
      customerId: invoices.customerId,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      amountDue: invoices.amountDue,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, input.invoiceId),
        eq(invoices.organizationId, input.organizationId)
      )
    )
    .limit(1);

  if (!inv) throw new Error("Invoice not found");
  if (inv.status === "draft") {
    throw new Error("Confirm the invoice before creating a payment link");
  }
  if (inv.status === "cancelled") {
    throw new Error("Cannot create a payment link for a cancelled invoice");
  }

  const amountDue = parseFloat(inv.amountDue ?? "0");
  if (!(amountDue > 0.009)) {
    throw new Error("Invoice has no amount due");
  }

  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
    })
    .from(customers)
    .where(
      and(
        eq(customers.id, inv.customerId),
        eq(customers.organizationId, input.organizationId)
      )
    )
    .limit(1);

  if (!customer) throw new Error("Customer not found");

  let bankAccountId = input.bankAccountId ?? null;
  if (bankAccountId) {
    const [ba] = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.id, bankAccountId),
          eq(bankAccounts.organizationId, input.organizationId),
          eq(bankAccounts.isActive, true)
        )
      )
      .limit(1);
    if (!ba) throw new Error("Bank account not found or inactive");
  } else {
    const [ba] = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.organizationId, input.organizationId),
          eq(bankAccounts.isActive, true)
        )
      )
      .limit(1);
    bankAccountId = ba?.id ?? null;
  }

  // Cancel prior open/pending links for this invoice (one active share at a time)
  await db
    .update(invoicePaymentLinks)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(invoicePaymentLinks.organizationId, input.organizationId),
        eq(invoicePaymentLinks.invoiceId, inv.id),
        inArray(invoicePaymentLinks.status, ["pending", "open"])
      )
    );

  const hours = Math.min(Math.max(1, input.expiresInHours ?? 72), 24 * 30);
  const currency = (inv.currency || "AED").toUpperCase();
  const siteUrl = getSiteUrl();
  const useStripe = stripeConfigured();
  // Stripe Checkout Session expiry must be ≤ 24 hours from creation
  const stripeHours = Math.min(hours, 24);
  const expiresAt = new Date(
    Date.now() + (useStripe ? stripeHours : hours) * 60 * 60 * 1000
  );

  if (useStripe) {
    const [row] = await db
      .insert(invoicePaymentLinks)
      .values({
        organizationId: input.organizationId,
        invoiceId: inv.id,
        customerId: customer.id,
        bankAccountId,
        amount: String(amountDue),
        currency,
        status: "pending",
        provider: "stripe",
        expiresAt,
        createdBy: input.createdBy,
      })
      .returning();

    if (!row) throw new Error("Failed to create payment link");

    const stripe = getStripe();
    // expires_at: at least 30 minutes from now (Stripe requirement)
    const expiresAtUnix = Math.max(
      Math.floor(Date.now() / 1000) + 30 * 60,
      Math.floor(expiresAt.getTime() / 1000)
    );
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: toMinorUnits(amountDue, currency),
            product_data: {
              name: `Invoice ${inv.invoiceNumber}`,
              description: `Payment for invoice ${inv.invoiceNumber}`,
            },
          },
        },
      ],
      success_url: `${siteUrl}/payment-links?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment-links?canceled=1`,
      expires_at: expiresAtUnix,
      metadata: {
        purpose: "invoice_payment",
        orgId: input.organizationId,
        invoiceId: inv.id,
        paymentLinkId: row.id,
      },
      payment_intent_data: {
        metadata: {
          purpose: "invoice_payment",
          orgId: input.organizationId,
          invoiceId: inv.id,
          paymentLinkId: row.id,
        },
      },
    });

    const [updated] = await db
      .update(invoicePaymentLinks)
      .set({
        status: "open",
        checkoutUrl: session.url,
        stripeCheckoutSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(invoicePaymentLinks.id, row.id))
      .returning();

    const link = updated ?? row;
    return {
      id: link.id,
      invoiceId: link.invoiceId,
      customerId: link.customerId,
      amount: link.amount,
      currency: link.currency,
      status: link.status,
      provider: link.provider,
      checkoutUrl: link.checkoutUrl,
      stripeCheckoutSessionId: link.stripeCheckoutSessionId,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    };
  }

  // Provider-agnostic stub when Stripe is not configured
  const { raw, hash, prefix } = generateStubToken();
  const checkoutUrl = `${siteUrl}/pay/${raw}`;

  const [row] = await db
    .insert(invoicePaymentLinks)
    .values({
      organizationId: input.organizationId,
      invoiceId: inv.id,
      customerId: customer.id,
      bankAccountId,
      amount: String(amountDue),
      currency,
      status: "open",
      provider: "stub",
      checkoutUrl,
      stubTokenHash: hash,
      stubTokenPrefix: prefix,
      expiresAt,
      createdBy: input.createdBy,
    })
    .returning();

  if (!row) throw new Error("Failed to create payment link");

  return {
    id: row.id,
    invoiceId: row.invoiceId,
    customerId: row.customerId,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    checkoutUrl: row.checkoutUrl,
    stripeCheckoutSessionId: null,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    stubRawToken: raw,
  };
}
