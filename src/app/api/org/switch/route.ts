import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { CURRENT_ORG_COOKIE, COOKIE_MAX_AGE } from "@/lib/org/constants";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { organizationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const organizationId = body.organizationId;
  if (!organizationId || typeof organizationId !== "string") {
    return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  }

  const [role] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.organizationId, organizationId)))
    .limit(1);
  if (!role) {
    return NextResponse.json({ error: "Access denied to this organization" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
