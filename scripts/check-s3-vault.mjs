/**
 * One-off script to verify the app can reach the Document Vault S3 bucket.
 * Run from project root: node scripts/check-s3-vault.mjs
 */
import { readFileSync, existsSync } from "fs";
import { pathToFileURL } from "url";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local if present (dotenv doesn't load it by default)
const envLocal = join(__dirname, "..", ".env.local");
if (existsSync(envLocal)) {
  const content = readFileSync(envLocal, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      process.env[m[1]] = val;
    }
  }
}

const region = process.env.AWS_REGION || "me-central-1";
const bucket = process.env.DOCUMENT_VAULT_BUCKET;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

async function main() {
  console.log("Checking S3 Document Vault connectivity...\n");
  console.log("  AWS_REGION:", region);
  console.log("  DOCUMENT_VAULT_BUCKET:", bucket || "(not set)");
  console.log("  AWS_ACCESS_KEY_ID:", accessKey ? `${accessKey.slice(0, 8)}...` : "(not set)");
  console.log("  AWS_SECRET_ACCESS_KEY:", secretKey ? "***set***" : "(not set)\n");

  if (!bucket || !accessKey || !secretKey) {
    console.error("Missing one or more of: DOCUMENT_VAULT_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  const { S3Client, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log("  HeadBucket: OK (bucket exists and you have access)\n");
  } catch (e) {
    console.error("  HeadBucket failed:", e.message || e);
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) {
      console.error("  The bucket does not exist or is in another region. Create it in region:", region);
    }
    process.exit(1);
  }

  const testKey = "temp/_vault-check/test.txt";
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: "vault connectivity check",
        ContentType: "text/plain",
      })
    );
    console.log("  PutObject (test file): OK\n");
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    console.log("  DeleteObject (cleanup): OK\n");
  } catch (e) {
    console.error("  PutObject failed:", e.message || e);
    process.exit(1);
  }

  console.log("Done. The app can reach the bucket and write/delete objects.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
