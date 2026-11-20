import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/utils/rate-limit";
import { resolvePortalToken, getPortalInvoice } from "@/lib/client-portal/tokens";
import { compileTemplate } from "@/lib/pdf/template-engine";
import { generatePdf } from "@/lib/pdf/engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const ip = getClientIp(request);
  if (!rateLimit(`portal-pdf:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token, id } = await params;
  const resolved = await resolvePortalToken(token);
  if (!resolved) {
    return NextResponse.json({ error: "Invalid or expired portal link" }, { status: 401 });
  }

  const invoice = await getPortalInvoice(
    resolved.organizationId,
    resolved.customerId,
    id
  );
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  try {
    const pdfInvoice = {
      number: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      customerName: invoice.customerName,
      customerAddress: invoice.customerAddress,
      customerEmail: invoice.customerEmail,
      customerTaxNumber: invoice.customerTaxNumber,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      notes: invoice.notes,
      terms: invoice.terms,
      paymentInfo: invoice.paymentInfo,
      lines: invoice.lines,
    };

    const html = await compileTemplate({
      orgId: resolved.organizationId,
      documentType: "invoice",
      data: { invoice: pdfInvoice },
    });

    const pdfBuffer = await generatePdf(html, {
      pageSize: "A4",
      orientation: "portrait",
      margins: { top: "15mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });

    const filename = `${invoice.invoiceNumber || "invoice"}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to generate PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
