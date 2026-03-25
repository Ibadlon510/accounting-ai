import type { PdfOrganization, CustomSlots, PdfShowSections, PdfRenderSettings } from "../types";
import { sanitizeHtml, sanitizeCss } from "../sanitize";

interface BaseLayoutOptions {
  org: PdfOrganization;
  bodyHtml: string;
  title?: string;
  slots?: CustomSlots;
  pdfSettings?: Partial<PdfRenderSettings>;
  noDefaultHeader?: boolean;
}

const DEFAULT_SECTIONS: PdfShowSections = {
  terms: true,
  notes: true,
  payment: true,
  signature: true,
  qrCode: false,
};

const GOOGLE_FONTS_MAP: Record<string, string> = {
  "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@300;400;500;600;700;800",
  "Inter": "Inter:wght@300;400;500;600;700;800",
  "Roboto": "Roboto:wght@300;400;500;700",
  "Lato": "Lato:wght@300;400;700;900",
  "Open Sans": "Open+Sans:wght@300;400;600;700;800",
  "DM Sans": "DM+Sans:wght@300;400;500;600;700",
};

function getFontLink(fontFamily: string): string {
  const spec = GOOGLE_FONTS_MAP[fontFamily];
  if (!spec) return "";
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=${spec}&display=swap" rel="stylesheet" />`;
}

function getSerifFallback(fontFamily: string): string {
  if (fontFamily === "Georgia" || fontFamily === "Times New Roman") {
    return `'${fontFamily}', 'Times New Roman', Georgia, serif`;
  }
  return `'${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
}

export function orgLogoHtml(org: PdfOrganization, accent: string, size = 44): string {
  if (org.logoUrl) {
    return `<img src="${org.logoUrl}" alt="${org.name}" style="height:${size}px;width:auto;object-fit:contain" />`;
  }
  const iconSize = Math.round(size * 0.5);
  return `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.22)}px;background:linear-gradient(135deg,${accent},${accent}bb);display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" width="${iconSize}" height="${iconSize}"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
  </div>`;
}

function defaultHeader(org: PdfOrganization, accent: string): string {
  const logo = orgLogoHtml(org, accent, 44);
  return `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:20px;border-bottom:1.5px solid ${accent}18;margin-bottom:32px">
      <div style="display:flex;align-items:center;gap:14px">
        ${logo}
        <div>
          <div style="font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.02em">${org.name}</div>
          ${org.address ? `<div style="font-size:11px;color:#94a3b8;margin-top:3px;white-space:pre-line;line-height:1.5">${org.address}</div>` : ""}
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#94a3b8;line-height:1.8">
        ${org.phone ? `<div>${org.phone}</div>` : ""}
        ${org.email ? `<div>${org.email}</div>` : ""}
        ${org.taxRegistrationNumber ? `<div style="margin-top:4px;font-weight:600;color:#475569">TRN: ${org.taxRegistrationNumber}</div>` : ""}
      </div>
    </div>`;
}

function defaultFooter(): string {
  return "";
}

export function getSections(org: PdfOrganization, pdfSettings?: Partial<PdfRenderSettings>): PdfShowSections {
  if (pdfSettings?.showSections) return { ...DEFAULT_SECTIONS, ...pdfSettings.showSections };
  return { ...DEFAULT_SECTIONS, ...(org.pdfShowSections ?? {}) };
}

export function wrapInBaseLayout({ org, bodyHtml, title, slots, pdfSettings, noDefaultHeader }: BaseLayoutOptions): string {
  const accent = pdfSettings?.accentColor ?? org.pdfAccentColor ?? "#1a1a2e";
  const fontFamily = pdfSettings?.fontFamily ?? org.pdfFontFamily ?? "Plus Jakarta Sans";
  const fontStack = getSerifFallback(fontFamily);
  const fontLink = getFontLink(fontFamily);

  const headerContent = noDefaultHeader
    ? ""
    : slots?.headerHtml
      ? sanitizeHtml(slots.headerHtml)
      : defaultHeader(org, accent);

  const watermarkHtml = slots?.watermark
    ? `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:100px;font-weight:900;color:rgba(0,0,0,0.04);pointer-events:none;z-index:0;white-space:nowrap">${sanitizeHtml(slots.watermark)}</div>`
    : "";

  const customCss = slots?.customCss ? sanitizeCss(slots.customCss) : "";

  const footerContent = slots?.footerHtml
    ? sanitizeHtml(slots.footerHtml)
    : defaultFooter();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title ?? "Document"}</title>
  ${fontLink}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent: ${accent};
      --accent-light: ${accent}06;
      --accent-soft: ${accent}0d;
      --accent-mid: ${accent}18;
      --accent-glow: ${accent}30;
      --surface: #f8f9fb;
      --border-subtle: rgba(0,0,0,0.05);
      --border-light: rgba(0,0,0,0.08);
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #94a3b8;
      --text-muted: #cbd5e1;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
    }
    body {
      font-family: ${fontStack};
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-primary);
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .pdf-page { padding: 0; position: relative; }
    table { border-collapse: collapse; width: 100%; }
    th, td { text-align: left; }
    th {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
      padding: 10px 16px 9px;
    }
    td {
      font-size: 13px;
      color: var(--text-secondary);
      padding: 13px 16px;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: 'SF Mono', 'JetBrains Mono', Monaco, 'Cascadia Code', 'Courier New', monospace; font-size: 12px; letter-spacing: -0.01em; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 11px; }
    .text-meta { color: var(--text-tertiary); }
    .text-success { color: #059669; }
    .text-error { color: #dc2626; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .mt-6 { margin-top: 24px; }
    .mt-8 { margin-top: 32px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 16px; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 14px;
      border-radius: 100px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      line-height: 1;
    }
    .badge-success { background: #ecfdf5; color: #059669; }
    .badge-warning { background: #fffbeb; color: #d97706; }
    .badge-error { background: #fef2f2; color: #dc2626; }
    .badge-blue { background: #eff6ff; color: #2563eb; }
    .badge-neutral { background: #f1f5f9; color: #64748b; }
    .badge-purple { background: #f5f3ff; color: #7c3aed; }

    .doc-table { overflow: hidden; }
    .doc-table th {
      border-bottom: 1.5px solid var(--border-light);
      background: transparent;
    }
    .doc-table td { border-bottom: none; }
    .doc-table tr:last-child td { border-bottom: none; }

    .summary-row td {
      background: transparent !important;
      font-weight: 600;
      font-size: 13px;
      color: var(--text-secondary);
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .total-row td {
      background: var(--accent) !important;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 16px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 14px;
      letter-spacing: 0.02em;
    }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .field-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
    }
    .field-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 3px;
    }

    .info-box {
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--accent-glow);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      padding: 18px 22px;
      margin-top: 24px;
    }
    .info-box-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-tertiary);
      margin-bottom: 8px;
    }
    .info-box-content {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.7;
      white-space: pre-line;
    }

    .info-box-exec {
      padding: 14px 0;
      margin-top: 20px;
      border-top: 1px solid var(--border-subtle);
    }
    .info-box-exec .info-box-title { margin-bottom: 6px; }
    .info-box-exec .info-box-content { font-size: 12px; }

    .signature-line {
      margin-top: 56px;
      display: flex;
      justify-content: space-between;
      gap: 56px;
    }
    .signature-block { flex: 1; text-align: center; }
    .signature-block .line {
      border-top: 1px solid var(--text-muted);
      margin-top: 56px;
      padding-top: 10px;
      font-size: 10px;
      color: var(--text-tertiary);
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .qr-placeholder {
      width: 80px;
      height: 80px;
      border: 1.5px dashed var(--text-muted);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: var(--text-tertiary);
      text-align: center;
    }

    @media print {
      body { background: white; }
      .page-break { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
    }
    @page {
      margin: ${pdfSettings?.marginTop ?? org.pdfMarginTop ?? "15mm"} ${pdfSettings?.marginRight ?? org.pdfMarginRight ?? "15mm"} ${pdfSettings?.marginBottom ?? org.pdfMarginBottom ?? "20mm"} ${pdfSettings?.marginLeft ?? org.pdfMarginLeft ?? "15mm"};
    }
    ${customCss}
  </style>
</head>
<body>
  <div class="pdf-page">
    ${watermarkHtml}
    ${headerContent}
    ${bodyHtml}
    ${footerContent}
  </div>
</body>
</html>`;
}
