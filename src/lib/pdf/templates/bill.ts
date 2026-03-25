import type { PdfOrganization, CustomSlots, PdfRenderSettings } from "../types";
import { wrapInBaseLayout, getSections, orgLogoHtml } from "./base-layout";

export type BillVariant = "prestige" | "executive";

export interface BillTemplateData {
  org: PdfOrganization;
  bill: {
    number: string;
    issueDate: string;
    dueDate: string;
    status: string;
    supplierName: string;
    supplierAddress?: string | null;
    supplierEmail?: string | null;
    supplierTaxNumber?: string | null;
    subtotal: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    notes?: string | null;
    terms?: string | null;
    paymentInfo?: string | null;
    lines: { description: string; quantity: number; unitPrice: number; taxRate: number; taxAmount: number; amount: number }[];
  };
  pdfSettings?: Partial<PdfRenderSettings>;
}

function fmt(n: number, currency = "AED"): string {
  return `${currency}\u00A0${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: string): string {
  const key = status.toLowerCase();
  const map: Record<string, { cls: string; extraStyle?: string }> = {
    draft: { cls: "badge-neutral" },
    received: { cls: "badge-purple" },
    paid: { cls: "badge-success" },
    partial: { cls: "badge-warning" },
    overdue: { cls: "badge-error" },
    cancelled: { cls: "badge-neutral", extraStyle: "text-decoration:line-through;opacity:0.9" },
  };
  const m = map[key] ?? { cls: "badge-neutral" };
  const style = m.extraStyle ? ` style="${m.extraStyle}"` : "";
  return `<span class="badge ${m.cls}"${style}>${status}</span>`;
}

function buildSections(org: PdfOrganization, bill: BillTemplateData["bill"], pdfSettings?: Partial<PdfRenderSettings>, variant: BillVariant = "prestige"): string {
  const s = getSections(org, pdfSettings);
  const boxClass = variant === "executive" ? "info-box-exec" : "info-box";
  let html = "";

  if (s.payment && bill.paymentInfo) {
    html += `<div class="${boxClass} no-break"><div class="info-box-title">Payment Information</div><div class="info-box-content">${bill.paymentInfo}</div></div>`;
  }
  if (s.terms && bill.terms) {
    html += `<div class="${boxClass} no-break"><div class="info-box-title">Terms &amp; Conditions</div><div class="info-box-content">${bill.terms}</div></div>`;
  }
  if (s.notes && bill.notes) {
    html += `<div class="${boxClass} no-break"><div class="info-box-title">Notes</div><div class="info-box-content">${bill.notes}</div></div>`;
  }
  if (s.signature) {
    html += `<div class="signature-line no-break"><div class="signature-block"><div class="line">Authorized Signature</div></div><div class="signature-block"><div class="line">Date</div></div></div>`;
  }
  if (s.qrCode) {
    html += `<div style="margin-top:24px;display:flex;justify-content:flex-end" class="no-break"><div class="qr-placeholder">QR Code</div></div>`;
  }
  return html;
}

// ─── Prestige Variant ─────────────────────────────────────────
function buildPrestige(data: BillTemplateData): string {
  const { bill, org } = data;
  const c = org.currency;
  const accent = data.pdfSettings?.accentColor ?? org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, accent, 42);

  const linesHtml = bill.lines.map((l, i) => `
    <tr style="${i % 2 === 1 ? `background:${accent}06` : ""}">
      <td style="font-weight:500;color:#0f172a">${l.description}</td>
      <td class="text-right" style="color:#475569">${l.quantity}</td>
      <td class="text-right font-mono">${fmt(l.unitPrice, c)}</td>
      <td class="text-right" style="color:#94a3b8">${l.taxRate}%</td>
      <td class="text-right font-mono" style="font-weight:600;color:#0f172a">${fmt(l.amount, c)}</td>
    </tr>`).join("");

  return `
    <div style="height:3px;background:linear-gradient(90deg, ${accent}, ${accent}99);margin-bottom:32px;border-radius:2px"></div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px">
      <div style="display:flex;align-items:center;gap:14px">
        ${logo}
        <div>
          <div style="font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.02em">${org.name}</div>
          ${org.address ? `<div style="font-size:11px;color:#94a3b8;margin-top:3px;white-space:pre-line;line-height:1.5">${org.address}</div>` : ""}
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;line-height:1.7">
            ${[org.phone, org.email].filter(Boolean).join(" &middot; ")}
          </div>
          ${org.taxRegistrationNumber ? `<div style="font-size:10px;font-weight:600;color:#475569;margin-top:3px">TRN: ${org.taxRegistrationNumber}</div>` : ""}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:28px;font-weight:800;color:${accent};letter-spacing:-0.03em;line-height:1">BILL</div>
        <div style="font-size:15px;font-weight:600;color:#475569;margin-top:4px">${bill.number}</div>
        <div style="margin-top:10px">${statusBadge(bill.status)}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:32px">
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;border:1px solid rgba(0,0,0,0.04)">
        <div class="field-label" style="margin-bottom:8px">From (Supplier)</div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.01em">${bill.supplierName}</div>
        ${bill.supplierAddress ? `<div style="font-size:12px;color:#64748b;margin-top:6px;white-space:pre-line;line-height:1.6">${bill.supplierAddress}</div>` : ""}
        ${bill.supplierEmail ? `<div style="font-size:12px;color:#64748b;margin-top:3px">${bill.supplierEmail}</div>` : ""}
        ${bill.supplierTaxNumber ? `<div style="font-size:10px;font-weight:600;color:#475569;margin-top:6px">TRN: ${bill.supplierTaxNumber}</div>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-start;gap:10px;padding-top:4px">
        <div style="display:grid;grid-template-columns:auto auto;gap:6px 24px;text-align:right">
          <span class="field-label" style="text-align:right">Issue Date</span>
          <span class="field-value">${bill.issueDate}</span>
          <span class="field-label" style="text-align:right">Due Date</span>
          <span class="field-value">${bill.dueDate}</span>
        </div>
      </div>
    </div>

    <div class="doc-table" style="margin-bottom:8px">
      <table>
        <thead><tr>
          <th style="width:42%">Description</th>
          <th class="text-right" style="width:10%">Qty</th>
          <th class="text-right" style="width:18%">Unit Price</th>
          <th class="text-right" style="width:10%">VAT</th>
          <th class="text-right" style="width:20%">Amount</th>
        </tr></thead>
        <tbody>${linesHtml}</tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:20px">
      <div style="width:270px">
        <div style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px;color:#94a3b8">
          <span>Subtotal</span><span class="font-mono" style="color:#475569">${fmt(bill.subtotal, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px;color:#94a3b8">
          <span>VAT</span><span class="font-mono" style="color:#475569">${fmt(bill.taxAmount, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:14px 18px;margin-top:6px;background:${accent};color:#fff;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:-0.01em">
          <span>Total</span><span class="font-mono">${fmt(bill.total, c)}</span>
        </div>
        ${bill.amountPaid > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:9px 0;margin-top:10px;font-size:13px;color:#059669">
          <span>Amount Paid</span><span class="font-mono">${fmt(bill.amountPaid, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:700;color:#0f172a;border-top:1.5px solid rgba(0,0,0,0.08)">
          <span>Balance Due</span><span class="font-mono">${fmt(bill.amountDue, c)}</span>
        </div>` : ""}
      </div>
    </div>

    ${buildSections(org, bill, data.pdfSettings, "prestige")}
  `;
}

// ─── Executive Variant ────────────────────────────────────────
function buildExecutive(data: BillTemplateData): string {
  const { bill, org } = data;
  const c = org.currency;
  const accent = data.pdfSettings?.accentColor ?? org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, accent, 36);

  const linesHtml = bill.lines.map((l) => `
    <tr>
      <td style="font-weight:500;color:#0f172a;padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${l.description}</td>
      <td class="text-right" style="padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${l.quantity}</td>
      <td class="text-right font-mono" style="padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${fmt(l.unitPrice, c)}</td>
      <td class="text-right" style="padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#94a3b8">${l.taxRate}%</td>
      <td class="text-right font-mono" style="font-weight:600;color:#0f172a;padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${fmt(l.amount, c)}</td>
    </tr>`).join("");

  return `
    <div style="height:2px;background:${accent};margin-bottom:28px"></div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      ${logo}
      <div>
        <div style="font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.01em">${org.name}</div>
        <div style="font-size:10.5px;color:#94a3b8;margin-top:2px">
          ${[org.address?.replace(/\n/g, ", "), org.phone, org.email].filter(Boolean).join(" &middot; ")}
        </div>
        ${org.taxRegistrationNumber ? `<div style="font-size:10px;color:#64748b;font-weight:600;margin-top:1px">TRN: ${org.taxRegistrationNumber}</div>` : ""}
      </div>
    </div>

    <div style="border-top:1px solid rgba(0,0,0,0.08);margin:20px 0 24px"></div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
      <div>
        <div style="font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.03em">BILL</div>
        <div style="margin-top:6px">${statusBadge(bill.status)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:700;color:#0f172a">${bill.number}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px">
      <div>
        <div class="field-label" style="margin-bottom:6px">From (Supplier)</div>
        <div style="font-size:14px;font-weight:700;color:#0f172a">${bill.supplierName}</div>
        ${bill.supplierAddress ? `<div style="font-size:12px;color:#64748b;margin-top:4px;white-space:pre-line;line-height:1.5">${bill.supplierAddress}</div>` : ""}
        ${bill.supplierEmail ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${bill.supplierEmail}</div>` : ""}
        ${bill.supplierTaxNumber ? `<div style="font-size:10px;font-weight:600;color:#475569;margin-top:4px">TRN: ${bill.supplierTaxNumber}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;color:#94a3b8;margin-bottom:4px">Issue <span style="color:#0f172a;font-weight:600;margin-left:8px">${bill.issueDate}</span></div>
        <div style="font-size:12px;color:#94a3b8">Due <span style="color:#0f172a;font-weight:600;margin-left:8px">${bill.dueDate}</span></div>
      </div>
    </div>

    <div style="border-top:1px solid rgba(0,0,0,0.06);margin-bottom:4px"></div>
    <div class="doc-table">
      <table>
        <thead><tr>
          <th style="width:42%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Description</th>
          <th class="text-right" style="width:10%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Qty</th>
          <th class="text-right" style="width:18%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Unit Price</th>
          <th class="text-right" style="width:10%;border-bottom:1.5px solid rgba(0,0,0,0.1)">VAT</th>
          <th class="text-right" style="width:20%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Amount</th>
        </tr></thead>
        <tbody>${linesHtml}</tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <div style="width:250px">
        <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#94a3b8">
          <span>Subtotal</span><span class="font-mono" style="color:#475569;font-weight:500">${fmt(bill.subtotal, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#94a3b8">
          <span>VAT</span><span class="font-mono" style="color:#475569;font-weight:500">${fmt(bill.taxAmount, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:4px;font-size:15px;font-weight:700;color:#0f172a;border-top:2px solid #0f172a">
          <span>Total</span><span class="font-mono">${fmt(bill.total, c)}</span>
        </div>
        ${bill.amountPaid > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#059669">
          <span>Paid</span><span class="font-mono">${fmt(bill.amountPaid, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;color:#0f172a;border-top:1px solid rgba(0,0,0,0.08)">
          <span>Balance Due</span><span class="font-mono">${fmt(bill.amountDue, c)}</span>
        </div>` : ""}
      </div>
    </div>

    ${buildSections(org, bill, data.pdfSettings, "executive")}
  `;
}

const BUILDERS: Record<BillVariant, (d: BillTemplateData) => string> = {
  prestige: buildPrestige,
  executive: buildExecutive,
};

export function buildBillHtml(data: BillTemplateData, variant: BillVariant = "prestige", slots?: CustomSlots): string {
  const body = BUILDERS[variant](data);
  return wrapInBaseLayout({
    org: data.org,
    bodyHtml: body,
    title: `Bill ${data.bill.number}`,
    slots,
    pdfSettings: data.pdfSettings,
    noDefaultHeader: true,
  });
}

export function getBillBodyHtml(data: BillTemplateData, variant: BillVariant = "prestige"): string {
  return BUILDERS[variant](data);
}
