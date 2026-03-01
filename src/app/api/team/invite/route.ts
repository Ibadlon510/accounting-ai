import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db, userRoles, users, teamInvites, organizations } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { canAddUser } from "@/lib/billing/gates";

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

    const [myRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, orgId)))
      .limit(1);

    if (!myRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get pending invites
    const invites = await db
      .select({
        id: teamInvites.id,
        email: teamInvites.email,
        role: teamInvites.role,
        expiresAt: teamInvites.expiresAt,
        createdAt: teamInvites.createdAt,
        acceptedAt: teamInvites.acceptedAt,
      })
      .from(teamInvites)
      .where(eq(teamInvites.organizationId, orgId));

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Team invites error:", error);
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, email, role } = await request.json();
    if (!orgId || !email) {
      return NextResponse.json({ error: "Missing orgId or email" }, { status: 400 });
    }

    const inviteRole = role || "accountant";
    if (!["admin", "accountant", "viewer"].includes(inviteRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Verify user is owner/admin
    const [myRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, orgId)))
      .limit(1);

    if (!myRole || !["owner", "admin"].includes(myRole.role)) {
      return NextResponse.json({ error: "Only owners and admins can invite users" }, { status: 403 });
    }

    // Check if email already belongs to a member
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      const existingRole = await db
        .select({ id: userRoles.id })
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, existingUser[0].id),
            eq(userRoles.organizationId, orgId)
          )
        )
        .limit(1);

      if (existingRole.length > 0) {
        return NextResponse.json({ error: "User is already a member of this organization" }, { status: 409 });
      }
    }

    // Check user limit gate
    const gate = await canAddUser(orgId);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgradeRequired: gate.upgradeRequired }, { status: 403 });
    }

    // Generate invite token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invite] = await db
      .insert(teamInvites)
      .values({
        organizationId: orgId,
        email: email.toLowerCase(),
        role: inviteRole,
        invitedBy: userId,
        token,
        expiresAt,
      })
      .returning();

    // TODO: Send invite email (Phase 8)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${siteUrl}/accept-invite?token=${token}`;

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
      inviteUrl,
    });
  } catch (error) {
    console.error("Team invite error:", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
