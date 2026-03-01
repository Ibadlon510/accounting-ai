import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentOrganization } from "@/lib/org/server";
import { db, notifications } from "@/lib/db";
import { eq, and, asc, desc, or, isNull } from "drizzle-orm";

/**
 * GET /api/notifications
 * Fetch latest 20 notifications (unread first, then recent).
 * Also appends synthetic client-side promo/usage notifications for free-plan users.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getCurrentOrganization();
  if (!org) {
    return NextResponse.json({ error: "No organization" }, { status: 401 });
  }

  // Fetch DB notifications: org-wide OR user-specific
  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, org.id),
        or(
          isNull(notifications.userId),
          eq(notifications.userId, session.user.id)
        )
      )
    )
    .orderBy(asc(notifications.isRead), desc(notifications.createdAt))
    .limit(20);

  // Build synthetic notifications for free-plan users
  const synthetic: Array<{
    id: string;
    category: string;
    title: string;
    message: string;
    icon: string;
    actionUrl: string | null;
    actionLabel: string | null;
    isRead: boolean;
    createdAt: string;
    synthetic: true;
  }> = [];

  if (org.subscriptionPlan === "FREE") {
    synthetic.push({
      id: "syn_promo_launch",
      category: "promo",
      title: "50% Off Pro — Limited Time",
      message: "Unlock unlimited AI scans, 150 tokens/month, and more. Upgrade now and save.",
      icon: "Rocket",
      actionUrl: "/settings",
      actionLabel: "Upgrade",
      isRead: false,
      createdAt: new Date().toISOString(),
      synthetic: true,
    });

    if (org.freeAiDocsUsed >= 4) {
      synthetic.push({
        id: "syn_docs_low",
        category: "documents",
        title: "AI Scans Running Low",
        message: `You've used ${org.freeAiDocsUsed} of 5 free AI document scans. Upgrade for unlimited.`,
        icon: "FileText",
        actionUrl: "/settings",
        actionLabel: "Upgrade",
        isRead: false,
        createdAt: new Date().toISOString(),
        synthetic: true,
      });
    }
  }

  // Merge: synthetic first (unread), then DB rows
  const items = [
    ...synthetic,
    ...rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      synthetic: false as const,
    })),
  ];

  const unreadCount =
    synthetic.length +
    rows.filter((r) => !r.isRead).length;

  return NextResponse.json({ items, unreadCount });
}

/**
 * PATCH /api/notifications
 * Mark one or all notifications as read.
 * Body: { id: string } or { markAllRead: true }
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getCurrentOrganization();
  if (!org) {
    return NextResponse.json({ error: "No organization" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.markAllRead) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.organizationId, org.id),
          or(
            isNull(notifications.userId),
            eq(notifications.userId, session.user.id)
          ),
          eq(notifications.isRead, false)
        )
      );
    return NextResponse.json({ ok: true });
  }

  if (body.id && typeof body.id === "string") {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, body.id),
          eq(notifications.organizationId, org.id)
        )
      );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
