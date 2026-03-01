import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CURRENT_ORG_COOKIE } from "@/lib/org/constants";

/**
 * Returns the current org ID from the server-side cookie.
 * Validates that the user actually belongs to the org; clears stale cookies if not.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ orgId: null });
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get(CURRENT_ORG_COOKIE)?.value ?? null;

  if (!orgId) {
    return NextResponse.json({ orgId: null });
  }

  // Validate user belongs to this org
  const [role] = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.organizationId, orgId)))
    .limit(1);

  if (!role) {
    // Stale cookie — clear it
    cookieStore.delete(CURRENT_ORG_COOKIE);
    return NextResponse.json({ orgId: null });
  }

  return NextResponse.json({ orgId });
}
