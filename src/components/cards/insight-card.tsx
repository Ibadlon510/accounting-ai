"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { toast } from "sonner";
import { InsightAreaChart } from "@/components/charts/insight-area-chart";
import { ComparisonMetric } from "@/components/data-display/comparison-metric";

const insights = [
  {
    text: "VAT filing deadline is approaching.",
    highlight: "Your output VAT exceeds input by AED 12,450",
    metric1: { value: "AED 92,367", label: "Output VAT" },
    metric2: { value: "AED 46,846", label: "Input VAT" },
    detail:
      "Based on Q1 2026 transactions, your net VAT payable is AED 45,521. Filing deadline is March 31, 2026.",
  },
  {
    text: "Revenue growth is strong this quarter.",
    highlight: "Sales increased 23% compared to last quarter",
    metric1: { value: "AED 340,000", label: "This Quarter" },
    metric2: { value: "AED 276,420", label: "Last Quarter" },
    detail:
      "Year-over-year revenue growth is 23%. Top contributor: consulting services at 45% of revenue.",
  },
  {
    text: "Accounts receivable needs attention.",
    highlight: "3 invoices overdue totaling AED 45,200",
    metric1: { value: "AED 45,200", label: "Overdue" },
    metric2: { value: "AED 120,800", label: "Outstanding" },
    detail:
      "3 invoices are past due. Oldest: INV-2026-012 (47 days overdue). Consider sending payment reminders.",
  },
];

export function InsightCard() {
  const [index, setIndex] = useState(0);
  const insight = insights[index]!;

  function goPrev() {
    setIndex((i) => (i - 1 + insights.length) % insights.length);
  }

  function goNext() {
    setIndex((i) => (i + 1) % insights.length);
  }

  function showDetail() {
    toast("Insight details", { description: insight.detail });
  }

  return (
    <div className="dashboard-card flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-text-secondary">Insight</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous insight"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next insight"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Insight text */}
      <p className="mt-4 text-[18px] leading-snug text-text-primary">
        {insight.text}{" "}
        <span className="font-bold">{insight.highlight}</span>
      </p>

      {/* Chart */}
      <div className="mt-4 flex-1">
        <InsightAreaChart />
      </div>

      {/* Comparison metrics */}
      <div className="mt-3 flex items-end justify-between">
        <ComparisonMetric value={insight.metric1.value} label={insight.metric1.label} />
        <ComparisonMetric value={insight.metric2.value} label={insight.metric2.label} />
      </div>

      {/* Info icon */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={showDetail}
          aria-label="Insight details"
          className="flex h-6 w-6 items-center justify-center rounded-full text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary"
        >
          <Info className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
