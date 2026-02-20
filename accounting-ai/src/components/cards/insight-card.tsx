"use client";

import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { InsightAreaChart } from "@/components/charts/insight-area-chart";
import { ComparisonMetric } from "@/components/data-display/comparison-metric";
import { comingSoon } from "@/lib/utils/toast-helpers";

export function InsightCard() {
  return (
    <div className="dashboard-card flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-text-secondary">Insight</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => comingSoon("Previous Insight")} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <button onClick={() => comingSoon("Next Insight")} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary">
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Insight text */}
      <p className="mt-4 text-[18px] leading-snug text-text-primary">
        VAT filing deadline is approaching.{" "}
        <span className="font-bold">Your output VAT exceeds input by AED 12,450</span>
      </p>

      {/* Chart */}
      <div className="mt-4 flex-1">
        <InsightAreaChart />
      </div>

      {/* Comparison metrics */}
      <div className="mt-3 flex items-end justify-between">
        <ComparisonMetric value="AED 92,367" label="Output VAT" />
        <ComparisonMetric value="AED 46,846" label="Input VAT" />
      </div>

      {/* Info icon */}
      <div className="mt-2 flex justify-end">
        <button onClick={() => comingSoon("Insight Details")} className="flex h-6 w-6 items-center justify-center rounded-full text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary">
          <Info className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
