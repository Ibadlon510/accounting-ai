import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bills, billLines, suppliers, chartOfAccounts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = sixMonthsAgo.toISOString().slice(0, 10);

    const billRows = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalExpenses: sql<string>`coalesce(sum(${bills.total}::numeric), 0)`,
        totalPaid: sql<string>`coalesce(sum(${bills.amountPaid}::numeric), 0)`,
      })
      .from(bills)
      .where(eq(bills.organizationId, orgId));

    const monthlyRows = await db
      .select({
        month: sql<string>`to_char(${bills.issueDate}::date, 'YYYY-MM')`,
        expenses: sql<string>`coalesce(sum(${bills.total}::numeric), 0)`,
      })
      .from(bills)
      .where(and(eq(bills.organizationId, orgId), sql`${bills.issueDate}::date >= ${startDate}`))
      .groupBy(sql`to_char(${bills.issueDate}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${bills.issueDate}::date, 'YYYY-MM')`);

    const statusRows = await db
      .select({
        status: bills.status,
        count: sql<number>`count(*)::int`,
        amount: sql<string>`coalesce(sum(${bills.total}::numeric), 0)`,
      })
      .from(bills)
      .where(eq(bills.organizationId, orgId))
      .groupBy(bills.status);

    const topSupplierRows = await db
      .select({
        name: suppliers.name,
        total: sql<string>`coalesce(sum(${bills.total}::numeric), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(bills)
      .innerJoin(suppliers, eq(bills.supplierId, suppliers.id))
      .where(eq(bills.organizationId, orgId))
      .groupBy(suppliers.id, suppliers.name)
      .orderBy(sql`sum(${bills.total}::numeric) desc`)
      .limit(5);

    const expenseCategoryRows = await db
      .select({
        accountName: chartOfAccounts.name,
        total: sql<string>`coalesce(sum(${billLines.amount}::numeric), 0)`,
      })
      .from(billLines)
      .innerJoin(bills, eq(billLines.billId, bills.id))
      .leftJoin(chartOfAccounts, eq(billLines.accountId, chartOfAccounts.id))
      .where(eq(bills.organizationId, orgId))
      .groupBy(chartOfAccounts.name, chartOfAccounts.id)
      .orderBy(sql`sum(${billLines.amount}::numeric) desc`)
      .limit(5);

    const supplierCountRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(and(eq(suppliers.organizationId, orgId), eq(suppliers.isActive, true)));

    const upcoming7d = new Date();
    upcoming7d.setDate(upcoming7d.getDate() + 7);
    const upcoming30d = new Date();
    upcoming30d.setDate(upcoming30d.getDate() + 30);
    const today = new Date().toISOString().slice(0, 10);

    const upcoming7Rows = await db
      .select({
        amount: sql<string>`coalesce(sum(${bills.amountDue}::numeric), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.organizationId, orgId),
          sql`${bills.dueDate}::date >= ${today}`,
          sql`${bills.dueDate}::date <= ${upcoming7d.toISOString().slice(0, 10)}`,
          sql`${bills.amountDue}::numeric > 0`
        )
      );

    const upcoming30Rows = await db
      .select({
        amount: sql<string>`coalesce(sum(${bills.amountDue}::numeric), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.organizationId, orgId),
          sql`${bills.dueDate}::date >= ${today}`,
          sql`${bills.dueDate}::date <= ${upcoming30d.toISOString().slice(0, 10)}`,
          sql`${bills.amountDue}::numeric > 0`
        )
      );

    const bl = billRows[0];
    const totalExpenses = parseFloat(bl?.totalExpenses ?? "0");
    const totalPaid = parseFloat(bl?.totalPaid ?? "0");
    const billCount = bl?.count ?? 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = new Map(monthlyRows.map((r) => [r.month, parseFloat(r.expenses)]));
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthlyExpenses = last6Months.map((m) => {
      const [y, mo] = m.split("-");
      const label = monthNames[parseInt(mo, 10) - 1] + " " + y.slice(2);
      return { month: label, expenses: monthlyMap.get(m) ?? 0 };
    });

    const statusBreakdown = statusRows.map((r) => ({
      status: r.status,
      count: r.count,
      amount: parseFloat(r.amount),
    }));

    const topSuppliers = topSupplierRows.map((r) => ({
      name: r.name,
      total: parseFloat(r.total),
      billCount: r.count,
    }));

    const topExpenseCategories = expenseCategoryRows
      .filter((r) => r.accountName)
      .map((r) => ({
        name: r.accountName ?? "Other",
        total: parseFloat(r.total),
      }));

    const avgBillValue = billCount > 0 ? totalExpenses / billCount : 0;
    const paymentRate = totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0;
    const supplierCount = supplierCountRows[0]?.count ?? 0;
    const upcomingPayables7d = parseFloat(upcoming7Rows[0]?.amount ?? "0");
    const upcomingPayables30d = parseFloat(upcoming30Rows[0]?.amount ?? "0");

    return NextResponse.json({
      monthlyExpenses,
      statusBreakdown,
      topSuppliers,
      topExpenseCategories,
      avgBillValue,
      paymentRate,
      supplierCountTrend: supplierCount,
      upcomingPayables7d,
      upcomingPayables30d,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load purchases mini stats";
    console.error("Purchases mini-stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
