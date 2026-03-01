import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/helpers";
import { db, teamInvites, userRoles, users, organizations } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { CURRENT_ORG_COOKIE, COOKIE_MAX_AGE } from "@/lib/org/constants";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
    }

    // Find the invite
    const [invite] = await db
      .select()
      .from(teamInvites)
      .where(eq(teamInvites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    // Get the current user's email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify email matches (case-insensitive)
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }

    // Check if already a member
    const [existingRole] = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.organizationId, invite.organizationId)
        )
      )
      .limit(1);

    if (existingRole) {
      return NextResponse.json({ error: "You are already a member of this organization" }, { status: 409 });
    }

    // Add user to org
    await db.insert(userRoles).values({
      userId,
      organizationId: invite.organizationId,
      role: invite.role,
    });

    // Mark invite as accepted
    await db
      .update(teamInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(teamInvites.id, invite.id));

    // Set org cookie so user can go directly to dashboard
    const cookieStore = await cookies();
    cookieStore.set(CURRENT_ORG_COOKIE, invite.organizationId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    // Get org name for response
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, invite.organizationId))
      .limit(1);

    return NextResponse.json({
      success: true,
      organizationId: invite.organizationId,
      organizationName: org?.name || "Organization",
      role: invite.role,
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
