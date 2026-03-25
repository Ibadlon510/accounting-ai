import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { sendDocumentEmail } from "@/lib/email/document-email";

export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: {
      documentType?: string; documentId?: string; recipientEmail?: string; recipientName?: string;
      cc?: string[]; bcc?: string[]; subject?: string; body?: string;
      emailTemplateId?: string; pdfTemplateId?: string; data?: Record<string, unknown>; documentNumber?: string;
    };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const { documentType, documentId, recipientEmail, recipientName, cc, bcc, subject, body: emailBody, emailTemplateId, pdfTemplateId, data, documentNumber } = body;

    if (!documentType || !recipientEmail) {
      return NextResponse.json({ error: "documentType and recipientEmail are required" }, { status: 400 });
    }

    const result = await sendDocumentEmail({
      documentType,
      documentId,
      recipientEmail,
      recipientName,
      cc,
      bcc,
      subject,
      body: emailBody,
      emailTemplateId,
      pdfTemplateId,
      senderId: userId,
      orgId,
      data,
      documentNumber,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, emailId: result.emailId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
