import type { PdfOrganization, CustomSlots } from "../types";
import { wrapInBaseLayout, orgLogoHtml } from "./base-layout";

export type InventoryVariant = "prestige" | "executive";

export interface InventoryTemplateData {
  org: PdfOrganization;
  report: { title?: string; asOfDate: string; generatedAt?: string };
  inventory: {
    items: {
      sku: string;
      name: string;
      quantityOnHand: number;
      unitOfMeasure: string;
      costPrice: number;
      totalValue: number;
    }[];
    totalValue: number;
    totalUnits: number;
    productCount: number;
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
function buildPrestige(data: InventoryTemplateData): string {
  const { inventory, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 34);

  const rowsHtml = [...inventory.items]
    .sort((a, b) => b.totalValue - a.totalValue)
    .map((item, i) => `
      <tr style="${i % 2 === 1 ? `background:${accent}06` : ""}">
        <td class="font-mono" style="color:#94a3b8;font-size:11px">${item.sku}</td>
        <td style="font-weight:500;color:#0f172a">${item.name}</td>
        <td class="text-right font-mono">${item.quantityOnHand.toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
        <td style="color:#94a3b8">${item.unitOfMeasure}</td>
        <td class="text-right font-mono">${fmt(item.costPrice, c)}</td>
        <td class="text-right font-mono" style="font-weight:600;color:#0f172a">${fmt(item.totalValue, c)}</td>
      </tr>`).join("");

  const generated = report.generatedAt ? `<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:3px">Generated ${fmtGeneratedAt(report.generatedAt)}</div>` : "";

  return `
    <div style="background:linear-gradient(135deg, ${accent}, ${accent}cc);border-radius:14px;padding:32px 36px;color:white;margin-bottom:32px;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05));pointer-events:none"></div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        ${logo}
        <div style="font-size:15px;font-weight:700;letter-spacing:-0.01em">${org.name}</div>
      </div>
      <div style="font-size:26px;font-weight:800;letter-spacing:-0.03em;line-height:1">${report.title ?? "Inventory Valuation"}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:8px">As of ${fmtDate(report.asOfDate)}</div>
      ${generated}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:28px" class="no-break">
      <div style="background:#f8f9fb;border:1px solid rgba(0,0,0,0.04);border-radius:10px;padding:18px 16px;text-align:center;border-top:3px solid ${accent}">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Total Value</div>
        <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:8px;letter-spacing:-0.02em" class="font-mono">${fmt(inventory.totalValue, c)}</div>
      </div>
      <div style="background:#f8f9fb;border:1px solid rgba(0,0,0,0.04);border-radius:10px;padding:18px 16px;text-align:center;border-top:3px solid ${accent}">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Total Units</div>
        <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:8px;letter-spacing:-0.02em" class="font-mono">${inventory.totalUnits.toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
      </div>
      <div style="background:#f8f9fb;border:1px solid rgba(0,0,0,0.04);border-radius:10px;padding:18px 16px;text-align:center;border-top:3px solid ${accent}">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Products</div>
        <div style="font-size:20px;font-weight:800;color:#0f172a;margin-top:8px;letter-spacing:-0.02em" class="font-mono">${inventory.productCount.toLocaleString()}</div>
      </div>
    </div>

    <div class="doc-table">
      <table>
        <thead><tr>
          <th>SKU</th><th>Name</th>
          <th class="text-right">Qty on Hand</th><th>UoM</th>
          <th class="text-right">Cost Price</th><th class="text-right">Total Value</th>
        </tr></thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" class="text-center text-meta" style="padding:28px;font-style:italic">No inventory items</td></tr>`}
          <tr><td colspan="6" style="padding:4px 0"><div style="border-top:1.5px solid rgba(0,0,0,0.06)"></div></td></tr>
          <tr>
            <td colspan="2" style="font-weight:700;color:#0f172a;padding:10px 16px">Totals</td>
            <td class="text-right font-mono font-bold" style="padding:10px 16px">${inventory.totalUnits.toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
            <td style="padding:10px 16px"></td>
            <td style="padding:10px 16px"></td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px">${fmt(inventory.totalValue, c)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ─── Executive Variant ────────────────────────────────────────
function buildExecutive(data: InventoryTemplateData): string {
  const { inventory, report, org } = data;
  const c = org.currency;
  const accent = org.pdfAccentColor ?? "#1a1a2e";
  const logo = orgLogoHtml(org, "#ffffff", 30);

  const rowsHtml = [...inventory.items]
    .sort((a, b) => b.totalValue - a.totalValue)
    .map((item) => `
      <tr>
        <td class="font-mono" style="color:#94a3b8;font-size:11px;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${item.sku}</td>
        <td style="font-weight:500;color:#0f172a;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${item.name}</td>
        <td class="text-right font-mono" style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${item.quantityOnHand.toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
        <td style="color:#94a3b8;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${item.unitOfMeasure}</td>
        <td class="text-right font-mono" style="padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(item.costPrice, c)}</td>
        <td class="text-right font-mono" style="font-weight:600;color:#0f172a;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,0.03)">${fmt(item.totalValue, c)}</td>
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
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em">${report.title ?? "Inventory Valuation"}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px">As of ${fmtDate(report.asOfDate)}</div>
      ${generated}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:24px" class="no-break">
      <div style="border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:16px 14px;text-align:center;border-top:2px solid ${accent}">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Total Value</div>
        <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:6px" class="font-mono">${fmt(inventory.totalValue, c)}</div>
      </div>
      <div style="border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:16px 14px;text-align:center;border-top:2px solid ${accent}">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Total Units</div>
        <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:6px" class="font-mono">${inventory.totalUnits.toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
      </div>
      <div style="border:1px solid rgba(0,0,0,0.06);border-radius:8px;padding:16px 14px;text-align:center;border-top:2px solid ${accent}">
        <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8">Products</div>
        <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:6px" class="font-mono">${inventory.productCount.toLocaleString()}</div>
      </div>
    </div>

    <div style="border-top:1px solid rgba(0,0,0,0.06);margin-bottom:4px"></div>
    <div class="doc-table">
      <table>
        <thead><tr>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">SKU</th>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Name</th>
          <th class="text-right" style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Qty on Hand</th>
          <th style="border-bottom:1.5px solid rgba(0,0,0,0.1)">UoM</th>
          <th class="text-right" style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Cost Price</th>
          <th class="text-right" style="border-bottom:1.5px solid rgba(0,0,0,0.1)">Total Value</th>
        </tr></thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" class="text-center text-meta" style="padding:28px;font-style:italic">No inventory items</td></tr>`}
          <tr>
            <td colspan="2" style="font-weight:700;color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">Totals</td>
            <td class="text-right font-mono font-bold" style="padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">${inventory.totalUnits.toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
            <td style="padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)"></td>
            <td style="padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)"></td>
            <td class="text-right font-mono font-bold" style="color:#0f172a;padding:10px 16px;border-top:1.5px solid rgba(0,0,0,0.06)">${fmt(inventory.totalValue, c)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

const BUILDERS: Record<InventoryVariant, (d: InventoryTemplateData) => string> = {
  prestige: buildPrestige,
  executive: buildExecutive,
};

export function buildInventoryHtml(data: InventoryTemplateData, variant: InventoryVariant = "prestige", slots?: CustomSlots): string {
  return wrapInBaseLayout({ org: data.org, bodyHtml: BUILDERS[variant](data), title: "Inventory Valuation", slots, noDefaultHeader: true });
}
