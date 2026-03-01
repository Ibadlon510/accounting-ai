import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Agar Smart Accounting <onboarding@resend.dev>";

export async function sendSubscriptionConfirmedEmail({
  to,
  planName,
  orgName,
}: {
  to: string;
  planName: string;
  orgName: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping subscription confirmed email");
    return { ok: false as const, error: "not_configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Welcome to Agar ${planName}!`,
    html: buildConfirmedHtml({ planName, orgName }),
  });

  if (error) {
    console.error("[email] Failed to send subscription confirmed email:", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function sendSubscriptionCanceledEmail({
  to,
  orgName,
}: {
  to: string;
  orgName: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping subscription canceled email");
    return { ok: false as const, error: "not_configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Your Agar subscription has been canceled",
    html: buildCanceledHtml({ orgName }),
  });

  if (error) {
    console.error("[email] Failed to send subscription canceled email:", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function sendLowTokensEmail({
  to,
  orgName,
  remaining,
}: {
  to: string;
  orgName: string;
  remaining: number;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping low tokens email");
    return { ok: false as const, error: "not_configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Low AI tokens for ${orgName}`,
    html: buildLowTokensHtml({ orgName, remaining }),
  });

  if (error) {
    console.error("[email] Failed to send low tokens email:", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

/* ─── HTML Builders ────────────────────────────────────────── */

function emailWrapper(icon: string, title: string, body: string) {
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
              <div style="font-size:48px;line-height:1">${icon}</div>
              <h1 style="margin:16px 0 0;font-size:24px;font-weight:700;color:#1a1a2e">${title}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;text-align:center">
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

function buildConfirmedHtml({ planName, orgName }: { planName: string; orgName: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agaraccounting.com";
  return emailWrapper(
    "🎉",
    `Welcome to ${planName}!`,
    `<p style="margin:12px 0 0;font-size:15px;color:#6b7280;line-height:1.6">
      Your subscription for <strong>${orgName}</strong> is now active. You have access to all ${planName} features including unlimited journal entries and AI-powered automation.
    </p>
    <div style="padding:24px 0">
      <a href="${siteUrl}/dashboard"
         style="display:inline-block;padding:14px 32px;background:#1a1a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
        Go to Dashboard →
      </a>
    </div>`
  );
}

function buildCanceledHtml({ orgName }: { orgName: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agaraccounting.com";
  return emailWrapper(
    "😔",
    "Subscription Canceled",
    `<p style="margin:12px 0 0;font-size:15px;color:#6b7280;line-height:1.6">
      Your Pro subscription for <strong>${orgName}</strong> has been canceled. You'll be moved to the Free plan at the end of your current billing period.
    </p>
    <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6">
      Your data is safe and you can continue using Agar on the Free plan. You can re-subscribe at any time from your Billing Settings.
    </p>
    <div style="padding:24px 0">
      <a href="${siteUrl}/dashboard/settings?tab=billing"
         style="display:inline-block;padding:14px 32px;background:#1a1a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
        Manage Billing →
      </a>
    </div>`
  );
}

function buildLowTokensHtml({ orgName, remaining }: { orgName: string; remaining: number }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agaraccounting.com";
  return emailWrapper(
    "⚡",
    "Low AI Tokens",
    `<p style="margin:12px 0 0;font-size:15px;color:#6b7280;line-height:1.6">
      <strong>${orgName}</strong> has <strong>${remaining}</strong> AI token${remaining !== 1 ? "s" : ""} remaining this month. Once depleted, AI features like document scanning and smart classification will be paused until your next billing cycle.
    </p>
    <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6">
      You can purchase a top-up pack (250 tokens for 35 AED) to keep your AI features running.
    </p>
    <div style="padding:24px 0">
      <a href="${siteUrl}/dashboard/settings?tab=billing"
         style="display:inline-block;padding:14px 32px;background:#1a1a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
        Buy Token Top-up →
      </a>
    </div>`
  );
}
