export function wrapInEmailLayout(bodyHtml: string, orgName?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #faf5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
    .email-card { background: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 32px; }
    .email-footer { text-align: center; padding: 20px 0; font-size: 12px; color: #9ca3af; }
    .email-btn { display: inline-block; padding: 12px 32px; border-radius: 12px; background: #1a1a2e; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; }
    h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
    p { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 16px; }
    .summary-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .summary-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    .summary-table td:last-child { text-align: right; font-weight: 600; color: #1a1a2e; }
    .highlight { font-size: 28px; font-weight: 800; color: #1a1a2e; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      ${bodyHtml}
    </div>
    <div class="email-footer">
      <p style="margin:0;font-size:12px;color:#9ca3af">${orgName ?? "Agar Smart Accounting"}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#d1d5db">Powered by Agar Smart Accounting</p>
    </div>
  </div>
</body>
</html>`;
}
