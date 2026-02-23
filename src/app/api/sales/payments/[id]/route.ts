import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { payments, paymentAllocations, invoices, bills, customers, suppliers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Payment ID required" }, { status: 400 });

  try {
    const [r] = await db
      .select({
        id: payments.id,
        paymentNumber: payments.paymentNumber,
        paymentDate: payments.paymentDate,
        entityType: payments.entityType,
        entityId: payments.entityId,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
      })
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.organizationId, orgId)))
      .limit(1);

    if (!r) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    let entityName = "—";
    if (r.entityId) {
      if (r.entityType === "supplier") {
        const [s] = await db
          .select({ name: suppliers.name })
          .from(suppliers)
          .where(and(eq(suppliers.organizationId, orgId), eq(suppliers.id, r.entityId)))
          .limit(1);
        if (s) entityName = s.name;
      } else {
        const [c] = await db
          .select({ name: customers.name })
          .from(customers)
          .where(and(eq(customers.organizationId, orgId), eq(customers.id, r.entityId)))
          .limit(1);
        if (c) entityName = c.name;
      }
    }

    const allocs = await db
      .select({ documentId: paymentAllocations.documentId, documentType: paymentAllocations.documentType })
      .from(paymentAllocations)
      .where(eq(paymentAllocations.paymentId, r.id));
    let invoiceNumber = "—";
    let invoiceId: string | null = null;
    let billNumber = "—";
    let billId: string | null = null;
    if (allocs[0]?.documentId) {
      if (allocs[0].documentType === "invoice") {
        const [inv] = await db
          .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
          .from(invoices)
          .where(eq(invoices.id, allocs[0].documentId))
          .limit(1);
        if (inv) {
          invoiceNumber = inv.invoiceNumber;
          invoiceId = inv.id;
        }
      } else if (allocs[0].documentType === "bill") {
        const [b] = await db
          .select({ id: bills.id, billNumber: bills.billNumber })
          .from(bills)
          .where(eq(bills.id, allocs[0].documentId))
          .limit(1);
        if (b) {
          billNumber = b.billNumber;
          billId = b.id;
        }
      }
    }

    const docRef = invoiceNumber !== "—" ? invoiceNumber : billNumber;
    return NextResponse.json({
      id: r.id,
      paymentNumber: r.paymentNumber,
      paymentDate: r.paymentDate,
      entityName,
      entityType: r.entityType ?? "customer",
      amount: parseFloat(r.amount ?? "0"),
      method: r.method ?? "bank_transfer",
      reference: r.reference ?? "",
      invoiceNumber: docRef,
      invoiceId,
      billId,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
