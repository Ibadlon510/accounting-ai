import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";

const INVOICE_MODERN_HTML = `
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
  <div>
    <h1 style="font-size:32px;font-weight:800;color:var(--accent);margin-bottom:2px;letter-spacing:-0.02em">INVOICE</h1>
    <div style="font-size:18px;font-weight:600;color:#6b7280">{{invoice.number}}</div>
  </div>
  <div style="text-align:right">
    <span class="badge badge-blue">{{invoice.status}}</span>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px">
  <div style="background:#f9fafb;border-radius:8px;padding:16px 20px">
    <div class="field-label" style="margin-bottom:6px">Bill To</div>
    <div style="font-size:15px;font-weight:700;color:#1f2937">{{invoice.customerName}}</div>
  </div>
  <div style="text-align:right">
    <div style="display:grid;grid-template-columns:auto auto;gap:6px 20px;justify-content:end">
      <span class="field-label">Issue Date</span><span class="field-value">{{invoice.issueDate}}</span>
      <span class="field-label">Due Date</span><span class="field-value">{{invoice.dueDate}}</span>
    </div>
  </div>
</div>

<div class="doc-table mt-4">
  <table>
    <thead><tr>
      <th style="width:42%">Description</th>
      <th class="text-right" style="width:10%">Qty</th>
      <th class="text-right" style="width:18%">Unit Price</th>
      <th class="text-right" style="width:10%">VAT</th>
      <th class="text-right" style="width:20%">Amount</th>
    </tr></thead>
    <tbody>
      {{#each invoice.lines}}
      <tr>
        <td>{{description}}</td>
        <td class="text-right">{{quantity}}</td>
        <td class="text-right font-mono">{{unitPrice}}</td>
        <td class="text-right">{{taxRate}}%</td>
        <td class="text-right font-mono">{{amount}}</td>
      </tr>
      {{/each}}
      <tr class="summary-row">
        <td colspan="4" class="text-right">Subtotal</td>
        <td class="text-right font-mono">{{invoice.subtotal}}</td>
      </tr>
      <tr class="summary-row">
        <td colspan="4" class="text-right">VAT</td>
        <td class="text-right font-mono">{{invoice.taxAmount}}</td>
      </tr>
      <tr class="total-row">
        <td colspan="4" class="text-right">Total</td>
        <td class="text-right font-mono">{{invoice.total}}</td>
      </tr>
    </tbody>
  </table>
</div>
`.trim();

const BILL_MODERN_HTML = INVOICE_MODERN_HTML
  .replace(/INVOICE/g, "BILL")
  .replace(/Bill To/g, "From (Supplier)")
  .replace(/invoice\./g, "bill.")
  .replace(/customerName/g, "supplierName");

const BASE_HTML: Record<string, string> = {
  invoice: INVOICE_MODERN_HTML,
  bill: BILL_MODERN_HTML,
  credit_note: `<h1 style="font-size:28px;font-weight:800;color:#dc2626">CREDIT NOTE</h1>\n<p>{{creditNote.number}}</p>\n<p>Customize this template...</p>`,
  statement: `<h1 style="font-size:28px;font-weight:800;color:var(--accent)">STATEMENT</h1>\n<p>Customer Account Statement</p>\n<p>Customize this template...</p>`,
  profit_and_loss: `<h1 style="font-size:24px;font-weight:700;color:var(--accent)">Profit & Loss Statement</h1>\n<p>Customize this report template...</p>`,
  balance_sheet: `<h1 style="font-size:24px;font-weight:700;color:var(--accent)">Balance Sheet</h1>\n<p>Customize this report template...</p>`,
  vat_audit: `<h1 style="font-size:24px;font-weight:700;color:var(--accent)">VAT Audit Report</h1>\n<p>Customize this report template...</p>`,
  inventory_valuation: `<h1 style="font-size:24px;font-weight:700;color:var(--accent)">Inventory Valuation</h1>\n<p>Customize this report template...</p>`,
};

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documentType = request.nextUrl.searchParams.get("documentType") ?? "invoice";
    const html = BASE_HTML[documentType] ?? BASE_HTML.invoice;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load base HTML";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
