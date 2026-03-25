import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sentEmails } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!WEBHOOK_SECRET) {
      console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { type, data } = body as { type?: string; data?: Record<string, unknown> };

    if (!data?.email_id) {
      return NextResponse.json({ ok: true });
    }

    const resendEmailId = data.email_id as string;

    let status: string | undefined;
    let openedAt: Date | undefined;
    let errorMessage: string | undefined;

    switch (type) {
      case "email.sent":
        status = "sent";
        break;
      case "email.delivered":
        status = "delivered";
        break;
      case "email.opened":
        status = "opened";
        openedAt = new Date();
        break;
      case "email.bounced":
        status = "bounced";
        errorMessage = (data.bounce as Record<string, string>)?.message ?? "Email bounced";
        break;
      case "email.complained":
        status = "bounced";
        errorMessage = "Recipient marked as spam";
        break;
      case "email.delivery_delayed":
        status = "queued";
        break;
      default:
        return NextResponse.json({ ok: true });
    }

    if (status) {
      await db
        .update(sentEmails)
        .set({
          status,
          statusUpdatedAt: new Date(),
          ...(openedAt ? { openedAt } : {}),
          ...(errorMessage ? { errorMessage } : {}),
        })
        .where(eq(sentEmails.resendEmailId, resendEmailId));
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[resend-webhook] Error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
