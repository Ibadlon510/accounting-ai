import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`forgot-password:${ip}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
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
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    // Delete any existing reset tokens for this email to prevent accumulation
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email))
      .catch(() => {});

    const rawToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(verificationTokens).values({
      identifier: email,
      token: hashToken(rawToken), // store hashed — raw goes in the URL
      expires,
    });

    const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({ to: email, resetUrl }).catch((err) => {
      console.error("Failed to send password reset email:", err);
    });
  }

  return NextResponse.json({ ok: true });
}
