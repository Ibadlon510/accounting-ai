import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "me-central-1";
const bucket = process.env.DOCUMENT_VAULT_BUCKET;

/** UAE FTA / blueprint: mandatory 7-year document retention. */
export const RETENTION_YEARS = 7;

/** Default COMPLIANCE (WORM); set DOCUMENT_VAULT_OBJECT_LOCK_MODE=GOVERNANCE for staging. */
export type ObjectLockMode = "COMPLIANCE" | "GOVERNANCE";

function getObjectLockMode(): ObjectLockMode {
  const raw = (process.env.DOCUMENT_VAULT_OBJECT_LOCK_MODE ?? "COMPLIANCE").toUpperCase();
  return raw === "GOVERNANCE" ? "GOVERNANCE" : "COMPLIANCE";
}

/** Retain-until date = now + RETENTION_YEARS (UTC). */
export function getRetentionRetainUntilDate(from: Date = new Date()): Date {
  const retainUntil = new Date(from.getTime());
  retainUntil.setUTCFullYear(retainUntil.getUTCFullYear() + RETENTION_YEARS);
  return retainUntil;
}

function isObjectLockUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; Code?: string; message?: string; Message?: string };
  const code = e.name ?? e.Code ?? "";
  const message = (e.message ?? e.Message ?? "").toLowerCase();
  if (code === "ObjectLockConfigurationNotFoundError") return true;
  if (code === "InvalidRequest" && message.includes("object lock")) return true;
  if (message.includes("object lock configuration") || message.includes("object lock")) {
    // Bucket created without Object Lock, or lock headers rejected.
    if (
      message.includes("missing") ||
      message.includes("not enabled") ||
      message.includes("does not have") ||
      message.includes("object lock configuration")
    ) {
      return true;
    }
  }
  return false;
}

function getClient(): S3Client | null {
  if (!bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Upload bytes to temp prefix. Key: temp/{orgId}/{documentId}/{fileName}
 */
export async function uploadToTemp(params: {
  orgId: string;
  documentId: string;
  fileName: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const key = `temp/${params.orgId}/${params.documentId}/${params.fileName}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket!,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
  return key;
}

/**
 * Copy object from temp to retention-vault with S3 Object Lock (7-year retention).
 * Key: retention-vault/{orgId}/{documentId}/{fileName}
 *
 * Applies ObjectLockMode (COMPLIANCE by default) and ObjectLockRetainUntilDate = now + 7 years.
 * If the bucket does not have Object Lock enabled (typical local/dev buckets), logs a warning
 * and copies without lock so verify still succeeds. Production buckets must enable Object Lock
 * at create time — see DEPLOYMENT.md.
 */
export async function moveToRetentionVault(params: {
  sourceKey: string;
  orgId: string;
  documentId: string;
  fileName: string;
}): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const destKey = `retention-vault/${params.orgId}/${params.documentId}/${params.fileName}`;
  const copySource = `${bucket}/${params.sourceKey}`;
  const mode = getObjectLockMode();
  const retainUntil = getRetentionRetainUntilDate();

  try {
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket!,
        CopySource: copySource,
        Key: destKey,
        ObjectLockMode: mode,
        ObjectLockRetainUntilDate: retainUntil,
      })
    );
  } catch (err) {
    if (!isObjectLockUnavailableError(err)) {
      throw err;
    }
    console.warn(
      "[vault] Object Lock not available on bucket; copying to retention-vault without lock. " +
        "Enable Object Lock at bucket create time for production 7-year WORM retention. " +
        `Bucket=${bucket} mode=${mode} retainUntil=${retainUntil.toISOString()}`,
      err instanceof Error ? err.message : err
    );
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket!,
        CopySource: copySource,
        Key: destKey,
      })
    );
  }

  return destKey;
}

/**
 * Get object bytes from S3 (for AI processing).
 */
export async function getObjectBytes(s3Key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  const client = getClient();
  if (!client || !bucket) return null;

  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: s3Key })
  );
  if (!res.Body) return null;
  const body = new Uint8Array(await res.Body.transformToByteArray());
  const contentType = (res.ContentType as string) || "application/octet-stream";
  return { body, contentType };
}

/**
 * Generate short-lived presigned URL for viewing the document (PDF/image).
 */
export async function getPresignedViewUrl(s3Key: string, expiresIn = 3600): Promise<string | null> {
  const client = getClient();
  if (!client || !bucket) return null;

  const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

export function isVaultConfigured(): boolean {
  return !!(bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}
