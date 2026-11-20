import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireOrgRole } from "@/lib/auth/require-role";
import { requireWritableOrg } from "@/lib/billing/gates";
import { db } from "@/lib/db";
import { invoicePaymentLinks } from "@/lib/db/schema";
import { settleInvoicePaymentLink } from "@/lib/payment-links/settle";

/**
 * Staff-only: simulate settlement for stub provider links (no Stripe).
 * Also allowed when PAYMENT_LINKS_ALLOW_STUB_SETTLE=true for local demos.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;

  const [link] = await db
    .select()
    .from(invoicePaymentLinks)
    .where(
      and(
        eq(invoicePaymentLinks.id, id),
        eq(invoicePaymentLinks.organizationId, orgId)
      )
    )
    .limit(1);

  if (!link) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }

  if (link.provider !== "stub") {
    return NextResponse.json(
      { error: "Stub settle is only for provider=stub links. Use the Stripe webhook for live links." },
      { status: 400 }
    );
  }

  try {
    const result = await settleInvoicePaymentLink({
      paymentLinkId: link.id,
      organizationId: orgId,
      providerEventId: `stub:${link.id}:${Date.now()}`,
      paidAt: new Date(),
    });
    return NextResponse.json({ result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Settlement failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
