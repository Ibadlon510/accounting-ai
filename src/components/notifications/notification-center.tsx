"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Bell,
  CreditCard,
  Users,
  FileText,
  BarChart3,
  Rocket,
  CheckCheck,
  Settings,
  X,
} from "lucide-react";

// Map icon name strings to Lucide components
const ICON_MAP: Record<string, typeof Bell> = {
  Bell,
  CreditCard,
  Users,
  FileText,
  BarChart3,
  Rocket,
  Settings,
};

const CATEGORY_COLORS: Record<string, string> = {
  billing: "bg-accent-yellow/15 text-accent-yellow",
  team: "bg-blue-500/10 text-blue-600",
  documents: "bg-emerald-500/10 text-emerald-600",
  reports: "bg-purple-500/10 text-purple-600",
  promo: "bg-gradient-to-br from-accent-yellow/20 to-orange-500/10 text-accent-yellow",
};

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  billing: CreditCard,
  team: Users,
  documents: FileText,
  reports: BarChart3,
  promo: Rocket,
};

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  message: string;
  icon: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  createdAt: string;
  synthetic: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dismissedSynthetic, setDismissedSynthetic] = useState<Set<string>>(
    new Set()
  );

  // Load dismissed synthetic IDs from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("agar_dismissed_notifications");
      if (raw) setDismissedSynthetic(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      // Subtract dismissed synthetic from unread count
      const dismissedCount = (data.items ?? []).filter(
        (i: NotificationItem) => i.synthetic && dismissedSynthetic.has(i.id)
      ).length;
      setUnreadCount(Math.max(0, (data.unreadCount ?? 0) - dismissedCount));
    } catch {}
    finally {
      setLoading(false);
    }
  }, [dismissedSynthetic]);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Re-fetch when popover opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Poll every 60s
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch on window focus
  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [fetchNotifications]);

  async function markAllRead() {
    // Mark DB notifications
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).catch(() => {});

    // Dismiss all synthetic
    const synIds = items.filter((i) => i.synthetic).map((i) => i.id);
    const newDismissed = new Set([...dismissedSynthetic, ...synIds]);
    setDismissedSynthetic(newDismissed);
    try {
      sessionStorage.setItem(
        "agar_dismissed_notifications",
        JSON.stringify([...newDismissed])
      );
    } catch {}

    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnreadCount(0);
  }

  async function markOneRead(id: string, synthetic: boolean) {
    if (synthetic) {
      const newDismissed = new Set([...dismissedSynthetic, id]);
      setDismissedSynthetic(newDismissed);
      try {
        sessionStorage.setItem(
          "agar_dismissed_notifications",
          JSON.stringify([...newDismissed])
        );
      } catch {}
    } else {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  // Filter out dismissed synthetic items for display
  const visibleItems = items.filter(
    (i) => !(i.synthetic && dismissedSynthetic.has(i.id))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border-subtle bg-surface p-0 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h3 className="text-[15px] font-semibold text-text-primary">
            Notifications
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading && visibleItems.length === 0 ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 rounded-xl px-2 py-3">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-border-subtle/60" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-border-subtle/60" />
                    <div className="h-2.5 w-full animate-pulse rounded bg-border-subtle/40" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-border-subtle/50">
                <Bell
                  className="h-5 w-5 text-text-meta"
                  strokeWidth={1.8}
                />
              </div>
              <p className="mt-3 text-[14px] font-medium text-text-primary">
                You&apos;re all caught up
              </p>
              <p className="mt-1 text-[12px] text-text-meta">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {visibleItems.map((item) => {
                const IconComp =
                  (item.icon ? ICON_MAP[item.icon] : null) ??
                  CATEGORY_ICONS[item.category] ??
                  Bell;
                const colorClass =
                  CATEGORY_COLORS[item.category] ?? "bg-black/5 text-text-meta";

                return (
                  <div
                    key={item.id}
                    className={`group flex gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] ${
                      !item.isRead ? "bg-accent-yellow/[0.03]" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                    >
                      <IconComp className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-[13px] font-medium leading-tight ${
                            item.isRead
                              ? "text-text-secondary"
                              : "text-text-primary"
                          }`}
                        >
                          {!item.isRead && (
                            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-error" />
                          )}
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-text-meta">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-text-meta line-clamp-2">
                        {item.message}
                      </p>
                      {item.actionUrl && item.actionLabel && (
                        <Link
                          href={item.actionUrl}
                          onClick={() => {
                            markOneRead(item.id, item.synthetic);
                            setOpen(false);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-text-primary/5 px-2.5 py-1 text-[11px] font-semibold text-text-primary transition-colors hover:bg-text-primary/10"
                        >
                          {item.actionLabel}
                        </Link>
                      )}
                    </div>

                    {/* Dismiss */}
                    {!item.isRead && (
                      <button
                        onClick={() => markOneRead(item.id, item.synthetic)}
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-meta opacity-0 transition-all hover:text-text-primary group-hover:opacity-100"
                        aria-label="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-subtle px-4 py-2.5">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <Settings className="h-3 w-3" />
            Notification Settings
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
