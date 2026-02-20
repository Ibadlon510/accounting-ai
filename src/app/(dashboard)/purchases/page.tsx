"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { getPurchaseStats } from "@/lib/mock/purchases-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Users, FileText, CreditCard, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { AiInsightBanner } from "@/components/ai/ai-insight-banner";

export default function PurchasesPage() {
  const stats = getPurchaseStats();

  const cards = [
    { title: "Total Expenses", value: `AED ${formatNumber(stats.totalExpenses)}`, icon: FileText, href: "/purchases/bills", color: "text-error" },
    { title: "Outstanding", value: `AED ${formatNumber(stats.totalOutstanding)}`, icon: AlertTriangle, href: "/purchases/bills", color: "text-accent-yellow" },
    { title: "Paid", value: `AED ${formatNumber(stats.totalPaid)}`, icon: CreditCard, href: "/purchases/bills", color: "text-success" },
    { title: "Suppliers", value: String(stats.supplierCount), icon: Users, href: "/purchases/suppliers", color: "text-text-primary" },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Purchases" }]} />
      <PageHeader title="Purchases" />

      <AiInsightBanner
        message="Top expense category: IT Services & Consulting at AED 15,750 (38% of total)."
        detail="AI detected a possible duplicate bill from Gulf IT Solutions — review recommended."
      />

      <div className="grid grid-cols-12 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="col-span-3">
              <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary/5">
                  <Icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.8} />
                </div>
                <p className="mt-3 text-[13px] text-text-secondary">{card.title}</p>
                <p className={`mt-1 text-[24px] font-bold ${card.color}`}>{card.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Link href="/purchases/bills" className="col-span-6">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <FileText className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
            <h3 className="mt-3 text-[16px] font-semibold text-text-primary">Bills</h3>
            <p className="mt-1 text-[13px] text-text-secondary">Manage supplier bills and expenses</p>
            <p className="mt-2 text-[12px] text-text-meta">{stats.billCount} bills</p>
          </div>
        </Link>
        <Link href="/purchases/suppliers" className="col-span-6">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <Users className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
            <h3 className="mt-3 text-[16px] font-semibold text-text-primary">Suppliers</h3>
            <p className="mt-1 text-[13px] text-text-secondary">Manage your supplier database</p>
            <p className="mt-2 text-[12px] text-text-meta">{stats.supplierCount} active suppliers</p>
          </div>
        </Link>
      </div>
    </>
  );
}
