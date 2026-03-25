import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";

const BASE_EMAIL_HTML: Record<string, string> = {
  invoice: `<h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 16px">Invoice {{invoice.number}}</h1>
<p>Dear {{invoice.customerName}},</p>
<p>Please find attached your invoice <strong>{{invoice.number}}</strong> dated {{invoice.issueDate}}.</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0">
  <tr style="border-bottom:1px solid #e5e7eb">
    <td style="padding:8px 0;color:#6b7280;font-size:14px">Amount Due</td>
    <td style="padding:8px 0;text-align:right;font-weight:700;font-size:16px">{{company.currency}} {{invoice.total}}</td>
  </tr>
  <tr>
    <td style="padding:8px 0;color:#6b7280;font-size:14px">Due Date</td>
    <td style="padding:8px 0;text-align:right;font-weight:600">{{invoice.dueDate}}</td>
  </tr>
</table>
<p>If you have any questions, please don't hesitate to contact us.</p>
<p style="margin-top:24px">Best regards,<br/>{{company.name}}</p>`,

  bill: `<h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 16px">Bill {{bill.number}}</h1>
<p>Please find the attached bill for your records.</p>
<p style="margin-top:24px">Regards,<br/>{{company.name}}</p>`,

  statement: `<h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 16px">Account Statement</h1>
<p>Dear Customer,</p>
<p>Please find your account statement attached.</p>
<p style="margin-top:24px">Best regards,<br/>{{company.name}}</p>`,

  payment_receipt: `<h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 16px">Payment Received</h1>
<p>We have received your payment. Thank you!</p>
<p style="margin-top:24px">Best regards,<br/>{{company.name}}</p>`,

  payment_reminder: `<h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 16px">Payment Reminder</h1>
<p>This is a friendly reminder that payment is due.</p>
<p style="margin-top:24px">Best regards,<br/>{{company.name}}</p>`,

  overdue_notice: `<h1 style="font-size:22px;font-weight:700;color:#dc2626;margin:0 0 16px">Overdue Notice</h1>
<p>Your payment is overdue. Please settle at your earliest convenience.</p>
<p style="margin-top:24px">Best regards,<br/>{{company.name}}</p>`,
};

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documentType = request.nextUrl.searchParams.get("documentType") ?? "invoice";
    const html = BASE_EMAIL_HTML[documentType] ?? BASE_EMAIL_HTML.invoice;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load base email HTML";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
