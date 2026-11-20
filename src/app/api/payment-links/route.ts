import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireOrgRole } from "@/lib/auth/require-role";
import { requireWritableOrg } from "@/lib/billing/gates";
import { db } from "@/lib/db";
import { customers, invoicePaymentLinks, invoices } from "@/lib/db/schema";
import { createInvoicePaymentLink } from "@/lib/payment-links/create";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = await requireOrgRole(orgId, "viewer");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoiceId") ?? undefined;

  try {
    const where = invoiceId
      ? and(
          eq(invoicePaymentLinks.organizationId, orgId),
          eq(invoicePaymentLinks.invoiceId, invoiceId)
        )
      : eq(invoicePaymentLinks.organizationId, orgId);

    const rows = await db
      .select({
        id: invoicePaymentLinks.id,
        invoiceId: invoicePaymentLinks.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoicePaymentLinks.customerId,
        customerName: customers.name,
        amount: invoicePaymentLinks.amount,
        currency: invoicePaymentLinks.currency,
        status: invoicePaymentLinks.status,
        provider: invoicePaymentLinks.provider,
        checkoutUrl: invoicePaymentLinks.checkoutUrl,
        stripeCheckoutSessionId: invoicePaymentLinks.stripeCheckoutSessionId,
        paymentId: invoicePaymentLinks.paymentId,
        journalEntryId: invoicePaymentLinks.journalEntryId,
        expiresAt: invoicePaymentLinks.expiresAt,
        paidAt: invoicePaymentLinks.paidAt,
        createdAt: invoicePaymentLinks.createdAt,
      })
      .from(invoicePaymentLinks)
      .innerJoin(invoices, eq(invoices.id, invoicePaymentLinks.invoiceId))
      .innerJoin(customers, eq(customers.id, invoicePaymentLinks.customerId))
      .where(where)
      .orderBy(desc(invoicePaymentLinks.createdAt))
      .limit(200);

    return NextResponse.json({
      links: rows.map((r) => ({
        ...r,
        amount: parseFloat(r.amount ?? "0"),
      })),
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to list payment links";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: {
    invoiceId?: string;
    bankAccountId?: string;
    expiresInHours?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invoiceId = body.invoiceId?.trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  try {
    const link = await createInvoicePaymentLink({
      organizationId: orgId,
      invoiceId,
      bankAccountId: body.bankAccountId?.trim() || null,
      createdBy: roleCheck.userId,
      expiresInHours: body.expiresInHours,
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create payment link";
    const status =
      /not found|confirm|cancelled|amount due|bank account/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
