import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { vatReturns } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(vatReturns)
      .where(eq(vatReturns.organizationId, orgId))
      .orderBy(sql`${vatReturns.periodEnd} desc`);

    return NextResponse.json({
      returns: rows.map((r) => ({
        id: r.id,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        status: r.status,
        outputVat: parseFloat(r.outputVat ?? "0"),
        inputVat: parseFloat(r.inputVat ?? "0"),
        netVat: parseFloat(r.netVat ?? "0"),
        taxableSales: parseFloat(r.taxableSales ?? "0"),
        exemptSales: parseFloat(r.exemptSales ?? "0"),
        zeroRatedSales: parseFloat(r.zeroRatedSales ?? "0"),
        taxablePurchases: parseFloat(r.taxablePurchases ?? "0"),
        filedAt: r.filedAt,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load VAT returns";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
