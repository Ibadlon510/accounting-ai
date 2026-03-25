import type { PdfOrganization, CustomSlots, PdfRenderSettings } from "../types";
import { wrapInBaseLayout, getSections, orgLogoHtml } from "./base-layout";

export type CreditNoteVariant = "prestige" | "executive";

export interface CreditNoteTemplateData {
  org: PdfOrganization;
  creditNote: {
    number: string;
    type: "sales" | "purchase";
    date: string;
    entityName: string;
    entityAddress?: string | null;
    entityEmail?: string | null;
    reason?: string | null;
    subtotal: number;
    taxAmount: number;
    total: number;
    lines: {
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      taxRate: number;
      taxAmount: number;
    }[];
  };
  pdfSettings?: Partial<PdfRenderSettings>;
}

function fmt(n: number, currency = "AED"): string {
  return `${currency}\u00A0${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CN_ACCENT = "#b91c1c";

function buildCreditNoteSections(org: PdfOrganization, pdfSettings?: Partial<PdfRenderSettings>, variant: CreditNoteVariant = "prestige"): string {
  const s = getSections(org, pdfSettings);
  const boxClass = variant === "executive" ? "info-box-exec" : "info-box";
  let html = "";

  if (s.payment && org.pdfPaymentInfo) {
    html += `<div class="${boxClass} no-break" ${variant === "prestige" ? `style="border-left-color:${CN_ACCENT}40"` : ""}><div class="info-box-title">Payment Information</div><div class="info-box-content">${org.pdfPaymentInfo}</div></div>`;
  }
  if (s.terms && org.pdfDefaultTerms) {
    html += `<div class="${boxClass} no-break" ${variant === "prestige" ? `style="border-left-color:${CN_ACCENT}40"` : ""}><div class="info-box-title">Terms &amp; Conditions</div><div class="info-box-content">${org.pdfDefaultTerms}</div></div>`;
  }
  if (s.notes && org.pdfDefaultNotes) {
    html += `<div class="${boxClass} no-break" ${variant === "prestige" ? `style="border-left-color:${CN_ACCENT}40"` : ""}><div class="info-box-title">Notes</div><div class="info-box-content">${org.pdfDefaultNotes}</div></div>`;
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
function buildPrestige(data: CreditNoteTemplateData): string {
  const { creditNote, org } = data;
  const c = org.currency;
  const accent = data.pdfSettings?.accentColor ?? org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, accent, 42);
  const isSales = creditNote.type === "sales";
  const entityLabel = isSales ? "Customer" : "Supplier";

  const linesHtml = creditNote.lines.map((l, i) => `
    <tr style="${i % 2 === 1 ? `background:${CN_ACCENT}06` : ""}">
      <td style="font-weight:500;color:#0f172a">${l.description}</td>
      <td class="text-right" style="color:#475569">${l.quantity}</td>
      <td class="text-right font-mono">${fmt(l.unitPrice, c)}</td>
      <td class="text-right" style="color:#94a3b8">${l.taxRate}%</td>
      <td class="text-right font-mono" style="font-weight:600;color:#0f172a">${fmt(l.amount, c)}</td>
    </tr>`).join("");

  return `
    <div style="height:3px;background:linear-gradient(90deg, ${CN_ACCENT}, ${CN_ACCENT}88);margin-bottom:32px;border-radius:2px"></div>

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
        <div style="font-size:24px;font-weight:800;color:${CN_ACCENT};letter-spacing:-0.03em;line-height:1">CREDIT NOTE</div>
        <div style="font-size:15px;font-weight:600;color:#475569;margin-top:4px">${creditNote.number}</div>
        <div style="margin-top:10px"><span class="badge badge-error">${isSales ? "Sales" : "Purchase"}</span></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:28px">
      <div style="background:#f8f9fb;border-radius:10px;padding:20px 24px;border:1px solid rgba(0,0,0,0.04)">
        <div class="field-label" style="margin-bottom:8px">${entityLabel}</div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.01em">${creditNote.entityName}</div>
        ${creditNote.entityAddress ? `<div style="font-size:12px;color:#64748b;margin-top:6px;white-space:pre-line;line-height:1.6">${creditNote.entityAddress}</div>` : ""}
        ${creditNote.entityEmail ? `<div style="font-size:12px;color:#64748b;margin-top:3px">${creditNote.entityEmail}</div>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-start;padding-top:4px">
        <div style="display:grid;grid-template-columns:auto auto;gap:6px 24px;text-align:right">
          <span class="field-label" style="text-align:right">Date</span>
          <span class="field-value">${creditNote.date}</span>
        </div>
      </div>
    </div>

    ${creditNote.reason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-left:3px solid ${CN_ACCENT};border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:28px" class="no-break">
      <div class="info-box-title" style="color:${CN_ACCENT}">Reason for Credit</div>
      <div class="info-box-content">${creditNote.reason}</div>
    </div>` : ""}

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
          <span>Subtotal</span><span class="font-mono" style="color:#475569">${fmt(creditNote.subtotal, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:9px 0;font-size:13px;color:#94a3b8">
          <span>VAT</span><span class="font-mono" style="color:#475569">${fmt(creditNote.taxAmount, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:14px 18px;margin-top:6px;background:${CN_ACCENT};color:#fff;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:-0.01em">
          <span>Credit Total</span><span class="font-mono">${fmt(creditNote.total, c)}</span>
        </div>
      </div>
    </div>

    ${buildCreditNoteSections(org, data.pdfSettings, "prestige")}
  `;
}

// ─── Executive Variant ────────────────────────────────────────
function buildExecutive(data: CreditNoteTemplateData): string {
  const { creditNote, org } = data;
  const c = org.currency;
  const accent = data.pdfSettings?.accentColor ?? org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, accent, 36);
  const isSales = creditNote.type === "sales";
  const entityLabel = isSales ? "Customer" : "Supplier";

  const linesHtml = creditNote.lines.map((l) => `
    <tr>
      <td style="font-weight:500;color:#0f172a;padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${l.description}</td>
      <td class="text-right" style="padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${l.quantity}</td>
      <td class="text-right font-mono" style="padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${fmt(l.unitPrice, c)}</td>
      <td class="text-right" style="padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04);color:#94a3b8">${l.taxRate}%</td>
      <td class="text-right font-mono" style="font-weight:600;color:#0f172a;padding:11px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${fmt(l.amount, c)}</td>
    </tr>`).join("");

  return `
    <div style="height:2px;background:${CN_ACCENT};margin-bottom:28px"></div>

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
        <div style="font-size:24px;font-weight:800;color:${CN_ACCENT};letter-spacing:-0.03em">CREDIT NOTE</div>
        <div style="margin-top:6px"><span class="badge badge-error">${isSales ? "Sales" : "Purchase"}</span></div>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:700;color:#0f172a">${creditNote.number}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px">Date: <span style="color:#0f172a;font-weight:600">${creditNote.date}</span></div>
      </div>
    </div>

    <div style="margin-bottom:24px">
      <div class="field-label" style="margin-bottom:6px">${entityLabel}</div>
      <div style="font-size:14px;font-weight:700;color:#0f172a">${creditNote.entityName}</div>
      ${creditNote.entityAddress ? `<div style="font-size:12px;color:#64748b;margin-top:4px;white-space:pre-line;line-height:1.5">${creditNote.entityAddress}</div>` : ""}
      ${creditNote.entityEmail ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${creditNote.entityEmail}</div>` : ""}
    </div>

    ${creditNote.reason ? `
    <div class="info-box-exec no-break" style="margin-top:0;margin-bottom:20px;border-top-color:#fecaca">
      <div class="info-box-title" style="color:${CN_ACCENT}">Reason for Credit</div>
      <div class="info-box-content">${creditNote.reason}</div>
    </div>` : ""}

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
          <span>Subtotal</span><span class="font-mono" style="color:#475569;font-weight:500">${fmt(creditNote.subtotal, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#94a3b8">
          <span>VAT</span><span class="font-mono" style="color:#475569;font-weight:500">${fmt(creditNote.taxAmount, c)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:4px;font-size:15px;font-weight:700;color:${CN_ACCENT};border-top:2px solid ${CN_ACCENT}">
          <span>Credit Total</span><span class="font-mono">${fmt(creditNote.total, c)}</span>
        </div>
      </div>
    </div>

    ${buildCreditNoteSections(org, data.pdfSettings, "executive")}
  `;
}

const BUILDERS: Record<CreditNoteVariant, (d: CreditNoteTemplateData) => string> = {
  prestige: buildPrestige,
  executive: buildExecutive,
};

export function getCreditNoteBodyHtml(data: CreditNoteTemplateData, variant: CreditNoteVariant = "prestige"): string {
  return BUILDERS[variant](data);
}

export function buildCreditNoteHtml(data: CreditNoteTemplateData, variant: CreditNoteVariant = "prestige", slots?: CustomSlots): string {
  return wrapInBaseLayout({
    org: data.org,
    bodyHtml: BUILDERS[variant](data),
    title: `Credit Note ${data.creditNote.number}`,
    slots,
    pdfSettings: data.pdfSettings,
    noDefaultHeader: true,
  });
}
