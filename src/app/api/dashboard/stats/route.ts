import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import {
  invoices,
  bills,
  customers,
  suppliers,
  bankAccounts,
  bankTransactions,
  vatReturns,
  items,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Sales stats
    const invoiceRows = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
        totalPaid: sql<string>`coalesce(sum(${invoices.amountPaid}::numeric), 0)`,
        totalOutstanding: sql<string>`coalesce(sum(${invoices.amountDue}::numeric), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, orgId));

    const overdueRows = await db
      .select({
        overdueAmount: sql<string>`coalesce(sum(${invoices.amountDue}::numeric), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, orgId),
          sql`${invoices.status} IN ('sent', 'overdue')`,
          sql`${invoices.dueDate} < current_date`,
          sql`${invoices.amountDue}::numeric > 0`
        )
      );

    const customerCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(and(eq(customers.organizationId, orgId), eq(customers.isActive, true)));

    // Purchase stats
    const billRows = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalExpenses: sql<string>`coalesce(sum(${bills.total}::numeric), 0)`,
        totalPaid: sql<string>`coalesce(sum(${bills.amountPaid}::numeric), 0)`,
        totalOutstanding: sql<string>`coalesce(sum(${bills.amountDue}::numeric), 0)`,
      })
      .from(bills)
      .where(eq(bills.organizationId, orgId));

    const supplierCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(and(eq(suppliers.organizationId, orgId), eq(suppliers.isActive, true)));

    // Banking stats
    const bankRows = await db
      .select({
        totalBalance: sql<string>`coalesce(sum(${bankAccounts.currentBalance}::numeric), 0)`,
      })
      .from(bankAccounts)
      .where(and(eq(bankAccounts.organizationId, orgId), eq(bankAccounts.isActive, true)));

    const unreconciledRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bankTransactions)
      .where(and(eq(bankTransactions.organizationId, orgId), eq(bankTransactions.isReconciled, false)));

    // VAT stats (latest draft or most recent)
    const vatRows = await db
      .select({
        outputVat: vatReturns.outputVat,
        inputVat: vatReturns.inputVat,
        netVat: vatReturns.netVat,
        status: vatReturns.status,
        periodStart: vatReturns.periodStart,
        periodEnd: vatReturns.periodEnd,
      })
      .from(vatReturns)
      .where(eq(vatReturns.organizationId, orgId))
      .orderBy(sql`${vatReturns.periodEnd} desc`)
      .limit(1);

    // Inventory stats
    const inventoryRows = await db
      .select({
        totalProducts: sql<number>`count(*)::int`,
        totalValue: sql<string>`coalesce(sum((${items.costPrice}::numeric) * (${items.quantityOnHand}::numeric)), 0)`,
        lowStock: sql<number>`count(*) filter (where ${items.quantityOnHand}::numeric <= ${items.reorderLevel}::numeric and ${items.trackInventory} = true)::int`,
      })
      .from(items)
      .where(and(eq(items.organizationId, orgId), eq(items.isActive, true)));

    const inv = invoiceRows[0];
    const ov = overdueRows[0];
    const bl = billRows[0];
    const bk = bankRows[0];
    const ur = unreconciledRows[0];
    const vt = vatRows[0];
    const it = inventoryRows[0];

    return NextResponse.json({
      sales: {
        totalRevenue: parseFloat(inv?.totalRevenue ?? "0"),
        totalPaid: parseFloat(inv?.totalPaid ?? "0"),
        totalOutstanding: parseFloat(inv?.totalOutstanding ?? "0"),
        overdueAmount: parseFloat(ov?.overdueAmount ?? "0"),
        invoiceCount: inv?.count ?? 0,
        customerCount: customerCount[0]?.count ?? 0,
      },
      purchases: {
        totalExpenses: parseFloat(bl?.totalExpenses ?? "0"),
        totalPaid: parseFloat(bl?.totalPaid ?? "0"),
        totalOutstanding: parseFloat(bl?.totalOutstanding ?? "0"),
        billCount: bl?.count ?? 0,
        supplierCount: supplierCount[0]?.count ?? 0,
      },
      banking: {
        totalBalance: parseFloat(bk?.totalBalance ?? "0"),
        unreconciled: ur?.count ?? 0,
      },
      vat: {
        totalOutputVat: parseFloat(vt?.outputVat ?? "0"),
        totalInputVat: parseFloat(vt?.inputVat ?? "0"),
        netPayable: parseFloat(vt?.netVat ?? "0"),
      },
      inventory: {
        totalProducts: it?.totalProducts ?? 0,
        totalValue: parseFloat(it?.totalValue ?? "0"),
        lowStock: it?.lowStock ?? 0,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load dashboard stats";
    console.error("Dashboard stats error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
