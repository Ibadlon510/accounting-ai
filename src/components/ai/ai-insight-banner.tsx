"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiInsightBannerProps {
  message: string;
  detail?: string;
  className?: string;
}

export function AiInsightBanner({ message, detail, className }: AiInsightBannerProps) {
  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-3 rounded-2xl border border-[var(--accent-ai)]/20 bg-[var(--accent-ai)]/5 px-5 py-4",
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
        <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-text-primary">{message}</p>
        {detail && (
          <p className="mt-0.5 text-[12px] text-text-secondary">{detail}</p>
        )}
      </div>
    </div>
  );
}
