import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const [created] = await db
      .insert(suppliers)
      .values({
        organizationId: orgId,
        name,
        email: typeof body.email === "string" ? body.email.trim() || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        taxNumber: typeof body.taxNumber === "string" ? body.taxNumber.trim() || null : null,
        city: typeof body.city === "string" ? body.city.trim() || null : null,
        country: typeof body.country === "string" ? body.country.trim() || "UAE" : "UAE",
        paymentTermsDays: typeof body.paymentTermsDays === "number" ? body.paymentTermsDays : 30,
      })
      .returning({ id: suppliers.id, name: suppliers.name });
    return NextResponse.json({ supplier: created });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create supplier";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.organizationId, orgId))
      .orderBy(sql`${suppliers.name} asc`);

    return NextResponse.json({
      suppliers: rows.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        taxNumber: s.taxNumber,
        city: s.city,
        country: s.country,
        currency: s.currency,
        paymentTermsDays: s.paymentTermsDays,
        isActive: s.isActive,
        totalSpent: 0,
        outstandingBalance: 0,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load suppliers";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
