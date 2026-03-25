import type { PdfOrganization, CustomSlots, PdfRenderSettings } from "../types";
import { wrapInBaseLayout, orgLogoHtml } from "./base-layout";

export type StatementVariant = "prestige" | "executive";

export interface StatementTemplateData {
  org: PdfOrganization;
  statement: {
    customerName: string;
    customerCity?: string;
    customerCountry?: string;
    customerAddress?: string | null;
    totalInvoiced: number;
    totalCreditNotes: number;
    totalPaid: number;
    totalRefunded: number;
    balance: number;
    entries: {
      date: string;
      type: "Invoice" | "Credit Note" | "Receipt" | "Refund" | string;
      ref: string;
      debit: number;
      credit: number;
    }[];
  };
  pdfSettings?: Partial<PdfRenderSettings>;
}

function fmt(n: number, currency = "AED"): string {
  return `${currency}\u00A0${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function summaryCardPrestige(label: string, value: string, opts?: { highlight?: boolean; accent?: string; valueColor?: string }): string {
  const accent = opts?.accent ?? "#1a1a2e";
  if (opts?.highlight) {
    return `
      <div class="no-break" style="background:${accent};border-radius:10px;padding:16px 14px;text-align:center;color:#fff;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06));pointer-events:none"></div>
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.7)">${label}</div>
        <div style="font-size:16px;font-weight:800;margin-top:8px;letter-spacing:-0.02em">${value}</div>
      </div>`;
  }
  const valueColor = opts?.valueColor ?? "#0f172a";
  return `
    <div class="no-break" style="background:#f8f9fb;border:1px solid rgba(0,0,0,0.04);border-radius:10px;padding:16px 14px;text-align:center">
      <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">${label}</div>
      <div style="font-size:15px;font-weight:700;margin-top:8px;color:${valueColor};letter-spacing:-0.02em">${value}</div>
    </div>`;
}

function summaryCardExec(label: string, value: string, opts?: { highlight?: boolean; accent?: string; valueColor?: string }): string {
  const accent = opts?.accent ?? "#1a1a2e";
  if (opts?.highlight) {
    return `
      <div class="no-break" style="border:2px solid ${accent};border-radius:8px;padding:14px 12px;text-align:center">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${accent}">${label}</div>
        <div style="font-size:16px;font-weight:800;margin-top:8px;color:${accent};letter-spacing:-0.02em">${value}</div>
      </div>`;
  }
  const valueColor = opts?.valueColor ?? "#0f172a";
  return `
    <div class="no-break" style="border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:14px 12px;text-align:center">
      <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">${label}</div>
      <div style="font-size:15px;font-weight:700;margin-top:8px;color:${valueColor};letter-spacing:-0.02em">${value}</div>
    </div>`;
}

// ─── Prestige Variant ─────────────────────────────────────────
function buildPrestige(data: StatementTemplateData): string {
  const { statement, org } = data;
  const c = org.currency;
  const accent = data.pdfSettings?.accentColor ?? org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 36);

  let runningBalance = 0;
  const rowsHtml = statement.entries.map((e, i) => {
    runningBalance += e.debit - e.credit;
    return `
      <tr style="${i % 2 === 1 ? `background:${accent}06` : ""}">
        <td style="font-size:13px;color:#475569">${e.date}</td>
        <td style="font-size:13px;font-weight:500;color:#0f172a">${e.type}</td>
        <td class="font-mono text-sm" style="color:#64748b">${e.ref}</td>
        <td class="text-right font-mono">${e.debit > 0 ? fmt(e.debit, c) : '<span style="color:#cbd5e1">&mdash;</span>'}</td>
        <td class="text-right font-mono">${e.credit > 0 ? fmt(e.credit, c) : '<span style="color:#cbd5e1">&mdash;</span>'}</td>
        <td class="text-right font-mono font-semibold" style="color:#0f172a">${fmt(runningBalance, c)}</td>
      </tr>`;
  }).join("");

  const location = [statement.customerCity, statement.customerCountry].filter(Boolean).join(", ");

  return `
    <div style="background:linear-gradient(135deg, ${accent}, ${accent}cc);border-radius:14px;padding:32px 36px;color:white;margin-bottom:32px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05));pointer-events:none"></div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        ${logo}
        <div style="font-size:16px;font-weight:700;letter-spacing:-0.01em">${org.name}</div>
      </div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;line-height:1">STATEMENT</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:6px">Customer account statement</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>

    <div style="background:#f8f9fb;border:1px solid rgba(0,0,0,0.04);border-radius:10px;padding:20px 24px;margin-bottom:28px" class="no-break">
      <div class="field-label" style="margin-bottom:8px">Bill To</div>
      <div style="font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.02em">${statement.customerName}</div>
      ${location ? `<div style="font-size:12px;color:#64748b;margin-top:4px">${location}</div>` : ""}
      ${statement.customerAddress ? `<div style="font-size:12px;color:#64748b;margin-top:4px;white-space:pre-line;line-height:1.5">${statement.customerAddress}</div>` : ""}
    </div>

    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:32px">
      ${summaryCardPrestige("Invoiced", fmt(statement.totalInvoiced, c))}
      ${summaryCardPrestige("Credits", fmt(statement.totalCreditNotes, c))}
      ${summaryCardPrestige("Paid", fmt(statement.totalPaid, c), { valueColor: "#059669" })}
      ${summaryCardPrestige("Refunded", fmt(statement.totalRefunded, c))}
      ${summaryCardPrestige("Balance Due", fmt(statement.balance, c), { highlight: true, accent })}
    </div>

    <div class="section-title" style="color:${accent}">Transaction History</div>
    <div class="doc-table no-break">
      <table>
        <thead><tr>
          <th style="width:13%">Date</th>
          <th style="width:16%">Type</th>
          <th style="width:18%">Reference</th>
          <th class="text-right" style="width:17%">Debit</th>
          <th class="text-right" style="width:17%">Credit</th>
          <th class="text-right" style="width:19%">Balance</th>
        </tr></thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" class="text-center text-meta" style="padding:28px;font-style:italic">No transactions in this period.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

// ─── Executive Variant ────────────────────────────────────────
function buildExecutive(data: StatementTemplateData): string {
  const { statement, org } = data;
  const c = org.currency;
  const accent = data.pdfSettings?.accentColor ?? org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 32);

  let runningBalance = 0;
  const rowsHtml = statement.entries.map((e) => {
    runningBalance += e.debit - e.credit;
    return `
      <tr>
        <td style="font-size:13px;color:#475569;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${e.date}</td>
        <td style="font-size:13px;font-weight:500;color:#0f172a;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${e.type}</td>
        <td class="font-mono text-sm" style="color:#64748b;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${e.ref}</td>
        <td class="text-right font-mono" style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${e.debit > 0 ? fmt(e.debit, c) : '<span style="color:#cbd5e1">&mdash;</span>'}</td>
        <td class="text-right font-mono" style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${e.credit > 0 ? fmt(e.credit, c) : '<span style="color:#cbd5e1">&mdash;</span>'}</td>
        <td class="text-right font-mono font-semibold" style="color:#0f172a;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.04)">${fmt(runningBalance, c)}</td>
      </tr>`;
  }).join("");

  const location = [statement.customerCity, statement.customerCountry].filter(Boolean).join(", ");

  return `
    <div style="background:${accent};padding:28px 32px;color:white;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:12px">
          ${logo}
          <span style="font-size:15px;font-weight:700">${org.name}</span>
        </div>
        <div style="font-size:10.5px;color:rgba(255,255,255,0.6)">${[org.phone, org.email].filter(Boolean).join(" &middot; ")}</div>
      </div>
      <div style="font-size:24px;font-weight:800;letter-spacing:-0.03em">STATEMENT</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:4px">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>

    <div style="margin-bottom:24px">
      <div class="field-label" style="margin-bottom:6px">Bill To</div>
      <div style="font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.01em">${statement.customerName}</div>
      ${location ? `<div style="font-size:12px;color:#64748b;margin-top:3px">${location}</div>` : ""}
      ${statement.customerAddress ? `<div style="font-size:12px;color:#64748b;margin-top:3px;white-space:pre-line;line-height:1.5">${statement.customerAddress}</div>` : ""}
    </div>

    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:28px">
      ${summaryCardExec("Invoiced", fmt(statement.totalInvoiced, c))}
      ${summaryCardExec("Credits", fmt(statement.totalCreditNotes, c))}
      ${summaryCardExec("Paid", fmt(statement.totalPaid, c), { valueColor: "#059669" })}
      ${summaryCardExec("Refunded", fmt(statement.totalRefunded, c))}
      ${summaryCardExec("Balance Due", fmt(statement.balance, c), { highlight: true, accent })}
    </div>

    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;letter-spacing:0.02em">Transaction History</div>
    <div style="border-top:1px solid rgba(0,0,0,0.06);margin-bottom:4px"></div>
    <div class="doc-table no-break">
      <table>
        <thead><tr>
          <th style="width:13%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Date</th>
          <th style="width:16%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Type</th>
          <th style="width:18%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Reference</th>
          <th class="text-right" style="width:17%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Debit</th>
          <th class="text-right" style="width:17%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Credit</th>
          <th class="text-right" style="width:19%;border-bottom:1.5px solid rgba(0,0,0,0.1)">Balance</th>
        </tr></thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" class="text-center text-meta" style="padding:28px;font-style:italic">No transactions in this period.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

const BUILDERS: Record<StatementVariant, (d: StatementTemplateData) => string> = {
  prestige: buildPrestige,
  executive: buildExecutive,
};

export function buildStatementHtml(data: StatementTemplateData, variant: StatementVariant = "prestige", slots?: CustomSlots): string {
  return wrapInBaseLayout({
    org: data.org,
    bodyHtml: BUILDERS[variant](data),
    title: `Statement — ${data.statement.customerName}`,
    slots,
    pdfSettings: data.pdfSettings,
    noDefaultHeader: true,
  });
}
