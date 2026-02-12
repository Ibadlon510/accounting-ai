"use client";

import { cn } from "@/lib/utils";

interface ComparisonMetricProps {
  label: string;
  value: string;
  className?: string;
}

export function ComparisonMetric({ label, value, className }: ComparisonMetricProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-[22px] font-bold tracking-tight text-text-primary">
        {value}
      </span>
      <span className="text-[12px] text-text-meta">{label}</span>
    </div>
  );
}
