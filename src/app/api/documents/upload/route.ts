import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { documents, auditLogs, users, organizations } from "@/lib/db/schema";
import { uploadToTemp, isVaultConfigured } from "@/lib/storage/vault";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
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
      { error: "Invalid file type. Allowed: PDF, JPEG, PNG, WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "document";

  const [doc] = await db
    .insert(documents)
    .values({
      organizationId: orgId,
      s3Key: "", // set after upload
      status: "PENDING",
    })
    .returning({ id: documents.id });

  if (!doc) {
    return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
  }

  const s3Key = await uploadToTemp({
    orgId,
    documentId: doc.id,
    fileName,
    body: buffer,
    contentType: file.type,
  });

  if (!s3Key) {
    await db.delete(documents).where(eq(documents.id, doc.id));
    return NextResponse.json(
      { error: "Failed to upload file to storage" },
      { status: 500 }
    );
  }

  await db.update(documents).set({ s3Key }).where(eq(documents.id, doc.id));

  let userId: string | undefined;
  const supabase = await createClient();
  if (supabase) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const [appUser] = await db.select({ id: users.id }).from(users).where(eq(users.authId, authUser.id)).limit(1);
      userId = appUser?.id;
    }
  }

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
