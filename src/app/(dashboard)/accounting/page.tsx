"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { BookOpen, FileText, BarChart3, Calendar, Shield } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    title: "Chart of Accounts",
    description: "Manage your account structure",
    icon: BookOpen,
    href: "/accounting/chart-of-accounts",
    count: "82 accounts",
  },
  {
    title: "Journal Entries",
    description: "Create and view journal entries",
    icon: FileText,
    href: "/accounting/journal-entries",
    count: "6 entries",
  },
  {
    title: "General Ledger",
    description: "View account transaction history",
    icon: BarChart3,
    href: "/accounting/general-ledger",
    count: "View ledger",
  },
  {
    title: "Trial Balance",
    description: "Verify debit/credit balance",
    icon: BarChart3,
    href: "/accounting/trial-balance",
    count: "View report",
  },
  {
    title: "Periods",
    description: "Manage accounting periods",
    icon: Calendar,
    href: "/accounting/periods",
    count: "12 periods",
  },
  {
    title: "Audit Trail",
    description: "Complete log of all system activity",
    icon: Shield,
    href: "/accounting/audit-trail",
    count: "12 entries",
  },
];

export default function AccountingPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Accounting" }]}
      />
      <PageHeader title="Accounting" showActions={false} />

      <div className="grid grid-cols-12 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="col-span-4"
            >
              <div className="dashboard-card group cursor-pointer transition-all hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary/5">
                    <Icon
                      className="h-5 w-5 text-text-primary"
                      strokeWidth={1.8}
                    />
                  </div>
                  <span className="text-[12px] font-medium text-text-meta">
                    {section.count}
                  </span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-text-primary">
                  {section.title}
                </h3>
                <p className="mt-1 text-[13px] text-text-secondary">
                  {section.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
