"use client";

import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BatchResult {
  total: number;
  highConfidence: number;
  needsReview: number;
  failed: number;
  totalSpend: number;
  topCategories: { name: string; count: number }[];
}

interface BatchReportProps {
  result: BatchResult;
  className?: string;
  onDismiss?: () => void;
}

export function BatchReport({ result, className, onDismiss }: BatchReportProps) {
  return (
    <div className={cn("dashboard-card border-l-4 border-l-[var(--accent-ai)]", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
          <h3 className="text-[14px] font-semibold text-text-primary">Batch Intelligence Report</h3>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-[12px] text-text-meta hover:text-text-primary">
            Dismiss
          </button>
        )}
      </div>

      <p className="text-[13px] text-text-secondary mb-3">
        Processed <span className="font-semibold text-text-primary">{result.total}</span> documents.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <div>
            <p className="text-[18px] font-bold text-success">{result.highConfidence}</p>
            <p className="text-[10px] text-text-meta">High confidence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <div>
            <p className="text-[18px] font-bold text-amber-600">{result.needsReview}</p>
            <p className="text-[10px] text-text-meta">Needs review</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2">
          <XCircle className="h-3.5 w-3.5 text-error" />
          <div>
            <p className="text-[18px] font-bold text-error">{result.failed}</p>
            <p className="text-[10px] text-text-meta">Failed</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-3">
        <div>
          <p className="text-[11px] text-text-meta">Total Spend</p>
          <p className="text-[16px] font-bold text-text-primary">AED {result.totalSpend.toLocaleString()}</p>
        </div>
        {result.topCategories.length > 0 && (
          <div className="text-right">
            <p className="text-[11px] text-text-meta">Top Categories</p>
            <p className="text-[12px] text-text-secondary">
              {result.topCategories.map((c) => `${c.name} (${c.count})`).join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
