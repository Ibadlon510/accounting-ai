"use client";

import { cn } from "@/lib/utils";

interface LegendItem {
  label: string;
  color: string;
}

interface LegendDotsProps {
  items: LegendItem[];
  className?: string;
}

export function LegendDots({ items, className }: LegendDotsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[12px] text-text-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
