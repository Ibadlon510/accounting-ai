"use client";

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("dashboard-card animate-pulse", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-border-subtle/60" />
        <div className="h-4 w-12 rounded-lg bg-border-subtle/60" />
      </div>
      <div className="h-4 w-24 rounded-lg bg-border-subtle/60 mb-2" />
      <div className="h-7 w-32 rounded-lg bg-border-subtle/40" />
    </div>
  );
}

interface SkeletonRowProps {
  cols?: number;
  className?: string;
}

export function SkeletonRow({ cols = 5, className }: SkeletonRowProps) {
  return (
    <div className={cn("flex items-center gap-4 px-6 py-3.5 animate-pulse", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-border-subtle/50"
          style={{ width: `${20 + Math.random() * 60}%`, flex: i === 1 ? 2 : 1 }}
        />
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, cols = 5, className }: SkeletonTableProps) {
  return (
    <div className={cn("dashboard-card overflow-hidden !p-0", className)}>
      <div className="flex items-center gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-border-subtle/40 animate-pulse" style={{ flex: i === 1 ? 2 : 1 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border-subtle/50">
          <SkeletonRow cols={cols} />
        </div>
      ))}
    </div>
  );
}
