"use client";

import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/accounting/engine";
import {
  Users, FileText, CreditCard, AlertTriangle, LayoutDashboard, Settings,
  TrendingUp, RefreshCw, Sparkles, X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PurchasesDashboard } from "@/components/dashboard/variants/purchases-dashboard";
import { useDashboardPillPreferences } from "@/hooks/use-dashboard-pill-preferences";
import { DashboardCustomizePanel } from "@/components/dashboard/dashboard-customize-panel";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { DashboardStats } from "@/lib/dashboard/mini-stats-types";
import type { PurchasesMiniStats } from "@/lib/dashboard/mini-stats-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
}

export default function PurchasesPage() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [dismissedInsight, setDismissedInsight] = useState(false);
  const { isVisible } = useDashboardPillPreferences("purchases");

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchJson<DashboardStats>("/api/dashboard/stats"),
  });

  const { data: mini, isLoading, error, refetch } = useQuery({
    queryKey: ["mini-stats", "purchases"],
    queryFn: () => fetchJson<PurchasesMiniStats>("/api/purchases/mini-stats"),
  });

  const stats = dashboardData?.purchases ?? {
    totalExpenses: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    billCount: 0,
    supplierCount: 0,
  };

  const cards = [
    {
      title: "Total Expenses",
      value: `AED ${formatNumber(stats.totalExpenses)}`,
      icon: FileText,
      href: "/purchases/bills",
      color: "text-error",
      accentBorder: "border-l-error",
      iconBg: "bg-error/10",
      trendIcon: null,
      subtitle: `${stats.billCount} bills`,
    },
    {
      title: "Outstanding",
      value: `AED ${formatNumber(stats.totalOutstanding)}`,
      icon: AlertTriangle,
      href: "/purchases/bills",
      color: "text-accent-yellow",
      accentBorder: "border-l-accent-yellow",
      iconBg: "bg-accent-yellow/10",
      trendIcon: null,
      subtitle: "Awaiting payment",
    },
    {
      title: "Paid",
      value: `AED ${formatNumber(stats.totalPaid)}`,
      icon: CreditCard,
      href: "/purchases/bills",
      color: "text-success",
      accentBorder: "border-l-success",
      iconBg: "bg-success/10",
      trendIcon: stats.totalPaid > 0 ? TrendingUp : null,
      subtitle: "Settled",
    },
    {
      title: "Suppliers",
      value: String(stats.supplierCount),
      icon: Users,
      href: "/purchases/suppliers",
      color: "text-[var(--accent-ai)]",
      accentBorder: "border-l-[var(--accent-ai)]",
      iconBg: "bg-[var(--accent-ai)]/10",
      trendIcon: null,
      subtitle: "Active vendors",
    },
  ];

  const insightText = stats.totalOutstanding > 0
    ? `AED ${formatNumber(stats.totalOutstanding)} outstanding across ${stats.billCount} bills`
    : stats.billCount > 0
    ? "All bills are paid — healthy cash flow"
    : "No bills yet. Start recording purchases to track payables.";

  return (
    <div className="space-y-8">
      {!dismissedInsight && (
        <div className="dashboard-card !py-3.5 !px-5 border-l-4 border-l-[var(--accent-ai)] flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
            <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
          </div>
          <p className="flex-1 text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">AI Insight: </span>
            {insightText}
          </p>
          <button
            onClick={() => setDismissedInsight(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-meta hover:bg-muted/50 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trendIcon;
          return (
            <Link key={card.title} href={card.href}>
              <div className={`dashboard-card group cursor-pointer border-l-[3px] ${card.accentBorder} transition-all hover:shadow-lg hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.8} />
                  </div>
                  {TrendIcon && <TrendIcon className={`h-4 w-4 ${card.color} opacity-60`} />}
                </div>
                <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">{card.title}</p>
                <p className={`mt-0.5 text-[28px] font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
                <p className="mt-1 text-[11px] text-text-meta">{card.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
              <LayoutDashboard className="h-4 w-4 text-text-secondary" />
              <h2 className="text-[15px] font-semibold text-text-primary">Dashboard</h2>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomize(!showCustomize)}
            className="rounded-xl text-[12px]"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            {showCustomize ? "Back" : "Customize"}
          </Button>
        </div>

        {showCustomize ? (
          <div className="dashboard-card">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
              <h3 className="text-[14px] font-semibold text-text-primary">Customize widgets</h3>
            </div>
            <DashboardCustomizePanel variant="purchases" />
          </div>
        ) : (
          <>
            {isLoading && <DashboardSkeleton />}
            {error && (
              <div className="dashboard-card border-l-4 border-l-destructive">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text-primary">Failed to load dashboard</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">There was an error fetching your purchases data. Please try again.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="shrink-0 rounded-xl">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            {!isLoading && !error && mini && (
              <PurchasesDashboard
                mini={mini}
                stats={dashboardData}
                isVisible={isVisible}
                layout="page"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
