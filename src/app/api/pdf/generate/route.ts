import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { compileTemplate } from "@/lib/pdf/template-engine";
import { generatePdf } from "@/lib/pdf/engine";
import { db } from "@/lib/db";
import { auditLogs, pdfTemplates, documentTypePdfSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { PdfDocumentType } from "@/lib/pdf/types";

export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await getSessionUserId();

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const {
      templateId, documentType, data, customSlots,
      pageSize, orientation, filename,
    } = body as {
      templateId?: string;
      documentType: PdfDocumentType;
      data?: Record<string, unknown>;
      customSlots?: { headerHtml?: string; footerHtml?: string; customCss?: string; watermark?: string };
      pageSize?: "A4" | "Letter" | "Legal";
      orientation?: "portrait" | "landscape";
      filename?: string;
    };

    if (!documentType) {
      return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    }

    const html = await compileTemplate({
      orgId,
      documentType,
      templateId,
      data,
      customSlots,
    });

    // Load PDF settings from custom template row or per-doc-type settings table
    let resolvedPageSize = pageSize ?? "A4";
    let resolvedOrientation = orientation ?? "portrait";
    let resolvedMargins = { top: "15mm", right: "15mm", bottom: "20mm", left: "15mm" };

    try {
      if (templateId) {
        const [tpl] = await db
          .select({ pageSize: pdfTemplates.pageSize, orientation: pdfTemplates.orientation, marginTop: pdfTemplates.marginTop, marginRight: pdfTemplates.marginRight, marginBottom: pdfTemplates.marginBottom, marginLeft: pdfTemplates.marginLeft })
          .from(pdfTemplates)
          .where(and(eq(pdfTemplates.id, templateId), eq(pdfTemplates.organizationId, orgId)))
          .limit(1);

        if (tpl) {
          resolvedPageSize = pageSize ?? (tpl.pageSize as "A4" | "Letter" | "Legal") ?? "A4";
          resolvedOrientation = orientation ?? (tpl.orientation as "portrait" | "landscape") ?? "portrait";
          resolvedMargins = { top: tpl.marginTop ?? "15mm", right: tpl.marginRight ?? "15mm", bottom: tpl.marginBottom ?? "20mm", left: tpl.marginLeft ?? "15mm" };
        }
      }

      if (!templateId || !pageSize) {
        const [dtSettings] = await db
          .select({ pageSize: documentTypePdfSettings.pageSize, orientation: documentTypePdfSettings.orientation, marginTop: documentTypePdfSettings.marginTop, marginRight: documentTypePdfSettings.marginRight, marginBottom: documentTypePdfSettings.marginBottom, marginLeft: documentTypePdfSettings.marginLeft })
          .from(documentTypePdfSettings)
          .where(and(eq(documentTypePdfSettings.organizationId, orgId), eq(documentTypePdfSettings.documentType, documentType)))
          .limit(1);

        if (dtSettings) {
          resolvedPageSize = pageSize ?? (dtSettings.pageSize as "A4" | "Letter" | "Legal") ?? resolvedPageSize;
          resolvedOrientation = orientation ?? (dtSettings.orientation as "portrait" | "landscape") ?? resolvedOrientation;
          resolvedMargins = { top: dtSettings.marginTop ?? resolvedMargins.top, right: dtSettings.marginRight ?? resolvedMargins.right, bottom: dtSettings.marginBottom ?? resolvedMargins.bottom, left: dtSettings.marginLeft ?? resolvedMargins.left };
        }
      }
    } catch {
      // PDF settings tables may not exist yet; use defaults
    }

    const pdfBuffer = await generatePdf(html, {
      pageSize: resolvedPageSize as "A4" | "Letter" | "Legal",
      orientation: resolvedOrientation as "portrait" | "landscape",
      margins: resolvedMargins,
    });

    const defaultFilename = `${documentType}-${new Date().toISOString().split("T")[0]}.pdf`;

    try {
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: userId ?? undefined,
        action: "pdf_generated",
        entity: documentType,
        metadata: { templateId, documentType, filename: filename ?? defaultFilename },
      });
    } catch {
      // audit logging is non-critical
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename ?? defaultFilename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "PDF generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
