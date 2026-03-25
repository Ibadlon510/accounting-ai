import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { pdfTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getBuiltInTemplates } from "@/lib/pdf/template-engine";

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documentType = request.nextUrl.searchParams.get("documentType");

    let query = db
      .select()
      .from(pdfTemplates)
      .where(
        documentType
          ? and(eq(pdfTemplates.organizationId, orgId), eq(pdfTemplates.documentType, documentType), eq(pdfTemplates.isActive, true))
          : and(eq(pdfTemplates.organizationId, orgId), eq(pdfTemplates.isActive, true))
      );

    const customTemplates = await query;

    const builtIn = getBuiltInTemplates().filter(
      (b) => !documentType || b.documentType === documentType
    );

    return NextResponse.json({ templates: customTemplates, builtIn });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load templates";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: {
      name?: string; documentType?: string; htmlBody?: string; customCss?: string;
      headerHtml?: string; footerHtml?: string; watermark?: string;
      pageSize?: string; orientation?: string; baseTemplateId?: string;
      marginTop?: string; marginRight?: string; marginBottom?: string; marginLeft?: string;
      accentColor?: string; fontFamily?: string;
      showSections?: { terms: boolean; notes: boolean; payment: boolean; signature: boolean; qrCode: boolean };
    };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const { name, documentType, htmlBody, customCss, headerHtml, footerHtml, watermark, pageSize, orientation, baseTemplateId, marginTop, marginRight, marginBottom, marginLeft, accentColor, fontFamily, showSections } = body;

    if (!name || !documentType || !htmlBody) {
      return NextResponse.json({ error: "name, documentType, and htmlBody are required" }, { status: 400 });
    }

    if (htmlBody.length > 512_000) {
      return NextResponse.json({ error: "Template body exceeds 500KB limit" }, { status: 400 });
    }

    const [template] = await db
      .insert(pdfTemplates)
      .values({
        organizationId: orgId,
        name,
        documentType,
        htmlBody,
        customCss: customCss ?? null,
        headerHtml: headerHtml ?? null,
        footerHtml: footerHtml ?? null,
        watermark: watermark ?? null,
        pageSize: pageSize ?? "A4",
        orientation: orientation ?? "portrait",
        baseTemplateId: baseTemplateId ?? null,
        marginTop: marginTop ?? "15mm",
        marginRight: marginRight ?? "15mm",
        marginBottom: marginBottom ?? "20mm",
        marginLeft: marginLeft ?? "15mm",
        accentColor: accentColor ?? "#1a1a2e",
        fontFamily: fontFamily ?? "Plus Jakarta Sans",
        showSections: showSections ?? null,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
