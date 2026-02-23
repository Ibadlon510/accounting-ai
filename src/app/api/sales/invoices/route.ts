import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { invoices, invoiceLines, customers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: invoices.id,
        customerId: invoices.customerId,
        customerName: customers.name,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        currency: invoices.currency,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        amountDue: invoices.amountDue,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.organizationId, orgId))
      .orderBy(sql`${invoices.issueDate} desc`);

    // Fetch lines for each invoice
    const result = [];
    for (const inv of rows) {
      const lines = await db
        .select()
        .from(invoiceLines)
        .where(eq(invoiceLines.invoiceId, inv.id))
        .orderBy(invoiceLines.lineOrder);

      result.push({
        ...inv,
        subtotal: parseFloat(inv.subtotal ?? "0"),
        taxAmount: parseFloat(inv.taxAmount ?? "0"),
        total: parseFloat(inv.total ?? "0"),
        amountPaid: parseFloat(inv.amountPaid ?? "0"),
        amountDue: parseFloat(inv.amountDue ?? "0"),
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

    return NextResponse.json({ invoices: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load invoices";
    console.error("Invoices API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
