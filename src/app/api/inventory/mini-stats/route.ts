import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const typeRows = await db
      .select({
        type: items.type,
        count: sql<number>`count(*)::int`,
        value: sql<string>`coalesce(sum((${items.costPrice}::numeric) * (${items.quantityOnHand}::numeric)), 0)`,
      })
      .from(items)
      .where(and(eq(items.organizationId, orgId), eq(items.isActive, true)))
      .groupBy(items.type);

    const lowStockRows = await db
      .select({
        id: items.id,
        name: items.name,
        sku: items.sku,
        quantityOnHand: items.quantityOnHand,
        reorderLevel: items.reorderLevel,
      })
      .from(items)
      .where(
        and(
          eq(items.organizationId, orgId),
          eq(items.isActive, true),
          eq(items.trackInventory, true),
          sql`${items.quantityOnHand}::numeric <= ${items.reorderLevel}::numeric`
        )
      )
      .orderBy(sql`${items.quantityOnHand}::numeric asc`)
      .limit(5);

    const topValueRows = await db
      .select({
        id: items.id,
        name: items.name,
        sku: items.sku,
        value: sql<string>`coalesce((${items.costPrice}::numeric) * (${items.quantityOnHand}::numeric), 0)`,
      })
      .from(items)
      .where(and(eq(items.organizationId, orgId), eq(items.isActive, true)))
      .orderBy(sql`(${items.costPrice}::numeric) * (${items.quantityOnHand}::numeric) desc`)
      .limit(5);

    const reorderCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(
        and(
          eq(items.organizationId, orgId),
          eq(items.isActive, true),
          eq(items.trackInventory, true),
          sql`${items.quantityOnHand}::numeric <= ${items.reorderLevel}::numeric`
        )
      );

    const stockOutRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(
        and(
          eq(items.organizationId, orgId),
          eq(items.isActive, true),
          eq(items.trackInventory, true),
          sql`${items.quantityOnHand}::numeric <= 0`
        )
      );

    const totalValue = typeRows.reduce((s, r) => s + parseFloat(r.value), 0);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthlyValue = last6Months.map((m) => {
      const [y, mo] = m.split("-");
      const label = monthNames[parseInt(mo, 10) - 1] + " " + y.slice(2);
      return { month: label, value: totalValue };
    });
    const typeBreakdown = typeRows.map((r) => ({
      type: r.type,
      count: r.count,
      value: parseFloat(r.value),
    }));

    const valueByCategory = typeRows.map((r) => ({
      name: r.type === "product" ? "Product" : "Service",
      value: parseFloat(r.value),
    }));

    const lowStockItems = lowStockRows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      quantityOnHand: parseFloat(r.quantityOnHand ?? "0"),
      reorderLevel: parseFloat(r.reorderLevel ?? "0"),
    }));

    const topItemsByValue = topValueRows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      value: parseFloat(r.value),
    }));

    return NextResponse.json({
      typeBreakdown,
      valueByCategory,
      lowStockItems,
      topItemsByValue,
      monthlyValue,
      reorderAlerts: reorderCount[0]?.count ?? 0,
      stockOutRisk: stockOutRows[0]?.count ?? 0,
      totalValue,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load inventory mini stats";
    console.error("Inventory mini-stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
