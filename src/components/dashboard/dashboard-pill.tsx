"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { DashboardVariant } from "@/hooks/use-dashboard-pill-preferences";

function pathToVariant(pathname: string): DashboardVariant | null {
  if (pathname.startsWith("/sales")) return "sales";
  if (pathname.startsWith("/purchases")) return "purchases";
  if (pathname.startsWith("/documents")) return "documents";
  if (pathname.startsWith("/inventory")) return "inventory";
  if (pathname.startsWith("/banking")) return "banking";
  return null;
}

const dashboardPaths: Record<string, string> = {
  sales: "/sales",
  purchases: "/purchases",
  documents: "/documents",
  inventory: "/inventory",
  banking: "/banking",
};

export function DashboardPill() {
  const pathname = usePathname();
  const variant = pathToVariant(pathname);

  if (!variant) return null;

  const href = dashboardPaths[variant];
  const isOnDashboardPage = pathname === href;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
        isOnDashboardPage
          ? "bg-text-primary text-white"
          : "bg-muted/60 text-text-secondary hover:bg-muted hover:text-text-primary"
      }`}
    >
      <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2} />
      Dashboard
    </Link>
  );
}
