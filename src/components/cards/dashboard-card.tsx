"use client";

import { cn } from "@/lib/utils";
import { FolderOpen, Settings, ArrowUpRight } from "lucide-react";
import { comingSoon } from "@/lib/utils/toast-helpers";

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  showActions?: boolean;
}

export function DashboardCard({
  children,
  className,
  showActions = true,
}: DashboardCardProps) {
  return (
    <div className={cn("dashboard-card relative", className)}>
      {showActions && <CardActions />}
      {children}
    </div>
  );
}

export function CardActions() {
  return (
    <div className="absolute right-6 top-6 flex items-center gap-1">
      <button onClick={() => comingSoon("Archive")} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary">
        <FolderOpen className="h-[16px] w-[16px]" strokeWidth={1.6} />
      </button>
      <button onClick={() => comingSoon("Card Settings")} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary">
        <Settings className="h-[16px] w-[16px]" strokeWidth={1.6} />
      </button>
      <button onClick={() => comingSoon("Expand")} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary">
        <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={1.6} />
      </button>
    </div>
  );
}
