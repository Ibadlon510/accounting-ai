import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bills, billLines, suppliers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: bills.id,
        supplierId: bills.supplierId,
        supplierName: suppliers.name,
        billNumber: bills.billNumber,
        issueDate: bills.issueDate,
        dueDate: bills.dueDate,
        status: bills.status,
        currency: bills.currency,
        subtotal: bills.subtotal,
        taxAmount: bills.taxAmount,
        total: bills.total,
        amountPaid: bills.amountPaid,
        amountDue: bills.amountDue,
      })
      .from(bills)
      .leftJoin(suppliers, eq(bills.supplierId, suppliers.id))
      .where(eq(bills.organizationId, orgId))
      .orderBy(sql`${bills.issueDate} desc`);

    const result = [];
    for (const bill of rows) {
      const lines = await db
        .select()
        .from(billLines)
        .where(eq(billLines.billId, bill.id))
        .orderBy(billLines.lineOrder);

      result.push({
        ...bill,
        subtotal: parseFloat(bill.subtotal ?? "0"),
        taxAmount: parseFloat(bill.taxAmount ?? "0"),
        total: parseFloat(bill.total ?? "0"),
        amountPaid: parseFloat(bill.amountPaid ?? "0"),
        amountDue: parseFloat(bill.amountDue ?? "0"),
        lines: lines.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: parseFloat(l.quantity ?? "0"),
          unitPrice: parseFloat(l.unitPrice ?? "0"),
          amount: parseFloat(l.amount ?? "0"),
          taxRate: parseFloat(l.taxRate ?? "0"),
          taxAmount: parseFloat(l.taxAmount ?? "0"),
        })),
      });
    }

    return NextResponse.json({ bills: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load bills";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
