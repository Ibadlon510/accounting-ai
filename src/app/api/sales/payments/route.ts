import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { payments, paymentAllocations, invoices, customers } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: payments.id,
        paymentNumber: payments.paymentNumber,
        paymentDate: payments.paymentDate,
        entityId: payments.entityId,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
      })
      .from(payments)
      .where(and(eq(payments.organizationId, orgId), eq(payments.entityType, "customer"), eq(payments.paymentType, "received")))
      .orderBy(desc(payments.paymentDate))
      .limit(200);

    const custIds = [...new Set(rows.map((r) => r.entityId).filter(Boolean))] as string[];
    const custMap = new Map<string, string>();
    if (custIds.length > 0) {
      const custRows = await db.select({ id: customers.id, name: customers.name }).from(customers).where(and(eq(customers.organizationId, orgId), inArray(customers.id, custIds)));
      custRows.forEach((c) => custMap.set(c.id, c.name));
    }

    const result = [];
    for (const r of rows) {
      const allocs = await db.select({ documentId: paymentAllocations.documentId }).from(paymentAllocations).where(eq(paymentAllocations.paymentId, r.id));
      let invoiceNumber = "—";
      let invoiceId: string | null = null;
      if (allocs[0]?.documentId) {
        const [inv] = await db.select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber }).from(invoices).where(eq(invoices.id, allocs[0].documentId)).limit(1);
        if (inv) {
          invoiceNumber = inv.invoiceNumber;
          invoiceId = inv.id;
        }
      }
      result.push({
        id: r.id,
        paymentNumber: r.paymentNumber,
        paymentDate: r.paymentDate,
        entityName: custMap.get(r.entityId ?? "") ?? "—",
        amount: parseFloat(r.amount ?? "0"),
        method: r.method ?? "bank_transfer",
        reference: r.reference ?? "",
        invoiceNumber,
        invoiceId,
      });
    }

    return NextResponse.json({ payments: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load payments";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
