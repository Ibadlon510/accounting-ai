import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, auditLogs, organizations } from "@/lib/db/schema";
import { uploadToTemp, isVaultConfigured } from "@/lib/storage/vault";
import { eq } from "drizzle-orm";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const BANK_STATEMENT_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [org] = await db.select({ subscriptionPlan: organizations.subscriptionPlan }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (org?.subscriptionPlan === "ARCHIVE") {
    return NextResponse.json({ error: "Archive mode: read-only. Restore subscription to upload." }, { status: 403 });
  }

  if (!isVaultConfigured()) {
    return NextResponse.json(
      { error: "Document vault storage is not configured" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PDF, JPEG, PNG, WebP, CSV, Excel (.xls, .xlsx)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "document";

  const isBankStatement = BANK_STATEMENT_TYPES.includes(file.type);

  let doc: { id: string } | undefined;
  try {
    [doc] = await db
      .insert(documents)
      .values({
        organizationId: orgId,
        s3Key: "", // set after upload
        documentType: isBankStatement ? "bank_statement" : null,
        status: "PENDING",
      })
      .returning({ id: documents.id });
  } catch (err) {
    console.error("[upload] DB insert failed:", err);
    return NextResponse.json(
      { error: "Failed to create document record" },
      { status: 500 }
    );
  }

  if (!doc) {
    return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
  }

  let s3Key: string | null;
  try {
    s3Key = await uploadToTemp({
      orgId,
      documentId: doc.id,
      fileName,
      body: buffer,
      contentType: file.type,
    });
  } catch (err) {
    console.error("[upload] S3 upload failed:", err);
    await db.delete(documents).where(eq(documents.id, doc.id)).catch(() => {});
    return NextResponse.json(
      { error: "Failed to upload file to storage" },
      { status: 500 }
    );
  }

  if (!s3Key) {
    await db.delete(documents).where(eq(documents.id, doc.id)).catch(() => {});
    return NextResponse.json(
      { error: "Failed to upload file to storage" },
      { status: 500 }
    );
  }

  await db.update(documents).set({ s3Key }).where(eq(documents.id, doc.id));

  const session = await auth();
  const userId = session?.user?.id;

  await db.insert(auditLogs).values({
    organizationId: orgId,
    userId,
    action: "document_uploaded",
    entity: "documents",
    entityId: doc.id,
    metadata: { fileName, s3Key },
  }).catch(() => {});

  return NextResponse.json({ documentId: doc.id, s3Key });
}
