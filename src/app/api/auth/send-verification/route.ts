import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { sendVerificationEmail } from "@/lib/email/verify-email";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

const VERIFY_IDENTIFIER_PREFIX = "verify:";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`send-verification:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.email) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const identifier = `${VERIFY_IDENTIFIER_PREFIX}${user.email}`;

  // Delete any existing verification tokens for this user to prevent accumulation
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  const rawToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(verificationTokens).values({
    identifier,
    token: hashToken(rawToken), // store hashed — raw token goes in the URL
    expires,
  });

  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

  await sendVerificationEmail({
    to: user.email,
    verifyUrl,
    name: user.name,
  }).catch((err) => {
    console.error("[send-verification] Failed to send email:", err);
  });

  return NextResponse.json({ ok: true });
}
