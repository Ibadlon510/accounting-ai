"use client";

import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/accounting/engine";
import {
  Users, FileText, AlertTriangle, LayoutDashboard, Settings,
  TrendingUp, TrendingDown, RefreshCw, Sparkles, X, Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SalesDashboard } from "@/components/dashboard/variants/sales-dashboard";
import { CreateInvoicePanel } from "@/components/modals/create-invoice-panel";
import { useDashboardPillPreferences } from "@/hooks/use-dashboard-pill-preferences";
import { DashboardCustomizePanel } from "@/components/dashboard/dashboard-customize-panel";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { DashboardStats } from "@/lib/dashboard/mini-stats-types";
import type { SalesMiniStats } from "@/lib/dashboard/mini-stats-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
}

type Customer = { id: string; name: string; email: string; phone: string; isActive: boolean };
type InvoiceLine = { id: string; productId?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };

export default function SalesPage() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [dismissedInsight, setDismissedInsight] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { isVisible } = useDashboardPillPreferences("sales");

  function loadCustomers() {
    fetch("/api/sales/customers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { customers: [] }))
      .then((d) => setCustomers(d.customers ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const { data: dashboardData, refetch: refetchDashboard } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchJson<DashboardStats>("/api/dashboard/stats"),
  });

  const { data: mini, isLoading, error, refetch } = useQuery({
    queryKey: ["mini-stats", "sales"],
    queryFn: () => fetchJson<SalesMiniStats>("/api/sales/mini-stats"),
  });

  const stats = dashboardData?.sales ?? {
    totalRevenue: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    invoiceCount: 0,
    customerCount: 0,
  };

  // ── Card definitions with accent borders and color-matched icons ──
  const cards = [
    {
      title: "Total Revenue",
      value: `AED ${formatNumber(stats.totalRevenue)}`,
      icon: FileText,
      href: "/sales/invoices",
      color: "text-success",
      accentBorder: "border-l-success",
      iconBg: "bg-success/10",
      trendIcon: TrendingUp,
      subtitle: `${stats.invoiceCount} invoices`,
    },
    {
      title: "Outstanding",
      value: `AED ${formatNumber(stats.totalOutstanding)}`,
      icon: AlertTriangle,
      href: "/sales/invoices",
      color: "text-accent-yellow",
      accentBorder: "border-l-accent-yellow",
      iconBg: "bg-accent-yellow/10",
      trendIcon: null,
      subtitle: "Awaiting payment",
    },
    {
      title: "Overdue",
      value: `AED ${formatNumber(stats.overdueAmount)}`,
      icon: AlertTriangle,
      href: "/sales/invoices",
      color: "text-error",
      accentBorder: "border-l-error",
      iconBg: "bg-error/10",
      trendIcon: stats.overdueAmount > 0 ? TrendingDown : null,
      subtitle: "Past due date",
    },
    {
      title: "Customers",
      value: String(stats.customerCount),
      icon: Users,
      href: "/sales/customers",
      color: "text-[var(--accent-ai)]",
      accentBorder: "border-l-[var(--accent-ai)]",
      iconBg: "bg-[var(--accent-ai)]/10",
      trendIcon: null,
      subtitle: "Active accounts",
    },
  ];

  async function handleCreateInvoice(data: { customerId: string; customerName: string; issueDate: string; dueDate: string; lines: InvoiceLine[]; subtotal: number; taxAmount: number; total: number }) {
    const res = await fetch("/api/sales/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: data.customerId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        lines: data.lines.map((l) => ({ productId: l.productId, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount, taxRate: l.taxRate, taxAmount: l.taxAmount })),
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        total: data.total,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const { showError } = await import("@/lib/utils/toast-helpers");
      showError(json.error ?? "Failed to create invoice");
      throw new Error(json.error ?? "Failed to create invoice");
    }
    setCreateInvoiceOpen(false);
    refetchDashboard();
  }

  // ── AI insight text (contextual) ──────────────────────────────────
  const insightText = stats.overdueAmount > 0
    ? `${stats.invoiceCount > 0 ? Math.round((stats.overdueAmount / stats.totalRevenue) * 100) : 0}% of revenue is overdue — AED ${formatNumber(stats.overdueAmount)} needs follow-up`
    : stats.totalOutstanding > 0
    ? `AED ${formatNumber(stats.totalOutstanding)} outstanding across active invoices`
    : "All invoices are up to date — great cash flow management";

  return (
    <div className="space-y-8">
      {/* ── AI Insight Banner ───────────────────────────────────────── */}
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

      {/* ── Summary KPI Cards ───────────────────────────────────────── */}
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

      {/* ── Dashboard Section ───────────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
              <LayoutDashboard className="h-4 w-4 text-text-secondary" />
              <h2 className="text-[15px] font-semibold text-text-primary">Dashboard</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateInvoiceOpen(true)}
              className="h-9 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create invoice
            </Button>
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
        </div>
        <CreateInvoicePanel open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen} customers={customers} onCustomerCreated={loadCustomers} onCreate={handleCreateInvoice} />

        {showCustomize ? (
          <div className="dashboard-card">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
              <h3 className="text-[14px] font-semibold text-text-primary">Customize widgets</h3>
            </div>
            <DashboardCustomizePanel variant="sales" />
          </div>
        ) : (
          <>
            {/* Loading skeleton grid */}
            {isLoading && <DashboardSkeleton />}

            {/* Error state with retry */}
            {error && (
              <div className="dashboard-card border-l-4 border-l-destructive">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text-primary">Failed to load dashboard</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">There was an error fetching your sales data. Please try again.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="shrink-0 rounded-xl">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Dashboard content */}
            {!isLoading && !error && mini && (
              <SalesDashboard
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
