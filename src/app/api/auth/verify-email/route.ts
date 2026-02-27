import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

const VERIFY_IDENTIFIER_PREFIX = "verify:";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
  }

  const identifier = `${VERIFY_IDENTIFIER_PREFIX}${email}`;
  const hashedToken = hashToken(token);

  const [vt] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, hashedToken)
      )
    )
    .limit(1);

  if (!vt) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
  }

  if (new Date(vt.expires) < new Date()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, hashedToken)
        )
      );
    return NextResponse.redirect(new URL("/login?error=link_expired", request.url));
  }

  // Mark email as verified
  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.email, email));

  // Delete used token
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, hashedToken)
      )
    );

  return NextResponse.redirect(new URL("/dashboard?verified=true", request.url));
}
