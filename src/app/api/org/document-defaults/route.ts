import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documentTypeDefaults } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select()
      .from(documentTypeDefaults)
      .where(eq(documentTypeDefaults.organizationId, orgId));

    const byType: Record<string, { defaultTerms: string | null; defaultNotes: string | null; defaultPaymentInfo: string | null }> = {};
    for (const r of rows) {
      byType[r.documentType] = {
        defaultTerms: r.defaultTerms,
        defaultNotes: r.defaultNotes,
        defaultPaymentInfo: r.defaultPaymentInfo,
      };
    }

    return NextResponse.json({ defaults: byType });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load defaults";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { documentType, defaultTerms, defaultNotes, defaultPaymentInfo } = body as {
      documentType: string;
      defaultTerms?: string;
      defaultNotes?: string;
      defaultPaymentInfo?: string;
    };

    if (!documentType?.trim()) {
      return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: documentTypeDefaults.id })
      .from(documentTypeDefaults)
      .where(and(eq(documentTypeDefaults.organizationId, orgId), eq(documentTypeDefaults.documentType, documentType)))
      .limit(1);

    if (existing) {
      await db
        .update(documentTypeDefaults)
        .set({
          defaultTerms: defaultTerms ?? null,
          defaultNotes: defaultNotes ?? null,
          defaultPaymentInfo: defaultPaymentInfo ?? null,
          updatedAt: new Date(),
        })
        .where(eq(documentTypeDefaults.id, existing.id));
    } else {
      await db.insert(documentTypeDefaults).values({
        organizationId: orgId,
        documentType,
        defaultTerms: defaultTerms ?? null,
        defaultNotes: defaultNotes ?? null,
        defaultPaymentInfo: defaultPaymentInfo ?? null,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save defaults";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
