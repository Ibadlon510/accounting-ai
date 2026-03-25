import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fiscalYears, accountingPeriods } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentOrganizationId } from "@/lib/org/server";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [fy] = await db
      .select()
      .from(fiscalYears)
      .where(eq(fiscalYears.organizationId, orgId))
      .orderBy(desc(fiscalYears.startDate))
      .limit(1);

    if (!fy) {
      return NextResponse.json({ fiscalYear: null, periods: [] });
    }

    const periods = await db
      .select()
      .from(accountingPeriods)
      .where(
        and(
          eq(accountingPeriods.organizationId, orgId),
          eq(accountingPeriods.fiscalYearId, fy.id),
        ),
      )
      .orderBy(accountingPeriods.startDate);

    return NextResponse.json({
      fiscalYear: {
        id: fy.id,
        name: fy.name,
        startDate: fy.startDate,
        endDate: fy.endDate,
        isClosed: fy.isClosed,
      },
      periods: periods.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        closedAt: p.closedAt?.toISOString() ?? null,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load periods";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { periodId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { periodId } = body;
  if (!periodId) return NextResponse.json({ error: "periodId is required" }, { status: 400 });

  try {
    const [period] = await db
      .select()
      .from(accountingPeriods)
      .where(
        and(
          eq(accountingPeriods.id, periodId),
          eq(accountingPeriods.organizationId, orgId),
        ),
      )
      .limit(1);

    if (!period) return NextResponse.json({ error: "Period not found" }, { status: 404 });

    const nextStatus =
      period.status === "open" ? "closed" : period.status === "closed" ? "locked" : "open";

    const [updated] = await db
      .update(accountingPeriods)
      .set({
        status: nextStatus,
        closedAt: nextStatus === "open" ? null : new Date(),
      })
      .where(eq(accountingPeriods.id, periodId))
      .returning();

    return NextResponse.json({
      period: {
        id: updated.id,
        name: updated.name,
        startDate: updated.startDate,
        endDate: updated.endDate,
        status: updated.status,
        closedAt: updated.closedAt?.toISOString() ?? null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to toggle period status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
