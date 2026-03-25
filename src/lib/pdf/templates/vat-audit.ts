import type { PdfOrganization, CustomSlots } from "../types";
import { wrapInBaseLayout, orgLogoHtml } from "./base-layout";

export type VatVariant = "prestige" | "executive";

export interface VatTemplateData {
  org: PdfOrganization;
  report: { title?: string; periodFrom: string; periodTo: string; generatedAt?: string };
  vat: {
    outputVAT: number;
    inputVAT: number;
    netPayable: number;
    outputCount: number;
    inputCount: number;
    transactions: { date: string; type: "output" | "input"; ref: string; entity: string; taxable: number; vat: number }[];
  };
}

function fmt(n: number, currency = "AED"): string {
  return `${currency}\u00A0${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string): string {
  if (!d) return "";
  const t = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return new Date(t + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }
  const parsed = new Date(t);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }
  return t;
}

function fmtGeneratedAt(d: string): string {
  if (!d) return "";
  const t = d.trim();
  const ms = Date.parse(t);
  if (!Number.isNaN(ms)) {
    return new Date(ms).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  }
  return t;
}

// ─── Prestige Variant ─────────────────────────────────────────
function buildPrestige(data: VatTemplateData): string {
  const { vat, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 34);

  const rowsHtml = vat.transactions.map((t, i) => `
    <tr style="${i % 2 === 1 ? `background:${accent}06` : ""}">
      <td style="color:#475569">${fmtDate(t.date)}</td>
      <td><span class="badge ${t.type === "output" ? "badge-error" : "badge-success"}" style="font-size:8.5px;padding:3px 10px">${t.type === "output" ? "Output" : "Input"}</span></td>
      <td class="font-mono text-sm" style="color:#64748b">${t.ref}</td>
      <td style="color:#475569;font-weight:500">${t.entity}</td>
      <td class="text-right font-mono">${fmt(t.taxable, c)}</td>
      <td class="text-right font-mono" style="color:${t.type === "output" ? "#dc2626" : "#059669"};font-weight:600">${fmt(t.vat, c)}</td>
    </tr>`).join("");

  const totalTaxable = vat.transactions.reduce((s, t) => s + t.taxable, 0);
  const totalVat = vat.transactions.reduce((s, t) => s + t.vat, 0);
  const generated = report.generatedAt ? `<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:3px">Generated ${fmtGeneratedAt(report.generatedAt)}</div>` : "";

  return `
    <div style="background:linear-gradient(135deg, ${accent}, ${accent}cc);border-radius:14px;padding:32px 36px;color:white;margin-bottom:32px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05));pointer-events:none"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        ${logo}
        <div style="font-size:15px;font-weight:700;letter-spacing:-0.01em">${org.name}</div>
      </div>
      <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;line-height:1">${report.title ?? "VAT Audit Report"}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:8px">${fmtDate(report.periodFrom)} &mdash; ${fmtDate(report.periodTo)}</div>
      ${generated}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:28px" class="no-break">
      <div style="background:#f8f9fb;border:1px solid rgba(0,0,0,0.04);border-radius:10px;padding:18px 16px;text-align:center;border-top:3px solid #dc2626">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Output VAT</div>
        <div style="font-size:20px;font-weight:800;color:#dc2626;margin-top:8px;letter-spacing:-0.02em" class="font-mono">${fmt(vat.outputVAT, c)}</div>
        <div style="font-size:10.5px;color:#94a3b8;margin-top:6px">${vat.outputCount} transaction${vat.outputCount === 1 ? "" : "s"}</div>
      </div>
      <div style="background:#f8f9fb;border:1px solid rgba(0,0,0,0.04);border-radius:10px;padding:18px 16px;text-align:center;border-top:3px solid #059669">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Input VAT</div>
        <div style="font-size:20px;font-weight:800;color:#059669;margin-top:8px;letter-spacing:-0.02em" class="font-mono">${fmt(vat.inputVAT, c)}</div>
        <div style="font-size:10.5px;color:#94a3b8;margin-top:6px">${vat.inputCount} transaction${vat.inputCount === 1 ? "" : "s"}</div>
      </div>
      <div style="background:${accent};border-radius:10px;padding:18px 16px;text-align:center;color:white;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06));pointer-events:none"></div>
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.7)">Net Payable</div>
        <div style="font-size:20px;font-weight:800;margin-top:8px;letter-spacing:-0.02em" class="font-mono">${fmt(Math.abs(vat.netPayable), c)}</div>
        <div style="font-size:10.5px;color:rgba(255,255,255,0.6);margin-top:6px">${vat.netPayable >= 0 ? "Payable to authority" : "Refund position"}</div>
      </div>
    </div>

    <div class="section-title" style="color:${accent}">Transactions</div>
    <div class="doc-table">
      <table>
        <thead><tr>
          <th>Date</th><th>Type</th><th>Reference</th><th>Entity</th>
          <th class="text-right">Taxable</th><th class="text-right">VAT</th>
        </tr></thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" class="text-center text-meta" style="padding:28px;font-style:italic">No transactions in period</td></tr>`}
          <tr><td colspan="6" style="padding:4px 0"><div style="border-top:1.5px solid rgba(0,0,0,0.06)"></div></td></tr>
          <tr>
            <td colspan="4" style="font-weight:700;color:#0f172a;padding:10px 16px">Totals</td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px">${fmt(totalTaxable, c)}</td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px">${fmt(totalVat, c)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ─── Executive Variant ────────────────────────────────────────
function buildExecutive(data: VatTemplateData): string {
  const { vat, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 30);

  const rowsHtml = vat.transactions.map((t) => `
    <tr>
      <td style="color:#475569;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmtDate(t.date)}</td>
      <td style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)"><span class="badge ${t.type === "output" ? "badge-error" : "badge-success"}" style="font-size:8.5px;padding:3px 10px">${t.type === "output" ? "Output" : "Input"}</span></td>
      <td class="font-mono text-sm" style="color:#64748b;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${t.ref}</td>
      <td style="color:#475569;font-weight:500;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${t.entity}</td>
      <td class="text-right font-mono" style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(t.taxable, c)}</td>
      <td class="text-right font-mono" style="color:${t.type === "output" ? "#dc2626" : "#059669"};font-weight:600;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(t.vat, c)}</td>
    </tr>`).join("");

  const totalTaxable = vat.transactions.reduce((s, t) => s + t.taxable, 0);
  const totalVat = vat.transactions.reduce((s, t) => s + t.vat, 0);
  const generated = report.generatedAt ? `<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:3px">Generated ${fmtGeneratedAt(report.generatedAt)}</div>` : "";

  return `
    <div style="background:${accent};padding:28px 32px;color:white;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          ${logo}
          <span style="font-size:14px;font-weight:700">${org.name}</span>
        </div>
        <div style="font-size:10.5px;color:rgba(255,255,255,0.55)">${[org.phone, org.email].filter(Boolean).join(" &middot; ")}</div>
      </div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em">${report.title ?? "VAT Audit Report"}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px">${fmtDate(report.periodFrom)} &mdash; ${fmtDate(report.periodTo)}</div>
      ${generated}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:24px" class="no-break">
      <div style="border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:16px 14px;text-align:center;border-top:2px solid #dc2626">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Output VAT</div>
        <div style="font-size:18px;font-weight:800;color:#dc2626;margin-top:6px" class="font-mono">${fmt(vat.outputVAT, c)}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:4px">${vat.outputCount} txn${vat.outputCount === 1 ? "" : "s"}</div>
      </div>
      <div style="border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:16px 14px;text-align:center;border-top:2px solid #059669">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Input VAT</div>
        <div style="font-size:18px;font-weight:800;color:#059669;margin-top:6px" class="font-mono">${fmt(vat.inputVAT, c)}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:4px">${vat.inputCount} txn${vat.inputCount === 1 ? "" : "s"}</div>
      </div>
      <div style="border:2px solid ${accent};border-radius:8px;padding:16px 14px;text-align:center">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${accent}">Net Payable</div>
        <div style="font-size:18px;font-weight:800;color:${accent};margin-top:6px" class="font-mono">${fmt(Math.abs(vat.netPayable), c)}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:4px">${vat.netPayable >= 0 ? "Payable" : "Refund"}</div>
      </div>
    </div>

    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;letter-spacing:0.02em">Transactions</div>
    <div style="border-top:1px solid rgba(0,0,0,0.06);margin-bottom:4px"></div>
    <div class="doc-table">
      <table>
        <thead><tr>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Date</th>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Type</th>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Reference</th>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Entity</th>
          <th class="text-right" style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Taxable</th>
          <th class="text-right" style="border-bottom:1.5px solid rgba(0,0,0,0.1)">VAT</th>
        </tr></thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" class="text-center text-meta" style="padding:28px;font-style:italic">No transactions in period</td></tr>`}
          <tr>
            <td colspan="4" style="font-weight:700;color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">Totals</td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">${fmt(totalTaxable, c)}</td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">${fmt(totalVat, c)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

const BUILDERS: Record<VatVariant, (d: VatTemplateData) => string> = {
  prestige: buildPrestige,
  executive: buildExecutive,
};

export function buildVatAuditHtml(data: VatTemplateData, variant: VatVariant = "prestige", slots?: CustomSlots): string {
  return wrapInBaseLayout({ org: data.org, bodyHtml: BUILDERS[variant](data), title: "VAT Audit Report", slots, noDefaultHeader: true });
}
