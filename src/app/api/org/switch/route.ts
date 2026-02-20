import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userRoles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { CURRENT_ORG_COOKIE, COOKIE_MAX_AGE } from "@/lib/org/constants";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
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

  const [appUser] = await db.select().from(users).where(eq(users.authId, authUser.id)).limit(1);
  if (!appUser) {
    return NextResponse.json({ error: "User record not found" }, { status: 403 });
  }

  const [role] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, appUser.id), eq(userRoles.organizationId, organizationId)))
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
