"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PLAN_LIMITS: Record<string, number> = {
  FREELANCER: 50,
  BUSINESS: 300,
  ENTERPRISE: 1000,
};

export function TokenMeter() {
  const [balance, setBalance] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>("FREELANCER");

  useEffect(() => {
    fetch("/api/org/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setBalance(d.tokenBalance ?? null);
          setPlan(d.subscriptionPlan ?? "FREELANCER");
        }
      })
      .catch(() => {});
  }, []);

  if (balance === null) return null;

  const limit = PLAN_LIMITS[plan] ?? 50;
  const pct = Math.min(100, Math.round((balance / limit) * 100));
  const isLow = pct <= 20;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface/60 px-3 py-1.5 text-[12px] transition-all hover:bg-surface hover:shadow-sm"
        >
          <Coins className={`h-3.5 w-3.5 ${isLow ? "text-error" : "text-text-meta"}`} />
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border-subtle">
              <div
                className={`h-full rounded-full transition-all ${
                  isLow ? "bg-error" : "bg-success"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`font-semibold tabular-nums ${isLow ? "text-error" : "text-text-primary"}`}>
              {balance}
            </span>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[12px]">
        {balance} of {limit} AI tokens remaining ({plan})
      </TooltipContent>
    </Tooltip>
  );
}
