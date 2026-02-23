import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * If the user has exactly one organization, returns its ID so the client can
 * auto-set the org cookie (e.g. after sign-in when cookie was cleared).
 * Also returns orgCount for redirect logic (e.g. multiple orgs → workspaces).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ singleOrgId: null, orgCount: 0 });
  }

  const roles = await db
    .select({ organizationId: userRoles.organizationId })
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id));

  const uniqueOrgIds = [...new Set(roles.map((r) => r.organizationId))];
  const orgCount = uniqueOrgIds.length;

  if (orgCount === 1) {
    return NextResponse.json({ singleOrgId: uniqueOrgIds[0], orgCount: 1 });
  }

  return NextResponse.json({ singleOrgId: null, orgCount });
}
