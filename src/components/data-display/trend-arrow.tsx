"use client";

import { cn } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";

interface TrendArrowProps {
  direction: "up" | "down";
  value?: string;
  className?: string;
}

export function TrendArrow({ direction, value, className }: TrendArrowProps) {
  const isUp = direction === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[13px] font-semibold",
        isUp ? "text-success" : "text-error",
        className
      )}
    >
      <svg
        viewBox="0 0 10 8"
        fill="currentColor"
        className={cn("h-2.5 w-2.5", !isUp && "rotate-180")}
      >
        <polygon points="5,0 10,8 0,8" />
      </svg>
      {value && <span>{value}</span>}
    </span>
  );
}
