"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip,
  Legend,
} from "recharts";
import { AlertTriangle, RefreshCw, BarChart2, Package, FolderOpen } from "lucide-react";
import { DashboardWidget } from "../dashboard-widget";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  axisProps, xAxisTickStyle, yAxisTickStyle, gridProps,
  formatCurrency, formatCompactCurrency, chartColors,
} from "@/components/charts/chart-utils";
import { cn } from "@/lib/utils";
import type { InventoryMiniStats } from "@/lib/dashboard/mini-stats-types";

interface Props {
  mini: InventoryMiniStats;
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
function RankBadge({ rank, variant = "default" }: { rank: number; variant?: "default" | "warning" }) {
  const isTop3 = rank <= 3;
  return (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
        variant === "warning"
          ? (isTop3 ? "bg-error/10 text-error" : "bg-muted text-text-meta")
          : (isTop3 ? "bg-success/10 text-success" : "bg-muted text-text-meta")
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

export function InventoryDashboard({ mini, isVisible, layout = "popover" }: Props) {
  const isPage = layout === "page";
  const colors = useMemo(() => chartColors(), []);
  const pieColors = [colors.chart1, colors.chart4, colors.chart3, colors.chart2, colors.chart5];

  const gridClass = isPage ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "";
  const fullSpanClass = isPage ? "md:col-span-2 xl:col-span-3" : undefined;

  const barH = isPage ? 220 : 140;
  const pieH = isPage ? 200 : 120;
  const pieRadius = isPage ? 70 : 45;

  const totalItems = (mini.typeBreakdown ?? []).reduce((s, t) => s + t.count, 0);
  const productCount = (mini.typeBreakdown ?? []).find((t) => t.type === "product")?.count ?? 0;

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
              { label: "Items", value: String(totalItems), color: "text-text-primary" },
              { label: "Products", value: String(productCount), color: "text-[var(--accent-ai)]" },
              { label: "Value", value: formatCurrency(mini.totalValue ?? 0), color: "text-success" },
              { label: "Low Stock", value: String(mini.reorderAlerts ?? 0), color: (mini.reorderAlerts ?? 0) > 0 ? "text-error" : "text-text-primary" },
            ].map((m) => (
              <div key={m.label} className="px-4 py-2 first:pl-0 last:pr-0">
                <p className="text-[12px] font-medium text-text-meta uppercase tracking-wide">{m.label}</p>
                <p className={cn("text-[20px] font-bold mt-0.5", m.color)}>{m.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <div className={S}><p className={M}>Items</p><p className={V}>{totalItems}</p></div>
            <div className={S}><p className={M}>Products</p><p className={V}>{productCount}</p></div>
            <div className={S}><p className={M}>Value</p><p className={V}>{formatCurrency(mini.totalValue ?? 0)}</p></div>
            <div className={S}><p className={M}>Low stock</p><p className={V}>{mini.reorderAlerts ?? 0}</p></div>
          </div>
        )}
      </DashboardWidget>

      {/* ── Mini Metrics (grouped in one card) ──────────────────── */}
      <DashboardWidget
        widgetId="reorderAlerts"
        visible={isVisible("reorderAlerts") || isVisible("stockOutRisk") || isVisible("inventoryTurnover")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            {isVisible("reorderAlerts") && (
              <div className="flex items-center gap-3 px-4 py-2 first:pl-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-error" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Reorder alerts</p>
                  <p className={cn("text-[18px] font-bold", (mini.reorderAlerts ?? 0) > 0 ? "text-error" : "text-text-primary")}>{mini.reorderAlerts ?? 0}</p>
                </div>
              </div>
            )}
            {isVisible("stockOutRisk") && (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-yellow/10 shrink-0">
                  <RefreshCw className="h-4 w-4 text-accent-yellow" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Stock-out risk</p>
                  <p className={cn("text-[18px] font-bold", (mini.stockOutRisk ?? 0) > 0 ? "text-accent-yellow" : "text-text-primary")}>{mini.stockOutRisk ?? 0}</p>
                </div>
              </div>
            )}
            {isVisible("inventoryTurnover") && (
              <div className="flex items-center gap-3 px-4 py-2 last:pr-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                  <BarChart2 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Inventory turnover</p>
                  <p className="text-[18px] font-bold text-text-primary">{typeof mini.turnover === "number" ? mini.turnover.toFixed(1) : "N/A"}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {isVisible("reorderAlerts") && (
              <div className={S}><p className={M}>Reorder alerts</p><p className={V}>{mini.reorderAlerts ?? 0}</p></div>
            )}
            {isVisible("stockOutRisk") && (
              <div className={S}><p className={M}>Stock-out risk</p><p className={V}>{mini.stockOutRisk ?? 0}</p></div>
            )}
            {isVisible("inventoryTurnover") && (
              <div className={S}><p className={M}>Inventory turnover</p><p className={V}>{typeof mini.turnover === "number" ? mini.turnover.toFixed(1) : "N/A"}</p></div>
            )}
          </div>
        )}
      </DashboardWidget>

      {/* ── Bar Chart — Inventory Value Trend ───────────────────── */}
      <DashboardWidget widgetId="barChart" visible={isVisible("barChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Inventory Value Trend" subtitle="Monthly" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Inventory value trend</p>
        )}
        {(mini.monthlyValue ?? []).length === 0 ? (
          <EmptyWidget icon={Package} message="No inventory data yet" />
        ) : (
          <div style={{ height: barH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mini.monthlyValue ?? []} barGap={2}>
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
                <Bar dataKey="value" fill="var(--chart-5)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Pie Chart — Product vs Service ───────────────────────── */}
      <DashboardWidget widgetId="pieChart" visible={isVisible("pieChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Product vs Service" subtitle="By value" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Product vs Service</p>
        )}
        {(mini.valueByCategory ?? []).length === 0 ? (
          <EmptyWidget icon={Package} message="No category data yet" />
        ) : (
          <div style={{ height: pieH }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(mini.valueByCategory ?? []).map((d, i) => ({
                    ...d,
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
                  {(mini.valueByCategory ?? []).map((_, i) => (
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

      {/* ── Value by Category (ranked) ──────────────────────────── */}
      <DashboardWidget widgetId="valueByCategory" visible={isVisible("valueByCategory")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Value by Category" subtitle="Breakdown" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Value by category</p>
        )}
        {(mini.valueByCategory ?? []).length === 0 ? (
          <EmptyWidget icon={FolderOpen} message="No category data yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.valueByCategory ?? []).map((c, i) => (
              <div
                key={c.name}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <RankBadge rank={i + 1} />
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{c.name}</p>
                <span className="text-[13px] font-semibold font-mono text-success shrink-0">
                  {formatCurrency(c.value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.valueByCategory ?? []).map((c) => (
              <div key={c.name} className="flex justify-between text-[12px]">
                <span className="text-text-secondary">{c.name}</span>
                <span className="font-medium">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardWidget>

      {/* ── Top Items by Value (ranked) ─────────────────────────── */}
      <DashboardWidget widgetId="topItemsByValue" visible={isVisible("topItemsByValue")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Top Items by Value" subtitle="Highest value items" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Top items by value</p>
        )}
        {(mini.topItemsByValue ?? []).length === 0 ? (
          <EmptyWidget icon={Package} message="No item data yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.topItemsByValue ?? []).slice(0, 5).map((item, i) => (
              <div
                key={item.id ?? item.name}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <RankBadge rank={i + 1} />
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{item.name}</p>
                <span className="text-[13px] font-semibold font-mono text-success shrink-0">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.topItemsByValue ?? []).slice(0, 5).map((item) => (
              <div key={item.id ?? item.name} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        )}
      </DashboardWidget>

      {/* ── Low Stock Items (warning table, full-width) ─────────── */}
      <DashboardWidget
        widgetId="lowStockTable"
        visible={isVisible("lowStockTable")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? <WidgetTitle title="Low Stock Items" subtitle="Below reorder level" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Low stock items</p>
        )}
        {(mini.lowStockItems ?? []).length === 0 ? (
          <EmptyWidget icon={AlertTriangle} message="No low stock items — all good!" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.lowStockItems ?? []).slice(0, 5).map((item, i) => (
              <div
                key={item.id ?? item.name}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <RankBadge rank={i + 1} variant="warning" />
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{item.name}</p>
                <span className="text-[13px] font-semibold font-mono text-error shrink-0">
                  {item.quantityOnHand} / {item.reorderLevel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.lowStockItems ?? []).slice(0, 5).map((item) => (
              <div key={item.id ?? item.name} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{item.name}</span>
                <span className="font-medium">{item.quantityOnHand} / {item.reorderLevel}</span>
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
