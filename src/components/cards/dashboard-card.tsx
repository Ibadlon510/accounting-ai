"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FolderOpen, Settings, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  showActions?: boolean;
}

interface CardActionsProps {
  onArchive?: () => void;
  onExpandToggle?: () => void;
  expanded?: boolean;
}

export function DashboardCard({
  children,
  className,
  showActions = true,
}: DashboardCardProps) {
  const [archived, setArchived] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (archived) {
    return null;
  }

  return (
    <div
      className={cn(
        "dashboard-card relative",
        expanded && "shadow-lg ring-2 ring-text-primary/10",
        className,
      )}
    >
      {showActions && (
        <CardActions
          expanded={expanded}
          onArchive={() => {
            setArchived(true);
            toast("Card archived");
          }}
          onExpandToggle={() => setExpanded((v) => !v)}
        />
      )}
      {children}
    </div>
  );
}

export function CardActions({
  onArchive = () => {},
  onExpandToggle = () => {},
  expanded = false,
}: CardActionsProps = {}) {
  return (
    <div className="absolute right-6 top-6 flex items-center gap-1">
      <button
        type="button"
        onClick={onArchive}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary"
      >
        <FolderOpen className="h-[16px] w-[16px]" strokeWidth={1.6} />
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary"
          >
            <Settings className="h-[16px] w-[16px]" strokeWidth={1.6} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Card Settings</TooltipContent>
      </Tooltip>
      <button
        type="button"
        onClick={onExpandToggle}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary",
          expanded && "text-text-primary",
        )}
      >
        <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={1.6} />
      </button>
    </div>
  );
}
