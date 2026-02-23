import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { customers, invoices, payments } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const custRows = await db
      .select({ id: customers.id, name: customers.name, city: customers.city, country: customers.country })
      .from(customers)
      .where(and(eq(customers.organizationId, orgId), eq(customers.isActive, true)))
      .orderBy(customers.name);

    const invRows = await db
      .select({
        id: invoices.id,
        customerId: invoices.customerId,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        amountDue: invoices.amountDue,
        status: invoices.status,
      })
      .from(invoices)
      .where(and(eq(invoices.organizationId, orgId), ne(invoices.status, "cancelled")));

    const payRows = await db
      .select({
        id: payments.id,
        entityId: payments.entityId,
        paymentNumber: payments.paymentNumber,
        paymentDate: payments.paymentDate,
        amount: payments.amount,
        paymentType: payments.paymentType,
      })
      .from(payments)
      .where(and(eq(payments.organizationId, orgId), eq(payments.entityType, "customer")));

    const statements = custRows.map((customer) => {
      const customerInvoices = invRows.filter((i) => i.customerId === customer.id);
      const invoicesList = customerInvoices.filter((i) => parseFloat(i.total ?? "0") > 0);
      const creditNotes = customerInvoices.filter(
        (i) => parseFloat(i.total ?? "0") < 0 || (i.invoiceNumber?.startsWith("CN-") ?? false)
      );
      const paymentsReceived = payRows.filter(
        (p) => p.entityId === customer.id && p.paymentType === "received"
      );
      const refunds = payRows.filter((p) => p.entityId === customer.id && p.paymentType === "made");

      const totalInvoiced = invoicesList.reduce((s, i) => s + parseFloat(i.total ?? "0"), 0);
      const totalCreditNotes = creditNotes.reduce((s, i) => s + Math.abs(parseFloat(i.total ?? "0")), 0);
      const totalPaid = paymentsReceived.reduce((s, p) => s + parseFloat(p.amount ?? "0"), 0);
      const totalRefunded = refunds.reduce((s, p) => s + parseFloat(p.amount ?? "0"), 0);

      const balance = customerInvoices
        .filter((i) => i.status !== "draft")
        .reduce((s, i) => s + parseFloat(i.amountDue ?? "0"), 0);
      const hasActivity =
        invoicesList.length > 0 ||
        creditNotes.length > 0 ||
        paymentsReceived.length > 0 ||
        refunds.length > 0;

      return {
        customer: {
          id: customer.id,
          name: customer.name,
          city: customer.city ?? "",
          country: customer.country ?? "",
        },
        invoices: invoicesList.map((i) => ({
          id: i.id,
          issueDate: i.issueDate ?? "",
          invoiceNumber: i.invoiceNumber ?? "",
          total: parseFloat(i.total ?? "0"),
        })),
        creditNotes: creditNotes.map((i) => ({
          id: i.id,
          issueDate: i.issueDate ?? "",
          creditNoteNumber: i.invoiceNumber ?? "",
          total: Math.abs(parseFloat(i.total ?? "0")),
        })),
        payments: paymentsReceived.map((p) => ({
          id: p.id,
          paymentDate: p.paymentDate ?? "",
          paymentNumber: p.paymentNumber ?? "",
          amount: parseFloat(p.amount ?? "0"),
        })),
        refunds: refunds.map((p) => ({
          id: p.id,
          paymentDate: p.paymentDate ?? "",
          paymentNumber: p.paymentNumber ?? "",
          amount: parseFloat(p.amount ?? "0"),
        })),
        totalInvoiced,
        totalCreditNotes,
        totalPaid,
        totalRefunded,
        balance,
        hasActivity,
      };
    });

    return NextResponse.json({
      statements: statements.filter((s) => s.hasActivity),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load statements";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
