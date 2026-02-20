"use client";

import { DashboardCard } from "./dashboard-card";
import { HeroMetric } from "@/components/data-display/hero-metric";
import { LegendDots } from "@/components/data-display/legend-dots";

interface MetricCardProps {
  title: string;
  subtitle: string;
  metricValue: string;
  metricSuffix?: string;
  trend?: "up" | "down";
  trendValue?: string;
  lastUpdate?: string;
  legendItems?: { label: string; color: string }[];
  children?: React.ReactNode;
  subMetric?: React.ReactNode;
  metricSize?: "lg" | "xl";
}

export function MetricCard({
  title,
  subtitle,
  metricValue,
  metricSuffix,
  trend,
  trendValue,
  lastUpdate,
  legendItems,
  children,
  subMetric,
  metricSize = "xl",
}: MetricCardProps) {
  return (
    <DashboardCard>
      <div className="flex flex-col">
        {/* Title row */}
        <div className="flex items-start justify-between pr-28">
          <div>
            <h3 className="text-[16px] font-semibold text-text-primary">{title}</h3>
            <p className="mt-0.5 text-[12px] text-text-meta">{subtitle}</p>
          </div>
        </div>

        {/* Metric + Meta row */}
        <div className="mt-5 flex items-end justify-between">
          <div>
            {lastUpdate && (
              <p className="mb-2 text-[11px] text-text-meta">
                Last update
                <br />
                {lastUpdate}
              </p>
            )}
            <HeroMetric
              value={metricValue}
              suffix={metricSuffix}
              trend={trend}
              trendValue={trendValue}
              size={metricSize}
            />
          </div>
          {legendItems && <LegendDots items={legendItems} />}
        </div>

        {/* Chart area */}
        {children && <div className="mt-4">{children}</div>}

        {/* Sub-metric */}
        {subMetric && <div className="mt-3">{subMetric}</div>}
      </div>
    </DashboardCard>
  );
}
