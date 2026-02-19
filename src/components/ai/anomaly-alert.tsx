"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AnomalyItem {
  id: string;
  merchant: string;
  amount: number;
  avgAmount: number;
  multiplier: number;
  date: string;
}

interface AnomalyAlertProps {
  anomalies: AnomalyItem[];
  className?: string;
}

export function AnomalyAlert({ anomalies, className }: AnomalyAlertProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = anomalies.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="flex-1 text-[13px]">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Unusual expense detected
            </p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
              <span className="font-medium">{a.merchant}</span> — AED{" "}
              {a.amount.toLocaleString()} is{" "}
              <span className="font-bold">{a.multiplier}x</span> higher than your
              average (AED {a.avgAmount.toLocaleString()}) on {a.date}.
            </p>
          </div>
          <button
            onClick={() => setDismissed((s) => new Set(s).add(a.id))}
            className="mt-0.5 shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-200/50 hover:text-amber-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
