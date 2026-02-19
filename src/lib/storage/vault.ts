import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "me-central-1";
const bucket = process.env.DOCUMENT_VAULT_BUCKET;

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
 * Copy object from temp to retention-vault. Key: retention-vault/{orgId}/{documentId}/{fileName}
 * Optionally add Object Lock retention (if bucket has lock enabled).
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
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket!,
      CopySource: `${bucket}/${params.sourceKey}`,
      Key: destKey,
    })
  );
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
