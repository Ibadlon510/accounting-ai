import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "@/lib/email/magic-link";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

async function hashToken(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const MAGIC_LINK_IDENTIFIER_PREFIX = "magic-link:";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`magic-link:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429 }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Always return success to avoid leaking whether the email exists
  // But still generate and send the token if user exists (or for new users)

  const identifier = `${MAGIC_LINK_IDENTIFIER_PREFIX}${email}`;

  // Delete any existing magic link tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier))
    .catch(() => {});

  const rawToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(verificationTokens).values({
    identifier,
    token: await hashToken(rawToken),
    expires,
  });

  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const magicUrl = `${baseUrl}/login?magic_token=${rawToken}&email=${encodeURIComponent(email)}`;

  // Look up user name for the email (if they exist)
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  await sendMagicLinkEmail({
    to: email,
    magicUrl,
    name: user?.name,
  }).catch((err) => {
    console.error("[magic-link] Failed to send email:", err);
  });

  return NextResponse.json({ ok: true });
}
