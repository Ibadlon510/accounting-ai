"use client";

import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { IncomeChart } from "@/components/charts/income-chart";
import { ForecastBarChart } from "@/components/charts/forecast-bar-chart";
import { getSalesStats } from "@/lib/mock/sales-data";
import { getPurchaseStats } from "@/lib/mock/purchases-data";
import { getInventoryStats } from "@/lib/mock/inventory-data";
import { getBankingStats } from "@/lib/mock/banking-data";
import { getVATSummary } from "@/lib/mock/vat-data";
import { formatNumber } from "@/lib/accounting/engine";
import {
  FileText,
  ShoppingCart,
  Package,
  Landmark,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const sales = getSalesStats();
  const purchases = getPurchaseStats();
  const inventory = getInventoryStats();
  const banking = getBankingStats();
  const vat = getVATSummary();

  const netIncome = sales.totalRevenue - purchases.totalExpenses;
  const grossMargin = sales.totalRevenue > 0 ? Math.round((netIncome / sales.totalRevenue) * 100) : 0;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Dashboard" },
        ]}
      />

      <PageHeader title="Accounting Command Center" />

      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-12 gap-5">
        <Link href="/sales" className="col-span-3">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <FileText className="h-5 w-5 text-success" strokeWidth={1.8} />
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="mt-3 text-[12px] font-medium text-text-meta">Total Revenue</p>
            <p className="mt-0.5 text-[24px] font-bold text-text-primary">AED {formatNumber(sales.totalRevenue)}</p>
            <p className="mt-1 text-[12px] text-success">{sales.invoiceCount} invoices • {sales.customerCount} customers</p>
          </div>
        </Link>

        <Link href="/purchases" className="col-span-3">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
                <ShoppingCart className="h-5 w-5 text-error" strokeWidth={1.8} />
              </div>
              <TrendingDown className="h-4 w-4 text-error" />
            </div>
            <p className="mt-3 text-[12px] font-medium text-text-meta">Total Expenses</p>
            <p className="mt-0.5 text-[24px] font-bold text-text-primary">AED {formatNumber(purchases.totalExpenses)}</p>
            <p className="mt-1 text-[12px] text-error">{purchases.billCount} bills • {purchases.supplierCount} suppliers</p>
          </div>
        </Link>

        <Link href="/banking" className="col-span-3">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Landmark className="h-5 w-5 text-blue-600" strokeWidth={1.8} />
              </div>
              {banking.unreconciled > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-yellow/20 text-[10px] font-bold text-amber-700">{banking.unreconciled}</span>}
            </div>
            <p className="mt-3 text-[12px] font-medium text-text-meta">Bank Balance</p>
            <p className="mt-0.5 text-[24px] font-bold text-text-primary">AED {formatNumber(banking.totalBalance)}</p>
            <p className="mt-1 text-[12px] text-text-secondary">{banking.unreconciled} unreconciled transactions</p>
          </div>
        </Link>

        <Link href="/vat" className="col-span-3">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Receipt className="h-5 w-5 text-purple-600" strokeWidth={1.8} />
              </div>
            </div>
            <p className="mt-3 text-[12px] font-medium text-text-meta">Net VAT Payable</p>
            <p className="mt-0.5 text-[24px] font-bold text-text-primary">AED {formatNumber(vat.netPayable)}</p>
            <p className="mt-1 text-[12px] text-text-secondary">Q1 2026 • Due Apr 28</p>
          </div>
        </Link>
      </div>

      {/* Row 2: Charts + Insights */}
      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* Income chart — 8 columns */}
        <div className="col-span-8">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">Income vs Expenses</h3>
                <p className="text-[12px] text-text-meta">Monthly trend for 2026</p>
              </div>
              <div className="flex items-center gap-4 text-[12px]">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EF4444]" />Revenue</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#FBBF24]" />Net Profit</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#0F172A]" />Expenses</div>
              </div>
            </div>
            <IncomeChart />
            <div className="mt-4 flex items-center gap-6 border-t border-border-subtle pt-4">
              <div>
                <p className="text-[11px] text-text-meta">Gross Margin</p>
                <p className={`text-[20px] font-bold ${grossMargin >= 0 ? "text-success" : "text-error"}`}>{grossMargin}%</p>
              </div>
              <div>
                <p className="text-[11px] text-text-meta">Net Income</p>
                <p className={`text-[20px] font-bold ${netIncome >= 0 ? "text-success" : "text-error"}`}>AED {formatNumber(netIncome)}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-meta">Outstanding Receivables</p>
                <p className="text-[20px] font-bold text-accent-yellow">AED {formatNumber(sales.totalOutstanding)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — 4 cols */}
        <div className="col-span-4 space-y-5">
          {/* Overdue alert */}
          {sales.overdueAmount > 0 && (
            <div className="dashboard-card border-l-4 border-l-error">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-error" />
                <p className="text-[13px] font-semibold text-error">Overdue Invoices</p>
              </div>
              <p className="text-[24px] font-bold text-error">AED {formatNumber(sales.overdueAmount)}</p>
              <Link href="/sales/invoices" className="mt-2 flex items-center gap-1 text-[12px] font-medium text-error hover:underline">
                View overdue <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Payables */}
          <div className="dashboard-card">
            <p className="text-[12px] font-medium text-text-meta">Accounts Payable</p>
            <p className="mt-1 text-[22px] font-bold text-text-primary">AED {formatNumber(purchases.totalOutstanding)}</p>
            <Link href="/purchases/bills" className="mt-2 flex items-center gap-1 text-[12px] font-medium text-text-secondary hover:text-text-primary">
              View bills <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Inventory */}
          <Link href="/inventory" className="block">
            <div className="dashboard-card transition-all hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium text-text-meta">Inventory</p>
                {inventory.lowStock > 0 && (
                  <span className="rounded-full bg-error-light px-2 py-0.5 text-[10px] font-medium text-error">{inventory.lowStock} low stock</span>
                )}
              </div>
              <p className="mt-1 text-[22px] font-bold text-text-primary">AED {formatNumber(inventory.totalValue)}</p>
              <p className="mt-1 text-[12px] text-text-secondary">{inventory.totalProducts} products tracked</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Row 3: Sales forecast */}
      <div className="mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-6">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-semibold text-text-primary">Sales Forecast</h3>
                <p className="text-[12px] text-text-meta">Actual vs projected</p>
              </div>
              <div className="flex items-center gap-3 text-[12px]">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Sales</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success/40" />Forecast</div>
              </div>
            </div>
            <ForecastBarChart />
          </div>
        </div>

        {/* Quick actions */}
        <div className="col-span-6">
          <div className="dashboard-card">
            <h3 className="text-[15px] font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "New Invoice", href: "/sales/invoices", icon: FileText, color: "text-success" },
                { label: "Record Expense", href: "/purchases/bills", icon: ShoppingCart, color: "text-error" },
                { label: "Reconcile Bank", href: "/banking", icon: Landmark, color: "text-blue-600" },
                { label: "VAT Return", href: "/vat", icon: Receipt, color: "text-purple-600" },
                { label: "Add Customer", href: "/sales/customers", icon: Users, color: "text-teal-600" },
                { label: "View Reports", href: "/reports", icon: TrendingUp, color: "text-text-primary" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <div className="flex items-center gap-3 rounded-xl border border-border-subtle px-4 py-3 transition-all hover:bg-black/[0.02] hover:shadow-sm">
                      <Icon className={`h-4 w-4 ${action.color}`} strokeWidth={1.8} />
                      <span className="text-[13px] font-medium text-text-primary">{action.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
