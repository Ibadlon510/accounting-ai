"use client";

import { formatCurrency } from "./chart-utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name?: string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  /** Override the value formatter (defaults to AED currency) */
  formatter?: (value: number, dataKey: string) => string;
  /** Override the label displayed at the top */
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const displayLabel = labelFormatter ? labelFormatter(label ?? "") : label;

  return (
    <div className="glass-dark rounded-xl px-3.5 py-2.5 text-white shadow-lg min-w-[120px]">
      {displayLabel && (
        <p className="text-[11px] font-medium text-white/60 mb-1.5">
          {displayLabel}
        </p>
      )}
      {payload.map((entry, i) => {
        const formattedValue = formatter
          ? formatter(entry.value ?? 0, entry.dataKey)
          : formatCurrency(entry.value ?? 0);
        return (
          <div key={`${entry.dataKey}-${i}`} className="flex items-center gap-2">
            {entry.color && (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-[13px] font-semibold">{formattedValue}</span>
            {entry.name && payload.length > 1 && (
              <span className="text-[11px] text-white/50">{entry.name}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
