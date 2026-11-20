import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireOrgRole } from "@/lib/auth/require-role";
import { requireWritableOrg } from "@/lib/billing/gates";
import { db } from "@/lib/db";
import { customerPortalTokens } from "@/lib/db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archiveBlock = await requireWritableOrg(orgId);
  if (archiveBlock) return archiveBlock;

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Token id required" }, { status: 400 });

  const now = new Date();
  const [updated] = await db
    .update(customerPortalTokens)
    .set({ revokedAt: now, updatedAt: now })
    .where(
      and(
        eq(customerPortalTokens.id, id),
        eq(customerPortalTokens.organizationId, orgId),
        isNull(customerPortalTokens.revokedAt)
      )
    )
    .returning({
      id: customerPortalTokens.id,
      revokedAt: customerPortalTokens.revokedAt,
    });

  if (!updated) {
    return NextResponse.json(
      { error: "Portal link not found or already revoked" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    token: {
      id: updated.id,
      revokedAt: updated.revokedAt?.toISOString() ?? now.toISOString(),
      status: "revoked",
    },
  });
}
