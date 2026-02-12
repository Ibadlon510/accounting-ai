"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { BarChart3, FileText, TrendingUp, PieChart, Package, Receipt, Shield } from "lucide-react";
import Link from "next/link";

const reports = [
  { title: "Profit & Loss", description: "Income statement for the period", icon: TrendingUp, href: "/reports/profit-and-loss" },
  { title: "Balance Sheet", description: "Assets, liabilities and equity snapshot", icon: BarChart3, href: "/reports/balance-sheet" },
  { title: "Trial Balance", description: "Verify debit/credit totals", icon: FileText, href: "/accounting/trial-balance" },
  { title: "General Ledger", description: "Account transaction history", icon: PieChart, href: "/accounting/general-ledger" },
  { title: "Inventory Valuation", description: "Stock value by weighted average cost", icon: Package, href: "/reports/inventory-valuation" },
  { title: "VAT Audit", description: "Input/output VAT transaction detail", icon: Receipt, href: "/reports/vat-audit" },
  { title: "Audit Trail", description: "Complete log of all system activity", icon: Shield, href: "/accounting/audit-trail" },
];

export default function ReportsPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Reports" }]} />
      <PageHeader title="Reports" showActions={false} />

      <div className="grid grid-cols-12 gap-6">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.title} href={r.href} className="col-span-3">
              <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary/5">
                  <Icon className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-text-primary">{r.title}</h3>
                <p className="mt-1 text-[13px] text-text-secondary">{r.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
