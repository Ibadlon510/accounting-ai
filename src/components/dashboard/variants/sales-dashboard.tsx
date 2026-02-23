"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, Percent, BarChart2, Users, Package, FileText } from "lucide-react";
import { DashboardWidget } from "../dashboard-widget";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  axisProps, xAxisTickStyle, yAxisTickStyle, gridProps,
  formatCurrency, formatCompactCurrency, formatShortDate, chartColors,
} from "@/components/charts/chart-utils";
import { cn } from "@/lib/utils";
import type { SalesMiniStats, DashboardStats } from "@/lib/dashboard/mini-stats-types";

interface Props {
  mini: SalesMiniStats;
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

// ── Rank badge (for top lists) ───────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
        isTop3 ? "bg-success/10 text-success" : "bg-muted text-text-meta"
      )}
    >
      {rank}
    </span>
  );
}

// ── Empty state for widgets ──────────────────────────────────────────
function EmptyWidget({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function SalesDashboard({ mini, stats, isVisible, layout = "popover" }: Props) {
  const isPage = layout === "page";
  const colors = useMemo(() => chartColors(), []);

  // Semantic colors array for pie chart cells
  const pieColors = [colors.chart1, colors.chart4, colors.chart3, colors.chart2, colors.chart5];

  // ── Grid classes ─────────────────────────────────────────────────
  const gridClass = isPage
    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    : "";
  const fullSpanClass = isPage ? "md:col-span-2 xl:col-span-3" : undefined;

  // ── Chart heights ────────────────────────────────────────────────
  const barH = isPage ? 220 : 140;
  const areaH = isPage ? 200 : 120;
  const pieH = isPage ? 200 : 140;
  const scatterH = isPage ? 180 : 120;
  const pieRadius = isPage ? 70 : 50;

  const content = (
    <>
      {/* ── Metrics Row (4 KPIs in one card with dividers) ──────── */}
      <DashboardWidget
        widgetId="metricsRow"
        visible={isVisible("metricsRow")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
            {[
              { label: "Revenue", value: formatCurrency(stats?.sales?.totalRevenue ?? 0), color: "text-success" },
              { label: "Outstanding", value: formatCurrency(stats?.sales?.totalOutstanding ?? 0), color: "text-accent-yellow" },
              { label: "Overdue", value: formatCurrency(stats?.sales?.overdueAmount ?? 0), color: "text-error" },
              { label: "Invoices", value: String(stats?.sales?.invoiceCount ?? 0), color: "text-text-primary" },
            ].map((m) => (
              <div key={m.label} className="px-4 py-2 first:pl-0 last:pr-0">
                <p className="text-[12px] font-medium text-text-meta uppercase tracking-wide">{m.label}</p>
                <p className={cn("text-[20px] font-bold mt-0.5", m.color)}>{m.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <div className={S}><p className={M}>Revenue</p><p className={V}>{formatCurrency(stats?.sales?.totalRevenue ?? 0)}</p></div>
            <div className={S}><p className={M}>Outstanding</p><p className={V}>{formatCurrency(stats?.sales?.totalOutstanding ?? 0)}</p></div>
            <div className={S}><p className={M}>Overdue</p><p className={V}>{formatCurrency(stats?.sales?.overdueAmount ?? 0)}</p></div>
            <div className={S}><p className={M}>Invoices</p><p className={V}>{stats?.sales?.invoiceCount ?? 0}</p></div>
          </div>
        )}
      </DashboardWidget>

      {/* ── Mini Metrics (grouped in one card with 3 cols) ──────── */}
      <DashboardWidget
        widgetId="avgInvoiceValue"
        visible={isVisible("avgInvoiceValue") || isVisible("collectionRate") || isVisible("yoyGrowth")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            {isVisible("avgInvoiceValue") && (
              <div className="flex items-center gap-3 px-4 py-2 first:pl-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Avg per invoice</p>
                  <p className="text-[18px] font-bold text-text-primary">{formatCurrency(mini.avgInvoiceValue ?? 0)}</p>
                </div>
              </div>
            )}
            {isVisible("collectionRate") && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
                  <Percent className="h-4 w-4 text-[var(--accent-ai)]" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Collection rate</p>
                  <p className="text-[18px] font-bold text-text-primary">{(mini.collectionRate ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            )}
            {isVisible("yoyGrowth") && (
              <div className="flex items-center gap-3 px-4 py-2 last:pr-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                  <BarChart2 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">YoY growth</p>
                  <p className={cn("text-[18px] font-bold", (mini.yoyGrowth ?? 0) >= 0 ? "text-success" : "text-error")}>
                    {(mini.yoyGrowth ?? 0) >= 0 ? "+" : ""}{(mini.yoyGrowth ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {isVisible("avgInvoiceValue") && (
              <div className={S}><p className={M}>Avg per invoice</p><p className={V}>{formatCurrency(mini.avgInvoiceValue ?? 0)}</p></div>
            )}
            {isVisible("collectionRate") && (
              <div className={S}><p className={M}>Collection rate</p><p className={V}>{(mini.collectionRate ?? 0).toFixed(1)}%</p></div>
            )}
            {isVisible("yoyGrowth") && (
              <div className={S}><p className={M}>YoY growth</p><p className={cn(V, (mini.yoyGrowth ?? 0) >= 0 ? "text-green-600" : "text-red-600")}>{(mini.yoyGrowth ?? 0).toFixed(1)}%</p></div>
            )}
          </div>
        )}
      </DashboardWidget>

      {/* ── Bar Chart — Monthly Revenue ─────────────────────────── */}
      <DashboardWidget widgetId="barChart" visible={isVisible("barChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Monthly Revenue" subtitle="Last 12 months" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Monthly revenue</p>
        )}
        {(mini.monthlyRevenue ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No revenue data yet" />
        ) : (
          <div style={{ height: barH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mini.monthlyRevenue ?? []} barGap={2}>
                {isPage && <CartesianGrid {...gridProps} />}
                <XAxis dataKey="month" {...axisProps} tick={xAxisTickStyle} dy={8} />
                {isPage && (
                  <YAxis
                    {...axisProps}
                    tick={yAxisTickStyle}
                    tickFormatter={formatCompactCurrency}
                    dx={-4}
                  />
                )}
                {!isPage && <YAxis hide />}
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--border-subtle)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--success)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Area Chart — Revenue Trend ──────────────────────────── */}
      <DashboardWidget widgetId="revenueTrend" visible={isVisible("revenueTrend")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Revenue Trend" subtitle="Cumulative" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Revenue trend</p>
        )}
        {(mini.revenueTrend ?? []).length === 0 ? (
          <EmptyWidget icon={TrendingUp} message="No trend data yet" />
        ) : (
          <div style={{ height: areaH }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mini.revenueTrend ?? []}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {isPage && <CartesianGrid {...gridProps} />}
                <XAxis dataKey="month" {...axisProps} tick={xAxisTickStyle} dy={8} />
                {isPage && (
                  <YAxis
                    {...axisProps}
                    tick={yAxisTickStyle}
                    tickFormatter={formatCompactCurrency}
                    dx={-4}
                  />
                )}
                {!isPage && <YAxis hide />}
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--text-meta)", strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--success)"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--success)", stroke: "var(--surface)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Pie Chart — Invoice Status ──────────────────────────── */}
      <DashboardWidget widgetId="pieChart" visible={isVisible("pieChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Invoice Status" subtitle="By amount" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Invoice status</p>
        )}
        {(mini.statusBreakdown ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No invoice data yet" />
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

      {/* ── Top Customers (ranked table) ────────────────────────── */}
      <DashboardWidget widgetId="topCustomers" visible={isVisible("topCustomers")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Top Customers" subtitle="By total revenue" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Top customers</p>
        )}
        {(mini.topCustomers ?? []).length === 0 ? (
          <EmptyWidget icon={Users} message="No customer data yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.topCustomers ?? []).slice(0, 5).map((c, i) => (
              <div
                key={c.name}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-text-primary truncate">{c.name}</p>
                  <p className="text-[11px] text-text-meta">{c.invoiceCount} invoices</p>
                </div>
                <span className="text-[13px] font-semibold font-mono text-success shrink-0">
                  {formatCurrency(c.total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.topCustomers ?? []).slice(0, 5).map((c) => (
              <div key={c.name} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{c.name}</span>
                <span className="font-medium">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardWidget>

      {/* ── Scatter Chart — Amount vs Due Date ──────────────────── */}
      <DashboardWidget widgetId="scatterChart" visible={isVisible("scatterChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Invoice Distribution" subtitle="Amount vs due date" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Amount vs due date</p>
        )}
        {(mini.scatterData ?? []).length === 0 ? (
          <EmptyWidget icon={FileText} message="No invoice data yet" />
        ) : (
          <div style={{ height: scatterH }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                data={(mini.scatterData ?? []).map((d) => ({
                  x: new Date(d.dueDate ?? 0).getTime(),
                  y: d.amount,
                }))}
              >
                {isPage && <CartesianGrid {...gridProps} />}
                <XAxis
                  dataKey="x"
                  type="number"
                  tickFormatter={(t) => formatShortDate(new Date(t).toISOString())}
                  {...axisProps}
                  tick={isPage ? xAxisTickStyle : { fontSize: 9 }}
                />
                <YAxis
                  dataKey="y"
                  tickFormatter={formatCompactCurrency}
                  {...axisProps}
                  tick={isPage ? yAxisTickStyle : { fontSize: 9 }}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v) => formatCurrency(v)}
                      labelFormatter={(l) => formatShortDate(new Date(Number(l)).toISOString())}
                    />
                  }
                />
                <Scatter dataKey="y" fill="var(--accent-ai)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Top Products (ranked table, full-width on page) ─────── */}
      <DashboardWidget
        widgetId="topProducts"
        visible={isVisible("topProducts")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? <WidgetTitle title="Top Products" subtitle="By total sales" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Top products</p>
        )}
        {(mini.topProducts ?? []).length === 0 ? (
          <EmptyWidget icon={Package} message="No product data yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.topProducts ?? []).slice(0, 5).map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <RankBadge rank={i + 1} />
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{p.name}</p>
                <span className="text-[13px] font-semibold font-mono text-success shrink-0">
                  {formatCurrency(p.total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.topProducts ?? []).slice(0, 5).map((p) => (
              <div key={p.name} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{p.name}</span>
                <span className="font-medium">{formatCurrency(p.total)}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardWidget>
    </>
  );

  if (isPage) {
    return <div className={gridClass}>{content}</div>;
  }
  return content;
}
