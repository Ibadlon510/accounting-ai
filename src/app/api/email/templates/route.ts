import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getBuiltInEmailTemplates } from "@/lib/email/document-email";

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documentType = request.nextUrl.searchParams.get("documentType");

    const customTemplates = await db
      .select()
      .from(emailTemplates)
      .where(
        documentType
          ? and(eq(emailTemplates.organizationId, orgId), eq(emailTemplates.documentType, documentType), eq(emailTemplates.isActive, true))
          : and(eq(emailTemplates.organizationId, orgId), eq(emailTemplates.isActive, true))
      );

    const builtIn = getBuiltInEmailTemplates().filter(
      (b) => !documentType || b.documentType === documentType
    );

    return NextResponse.json({ templates: customTemplates, builtIn });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load email templates";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { name?: string; documentType?: string; subject?: string; htmlBody?: string };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const { name, documentType, subject, htmlBody } = body;

    if (!name || !documentType || !subject || !htmlBody) {
      return NextResponse.json({ error: "name, documentType, subject, and htmlBody are required" }, { status: 400 });
    }

    const [template] = await db
      .insert(emailTemplates)
      .values({
        organizationId: orgId,
        name,
        documentType,
        subject,
        htmlBody,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create email template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
