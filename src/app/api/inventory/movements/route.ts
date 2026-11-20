import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { inventoryMovements, items } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: inventoryMovements.id,
        itemId: inventoryMovements.itemId,
        itemName: items.name,
        itemSku: items.sku,
        movementType: inventoryMovements.movementType,
        quantity: inventoryMovements.quantity,
        unitCost: inventoryMovements.unitCost,
        totalCost: inventoryMovements.totalCost,
        referenceType: inventoryMovements.referenceType,
        referenceId: inventoryMovements.referenceId,
        notes: inventoryMovements.notes,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .innerJoin(items, eq(inventoryMovements.itemId, items.id))
      .where(eq(inventoryMovements.organizationId, orgId))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(100);

    return NextResponse.json({
      movements: rows.map((m) => ({
        id: m.id,
        itemId: m.itemId,
        itemName: m.itemName,
        itemSku: m.itemSku,
        movementType: m.movementType,
        quantity: parseFloat(m.quantity ?? "0"),
        unitCost: parseFloat(m.unitCost ?? "0"),
        totalCost: parseFloat(m.totalCost ?? "0"),
        referenceType: m.referenceType,
        referenceId: m.referenceId,
        notes: m.notes,
        createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load stock movements";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
