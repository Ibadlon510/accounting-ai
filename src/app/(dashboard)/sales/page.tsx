"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { getSalesStats } from "@/lib/mock/sales-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Users, FileText, CreditCard, AlertTriangle, ScrollText } from "lucide-react";
import Link from "next/link";

export default function SalesPage() {
  const stats = getSalesStats();

  const cards = [
    { title: "Total Revenue", value: `AED ${formatNumber(stats.totalRevenue)}`, icon: FileText, href: "/sales/invoices", color: "text-success" },
    { title: "Outstanding", value: `AED ${formatNumber(stats.totalOutstanding)}`, icon: AlertTriangle, href: "/sales/invoices", color: "text-accent-yellow" },
    { title: "Overdue", value: `AED ${formatNumber(stats.overdueAmount)}`, icon: AlertTriangle, href: "/sales/invoices", color: "text-error" },
    { title: "Customers", value: String(stats.customerCount), icon: Users, href: "/sales/customers", color: "text-text-primary" },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Sales" }]} />
      <PageHeader title="Sales" showActions={false} />

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
        <Link href="/sales/invoices" className="col-span-4">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <FileText className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
            <h3 className="mt-3 text-[16px] font-semibold text-text-primary">Invoices</h3>
            <p className="mt-1 text-[13px] text-text-secondary">Create and manage sales invoices</p>
            <p className="mt-2 text-[12px] text-text-meta">{stats.invoiceCount} invoices</p>
          </div>
        </Link>
        <Link href="/sales/customers" className="col-span-4">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <Users className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
            <h3 className="mt-3 text-[16px] font-semibold text-text-primary">Customers</h3>
            <p className="mt-1 text-[13px] text-text-secondary">Manage your customer database</p>
            <p className="mt-2 text-[12px] text-text-meta">{stats.customerCount} active customers</p>
          </div>
        </Link>
        <Link href="/sales/payments" className="col-span-4">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <CreditCard className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
            <h3 className="mt-3 text-[16px] font-semibold text-text-primary">Payments Received</h3>
            <p className="mt-1 text-[13px] text-text-secondary">Track customer payments</p>
            <p className="mt-2 text-[12px] text-text-meta">AED {formatNumber(stats.totalPaid)} collected</p>
          </div>
        </Link>
        <Link href="/sales/statements" className="col-span-4">
          <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
            <ScrollText className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
            <h3 className="mt-3 text-[16px] font-semibold text-text-primary">Customer Statements</h3>
            <p className="mt-1 text-[13px] text-text-secondary">View account statements per customer</p>
            <p className="mt-2 text-[12px] text-text-meta">{stats.customerCount} customers</p>
          </div>
        </Link>
      </div>
    </>
  );
}
