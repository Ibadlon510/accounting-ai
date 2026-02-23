import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const [created] = await db
      .insert(customers)
      .values({
        organizationId: orgId,
        name,
        email: typeof body.email === "string" ? body.email.trim() || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
        taxNumber: typeof body.taxNumber === "string" ? body.taxNumber.trim() || null : null,
        city: typeof body.city === "string" ? body.city.trim() || null : null,
        country: typeof body.country === "string" ? body.country.trim() || "UAE" : "UAE",
        creditLimit: typeof body.creditLimit === "number" ? String(body.creditLimit) : null,
        paymentTermsDays: typeof body.paymentTermsDays === "number" ? body.paymentTermsDays : 30,
      })
      .returning({ id: customers.id, name: customers.name });
    return NextResponse.json({ customer: created });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create customer";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(customers)
      .where(eq(customers.organizationId, orgId))
      .orderBy(sql`${customers.name} asc`);

    return NextResponse.json({
      customers: rows.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        taxNumber: c.taxNumber,
        city: c.city,
        country: c.country,
        currency: c.currency,
        creditLimit: parseFloat(c.creditLimit ?? "0"),
        paymentTermsDays: c.paymentTermsDays,
        isActive: c.isActive,
        totalRevenue: 0,
        outstandingBalance: 0,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load customers";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
