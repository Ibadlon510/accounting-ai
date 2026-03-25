import type { PdfOrganization, CustomSlots } from "../types";
import { wrapInBaseLayout, orgLogoHtml } from "./base-layout";

export type PnlVariant = "prestige" | "executive";

export interface PnlTemplateData {
  org: PdfOrganization;
  report: { title?: string; periodFrom: string; periodTo: string; generatedAt?: string };
  pnl: {
    revenue: { code: string; name: string; amount: number }[];
    expenses: { code: string; name: string; amount: number }[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
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
function buildPrestige(data: PnlTemplateData): string {
  const { pnl, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 34);
  const isProfit = pnl.netIncome >= 0;

  const revenueRows = pnl.revenue.map((r, i) => `
    <tr style="${i % 2 === 1 ? `background:${accent}06` : ""}">
      <td style="padding-left:28px;color:#475569"><span style="color:#94a3b8;font-size:11px;margin-right:8px">${r.code}</span>${r.name}</td>
      <td class="text-right font-mono" style="color:#0f172a;font-weight:500">${fmt(r.amount, c)}</td>
    </tr>`).join("");

  const expenseRows = pnl.expenses.map((r, i) => `
    <tr style="${i % 2 === 1 ? `background:${accent}06` : ""}">
      <td style="padding-left:28px;color:#475569"><span style="color:#94a3b8;font-size:11px;margin-right:8px">${r.code}</span>${r.name}</td>
      <td class="text-right font-mono" style="color:#0f172a;font-weight:500">${fmt(r.amount, c)}</td>
    </tr>`).join("");

  const generated = report.generatedAt ? `<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:3px">Generated ${fmtGeneratedAt(report.generatedAt)}</div>` : "";

  return `
    <div style="background:linear-gradient(135deg, ${accent}, ${accent}cc);border-radius:14px;padding:32px 36px;color:white;margin-bottom:32px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05));pointer-events:none"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        ${logo}
        <div style="font-size:15px;font-weight:700;letter-spacing:-0.01em">${org.name}</div>
      </div>
      <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;line-height:1">${report.title ?? "Profit & Loss Statement"}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:8px">${fmtDate(report.periodFrom)} &mdash; ${fmtDate(report.periodTo)}</div>
      ${generated}
    </div>

    <div class="doc-table no-break" style="margin-bottom:8px">
      <table>
        <thead><tr>
          <th style="color:${accent}">Account</th>
          <th class="text-right" style="color:${accent}">Amount (${c})</th>
        </tr></thead>
        <tbody>
          <tr><td colspan="2" style="padding:12px 16px 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${accent}">Revenue</td></tr>
          ${revenueRows}
          <tr><td colspan="2" style="padding:4px 0"><div style="border-top:1.5px solid rgba(0,0,0,0.06)"></div></td></tr>
          <tr>
            <td style="font-weight:700;color:#0f172a;padding:10px 16px">Total Revenue</td>
            <td class="text-right font-mono font-bold" style="color:#059669;padding:10px 16px">${fmt(pnl.totalRevenue, c)}</td>
          </tr>

          <tr><td colspan="2" style="padding:16px 16px 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${accent}">Expenses</td></tr>
          ${expenseRows}
          <tr><td colspan="2" style="padding:4px 0"><div style="border-top:1.5px solid rgba(0,0,0,0.06)"></div></td></tr>
          <tr>
            <td style="font-weight:700;color:#0f172a;padding:10px 16px">Total Expenses</td>
            <td class="text-right font-mono font-bold" style="color:#dc2626;padding:10px 16px">${fmt(pnl.totalExpenses, c)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:20px">
      <div style="display:flex;justify-content:space-between;padding:16px 20px;background:${accent};color:#fff;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:-0.01em;width:320px;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06));pointer-events:none"></div>
        <span>Net ${isProfit ? "Profit" : "Loss"}</span>
        <span class="font-mono">${fmt(pnl.netIncome, c)}</span>
      </div>
    </div>
  `;
}

// ─── Executive Variant ────────────────────────────────────────
function buildExecutive(data: PnlTemplateData): string {
  const { pnl, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 30);
  const isProfit = pnl.netIncome >= 0;

  const revenueRows = pnl.revenue.map((r) => `
    <tr>
      <td style="padding:9px 16px 9px 28px;color:#475569;border-bottom:1px solid rgba(0,0,0,0.03)"><span style="color:#94a3b8;font-size:11px;margin-right:8px">${r.code}</span>${r.name}</td>
      <td class="text-right font-mono" style="color:#0f172a;font-weight:500;padding:9px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(r.amount, c)}</td>
    </tr>`).join("");

  const expenseRows = pnl.expenses.map((r) => `
    <tr>
      <td style="padding:9px 16px 9px 28px;color:#475569;border-bottom:1px solid rgba(0,0,0,0.03)"><span style="color:#94a3b8;font-size:11px;margin-right:8px">${r.code}</span>${r.name}</td>
      <td class="text-right font-mono" style="color:#0f172a;font-weight:500;padding:9px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(r.amount, c)}</td>
    </tr>`).join("");

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
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em">${report.title ?? "Profit & Loss Statement"}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px">${fmtDate(report.periodFrom)} &mdash; ${fmtDate(report.periodTo)}</div>
      ${generated}
    </div>

    <div class="doc-table no-break">
      <table>
        <thead><tr>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Account</th>
          <th class="text-right" style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Amount (${c})</th>
        </tr></thead>
        <tbody>
          <tr><td colspan="2" style="padding:14px 16px 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a">Revenue</td></tr>
          ${revenueRows}
          <tr>
            <td style="font-weight:700;color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">Total Revenue</td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">${fmt(pnl.totalRevenue, c)}</td>
          </tr>

          <tr><td colspan="2" style="padding:18px 16px 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a">Expenses</td></tr>
          ${expenseRows}
          <tr>
            <td style="font-weight:700;color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">Total Expenses</td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">${fmt(pnl.totalExpenses, c)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <div style="display:flex;justify-content:space-between;padding:12px 16px;width:280px;border-top:2px solid #0f172a;font-weight:700;font-size:15px;color:${isProfit ? "#059669" : "#dc2626"}">
        <span>Net ${isProfit ? "Profit" : "Loss"}</span>
        <span class="font-mono">${fmt(pnl.netIncome, c)}</span>
      </div>
    </div>
  `;
}

const BUILDERS: Record<PnlVariant, (d: PnlTemplateData) => string> = {
  prestige: buildPrestige,
  executive: buildExecutive,
};

export function buildPnlHtml(data: PnlTemplateData, variant: PnlVariant = "prestige", slots?: CustomSlots): string {
  return wrapInBaseLayout({ org: data.org, bodyHtml: BUILDERS[variant](data), title: "Profit & Loss", slots, noDefaultHeader: true });
}
