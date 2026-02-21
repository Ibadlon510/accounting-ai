import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Agar Smart Accounting <onboarding@resend.dev>";

/**
 * Send a password reset email with a link containing the reset token.
 * Fails silently if Resend is not configured.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping password reset email");
    console.log("[email] Reset URL (dev):", resetUrl);
    return { ok: false as const, error: "not_configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Agar password",
    html: buildResetHtml(resetUrl),
  });

  if (error) {
    console.error("[email] Failed to send password reset email:", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

function buildResetHtml(resetUrl: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fce8e0 0%,#fdf6ec 40%,#f0f4f8 100%)">
    <tr>
      <td align="center" style="padding:48px 24px">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden">
          <tr>
            <td style="padding:40px 40px 0;text-align:center">
              <div style="display:inline-flex;align-items:center;gap:10px">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#f97316);display:flex;align-items:center;justify-content:center">
                  <img src="https://api.iconify.design/lucide/layers.svg?color=white" alt="" width="22" height="22" style="display:block">
                </div>
                <div>
                  <div style="font-size:18px;font-weight:700;color:#1a1a2e;line-height:1.2">Agar</div>
                  <div style="font-size:11px;font-weight:500;color:#6b7280;line-height:1.2">Smart Accounting</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;text-align:center">
              <div style="font-size:48px;line-height:1">🔒</div>
              <h1 style="margin:16px 0 0;font-size:24px;font-weight:700;color:#1a1a2e">
                Reset your password
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:#6b7280;line-height:1.6">
                We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center">
              <a href="${resetUrl}"
                 style="display:inline-block;padding:14px 32px;background:#1a1a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
                Reset Password →
              </a>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;text-align:center">
              <div style="border-top:1px solid #f3f4f6;padding-top:20px">
                <p style="margin:0;font-size:11px;color:#9ca3af">
                  © ${new Date().getFullYear()} Agar Smart Accounting. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
