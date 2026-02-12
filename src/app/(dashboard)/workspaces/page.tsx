"use client";

import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { getSalesStats } from "@/lib/mock/sales-data";
import { getPurchaseStats } from "@/lib/mock/purchases-data";
import { getBankingStats } from "@/lib/mock/banking-data";
import {
  Building2,
  Users,
  Calendar,
  ArrowRight,
  Plus,
  Star,
  Globe,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

const organizations = [
  {
    id: "org-001",
    name: "Al Noor Trading LLC",
    role: "Owner",
    members: 5,
    currency: "AED",
    country: "UAE",
    city: "Dubai",
    fiscalYearEnd: "December",
    trn: "100XXXXXXXXX003",
    isActive: true,
    isCurrent: true,
    lastAccessed: "Just now",
  },
  {
    id: "org-002",
    name: "Gulf Properties FZCO",
    role: "Accountant",
    members: 12,
    currency: "AED",
    country: "UAE",
    city: "Abu Dhabi",
    fiscalYearEnd: "March",
    trn: "100XXXXXXXXX017",
    isActive: true,
    isCurrent: false,
    lastAccessed: "2 hours ago",
  },
  {
    id: "org-003",
    name: "Skyline Consulting Ltd",
    role: "Viewer",
    members: 3,
    currency: "USD",
    country: "UAE",
    city: "DIFC",
    fiscalYearEnd: "December",
    trn: "100XXXXXXXXX029",
    isActive: true,
    isCurrent: false,
    lastAccessed: "Yesterday",
  },
  {
    id: "org-004",
    name: "Desert Bloom Agriculture",
    role: "Accountant",
    members: 8,
    currency: "AED",
    country: "UAE",
    city: "Al Ain",
    fiscalYearEnd: "June",
    trn: "100XXXXXXXXX041",
    isActive: false,
    isCurrent: false,
    lastAccessed: "3 days ago",
  },
];

const roleColors: Record<string, string> = {
  Owner: "bg-purple-100 text-purple-700",
  Accountant: "bg-blue-100 text-blue-700",
  Viewer: "bg-muted text-text-secondary",
  Admin: "bg-success-light text-success",
};

export default function WorkspacesPage() {
  const sales = getSalesStats();
  const purchases = getPurchaseStats();
  const banking = getBankingStats();

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces" }]} />
      <div className="flex items-center justify-between">
        <PageHeader title="Workspaces" showActions={false} />
        <Button onClick={() => comingSoon("Create Organization")} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> New Organization
        </Button>
      </div>

      <p className="mb-6 text-[14px] text-text-secondary">
        Organizations you have access to. Select a workspace to manage its accounting.
      </p>

      <div className="space-y-4">
        {organizations.map((org) => (
          <Link key={org.id} href={org.isCurrent ? "/dashboard" : "#"} onClick={(e) => { if (!org.isCurrent) { e.preventDefault(); comingSoon("Switch Organization"); } }}>
            <div className={`dashboard-card group cursor-pointer transition-all hover:shadow-lg ${org.isCurrent ? "ring-2 ring-text-primary/20" : ""} ${!org.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${org.isCurrent ? "bg-gradient-to-br from-red-500 to-orange-500" : "bg-gradient-to-br from-blue-400 to-purple-400"}`}>
                  <span className="text-[18px] font-bold text-white">
                    {org.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[17px] font-semibold text-text-primary">{org.name}</h3>
                    {org.isCurrent && (
                      <span className="rounded-full bg-success-light px-2.5 py-0.5 text-[10px] font-semibold text-success">
                        CURRENT
                      </span>
                    )}
                    {!org.isActive && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-text-meta">
                        INACTIVE
                      </span>
                    )}
                    <span className={`ml-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${roleColors[org.role]}`}>
                      {org.role}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-5 text-[12px] text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />{org.city}, {org.country}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />{org.members} members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />FY ends {org.fiscalYearEnd}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />{org.lastAccessed}
                    </span>
                  </div>

                  {/* Stats for current org */}
                  {org.isCurrent && (
                    <div className="mt-3 flex items-center gap-6 border-t border-border-subtle pt-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-text-meta">Revenue</p>
                        <p className="text-[15px] font-bold text-success">AED {formatNumber(sales.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-text-meta">Expenses</p>
                        <p className="text-[15px] font-bold text-error">AED {formatNumber(purchases.totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-text-meta">Bank Balance</p>
                        <p className="text-[15px] font-bold text-text-primary">AED {formatNumber(banking.totalBalance)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center self-center">
                  <ArrowRight className="h-5 w-5 text-text-meta transition-transform group-hover:translate-x-1 group-hover:text-text-primary" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
