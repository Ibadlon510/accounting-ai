"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, Percent, CalendarClock, Users, FileText, FolderOpen } from "lucide-react";
import { DashboardWidget } from "../dashboard-widget";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  axisProps, xAxisTickStyle, yAxisTickStyle, gridProps,
  formatCurrency, formatCompactCurrency, chartColors,
} from "@/components/charts/chart-utils";
import { cn } from "@/lib/utils";
import type { PurchasesMiniStats, DashboardStats } from "@/lib/dashboard/mini-stats-types";

interface Props {
  mini: PurchasesMiniStats;
  stats: DashboardStats | undefined;
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

// ── Rank badge ───────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
        isTop3 ? "bg-error/10 text-error" : "bg-muted text-text-meta"
      )}
    >
      {rank}
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

export function PurchasesDashboard({ mini, stats, isVisible, layout = "popover" }: Props) {
  const isPage = layout === "page";
  const colors = useMemo(() => chartColors(), []);
  const pieColors = [colors.chart1, colors.chart4, colors.chart3, colors.chart2, colors.chart5];

  const gridClass = isPage ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "";
  const fullSpanClass = isPage ? "md:col-span-2 xl:col-span-3" : undefined;

  const barH = isPage ? 220 : 140;
  const pieH = isPage ? 200 : 140;
  const pieRadius = isPage ? 70 : 50;

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
              { label: "Expenses", value: formatCurrency(stats?.purchases?.totalExpenses ?? 0), color: "text-error" },
              { label: "Outstanding", value: formatCurrency(stats?.purchases?.totalOutstanding ?? 0), color: "text-accent-yellow" },
              { label: "Paid", value: formatCurrency(stats?.purchases?.totalPaid ?? 0), color: "text-success" },
              { label: "Bills", value: String(stats?.purchases?.billCount ?? 0), color: "text-text-primary" },
            ].map((m) => (
              <div key={m.label} className="px-4 py-2 first:pl-0 last:pr-0">
                <p className="text-[12px] font-medium text-text-meta uppercase tracking-wide">{m.label}</p>
                <p className={cn("text-[20px] font-bold mt-0.5", m.color)}>{m.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <div className={S}><p className={M}>Expenses</p><p className={V}>{formatCurrency(stats?.purchases?.totalExpenses ?? 0)}</p></div>
            <div className={S}><p className={M}>Outstanding</p><p className={V}>{formatCurrency(stats?.purchases?.totalOutstanding ?? 0)}</p></div>
            <div className={S}><p className={M}>Paid</p><p className={V}>{formatCurrency(stats?.purchases?.totalPaid ?? 0)}</p></div>
            <div className={S}><p className={M}>Bills</p><p className={V}>{stats?.purchases?.billCount ?? 0}</p></div>
          </div>
        )}
      </DashboardWidget>

      {/* ── Mini Metrics (grouped in one card) ──────────────────── */}
      <DashboardWidget
        widgetId="avgBillValue"
        visible={isVisible("avgBillValue") || isVisible("paymentRate") || isVisible("upcomingPayables") || isVisible("supplierCountTrend")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            {isVisible("avgBillValue") && (
              <div className="flex items-center gap-3 px-4 py-2 first:pl-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10 shrink-0">
                  <TrendingUp className="h-4 w-4 text-error" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Avg per bill</p>
                  <p className="text-[18px] font-bold text-text-primary">{formatCurrency(mini.avgBillValue ?? 0)}</p>
                </div>
              </div>
            )}
            {isVisible("paymentRate") && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
                  <Percent className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Payment rate</p>
                  <p className="text-[18px] font-bold text-text-primary">{(mini.paymentRate ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            )}
            {isVisible("upcomingPayables") && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-yellow/10 shrink-0">
                  <CalendarClock className="h-4 w-4 text-accent-yellow" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Due 7d / 30d</p>
                  <p className="text-[16px] font-bold text-text-primary">
                    {formatCompactCurrency(mini.upcomingPayables7d ?? 0)} / {formatCompactCurrency(mini.upcomingPayables30d ?? 0)}
                  </p>
                </div>
              </div>
            )}
            {isVisible("supplierCountTrend") && (
              <div className="flex items-center gap-3 px-4 py-2 last:pr-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
                  <Users className="h-4 w-4 text-[var(--accent-ai)]" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Active suppliers</p>
                  <p className="text-[18px] font-bold text-text-primary">{mini.supplierCountTrend ?? 0}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {isVisible("avgBillValue") && (
              <div className={S}><p className={M}>Avg per bill</p><p className={V}>{formatCurrency(mini.avgBillValue ?? 0)}</p></div>
            )}
            {isVisible("paymentRate") && (
              <div className={S}><p className={M}>Payment rate</p><p className={V}>{(mini.paymentRate ?? 0).toFixed(1)}%</p></div>
            )}
            {isVisible("upcomingPayables") && (
              <div className={S}>
                <p className={M}>Due in 7d / 30d</p>
                <p className={V}>{formatCurrency(mini.upcomingPayables7d ?? 0)} / {formatCurrency(mini.upcomingPayables30d ?? 0)}</p>
              </div>
            )}
            {isVisible("supplierCountTrend") && (
              <div className={S}><p className={M}>Active suppliers</p><p className={V}>{mini.supplierCountTrend ?? 0}</p></div>
            )}
          </div>
        )}
      </DashboardWidget>

      {/* ── Bar Chart — Monthly Expenses ────────────────────────── */}
      <DashboardWidget widgetId="barChart" visible={isVisible("barChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Monthly Expenses" subtitle="Last 12 months" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Monthly expenses</p>
        )}
        {(mini.monthlyExpenses ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No expense data yet" />
        ) : (
          <div style={{ height: barH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mini.monthlyExpenses ?? []} barGap={2}>
                {isPage && <CartesianGrid {...gridProps} />}
                <XAxis dataKey="month" {...axisProps} tick={xAxisTickStyle} dy={8} />
                {isPage && (
                  <YAxis {...axisProps} tick={yAxisTickStyle} tickFormatter={formatCompactCurrency} dx={-4} />
                )}
                {!isPage && <YAxis hide />}
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--border-subtle)", opacity: 0.3 }}
                />
                <Bar dataKey="expenses" fill="var(--error)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Pie Chart — Bill Status ─────────────────────────────── */}
      <DashboardWidget widgetId="pieChart" visible={isVisible("pieChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Bill Status" subtitle="By amount" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Bill status</p>
        )}
        {(mini.statusBreakdown ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No bill data yet" />
        ) : (
          <div style={{ height: pieH }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(mini.statusBreakdown ?? []).map((d, i) => ({
                    name: d.status,
                    value: d.amount,
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
                <Tooltip content={<ChartTooltip />} />
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

      {/* ── Top Expense Categories (ranked) ─────────────────────── */}
      <DashboardWidget widgetId="topExpenseCategories" visible={isVisible("topExpenseCategories")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Top Expense Categories" subtitle="By total spend" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Top expense categories</p>
        )}
        {(mini.topExpenseCategories ?? []).length === 0 ? (
          <EmptyWidget icon={FolderOpen} message="No expense categories yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.topExpenseCategories ?? []).slice(0, 5).map((e, i) => (
              <div
                key={e.name}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <RankBadge rank={i + 1} />
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{e.name}</p>
                <span className="text-[13px] font-semibold font-mono text-error shrink-0">
                  {formatCurrency(e.total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.topExpenseCategories ?? []).slice(0, 5).map((e) => (
              <div key={e.name} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{e.name}</span>
                <span className="font-medium">{formatCurrency(e.total)}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardWidget>

      {/* ── Top Suppliers (ranked, full-width on page) ──────────── */}
      <DashboardWidget
        widgetId="topSuppliers"
        visible={isVisible("topSuppliers")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? <WidgetTitle title="Top Suppliers" subtitle="By total purchases" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Top suppliers</p>
        )}
        {(mini.topSuppliers ?? []).length === 0 ? (
          <EmptyWidget icon={Users} message="No supplier data yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.topSuppliers ?? []).slice(0, 5).map((s, i) => (
              <div
                key={s.name}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <RankBadge rank={i + 1} />
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{s.name}</p>
                <span className="text-[13px] font-semibold font-mono text-error shrink-0">
                  {formatCurrency(s.total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.topSuppliers ?? []).slice(0, 5).map((s) => (
              <div key={s.name} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{s.name}</span>
                <span className="font-medium">{formatCurrency(s.total)}</span>
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
