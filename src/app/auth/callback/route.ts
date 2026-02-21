import { NextResponse } from "next/server";

/**
 * Legacy auth callback route.
 * NextAuth handles OAuth callbacks at /api/auth/callback/[provider].
 * This route exists to handle any legacy links — it simply redirects to dashboard.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/dashboard`);
}
