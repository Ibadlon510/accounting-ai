import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { invoices, invoiceLines, customers, paymentAllocations, payments, documents, documentTransactions } from "@/lib/db/schema";
import { eq, sql, count, and } from "drizzle-orm";
import { deriveInvoiceStatus } from "@/lib/accounting/document-status";

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
        documentId: invoices.documentId,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.organizationId, orgId))
      .orderBy(sql`${invoices.issueDate} desc`);

    // Fetch lines and payment link for each invoice
    const result = [];
    for (const inv of rows) {
      const lines = await db
        .select()
        .from(invoiceLines)
        .where(eq(invoiceLines.invoiceId, inv.id))
        .orderBy(invoiceLines.lineOrder);

      const receipts: { type: "document" | "payment"; date: string; amount: number; documentId?: string; paymentId?: string }[] = [];
      const amountPaidNum = parseFloat(inv.amountPaid ?? "0");

      if (amountPaidNum > 0) {
        const allocs = await db
          .select({
            paymentId: paymentAllocations.paymentId,
            amount: paymentAllocations.amount,
            paymentDate: payments.paymentDate,
          })
          .from(paymentAllocations)
          .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
          .where(
            and(
              eq(paymentAllocations.documentType, "invoice"),
              eq(paymentAllocations.documentId, inv.id)
            )
          );
        for (const a of allocs) {
          receipts.push({
            type: "payment",
            date: a.paymentDate ?? "",
            amount: parseFloat(a.amount ?? "0"),
            paymentId: a.paymentId,
          });
        }

        if (inv.documentId && receipts.length === 0) {
          const [dt] = await db
            .select({ date: documentTransactions.date, totalAmount: documentTransactions.totalAmount })
            .from(documentTransactions)
            .where(eq(documentTransactions.documentId, inv.documentId))
            .limit(1);
          const [doc] = await db
            .select({ createdAt: documents.createdAt })
            .from(documents)
            .where(eq(documents.id, inv.documentId))
            .limit(1);
          const docDate = dt?.date ?? (doc?.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : "");
          const docAmount = dt ? parseFloat(dt.totalAmount ?? "0") : parseFloat(inv.total ?? "0");
          receipts.push({
            type: "document",
            date: docDate,
            amount: docAmount || parseFloat(inv.total ?? "0"),
            documentId: inv.documentId,
          });
        } else if (inv.documentId && receipts.length > 0) {
          receipts[0].documentId = inv.documentId;
        }
      }

      receipts.sort((a, b) => a.date.localeCompare(b.date));
      const paymentId = receipts.find((r) => r.paymentId)?.paymentId ?? null;
      const amountDueNum = parseFloat(inv.amountDue ?? "0");
      const derivedStatus = deriveInvoiceStatus(
        inv.status ?? "draft",
        amountPaidNum,
        amountDueNum,
        inv.dueDate
      );

      result.push({
        ...inv,
        status: derivedStatus,
        subtotal: parseFloat(inv.subtotal ?? "0"),
        taxAmount: parseFloat(inv.taxAmount ?? "0"),
        total: parseFloat(inv.total ?? "0"),
        amountPaid: amountPaidNum,
        amountDue: amountDueNum,
        paymentId,
        receipts,
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

type LineInput = { id?: string; productId?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate?: number; taxAmount?: number };

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { customerId: string; issueDate: string; dueDate: string; lines: LineInput[]; subtotal: number; taxAmount: number; total: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { customerId, issueDate, dueDate, lines, subtotal, taxAmount, total } = body;
  if (!customerId?.trim()) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
  if (!issueDate || !dueDate) return NextResponse.json({ error: "Issue date and due date are required" }, { status: 400 });
  if (!lines?.length || lines.some((l) => !l.description?.trim())) return NextResponse.json({ error: "At least one line with description is required" }, { status: 400 });
  const totalNum = Number(total) || 0;
  if (totalNum <= 0) return NextResponse.json({ error: "Total must be greater than zero" }, { status: 400 });

  try {
    const [{ value: cnt }] = await db.select({ value: count() }).from(invoices).where(eq(invoices.organizationId, orgId));
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String((cnt ?? 0) + 1).padStart(3, "0")}`;

    const [inv] = await db
      .insert(invoices)
      .values({
        organizationId: orgId,
        customerId,
        invoiceNumber,
        issueDate,
        dueDate,
        status: "draft",
        subtotal: String(Number(subtotal) || 0),
        taxAmount: String(Number(taxAmount) || 0),
        total: String(totalNum),
        amountPaid: "0",
        amountDue: String(totalNum),
      })
      .returning({ id: invoices.id, invoiceNumber: invoices.invoiceNumber, customerId: invoices.customerId, issueDate: invoices.issueDate, dueDate: invoices.dueDate, status: invoices.status, subtotal: invoices.subtotal, taxAmount: invoices.taxAmount, total: invoices.total, amountPaid: invoices.amountPaid, amountDue: invoices.amountDue });

    if (!inv) return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const qty = Number(l.quantity) || 0;
      const price = Number(l.unitPrice) || 0;
      const amt = Number(l.amount) || (qty * price);
      const rate = isNaN(Number(l.taxRate)) ? 5 : Number(l.taxRate);
      const taxAmt = isNaN(Number(l.taxAmount)) ? Math.round(amt * rate / 100 * 100) / 100 : Number(l.taxAmount);
      await db.insert(invoiceLines).values({
        invoiceId: inv.id,
        itemId: l.productId || null,
        description: (l.description ?? "").trim() || "Line item",
        quantity: String(qty),
        unitPrice: String(price),
        amount: String(amt),
        taxCode: "VAT5",
        taxRate: String(rate),
        taxAmount: String(taxAmt),
        lineOrder: i,
      });
    }

    const [cust] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, customerId)).limit(1);
    return NextResponse.json({
      invoice: {
        id: inv.id,
        customerId: inv.customerId,
        customerName: cust?.name ?? "",
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        subtotal: parseFloat(inv.subtotal ?? "0"),
        taxAmount: parseFloat(inv.taxAmount ?? "0"),
        total: parseFloat(inv.total ?? "0"),
        amountPaid: parseFloat(inv.amountPaid ?? "0"),
        amountDue: parseFloat(inv.amountDue ?? "0"),
        lines: lines.map((l, i) => ({
          id: `line-${i}`,
          description: l.description,
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          amount: Number(l.amount) || 0,
          taxRate: isNaN(Number(l.taxRate)) ? 5 : Number(l.taxRate),
          taxAmount: Number(l.taxAmount) || 0,
        })),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create invoice";
    console.error("Invoices POST error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
