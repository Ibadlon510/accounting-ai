import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bills, billLines, suppliers, paymentAllocations, payments, documents, documentTransactions, organizations, taxCodes } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { deriveBillStatus } from "@/lib/accounting/document-status";
import { requireOrgRole } from "@/lib/auth/require-role";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: bills.id,
        supplierId: bills.supplierId,
        supplierName: suppliers.name,
        supplierEmail: suppliers.email,
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
        notes: bills.notes,
        terms: bills.terms,
        paymentInfo: bills.paymentInfo,
        documentId: bills.documentId,
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

      const amountPaidNum = parseFloat(bill.amountPaid ?? "0");
      const amountDueNum = parseFloat(bill.amountDue ?? "0");
      const derivedStatus = deriveBillStatus(
        bill.status ?? "draft",
        amountPaidNum,
        amountDueNum,
        bill.dueDate
      );

      const receipts: { type: "document" | "payment"; date: string; amount: number; documentId?: string; paymentId?: string }[] = [];
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
              eq(paymentAllocations.documentType, "bill"),
              eq(paymentAllocations.documentId, bill.id)
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

        if (bill.documentId && receipts.length === 0) {
          const [dt] = await db
            .select({ date: documentTransactions.date, totalAmount: documentTransactions.totalAmount })
            .from(documentTransactions)
            .where(eq(documentTransactions.documentId, bill.documentId))
            .limit(1);
          const [doc] = await db
            .select({ createdAt: documents.createdAt })
            .from(documents)
            .where(eq(documents.id, bill.documentId))
            .limit(1);
          const docDate = dt?.date ?? (doc?.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : "");
          const docAmount = dt ? parseFloat(dt.totalAmount ?? "0") : parseFloat(bill.total ?? "0");
          receipts.push({
            type: "document",
            date: docDate,
            amount: docAmount || parseFloat(bill.total ?? "0"),
            documentId: bill.documentId,
          });
        } else if (bill.documentId && receipts.length > 0) {
          receipts[0].documentId = bill.documentId;
        }
      }

      receipts.sort((a, b) => a.date.localeCompare(b.date));
      const paymentId = receipts.find((r) => r.paymentId)?.paymentId ?? null;

      result.push({
        ...bill,
        status: derivedStatus,
        subtotal: parseFloat(bill.subtotal ?? "0"),
        taxAmount: parseFloat(bill.taxAmount ?? "0"),
        total: parseFloat(bill.total ?? "0"),
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

    return NextResponse.json({ bills: result });
  } catch (e: unknown) {
    console.error("[purchases/bills GET] Error:", e);
    return NextResponse.json({ error: "Failed to load bills" }, { status: 500 });
  }
}

type LineInput = { id?: string; productId?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate?: number; taxAmount?: number; taxCodeId?: string; taxCode?: string };

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleCheck = await requireOrgRole(orgId, "accountant");
  if (roleCheck instanceof NextResponse) return roleCheck;

  let body: { supplierId: string; billNumber: string; issueDate: string; dueDate: string; lines: LineInput[]; subtotal: number; taxAmount: number; total: number; notes?: string; terms?: string; paymentInfo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { supplierId, billNumber, issueDate, dueDate, lines, subtotal, taxAmount, total } = body;
  if (!supplierId?.trim()) return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
  if (!billNumber?.trim()) return NextResponse.json({ error: "Bill number is required" }, { status: 400 });
  if (!issueDate || !dueDate) return NextResponse.json({ error: "Issue date and due date are required" }, { status: 400 });
  if (!lines?.length || lines.some((l) => !l.description?.trim())) return NextResponse.json({ error: "At least one line with description is required" }, { status: 400 });
  const totalNum = Number(total) || 0;
  if (totalNum <= 0) return NextResponse.json({ error: "Total must be greater than zero" }, { status: 400 });

  try {
    const [org] = await db
      .select({ isVatRegistered: organizations.isVatRegistered, defaultTaxCodeId: organizations.defaultTaxCodeId })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    let defaultTaxCode = "SR";
    if (org?.defaultTaxCodeId) {
      const [tc] = await db.select({ code: taxCodes.code }).from(taxCodes).where(eq(taxCodes.id, org.defaultTaxCodeId)).limit(1);
      if (tc) defaultTaxCode = tc.code;
    }

    const [bill] = await db
      .insert(bills)
      .values({
        organizationId: orgId,
        supplierId,
        billNumber: billNumber.trim(),
        issueDate,
        dueDate,
        status: "draft",
        subtotal: String(Number(subtotal) || 0),
        taxAmount: String(org?.isVatRegistered ? (Number(taxAmount) || 0) : 0),
        total: String(totalNum),
        amountPaid: "0",
        amountDue: String(totalNum),
        notes: body.notes?.trim() || null,
        terms: body.terms?.trim() || null,
        paymentInfo: body.paymentInfo?.trim() || null,
      })
      .returning({ id: bills.id, billNumber: bills.billNumber, supplierId: bills.supplierId, issueDate: bills.issueDate, dueDate: bills.dueDate, status: bills.status, subtotal: bills.subtotal, taxAmount: bills.taxAmount, total: bills.total, amountPaid: bills.amountPaid, amountDue: bills.amountDue });

    if (!bill) return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const qty = Number(l.quantity) || 0;
      const price = Number(l.unitPrice) || 0;
      const amt = Number(l.amount) || (qty * price);
      const rate = org?.isVatRegistered ? (isNaN(Number(l.taxRate)) ? 5 : Number(l.taxRate)) : 0;
      const taxAmt = org?.isVatRegistered ? (isNaN(Number(l.taxAmount)) ? Math.round(amt * rate / 100 * 100) / 100 : Number(l.taxAmount)) : 0;

      let lineTaxCode = l.taxCode || defaultTaxCode;
      let lineTaxCodeId = l.taxCodeId || null;
      if (lineTaxCodeId) {
        const [tc] = await db.select({ code: taxCodes.code }).from(taxCodes).where(eq(taxCodes.id, lineTaxCodeId)).limit(1);
        if (tc) lineTaxCode = tc.code;
      }

      await db.insert(billLines).values({
        billId: bill.id,
        itemId: l.productId || null,
        description: (l.description ?? "").trim() || "Line item",
        quantity: String(qty),
        unitPrice: String(price),
        amount: String(amt),
        taxCode: lineTaxCode,
        taxCodeId: lineTaxCodeId,
        taxRate: String(rate),
        taxAmount: String(taxAmt),
        lineOrder: i,
      });
    }

    const [sup] = await db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    return NextResponse.json({
      bill: {
        id: bill.id,
        supplierId: bill.supplierId,
        supplierName: sup?.name ?? "",
        billNumber: bill.billNumber,
        issueDate: bill.issueDate,
        dueDate: bill.dueDate,
        status: bill.status,
        subtotal: parseFloat(bill.subtotal ?? "0"),
        taxAmount: parseFloat(bill.taxAmount ?? "0"),
        total: parseFloat(bill.total ?? "0"),
        amountPaid: parseFloat(bill.amountPaid ?? "0"),
        amountDue: parseFloat(bill.amountDue ?? "0"),
        lines: lines.map((l, i) => ({
          id: `line-${i}`,
          description: l.description,
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          amount: Number(l.amount) || 0,
          taxRate: isNaN(Number(l.taxRate)) ? 0 : Number(l.taxRate),
          taxAmount: Number(l.taxAmount) || 0,
        })),
      },
    });
  } catch (e: unknown) {
    console.error("[purchases/bills POST] Error:", e);
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}
