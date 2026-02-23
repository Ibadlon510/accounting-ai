import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { customers, invoices } from "@/lib/db/schema";
import { eq, sql, and, ne } from "drizzle-orm";

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

    const outstandingRows = await db
      .select({
        customerId: invoices.customerId,
        outstanding: sql<string>`coalesce(sum(${invoices.amountDue}::numeric), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          ne(invoices.status, "draft"),
          ne(invoices.status, "cancelled")
        )
      )
      .groupBy(invoices.customerId);

    const outstandingMap = new Map<string, number>();
    for (const r of outstandingRows) {
      if (r.customerId) {
        outstandingMap.set(r.customerId, parseFloat(r.outstanding ?? "0"));
      }
    }

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
        outstandingBalance: outstandingMap.get(c.id) ?? 0,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load customers";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
