"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip,
  Legend,
} from "recharts";
import { Percent, ArrowDownLeft, ArrowUpRight, Sparkles, Landmark, CreditCard } from "lucide-react";
import { DashboardWidget } from "../dashboard-widget";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  axisProps, xAxisTickStyle, yAxisTickStyle, gridProps,
  formatCurrency, formatCompactCurrency, chartColors,
} from "@/components/charts/chart-utils";
import { cn } from "@/lib/utils";
import type { BankingMiniStats } from "@/lib/dashboard/mini-stats-types";

interface Props {
  mini: BankingMiniStats;
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

// ── Empty state ──────────────────────────────────────────────────────
function EmptyWidget({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function BankingDashboard({ mini, isVisible, layout = "popover" }: Props) {
  const isPage = layout === "page";
  const colors = useMemo(() => chartColors(), []);
  const pieColors = [colors.chart1, colors.chart4, colors.chart3, colors.chart2, colors.chart5];

  const gridClass = isPage ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "";
  const fullSpanClass = isPage ? "md:col-span-2 xl:col-span-3" : undefined;

  const barH = isPage ? 220 : 140;
  const areaH = isPage ? 200 : 120;
  const pieH = isPage ? 200 : 120;
  const pieRadius = isPage ? 70 : 45;

  const content = (
    <>
      {/* ── Metrics Row (3 KPIs with dividers) ──────────────────── */}
      <DashboardWidget
        widgetId="metricsRow"
        visible={isVisible("metricsRow")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
            {[
              { label: "Balance", value: formatCurrency(mini.totalBalance ?? 0), color: "text-success" },
              { label: "Unreconciled", value: String(mini.unreconciledCount ?? 0), color: (mini.unreconciledCount ?? 0) > 0 ? "text-accent-yellow" : "text-text-primary" },
              { label: "Accounts", value: String(mini.accountCount ?? 0), color: "text-text-primary" },
            ].map((m) => (
              <div key={m.label} className="px-4 py-2 first:pl-0 last:pr-0">
                <p className="text-[12px] font-medium text-text-meta uppercase tracking-wide">{m.label}</p>
                <p className={cn("text-[20px] font-bold mt-0.5", m.color)}>{m.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className={S}><p className={M}>Balance</p><p className={V}>{formatCurrency(mini.totalBalance ?? 0)}</p></div>
            <div className={S}><p className={M}>Unreconciled</p><p className={V}>{mini.unreconciledCount ?? 0}</p></div>
            <div className={S}><p className={M}>Accounts</p><p className={V}>{mini.accountCount ?? 0}</p></div>
          </div>
        )}
      </DashboardWidget>

      {/* ── Mini Metrics (grouped in one card) ──────────────────── */}
      <DashboardWidget
        widgetId="reconciliationRate"
        visible={isVisible("reconciliationRate") || isVisible("inVsOutThisMonth") || isVisible("pendingAiMatches")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            {isVisible("reconciliationRate") && (
              <div className="flex items-center gap-3 px-4 py-2 first:pl-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
                  <Percent className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Reconciliation rate</p>
                  <p className="text-[18px] font-bold text-text-primary">{(mini.reconciliationRate ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            )}
            {isVisible("inVsOutThisMonth") && (
              <>
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-[11px] text-text-meta">In this month</p>
                    <p className="text-[18px] font-bold text-success">{formatCompactCurrency(mini.inVsOutThisMonth?.in ?? 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10 shrink-0">
                    <ArrowUpRight className="h-4 w-4 text-error" />
                  </div>
                  <div>
                    <p className="text-[11px] text-text-meta">Out this month</p>
                    <p className="text-[18px] font-bold text-error">{formatCompactCurrency(mini.inVsOutThisMonth?.out ?? 0)}</p>
                  </div>
                </div>
              </>
            )}
            {isVisible("pendingAiMatches") && (
              <div className="flex items-center gap-3 px-4 py-2 last:pr-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
                  <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
                </div>
                <div>
                  <p className="text-[11px] text-text-meta">Pending AI matches</p>
                  <p className="text-[18px] font-bold text-text-primary">{mini.pendingAiMatches ?? 0}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {isVisible("reconciliationRate") && (
              <div className={S}><p className={M}>Reconciliation rate</p><p className={V}>{(mini.reconciliationRate ?? 0).toFixed(1)}%</p></div>
            )}
            {isVisible("inVsOutThisMonth") && (
              <div className="grid grid-cols-2 gap-2">
                <div className={S}>
                  <p className={M}>In this month</p>
                  <p className={cn(V, "text-success")}>{formatCurrency(mini.inVsOutThisMonth?.in ?? 0)}</p>
                </div>
                <div className={S}>
                  <p className={M}>Out this month</p>
                  <p className={cn(V, "text-error")}>{formatCurrency(mini.inVsOutThisMonth?.out ?? 0)}</p>
                </div>
              </div>
            )}
            {isVisible("pendingAiMatches") && (
              <div className={S}><p className={M}>Pending AI matches</p><p className={V}>{mini.pendingAiMatches ?? 0}</p></div>
            )}
          </div>
        )}
      </DashboardWidget>

      {/* ── Bar Chart — Cash Flow by Month ──────────────────────── */}
      <DashboardWidget widgetId="barChart" visible={isVisible("barChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Cash Flow" subtitle="Monthly in vs out" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Cash flow by month</p>
        )}
        {(mini.monthlyCashFlow ?? []).length === 0 ? (
          <EmptyWidget icon={Landmark} message="No cash flow data yet" />
        ) : (
          <div style={{ height: barH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mini.monthlyCashFlow ?? []} barGap={2}>
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
                <Bar dataKey="in" name="Inflow" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="out" name="Outflow" fill="var(--error)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                {isPage && (
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-[12px] text-text-secondary">{value}</span>
                    )}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Area Chart — Net Cash Flow Trend ─────────────────────── */}
      <DashboardWidget widgetId="balanceTrend" visible={isVisible("balanceTrend")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Net Cash Flow Trend" subtitle="Cumulative" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Net cash flow trend</p>
        )}
        {(mini.balanceTrend ?? []).length === 0 ? (
          <EmptyWidget icon={Landmark} message="No trend data yet" />
        ) : (
          <div style={{ height: areaH }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mini.balanceTrend ?? []}>
                <defs>
                  <linearGradient id="cashFlowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-ai)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent-ai)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {isPage && <CartesianGrid {...gridProps} />}
                <XAxis dataKey="month" {...axisProps} tick={xAxisTickStyle} dy={8} />
                {isPage && (
                  <YAxis {...axisProps} tick={yAxisTickStyle} tickFormatter={formatCompactCurrency} dx={-4} />
                )}
                {!isPage && <YAxis hide />}
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--text-meta)", strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="var(--accent-ai)"
                  strokeWidth={2}
                  fill="url(#cashFlowFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--accent-ai)", stroke: "var(--surface)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </DashboardWidget>

      {/* ── Pie Chart — Balance per Account ──────────────────────── */}
      <DashboardWidget widgetId="pieChart" visible={isVisible("pieChart")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Balance per Account" subtitle="Distribution" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Balance per account</p>
        )}
        {(mini.accountBalances ?? []).length === 0 ? (
          <EmptyWidget icon={Landmark} message="No account data yet" />
        ) : (
          <div style={{ height: pieH }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(mini.accountBalances ?? []).map((d, i) => ({
                    ...d,
                    value: d.balance,
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
                  {(mini.accountBalances ?? []).map((_, i) => (
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

      {/* ── Recent Transactions ──────────────────────────────────── */}
      <DashboardWidget widgetId="recentTransactions" visible={isVisible("recentTransactions")} cardWrap={isPage}>
        {isPage ? <WidgetTitle title="Recent Transactions" subtitle="Latest activity" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent transactions</p>
        )}
        {(mini.recentTransactions ?? []).length === 0 ? (
          <EmptyWidget icon={CreditCard} message="No transactions yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.recentTransactions ?? []).slice(0, 5).map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                  t.type === "credit" ? "bg-success/10" : "bg-error/10"
                )}>
                  {t.type === "credit"
                    ? <ArrowDownLeft className="h-4 w-4 text-success" />
                    : <ArrowUpRight className="h-4 w-4 text-error" />
                  }
                </div>
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{t.description || "—"}</p>
                <span className={cn(
                  "text-[13px] font-semibold font-mono shrink-0",
                  t.type === "credit" ? "text-success" : "text-error"
                )}>
                  {t.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.recentTransactions ?? []).slice(0, 5).map((t, i) => (
              <div key={i} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{t.description || "—"}</span>
                <span className={cn("font-medium", t.type === "credit" ? "text-success" : "text-error")}>
                  {t.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </DashboardWidget>

      {/* ── Largest Transactions (full-width on page) ────────────── */}
      <DashboardWidget
        widgetId="largestTransactions"
        visible={isVisible("largestTransactions")}
        className={fullSpanClass}
        cardWrap={isPage}
      >
        {isPage ? <WidgetTitle title="Largest Transactions" subtitle="By amount" /> : (
          <p className="text-xs font-medium text-muted-foreground mb-2">Largest transactions</p>
        )}
        {(mini.largestTransactions ?? []).length === 0 ? (
          <EmptyWidget icon={CreditCard} message="No transactions yet" />
        ) : isPage ? (
          <div className="space-y-0">
            {(mini.largestTransactions ?? []).slice(0, 5).map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 px-1 border-b border-border-subtle/50 last:border-b-0 hover:bg-muted/40 transition-colors rounded-lg"
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                  t.type === "credit" ? "bg-success/10" : "bg-error/10"
                )}>
                  {t.type === "credit"
                    ? <ArrowDownLeft className="h-4 w-4 text-success" />
                    : <ArrowUpRight className="h-4 w-4 text-error" />
                  }
                </div>
                <p className="flex-1 text-[13px] font-medium text-text-primary truncate">{t.description || "—"}</p>
                <span className={cn(
                  "text-[13px] font-semibold font-mono shrink-0",
                  t.type === "credit" ? "text-success" : "text-error"
                )}>
                  {t.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(mini.largestTransactions ?? []).slice(0, 5).map((t, i) => (
              <div key={i} className="flex justify-between text-[12px]">
                <span className="truncate text-text-secondary">{t.description || "—"}</span>
                <span className={cn("font-medium", t.type === "credit" ? "text-success" : "text-error")}>
                  {t.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                </span>
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
