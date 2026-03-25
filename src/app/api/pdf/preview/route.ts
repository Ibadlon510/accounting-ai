import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { compileTemplate } from "@/lib/pdf/template-engine";
import type { PdfDocumentType } from "@/lib/pdf/types";

export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const { templateId, documentType, data, sampleData, customHtml, customSlots } = body as {
      templateId?: string;
      documentType: PdfDocumentType;
      data?: Record<string, unknown>;
      sampleData?: boolean;
      customHtml?: string;
      customSlots?: { headerHtml?: string; footerHtml?: string; customCss?: string; watermark?: string };
    };

    if (!documentType) {
      return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    }

    const html = await compileTemplate({
      orgId,
      documentType,
      templateId,
      data,
      useSampleData: sampleData ?? false,
      customHtmlBody: customHtml,
      customSlots,
    });

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Preview generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
