import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const statusRows = await db
      .select({
        status: documents.status,
        count: sql<number>`count(*)::int`,
      })
      .from(documents)
      .where(eq(documents.organizationId, orgId))
      .groupBy(documents.status);

    const typeRows = await db
      .select({
        documentType: documents.documentType,
        count: sql<number>`count(*)::int`,
      })
      .from(documents)
      .where(eq(documents.organizationId, orgId))
      .groupBy(documents.documentType);

    const monthlyRows = await db
      .select({
        month: sql<string>`to_char(${documents.createdAt}::date, 'YYYY-MM')`,
        processed: sql<number>`count(*) filter (where ${documents.status} = 'PROCESSED' or ${documents.status} = 'ARCHIVED')::int`,
        failed: sql<number>`count(*) filter (where ${documents.status} = 'PROCESSING_FAILED')::int`,
      })
      .from(documents)
      .where(
        and(
          eq(documents.organizationId, orgId),
          sql`${documents.createdAt}::date >= ${sixMonthsAgo.toISOString().slice(0, 10)}`
        )
      )
      .groupBy(sql`to_char(${documents.createdAt}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${documents.createdAt}::date, 'YYYY-MM')`);

    const confidenceRows = await db
      .select({
        avgConfidence: sql<string>`coalesce(avg(${documents.aiConfidence}::numeric), 0)`,
      })
      .from(documents)
      .where(
        and(
          eq(documents.organizationId, orgId),
          sql`${documents.aiConfidence} is not null`
        )
      );

    const oldestPending = await db
      .select({
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(
        and(
          eq(documents.organizationId, orgId),
          eq(documents.status, "PENDING")
        )
      )
      .orderBy(documents.createdAt)
      .limit(1);

    const recentDocs = await db
      .select({
        id: documents.id,
        s3Key: documents.s3Key,
        status: documents.status,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.organizationId, orgId))
      .orderBy(desc(documents.createdAt))
      .limit(5);

    const pendingCount = statusRows.find((r) => r.status === "PENDING")?.count ?? 0;
    const verifiedCount = (statusRows.find((r) => r.status === "PROCESSED")?.count ?? 0) +
      (statusRows.find((r) => r.status === "ARCHIVED")?.count ?? 0);
    const flaggedCount = statusRows.find((r) => r.status === "FLAGGED")?.count ?? 0;
    const failedCount = statusRows.find((r) => r.status === "PROCESSING_FAILED")?.count ?? 0;
    const totalCount = statusRows.reduce((s, r) => s + r.count, 0);

    const successRate = verifiedCount + failedCount > 0
      ? (verifiedCount / (verifiedCount + failedCount)) * 100
      : 0;
    const avgConfidence = parseFloat(confidenceRows[0]?.avgConfidence ?? "0");
    const oldestDate = oldestPending[0]?.createdAt;
    const oldestPendingDays = oldestDate
      ? Math.floor((Date.now() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = new Map(monthlyRows.map((r) => [r.month, { processed: r.processed, failed: r.failed }]));
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthlyProcessed = last6Months.map((m) => {
      const [y, mo] = m.split("-");
      const label = monthNames[parseInt(mo, 10) - 1] + " " + y.slice(2);
      const data = monthlyMap.get(m) ?? { processed: 0, failed: 0 };
      return { month: label, processed: data.processed, failed: data.failed };
    });

    const statusBreakdown = statusRows.map((r) => ({
      status: r.status,
      count: r.count,
    }));

    const documentsByType = typeRows
      .filter((r) => r.documentType)
      .map((r) => ({
        type: r.documentType ?? "other",
        count: r.count,
      }));

    return NextResponse.json({
      pendingCount,
      verifiedCount,
      flaggedCount,
      failedCount,
      totalCount,
      successRate,
      avgConfidence,
      oldestPendingDays,
      monthlyProcessed,
      processingByMonth: monthlyProcessed,
      statusBreakdown,
      documentsByType,
      recentDocuments: recentDocs.map((d) => ({
        id: d.id,
        fileName: d.s3Key.split("/").pop() ?? "document",
        status: d.status,
        createdAt: d.createdAt,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load documents mini stats";
    console.error("Documents mini-stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
