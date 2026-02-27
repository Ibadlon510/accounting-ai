import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  let body: { email?: string; token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const token = body.token?.trim();
  const password = body.password;

  if (!email || !token || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Find and validate the token (compare hashed value stored in DB)
  const hashedToken = hashToken(token);
  const [vt] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, hashedToken)
      )
    )
    .limit(1);

  if (!vt) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  if (new Date(vt.expires) < new Date()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, hashedToken)
        )
      );
    return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
  }

  // Update password
  const hashedPassword = await bcrypt.hash(password, 12);
  await db
    .update(users)
    .set({ hashedPassword, updatedAt: new Date() })
    .where(eq(users.email, email));

  // Delete the used token
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, hashedToken)
      )
    );

  return NextResponse.json({ ok: true });
}
