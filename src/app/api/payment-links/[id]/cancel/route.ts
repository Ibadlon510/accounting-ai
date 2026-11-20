import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireOrgRole } from "@/lib/auth/require-role";
import { requireWritableOrg } from "@/lib/billing/gates";
import { db } from "@/lib/db";
import { invoicePaymentLinks } from "@/lib/db/schema";

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

  const [updated] = await db
    .update(invoicePaymentLinks)
    .set({ status: "cancelled", updatedAt: new Date(), checkoutUrl: null })
    .where(
      and(
        eq(invoicePaymentLinks.id, id),
        eq(invoicePaymentLinks.organizationId, orgId),
        inArray(invoicePaymentLinks.status, ["pending", "open"])
      )
    )
    .returning({
      id: invoicePaymentLinks.id,
      status: invoicePaymentLinks.status,
    });

  if (!updated) {
    return NextResponse.json(
      { error: "Payment link not found or not cancellable" },
      { status: 404 }
    );
  }

  return NextResponse.json({ link: updated });
}
