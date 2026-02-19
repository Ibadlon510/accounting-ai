import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.organizationId, orgId)))
    .limit(1);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: doc.id,
    s3Key: doc.s3Key,
    status: doc.status,
    aiConfidence: doc.aiConfidence != null ? Number(doc.aiConfidence) : null,
    extractedData: doc.extractedData,
    lastError: doc.lastError,
    createdAt: doc.createdAt,
  });
}
