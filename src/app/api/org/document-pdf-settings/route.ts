import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documentTypePdfSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documentType = request.nextUrl.searchParams.get("documentType");

    if (documentType) {
      const [row] = await db
        .select()
        .from(documentTypePdfSettings)
        .where(and(eq(documentTypePdfSettings.organizationId, orgId), eq(documentTypePdfSettings.documentType, documentType)))
        .limit(1);

      return NextResponse.json({ settings: row ?? null });
    }

    const rows = await db
      .select()
      .from(documentTypePdfSettings)
      .where(eq(documentTypePdfSettings.organizationId, orgId));

    return NextResponse.json({ settings: rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { documentType, ...settings } = body as {
      documentType: string;
      pageSize?: string;
      orientation?: string;
      marginTop?: string;
      marginRight?: string;
      marginBottom?: string;
      marginLeft?: string;
      accentColor?: string;
      fontFamily?: string;
      showSections?: { terms: boolean; notes: boolean; payment: boolean; signature: boolean; qrCode: boolean };
    };

    if (!documentType?.trim()) {
      return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, val] of Object.entries(settings)) {
      if (val !== undefined) updates[key] = val;
    }

    const [existing] = await db
      .select({ id: documentTypePdfSettings.id })
      .from(documentTypePdfSettings)
      .where(and(eq(documentTypePdfSettings.organizationId, orgId), eq(documentTypePdfSettings.documentType, documentType)))
      .limit(1);

    if (existing) {
      await db
        .update(documentTypePdfSettings)
        .set(updates)
        .where(eq(documentTypePdfSettings.id, existing.id));
    } else {
      await db.insert(documentTypePdfSettings).values({
        organizationId: orgId,
        documentType,
        ...updates,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
