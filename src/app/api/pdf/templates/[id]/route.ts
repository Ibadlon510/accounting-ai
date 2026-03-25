import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { pdfTemplates } from "@/lib/db/schema";
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

    const [existing] = await db
      .select()
      .from(pdfTemplates)
      .where(and(eq(pdfTemplates.id, id), eq(pdfTemplates.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (body.isDefault) {
      await db
        .update(pdfTemplates)
        .set({ isDefault: false })
        .where(
          and(
            eq(pdfTemplates.organizationId, orgId),
            eq(pdfTemplates.documentType, existing.documentType),
            eq(pdfTemplates.isDefault, true)
          )
        );
    }

    const safeFields: Record<string, unknown> = {};
    if (body.name !== undefined) safeFields.name = body.name;
    if (body.htmlBody !== undefined) safeFields.htmlBody = body.htmlBody;
    if (body.customCss !== undefined) safeFields.customCss = body.customCss;
    if (body.headerHtml !== undefined) safeFields.headerHtml = body.headerHtml;
    if (body.footerHtml !== undefined) safeFields.footerHtml = body.footerHtml;
    if (body.watermark !== undefined) safeFields.watermark = body.watermark;
    if (body.pageSize !== undefined) safeFields.pageSize = body.pageSize;
    if (body.orientation !== undefined) safeFields.orientation = body.orientation;
    if (body.isDefault !== undefined) safeFields.isDefault = body.isDefault;
    if (body.isActive !== undefined) safeFields.isActive = body.isActive;
    if (body.marginTop !== undefined) safeFields.marginTop = body.marginTop;
    if (body.marginRight !== undefined) safeFields.marginRight = body.marginRight;
    if (body.marginBottom !== undefined) safeFields.marginBottom = body.marginBottom;
    if (body.marginLeft !== undefined) safeFields.marginLeft = body.marginLeft;
    if (body.accentColor !== undefined) safeFields.accentColor = body.accentColor;
    if (body.fontFamily !== undefined) safeFields.fontFamily = body.fontFamily;
    if (body.showSections !== undefined) safeFields.showSections = body.showSections;

    const [updated] = await db
      .update(pdfTemplates)
      .set({
        ...safeFields,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(pdfTemplates.id, id), eq(pdfTemplates.organizationId, orgId)))
      .returning();

    return NextResponse.json({ template: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update template";
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
      .update(pdfTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(pdfTemplates.id, id), eq(pdfTemplates.organizationId, orgId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
