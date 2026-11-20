import { createHash, randomBytes } from "crypto";

export function hashStubToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateStubToken(): { raw: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashStubToken(raw),
    prefix: raw.slice(0, 8),
  };
}
