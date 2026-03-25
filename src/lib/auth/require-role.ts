import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  accountant: 2,
  viewer: 1,
};

export async function requireOrgRole(
  organizationId: string,
  minimumRole: "viewer" | "accountant" | "admin" | "owner" = "accountant"
): Promise<{ userId: string; role: string } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userRole] = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, session.user.id),
        eq(userRoles.organizationId, organizationId)
      )
    )
    .limit(1);

  const role = userRole?.role ?? "viewer";
  const userLevel = ROLE_HIERARCHY[role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

  if (userLevel < requiredLevel) {
    return NextResponse.json(
      { error: `Insufficient permissions. Required: ${minimumRole}` },
      { status: 403 }
    );
  }

  return { userId: session.user.id, role };
}
