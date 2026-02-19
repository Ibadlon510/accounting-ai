import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({
      id: documents.id,
      s3Key: documents.s3Key,
      status: documents.status,
      aiConfidence: documents.aiConfidence,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.organizationId, orgId))
    .orderBy(desc(documents.createdAt));

  return NextResponse.json({
    documents: list.map((d) => ({
      id: d.id,
      s3Key: d.s3Key,
      status: d.status,
      aiConfidence: d.aiConfidence != null ? Number(d.aiConfidence) : null,
      createdAt: d.createdAt,
    })),
  });
}
