import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      currency: organizations.currency,
      taxRegistrationNumber: organizations.taxRegistrationNumber,
      fiscalYearStart: organizations.fiscalYearStart,
      subscriptionPlan: organizations.subscriptionPlan,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({ organization: org });
}

export async function PATCH(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    currency?: string;
    taxRegistrationNumber?: string;
    fiscalYearStart?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.currency?.trim()) updates.currency = body.currency.trim();
  if (body.taxRegistrationNumber !== undefined)
    updates.taxRegistrationNumber = body.taxRegistrationNumber?.trim() || null;
  if (body.fiscalYearStart != null)
    updates.fiscalYearStart = body.fiscalYearStart;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(organizations)
    .set(updates)
    .where(eq(organizations.id, orgId));

  return NextResponse.json({ ok: true });
}
