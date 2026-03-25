import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { sentEmails } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendDocumentEmail } from "@/lib/email/document-email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [original] = await db
      .select()
      .from(sentEmails)
      .where(and(eq(sentEmails.id, id), eq(sentEmails.organizationId, orgId)))
      .limit(1);

    if (!original) {
      return NextResponse.json({ error: "Email record not found" }, { status: 404 });
    }

    const result = await sendDocumentEmail({
      documentType: original.documentType,
      documentId: original.documentId ?? undefined,
      recipientEmail: original.recipientEmail,
      recipientName: original.recipientName ?? undefined,
      cc: original.ccEmails ? original.ccEmails.split(", ") : undefined,
      bcc: original.bccEmails ? original.bccEmails.split(", ") : undefined,
      emailTemplateId: original.emailTemplateId ?? undefined,
      pdfTemplateId: original.pdfTemplateId ?? undefined,
      senderId: userId,
      orgId,
      documentNumber: original.documentNumber ?? undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, emailId: result.emailId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to resend email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
