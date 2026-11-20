import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, invoicePaymentLinks, invoices, organizations } from "@/lib/db/schema";
import { hashStubToken } from "@/lib/payment-links/tokens";

/** Public stub payment-link lookup (no auth). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid link" }, { status: 401 });
  }

  const hash = hashStubToken(token);
  const [link] = await db
    .select({
      id: invoicePaymentLinks.id,
      status: invoicePaymentLinks.status,
      amount: invoicePaymentLinks.amount,
      currency: invoicePaymentLinks.currency,
      expiresAt: invoicePaymentLinks.expiresAt,
      paidAt: invoicePaymentLinks.paidAt,
      provider: invoicePaymentLinks.provider,
      invoiceNumber: invoices.invoiceNumber,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      customerName: customers.name,
      orgName: organizations.name,
    })
    .from(invoicePaymentLinks)
    .innerJoin(invoices, eq(invoices.id, invoicePaymentLinks.invoiceId))
    .innerJoin(customers, eq(customers.id, invoicePaymentLinks.customerId))
    .innerJoin(organizations, eq(organizations.id, invoicePaymentLinks.organizationId))
    .where(
      and(
        eq(invoicePaymentLinks.stubTokenHash, hash),
        eq(invoicePaymentLinks.provider, "stub")
      )
    )
    .limit(1);

  if (!link) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  let status = link.status;
  if (
    (status === "open" || status === "pending") &&
    link.expiresAt &&
    link.expiresAt.getTime() < Date.now()
  ) {
    status = "expired";
  }

  return NextResponse.json({
    invoiceNumber: link.invoiceNumber,
    issueDate: link.issueDate,
    dueDate: link.dueDate,
    customerName: link.customerName,
    orgName: link.orgName,
    amount: parseFloat(link.amount ?? "0"),
    currency: link.currency,
    status,
    paidAt: link.paidAt,
    provider: link.provider,
  });
}
