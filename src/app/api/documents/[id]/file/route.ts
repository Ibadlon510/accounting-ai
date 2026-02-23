import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getObjectBytes } from "@/lib/storage/vault";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const [doc] = await db
    .select({ s3Key: documents.s3Key })
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.organizationId, orgId)))
    .limit(1);

  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await getObjectBytes(doc.s3Key);
  if (!file) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  return new NextResponse(Buffer.from(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
