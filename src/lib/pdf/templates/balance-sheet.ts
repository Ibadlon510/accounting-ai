import type { PdfOrganization, CustomSlots } from "../types";
import { wrapInBaseLayout, orgLogoHtml } from "./base-layout";

export type BSVariant = "prestige" | "executive";

export interface BSTemplateData {
  org: PdfOrganization;
  report: { title?: string; asOfDate: string; generatedAt?: string };
  bs: {
    assets: { code: string; name: string; amount: number }[];
    liabilities: { code: string; name: string; amount: number }[];
    equity: { code: string; name: string; amount: number }[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    retainedEarnings: number;
    isBalanced: boolean;
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

function sectionTable(title: string, rows: { code: string; name: string; amount: number }[], total: number, c: string, accent: string, extraBodyRows?: string, zebraColor?: string): string {
  const zc = zebraColor ?? `${accent}06`;
  const items = rows.map((r, i) => `
    <tr style="${i % 2 === 1 ? `background:${zc}` : ""}">
      <td style="padding-left:28px;color:#475569"><span style="color:#94a3b8;font-size:11px;margin-right:8px">${r.code}</span>${r.name}</td>
      <td class="text-right font-mono" style="color:#0f172a;font-weight:500">${fmt(r.amount, c)}</td>
    </tr>`).join("");

  return `
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;color:${accent};margin-bottom:10px;letter-spacing:0.02em">${title}</div>
      <div class="doc-table">
        <table>
          <thead><tr>
            <th>Account</th>
            <th class="text-right">Amount (${c})</th>
          </tr></thead>
          <tbody>
            ${items}
            ${extraBodyRows ?? ""}
            <tr>
              <td colspan="2" style="padding:4px 0"><div style="border-top:1.5px solid rgba(0,0,0,0.06)"></div></td>
            </tr>
            <tr>
              <td style="font-weight:700;color:#0f172a;padding:10px 16px">Total ${title}</td>
              <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px">${fmt(total, c)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

// ─── Prestige Variant ─────────────────────────────────────────
function buildPrestige(data: BSTemplateData): string {
  const { bs, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 34);
  const equityWithRetained = bs.totalEquity + bs.retainedEarnings;
  const totalLE = bs.totalLiabilities + equityWithRetained;

  const generated = report.generatedAt ? `<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:3px">Generated ${fmtGeneratedAt(report.generatedAt)}</div>` : "";

  const balanceBadge = bs.isBalanced
    ? `<span class="badge badge-success">Balanced</span>`
    : `<span class="badge badge-error">Out of Balance</span>`;

  const retainedRow = `
    <tr style="background:${accent}04">
      <td style="padding-left:28px;font-style:italic;color:#64748b">Retained Earnings</td>
      <td class="text-right font-mono" style="color:#0f172a;font-weight:500">${fmt(bs.retainedEarnings, c)}</td>
    </tr>`;

  return `
    <div style="background:linear-gradient(135deg, ${accent}, ${accent}cc);border-radius:14px;padding:32px 36px;color:white;margin-bottom:32px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05));pointer-events:none"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        ${logo}
        <div style="font-size:15px;font-weight:700;letter-spacing:-0.01em">${org.name}</div>
      </div>
      <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;line-height:1">${report.title ?? "Balance Sheet"}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:8px">As of ${fmtDate(report.asOfDate)}</div>
      ${generated}
    </div>

    <div class="no-break" style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-radius:10px;margin-bottom:24px;border:1px solid ${bs.isBalanced ? "#bbf7d0" : "#fecaca"};background:${bs.isBalanced ? "#f0fdf4" : "#fef2f2"}">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:13px;font-weight:600;color:${bs.isBalanced ? "#15803d" : "#b91c1c"}">Balance Check</span>
        ${balanceBadge}
      </div>
      <span class="text-xs text-meta" style="max-width:320px;line-height:1.5">Assets = Liabilities + Equity (incl. retained earnings)</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
      <div>${sectionTable("Assets", bs.assets, bs.totalAssets, c, accent)}</div>
      <div>
        ${sectionTable("Liabilities", bs.liabilities, bs.totalLiabilities, c, accent)}
        ${sectionTable("Equity", bs.equity, equityWithRetained, c, accent, retainedRow)}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px" class="no-break">
      <div style="background:${accent};color:white;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06));pointer-events:none"></div>
        <span style="font-weight:700">Total Assets</span>
        <span class="font-mono" style="font-weight:800;font-size:16px">${fmt(bs.totalAssets, c)}</span>
      </div>
      <div style="background:${accent};color:white;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;right:0;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06));pointer-events:none"></div>
        <span style="font-weight:700">Liabilities + Equity</span>
        <span class="font-mono" style="font-weight:800;font-size:16px">${fmt(totalLE, c)}</span>
      </div>
    </div>
  `;
}

// ─── Executive Variant ────────────────────────────────────────
function buildExecutive(data: BSTemplateData): string {
  const { bs, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 30);
  const equityWithRetained = bs.totalEquity + bs.retainedEarnings;
  const totalLE = bs.totalLiabilities + equityWithRetained;

  const generated = report.generatedAt ? `<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:3px">Generated ${fmtGeneratedAt(report.generatedAt)}</div>` : "";

  const balanceBadge = bs.isBalanced
    ? `<span class="badge badge-success">Balanced</span>`
    : `<span class="badge badge-error">Out of Balance</span>`;

  const retainedRow = `
    <tr>
      <td style="padding:9px 16px 9px 28px;font-style:italic;color:#64748b;border-bottom:1px solid rgba(0,0,0,0.03)">Retained Earnings</td>
      <td class="text-right font-mono" style="color:#0f172a;font-weight:500;padding:9px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(bs.retainedEarnings, c)}</td>
    </tr>`;

  function execSection(title: string, rows: { code: string; name: string; amount: number }[], total: number, extra?: string): string {
    const items = rows.map((r) => `
      <tr>
        <td style="padding:9px 16px 9px 28px;color:#475569;border-bottom:1px solid rgba(0,0,0,0.03)"><span style="color:#94a3b8;font-size:11px;margin-right:8px">${r.code}</span>${r.name}</td>
        <td class="text-right font-mono" style="color:#0f172a;font-weight:500;padding:9px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(r.amount, c)}</td>
      </tr>`).join("");

    return `
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:8px;letter-spacing:0.02em;text-transform:uppercase">${title}</div>
        <div class="doc-table">
          <table>
            <thead><tr>
              <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Account</th>
              <th class="text-right" style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Amount (${c})</th>
            </tr></thead>
            <tbody>
              ${items}
              ${extra ?? ""}
              <tr>
                <td style="font-weight:700;color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">Total ${title}</td>
                <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">${fmt(total, c)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  return `
    <div style="background:${accent};padding:28px 32px;color:white;margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          ${logo}
          <span style="font-size:14px;font-weight:700">${org.name}</span>
        </div>
        <div style="font-size:10.5px;color:rgba(255,255,255,0.55)">${[org.phone, org.email].filter(Boolean).join(" &middot; ")}</div>
      </div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em">${report.title ?? "Balance Sheet"}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px">As of ${fmtDate(report.asOfDate)}</div>
      ${generated}
    </div>

    <div class="no-break" style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-radius:8px;margin-bottom:24px;border:1px solid ${bs.isBalanced ? "#bbf7d0" : "#fecaca"};background:${bs.isBalanced ? "#f0fdf4" : "#fef2f2"}">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:13px;font-weight:600;color:${bs.isBalanced ? "#15803d" : "#b91c1c"}">Balance Check</span>
        ${balanceBadge}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div>${execSection("Assets", bs.assets, bs.totalAssets)}</div>
      <div>
        ${execSection("Liabilities", bs.liabilities, bs.totalLiabilities)}
        ${execSection("Equity", bs.equity, equityWithRetained, retainedRow)}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px" class="no-break">
      <div style="border:2px solid ${accent};border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700;color:${accent}">Total Assets</span>
        <span class="font-mono" style="font-weight:800;font-size:15px;color:${accent}">${fmt(bs.totalAssets, c)}</span>
      </div>
      <div style="border:2px solid ${accent};border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700;color:${accent}">Liabilities + Equity</span>
        <span class="font-mono" style="font-weight:800;font-size:15px;color:${accent}">${fmt(totalLE, c)}</span>
      </div>
    </div>
  `;
}

const BUILDERS: Record<BSVariant, (d: BSTemplateData) => string> = {
  prestige: buildPrestige,
  executive: buildExecutive,
};

export function buildBalanceSheetHtml(data: BSTemplateData, variant: BSVariant = "prestige", slots?: CustomSlots): string {
  return wrapInBaseLayout({ org: data.org, bodyHtml: BUILDERS[variant](data), title: "Balance Sheet", slots, noDefaultHeader: true });
}
