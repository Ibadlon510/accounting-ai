import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (body.isDefault) {
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(and(eq(emailTemplates.id, id), eq(emailTemplates.organizationId, orgId)))
        .limit(1);

      if (existing) {
        await db
          .update(emailTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(emailTemplates.organizationId, orgId),
              eq(emailTemplates.documentType, existing.documentType),
              eq(emailTemplates.isDefault, true)
            )
          );
      }
    }

    const safeFields: Record<string, unknown> = {};
    if (body.name !== undefined) safeFields.name = body.name;
    if (body.subject !== undefined) safeFields.subject = body.subject;
    if (body.htmlBody !== undefined) safeFields.htmlBody = body.htmlBody;
    if (body.isDefault !== undefined) safeFields.isDefault = body.isDefault;
    if (body.isActive !== undefined) safeFields.isActive = body.isActive;

    const [updated] = await db
      .update(emailTemplates)
      .set({ ...safeFields, updatedAt: new Date() })
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.organizationId, orgId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    return NextResponse.json({ template: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update email template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [deleted] = await db
      .update(emailTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.organizationId, orgId)))
      .returning();

    if (!deleted) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete email template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
