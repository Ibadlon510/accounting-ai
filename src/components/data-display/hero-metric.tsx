"use client";

import { cn } from "@/lib/utils";
import { TrendArrow } from "./trend-arrow";

interface HeroMetricProps {
  value: string;
  suffix?: string;
  trend?: "up" | "down";
  trendValue?: string;
  size?: "lg" | "xl";
  className?: string;
}

export function HeroMetric({
  value,
  suffix,
  trend,
  trendValue,
  size = "xl",
  className,
}: HeroMetricProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-extrabold leading-none tracking-tight text-text-primary",
          size === "xl" ? "text-[52px]" : "text-[40px]"
        )}
      >
        {value}
      </span>
      {suffix && (
        <span
          className={cn(
            "font-bold text-text-primary",
            size === "xl" ? "text-[28px]" : "text-[22px]"
          )}
        >
          {suffix}
        </span>
      )}
      {trend && <TrendArrow direction={trend} value={trendValue} />}
    </div>
  );
}
