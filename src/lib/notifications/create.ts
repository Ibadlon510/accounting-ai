import { db, notifications } from "@/lib/db";
import type { NotificationCategory } from "@/lib/db/schema";

interface CreateNotificationInput {
  orgId: string;
  userId?: string; // null = org-wide notification
  category: NotificationCategory;
  title: string;
  message: string;
  icon?: string; // lucide icon name
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Create a persistent notification in the DB.
 * Used by webhooks, server actions, and background jobs.
 */
export async function createNotification(input: CreateNotificationInput) {
  const [row] = await db
    .insert(notifications)
    .values({
      organizationId: input.orgId,
      userId: input.userId ?? null,
      category: input.category,
      title: input.title,
      message: input.message,
      icon: input.icon ?? null,
      actionUrl: input.actionUrl ?? null,
      actionLabel: input.actionLabel ?? null,
    })
    .returning({ id: notifications.id });

  return row;
}
