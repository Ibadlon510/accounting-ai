import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db, userRoles, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // Verify user belongs to org
    const [myRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, orgId)))
      .limit(1);

    if (!myRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all members with their user info
    const members = await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        role: userRoles.role,
        joinedAt: userRoles.createdAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(userRoles)
      .innerJoin(users, eq(users.id, userRoles.userId))
      .where(eq(userRoles.organizationId, orgId));

    return NextResponse.json({ members, myRole: myRole.role });
  } catch (error) {
    console.error("Team members error:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}
