import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db, userRoles, users } from "@/lib/db";
import { eq } from "drizzle-orm";

/** Team members for the current org (from cookie). Used by dashboard header. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const members = await db
    .select({
      userId: userRoles.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .where(eq(userRoles.organizationId, orgId));

  return NextResponse.json({ members });
}
