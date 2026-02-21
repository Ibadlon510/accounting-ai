import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documents, organizations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getObjectBytes, isVaultConfigured } from "@/lib/storage/vault";
import { extractInvoiceFromImage } from "@/lib/ai/extract-invoice";
import { auditLogs } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [org] = await db
    .select({ tokenBalance: organizations.tokenBalance, subscriptionPlan: organizations.subscriptionPlan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (org?.subscriptionPlan === "ARCHIVE") {
    return NextResponse.json({ error: "Archive mode: read-only. Restore subscription to process." }, { status: 403 });
  }
  if (!org || Number(org.tokenBalance ?? 0) < 1) {
    return NextResponse.json(
      { error: "Insufficient token balance. Upgrade or refill to process documents." },
      { status: 402 }
    );
  }

  if (!isVaultConfigured()) {
    return NextResponse.json(
      { error: "Document vault storage is not configured" },
      { status: 503 }
    );
  }

  const { id: documentId } = await params;
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.organizationId, orgId)))
    .limit(1);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.status === "PROCESSED") {
    return NextResponse.json({ error: "Document already verified" }, { status: 400 });
  }

  const fileData = await getObjectBytes(doc.s3Key);
  if (!fileData) {
    await db
      .update(documents)
      .set({ status: "PROCESSING_FAILED", lastError: "Failed to read file from storage" })
      .where(eq(documents.id, documentId));
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }

  const result = await extractInvoiceFromImage(fileData.body, fileData.contentType);

  if (!result.ok) {
    await db
      .update(documents)
      .set({ status: "PROCESSING_FAILED", lastError: result.error })
      .where(eq(documents.id, documentId));
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  const status = result.data.validation.math_check_passed && (result.data.validation.issues?.length ?? 0) === 0
    ? "PENDING"
    : "FLAGGED";

  await db
    .update(documents)
    .set({
      extractedData: result.data as unknown as Record<string, unknown>,
      aiConfidence: String(result.confidence),
      status,
      lastError: null,
    })
    .where(eq(documents.id, documentId));

  await db
    .update(organizations)
    .set({ tokenBalance: Math.max(0, Number(org.tokenBalance ?? 0) - 1) })
    .where(eq(organizations.id, orgId));

  const session = await auth();
  const userId = session?.user?.id;
  await db.insert(auditLogs).values({
    organizationId: orgId,
    userId,
    action: "document_processing_completed",
    entity: "documents",
    entityId: documentId,
    metadata: { confidence: result.confidence, status },
  });

  return NextResponse.json({
    ok: true,
    extractedData: result.data,
    confidence: result.confidence,
    status,
  });
}
