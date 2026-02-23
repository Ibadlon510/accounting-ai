import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(items)
      .where(eq(items.organizationId, orgId))
      .orderBy(sql`${items.name} asc`);

    return NextResponse.json({
      items: rows.map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        type: i.type,
        unitOfMeasure: i.unitOfMeasure,
        salesPrice: parseFloat(i.salesPrice ?? "0"),
        purchasePrice: parseFloat(i.purchasePrice ?? "0"),
        costPrice: parseFloat(i.costPrice ?? "0"),
        quantityOnHand: parseFloat(i.quantityOnHand ?? "0"),
        reorderLevel: parseFloat(i.reorderLevel ?? "0"),
        taxCode: i.taxCode,
        trackInventory: i.trackInventory,
        isActive: i.isActive,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load inventory";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name: string; sku?: string; type?: string; unitOfMeasure?: string; salesPrice?: number; purchasePrice?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const type = (body.type === "service" ? "service" : "product") as "product" | "service";
  const sku = body.sku?.trim()?.toUpperCase() || `${type.slice(0, 2).toUpperCase()}-${Date.now().toString(36)}`;
  const unitOfMeasure = body.unitOfMeasure ?? "pcs";
  const salesPrice = Number(body.salesPrice) || 0;
  const purchasePrice = Number(body.purchasePrice) || salesPrice;

  try {
    const [row] = await db
      .insert(items)
      .values({
        organizationId: orgId,
        name,
        sku,
        type,
        unitOfMeasure,
        salesPrice: String(salesPrice),
        purchasePrice: String(purchasePrice),
        costPrice: String(purchasePrice),
        quantityOnHand: "0",
        reorderLevel: type === "product" ? "5" : null,
        taxCode: "VAT5",
        trackInventory: type === "product",
        isActive: true,
      })
      .returning({ id: items.id, name: items.name, sku: items.sku, type: items.type, salesPrice: items.salesPrice, purchasePrice: items.purchasePrice });

    if (!row) {
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }

    return NextResponse.json({
      item: {
        id: row.id,
        name: row.name,
        sku: row.sku,
        type: row.type,
        salesPrice: parseFloat(row.salesPrice ?? "0"),
        purchasePrice: parseFloat(row.purchasePrice ?? "0"),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
