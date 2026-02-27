import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { sendVerificationEmail } from "@/lib/email/verify-email";
import { z } from "zod";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const VERIFY_IDENTIFIER_PREFIX = "verify:";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`update-email:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 }
    );
  }

  const newEmail = parsed.data.email.toLowerCase().trim();

  // Check if already verified (no change needed)
  const [currentUser] = await db
    .select({ email: users.email, name: users.name, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!currentUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  if (currentUser.emailVerified) {
    return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
  }

  if (currentUser.email === newEmail) {
    return NextResponse.json({ error: "That is already your current email address" }, { status: 400 });
  }

  // Check the new email is not taken by another account
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, newEmail), ne(users.id, session.user.id)))
    .limit(1);

  if (taken) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Update email and clear verified status
  await db
    .update(users)
    .set({ email: newEmail, emailVerified: null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  // Delete old verification tokens for both old and new email
  const oldIdentifier = `${VERIFY_IDENTIFIER_PREFIX}${currentUser.email}`;
  const newIdentifier = `${VERIFY_IDENTIFIER_PREFIX}${newEmail}`;
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, oldIdentifier)).catch(() => {});
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, newIdentifier)).catch(() => {});

  // Issue a fresh verification token for the new email
  const rawToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(verificationTokens).values({
    identifier: newIdentifier,
    token: hashToken(rawToken), // store hashed — raw token goes in the URL
    expires,
  });

  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(newEmail)}`;

  await sendVerificationEmail({
    to: newEmail,
    verifyUrl,
    name: currentUser.name,
  }).catch((err) => {
    console.error("[update-email] Failed to send verification email:", err);
  });

  return NextResponse.json({ ok: true, email: newEmail });
}
