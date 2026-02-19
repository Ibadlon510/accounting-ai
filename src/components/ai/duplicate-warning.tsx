"use client";

import { Copy, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface DuplicateMatch {
  id: string;
  existingDocId: string;
  merchant: string;
  amount: number;
  existingDate: string;
  newDate: string;
  similarity: number;
}

interface DuplicateWarningProps {
  duplicates: DuplicateMatch[];
  className?: string;
}

export function DuplicateWarning({ duplicates, className }: DuplicateWarningProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = duplicates.filter((d) => !dismissed.has(d.id));
  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {visible.map((d) => (
        <div
          key={d.id}
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 dark:border-red-800 dark:bg-red-950/30"
        >
          <Copy className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1 text-[13px]">
            <p className="font-semibold text-red-700 dark:text-red-300">
              Possible duplicate ({Math.round(d.similarity * 100)}% match)
            </p>
            <p className="mt-0.5 text-red-600 dark:text-red-400">
              <span className="font-medium">{d.merchant}</span> — AED{" "}
              {d.amount.toLocaleString()} matches a document uploaded on{" "}
              {d.existingDate}.
            </p>
          </div>
          <button
            onClick={() => setDismissed((s) => new Set(s).add(d.id))}
            className="mt-0.5 shrink-0 rounded p-0.5 text-red-400 hover:bg-red-200/50 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
