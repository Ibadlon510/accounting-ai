import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Agar Smart Accounting <onboarding@resend.dev>";

/**
 * Send an email verification link to the user.
 * Fails silently if Resend is not configured.
 */
export async function sendVerificationEmail({
  to,
  verifyUrl,
  name,
}: {
  to: string;
  verifyUrl: string;
  name?: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping verification email");
    console.log("[email] Verify URL (dev):", verifyUrl);
    return { ok: false as const, error: "not_configured" };
  }

  const displayName = name || to.split("@")[0];

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your Agar email address",
    html: buildVerifyHtml(verifyUrl, displayName),
  });

  if (error) {
    console.error("[email] Failed to send verification email:", error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

function buildVerifyHtml(verifyUrl: string, name: string) {
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
              <div style="font-size:48px;line-height:1">✉️</div>
              <h1 style="margin:16px 0 0;font-size:24px;font-weight:700;color:#1a1a2e">
                Verify your email address
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:#6b7280;line-height:1.6">
                Hi ${name}, click the button below to verify your email and unlock full access to Agar. This link expires in <strong>24 hours</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center">
              <a href="${verifyUrl}"
                 style="display:inline-block;padding:14px 32px;background:#1a1a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
                Verify Email →
              </a>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
                If you didn't create an Agar account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 16px;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;word-break:break-all">
                ${verifyUrl}
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
