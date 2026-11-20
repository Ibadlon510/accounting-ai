import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { requireOrgRole } from "@/lib/auth/require-role";
import { requireWritableOrg } from "@/lib/billing/gates";
import { db } from "@/lib/db";
import { customers, customerPortalTokens } from "@/lib/db/schema";
import {
  DEFAULT_PORTAL_TOKEN_DAYS,
  MAX_PORTAL_TOKEN_DAYS,
  generateRawPortalToken,
  listPortalTokensForOrg,
  portalShareUrl,
} from "@/lib/client-portal/tokens";

export async function GET(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = await requireOrgRole(orgId, "viewer");
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") ?? undefined;

  try {
    const tokens = await listPortalTokensForOrg(orgId, customerId);
    return NextResponse.json({ tokens });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to list portal tokens";
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

  let body: { customerId?: string; label?: string; expiresInDays?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const customerId = body.customerId?.trim();
  if (!customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  const expiresInDays = Math.min(
    Math.max(1, Math.floor(body.expiresInDays ?? DEFAULT_PORTAL_TOKEN_DAYS)),
    MAX_PORTAL_TOKEN_DAYS
  );
  const label = body.label?.trim().slice(0, 120) || null;

  const [customer] = await db
    .select({ id: customers.id, name: customers.name, isActive: customers.isActive })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (!customer.isActive) {
    return NextResponse.json({ error: "Customer is inactive" }, { status: 400 });
  }

  const { raw, hash, prefix } = generateRawPortalToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const [created] = await db
    .insert(customerPortalTokens)
    .values({
      organizationId: orgId,
      customerId,
      tokenHash: hash,
      tokenPrefix: prefix,
      label,
      expiresAt,
      createdBy: roleCheck.userId,
    })
    .returning({
      id: customerPortalTokens.id,
      expiresAt: customerPortalTokens.expiresAt,
      tokenPrefix: customerPortalTokens.tokenPrefix,
      label: customerPortalTokens.label,
      createdAt: customerPortalTokens.createdAt,
    });

  const url = portalShareUrl(raw);

  return NextResponse.json(
    {
      token: {
        id: created.id,
        customerId,
        customerName: customer.name,
        tokenPrefix: created.tokenPrefix,
        label: created.label,
        expiresAt: created.expiresAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
        status: "active",
        // Raw secret returned once — never stored or listed again
        shareUrl: url,
        rawToken: raw,
      },
    },
    { status: 201 }
  );
}
