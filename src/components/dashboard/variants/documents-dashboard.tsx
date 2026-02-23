"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip,
  Legend,
} from "recharts";
import { CheckCircle, Sparkles, Clock, FileText, FolderOpen } from "lucide-react";
import { DashboardWidget } from "../dashboard-widget";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  axisProps, xAxisTickStyle, yAxisTickStyle, gridProps,
  chartColors,
} from "@/components/charts/chart-utils";
import { cn } from "@/lib/utils";
import type { DocumentsMiniStats } from "@/lib/dashboard/mini-stats-types";

interface Props {
  mini: DocumentsMiniStats;
  isVisible: (id: string) => boolean;
  layout?: "popover" | "page";
}

// ── Popover-mode compact styles ──────────────────────────────────────
const S = "space-y-1";
const M = "text-[11px] text-muted-foreground";
const V = "text-[14px] font-semibold text-text-primary";

// ── Widget title helper ──────────────────────────────────────────────
function WidgetTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <p className="text-[13px] font-semibold text-text-primary">{title}</p>
      {subtitle && <p className="text-[11px] text-text-meta">{subtitle}</p>}
    </div>
  );
}

// ── Status badge for documents ───────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-muted text-text-secondary",
    PROCESSED: "bg-success/10 text-success",
    FLAGGED: "bg-accent-yellow/20 text-amber-700",
    PROCESSING_FAILED: "bg-error/10 text-error",
    ARCHIVED: "bg-muted text-text-meta",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending",
    PROCESSED: "Verified",
    FLAGGED: "Flagged",
    PROCESSING_FAILED: "Failed",
    ARCHIVED: "Archived",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", styles[status] ?? styles.PENDING)}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Empty state ──────────────────────────────────────────────────────
function EmptyWidget({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function DocumentsDashboard({ mini, isVisible, layout = "popover" }: Props) {
  const isPage = layout === "page";
  const colors = useMemo(() => chartColors(), []);
  const pieColors = [colors.chart1, colors.chart4, colors.chart3, colors.chart2, colors.chart5];

  const gridClass = isPage ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "";
  const fullSpanClass = isPage ? "md:col-span-2 xl:col-span-3" : undefined;

  const barH = isPage ? 220 : 140;
  const pieH = isPage ? 200 : 120;
  const pieRadius = isPage ? 70 : 45;

  const content = (
    <>
      {/* ── Metrics Row (4 KPIs with dividers) ──────────────────── */}
      <DashboardWidget
        widgetId="metricsRow"
        visible={isVisible("metricsRow")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
            {[
              { label: "Pending", value: String(mini.pendingCount ?? 0), color: "text-accent-yellow" },
              { label: "Verified", value: String(mini.verifiedCount ?? 0), color: "text-success" },
              { label: "Flagged", value: String(mini.flaggedCount ?? 0), color: "text-error" },
              { label: "Total", value: String(mini.totalCount ?? 0), color: "text-text-primary" },
            ].map((m) => (
              <div key={m.label} className="px-4 py-2 first:pl-0 last:pr-0">
                <p className="text-[12px] font-medium text-text-meta uppercase tracking-wide">{m.label}</p>
                <p className={cn("text-[20px] font-bold mt-0.5", m.color)}>{m.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <div className={S}><p className={M}>Pending</p><p className={V}>{mini.pendingCount ?? 0}</p></div>
            <div className={S}><p className={M}>Verified</p><p className={V}>{mini.verifiedCount ?? 0}</p></div>
            <div className={S}><p className={M}>Flagged</p><p className={V}>{mini.flaggedCount ?? 0}</p></div>
            <div className={S}><p className={M}>Total</p><p className={V}>{mini.totalCount ?? 0}</p></div>
          </div>
        )}
      </DashboardWidget>

      {/* ── Mini Metrics (grouped in one card) ──────────────────── */}
      <DashboardWidget
        widgetId="successRate"
        visible={isVisible("successRate") || isVisible("avgConfidence") || isVisible("oldestPending")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            {isVisible("successRate") && (
              <div className="flex items-center gap-3 px-4 py-2 first:pl-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Success rate</p>
                  <p className="text-[18px] font-bold text-text-primary">{(mini.successRate ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            )}
            {isVisible("avgConfidence") && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
                  <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Avg AI confidence</p>
                  <p className="text-[18px] font-bold text-text-primary">{Math.round((mini.avgConfidence ?? 0) * 100)}%</p>
                </div>
              </div>
            )}
            {isVisible("oldestPending") && (
              <div className="flex items-center gap-3 px-4 py-2 last:pr-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-yellow/10 shrink-0">
                  <Clock className="h-4 w-4 text-accent-yellow" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Oldest pending</p>
                  <p className="text-[18px] font-bold text-text-primary">{mini.oldestPendingDays ?? 0} days</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {isVisible("successRate") && (
              <div className={S}><p className={M}>Success rate</p><p className={V}>{(mini.successRate ?? 0).toFixed(1)}%</p></div>
            )}
            {isVisible("avgConfidence") && (
              <div className={S}><p className={M}>Avg AI confidence</p><p className={V}>{Math.round((mini.avgConfidence ?? 0) * 100)}%</p></div>
            )}
            {isVisible("oldestPending") && (
              <div className={S}><p className={M}>Oldest pending (days)</p><p className={V}>{mini.oldestPendingDays ?? 0}</p></div>
            )}
          </div>
        )}
      </DashboardWidget>

      {/* ── Bar Chart — Processed per Month ─────────────────────── */}
      <DashboardWidget widgetId="barChart" visible={isVisible("barChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Documents Processed" subtitle="Per month" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Processed per month</p>
        )}
        {(mini.monthlyProcessed ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No processing data yet" />
        ) : (
          <div style={{ height: barH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mini.monthlyProcessed ?? []} barGap={2}>
                {isPage && <CartesianGrid {...gridProps} />}
                <XAxis dataKey="month" {...axisProps} tick={xAxisTickStyle} dy={8} />
                {isPage && (
                  <YAxis {...axisProps} tick={yAxisTickStyle} dx={-4} />
                )}
                {!isPage && <YAxis hide />}
                <Tooltip
                  content={<ChartTooltip formatter={(v) => `${v} docs`} />}
                  cursor={{ fill: "var(--border-subtle)", opacity: 0.3 }}
                />
                <Bar dataKey="processed" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Stacked Bar — Processed vs Failed ───────────────────── */}
      <DashboardWidget widgetId="processingByMonth" visible={isVisible("processingByMonth")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Processed vs Failed" subtitle="Monthly comparison" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Processed vs failed</p>
        )}
        {(mini.processingByMonth ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No processing data yet" />
        ) : (
          <div style={{ height: barH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mini.processingByMonth ?? []} barGap={2}>
                {isPage && <CartesianGrid {...gridProps} />}
                <XAxis dataKey="month" {...axisProps} tick={xAxisTickStyle} dy={8} />
                {isPage && (
                  <YAxis {...axisProps} tick={yAxisTickStyle} dx={-4} />
                )}
                {!isPage && <YAxis hide />}
                <Tooltip
                  content={<ChartTooltip formatter={(v) => `${v} docs`} />}
                  cursor={{ fill: "var(--border-subtle)", opacity: 0.3 }}
                />
                <Bar dataKey="processed" fill="var(--success)" radius={[4, 4, 0, 0]} stackId="a" maxBarSize={24} />
                <Bar dataKey="failed" fill="var(--error)" radius={[4, 4, 0, 0]} stackId="a" maxBarSize={24} />
                {isPage && (
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-[12px] text-text-secondary capitalize">{value}</span>
                    )}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Pie Chart — Status Breakdown ─────────────────────────── */}
      <DashboardWidget widgetId="pieChart" visible={isVisible("pieChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Document Status" subtitle="By count" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
        )}
        {(mini.statusBreakdown ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No status data yet" />
        ) : (
          <div style={{ height: pieH }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(mini.statusBreakdown ?? []).map((d, i) => ({
                    name: d.status,
                    value: d.count,
                    fill: pieColors[i % pieColors.length],
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx={isPage ? "40%" : "50%"}
                  cy="50%"
                  outerRadius={pieRadius}
                  innerRadius={isPage ? pieRadius - 20 : 0}
                  paddingAngle={isPage ? 2 : 0}
                  strokeWidth={0}
                >
                  {(mini.statusBreakdown ?? []).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} docs`} />} />
                {isPage && (
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-[12px] text-text-secondary">{value}</span>
                    )}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Pie Chart — By Type ──────────────────────────────────── */}
      <DashboardWidget widgetId="documentsByType" visible={isVisible("documentsByType")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="By Document Type" subtitle="Distribution" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">By type</p>
        )}
        {(mini.documentsByType ?? []).length === 0 ? (
          <EmptyWidget icon={FolderOpen} message="No type data yet" />
        ) : (
          <div style={{ height: pieH }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(mini.documentsByType ?? []).map((d, i) => ({
                    name: d.type,
                    value: d.count,
                    fill: pieColors[i % pieColors.length],
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx={isPage ? "40%" : "50%"}
                  cy="50%"
                  outerRadius={pieRadius}
                  innerRadius={isPage ? pieRadius - 20 : 0}
                  paddingAngle={isPage ? 2 : 0}
                  strokeWidth={0}
                >
                  {(mini.documentsByType ?? []).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} docs`} />} />
                {isPage && (
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-[12px] text-text-secondary">{value}</span>
                    )}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Recent Documents (table, full-width on page) ─────────── */}
      <DashboardWidget
        widgetId="recentDocuments"
        visible={isVisible("recentDocuments")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? <WidgetTitle title="Recent Documents" subtitle="Latest uploads" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent documents</p>
        )}
        {(mini.recentDocuments ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No documents yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.recentDocuments ?? []).slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
                  <FileText className="h-4 w-4 text-[var(--accent-ai)]" />
                </div>
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate font-mono text-[12px]">{d.fileName}</p>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.recentDocuments ?? []).slice(0, 5).map((d) => (
              <div key={d.id} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{d.fileName}</span>
                <span className="text-muted-foreground">{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardWidget>
    </>
  );

  if (isPage) return <div className={gridClass}>{content}</div>;
  return content;
}
