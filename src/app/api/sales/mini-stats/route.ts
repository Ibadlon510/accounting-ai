import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { invoices, invoiceLines, customers } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = sixMonthsAgo.toISOString().slice(0, 10);

    const lastYearStart = new Date();
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    lastYearStart.setMonth(lastYearStart.getMonth() - 5);
    const lastYearEnd = new Date(lastYearStart);
    lastYearEnd.setMonth(lastYearEnd.getMonth() + 6);

    const invRows = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
        totalPaid: sql<string>`coalesce(sum(${invoices.amountPaid}::numeric), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, orgId));

    const monthlyRows = await db
      .select({
        month: sql<string>`to_char(${invoices.issueDate}::date, 'YYYY-MM')`,
        revenue: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
      })
      .from(invoices)
      .where(and(eq(invoices.organizationId, orgId), sql`${invoices.issueDate}::date >= ${startDate}`))
      .groupBy(sql`to_char(${invoices.issueDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${invoices.issueDate}::date, 'YYYY-MM')`);

    const statusRows = await db
      .select({
        status: invoices.status,
        count: sql<number>`count(*)::int`,
        amount: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, orgId))
      .groupBy(invoices.status);

    const topCustomerRows = await db
      .select({
        name: customers.name,
        total: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.organizationId, orgId))
      .groupBy(customers.id, customers.name)
      .orderBy(sql`sum(${invoices.total}::numeric) desc`)
      .limit(5);

    const topProductRows = await db
      .select({
        name: invoiceLines.description,
        total: sql<string>`coalesce(sum(${invoiceLines.amount}::numeric), 0)`,
      })
      .from(invoiceLines)
      .innerJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
      .where(eq(invoices.organizationId, orgId))
      .groupBy(invoiceLines.description)
      .orderBy(sql`sum(${invoiceLines.amount}::numeric) desc`)
      .limit(5);

    const scatterRows = await db
      .select({
        total: invoices.total,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, orgId))
      .orderBy(desc(invoices.issueDate))
      .limit(50);

    const lastYearRevenueRows = await db
      .select({
        total: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          sql`${invoices.issueDate}::date >= ${lastYearStart.toISOString().slice(0, 10)}`,
          sql`${invoices.issueDate}::date <= ${lastYearEnd.toISOString().slice(0, 10)}`
        )
      );

    const inv = invRows[0];
    const totalRevenue = parseFloat(inv?.totalRevenue ?? "0");
    const totalPaid = parseFloat(inv?.totalPaid ?? "0");
    const invoiceCount = inv?.count ?? 0;
    const lastYearTotal = parseFloat(lastYearRevenueRows[0]?.total ?? "0");

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = new Map(monthlyRows.map((r) => [r.month, parseFloat(r.revenue)]));
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthlyRevenue = last6Months.map((m) => {
      const [y, mo] = m.split("-");
      const label = monthNames[parseInt(mo, 10) - 1] + " " + y.slice(2);
      return { month: label, revenue: monthlyMap.get(m) ?? 0 };
    });

    const cumulative = monthlyRevenue.reduce(
      (acc, cur) => {
        const last = acc[acc.length - 1]?.cumulative ?? 0;
        acc.push({ ...cur, cumulative: last + cur.revenue });
        return acc;
      },
      [] as { month: string; revenue: number; cumulative: number }[]
    );

    const statusBreakdown = statusRows.map((r) => ({
      status: r.status,
      count: r.count,
      amount: parseFloat(r.amount),
    }));

    const topCustomers = topCustomerRows.map((r) => ({
      name: r.name,
      total: parseFloat(r.total),
      invoiceCount: r.count,
    }));

    const topProducts = topProductRows.map((r) => ({
      name: r.name ?? "Unknown",
      total: parseFloat(r.total),
    }));

    const scatterData = scatterRows.map((r) => ({
      amount: parseFloat(r.total ?? "0"),
      dueDate: r.dueDate,
    }));

    const avgInvoiceValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
    const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;
    const yoyGrowth = lastYearTotal > 0 ? ((totalRevenue - lastYearTotal) / lastYearTotal) * 100 : 0;

    return NextResponse.json({
      monthlyRevenue,
      revenueTrend: cumulative,
      statusBreakdown,
      topCustomers,
      topProducts,
      scatterData,
      avgInvoiceValue,
      collectionRate,
      yoyGrowth,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load sales mini stats";
    console.error("Sales mini-stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
