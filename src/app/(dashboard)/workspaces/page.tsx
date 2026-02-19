"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { getSalesStats } from "@/lib/mock/sales-data";
import { getPurchaseStats } from "@/lib/mock/purchases-data";
import { getBankingStats } from "@/lib/mock/banking-data";
import {
  Calendar,
  ArrowRight,
  Plus,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";
import { useCurrentOrgId, useSetCurrentOrg } from "@/hooks/use-organization";

type OrgItem = {
  id: string;
  name: string;
  role: string;
  currency: string;
  taxRegistrationNumber: string | null;
  fiscalYearStart: number;
  subscriptionPlan: string;
  tokenBalance: number;
};

const roleColors: Record<string, string> = {
  Owner: "bg-purple-100 text-purple-700",
  Accountant: "bg-blue-100 text-blue-700",
  Viewer: "bg-muted text-text-secondary",
  Admin: "bg-success-light text-success",
};

const fiscalMonthNames: Record<number, string> = {
  1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
  7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December",
};

export default function WorkspacesPage() {
  const currentOrgId = useCurrentOrgId();
  const setCurrentOrg = useSetCurrentOrg();
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/org/list")
      .then((res) => res.ok ? res.json() : { organizations: [] })
      .then((data: { organizations: OrgItem[] }) => {
        setOrganizations(data.organizations ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sales = getSalesStats();
  const purchases = getPurchaseStats();
  const banking = getBankingStats();

  const handleOrgClick = async (org: OrgItem) => {
    if (org.id === currentOrgId) return;
    try {
      await setCurrentOrg(org.id);
    } catch {
      comingSoon("Switch Organization");
    }
  };

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

      {loading ? (
        <div className="dashboard-card text-center text-text-secondary py-8">Loading workspaces...</div>
      ) : organizations.length === 0 ? (
        <div className="dashboard-card text-center text-text-secondary py-8">
          No organizations yet. Complete onboarding to create your first workspace.
          <Link href="/onboarding" className="mt-3 block text-text-primary font-medium hover:underline">Go to onboarding</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => {
            const isCurrent = org.id === currentOrgId;
            return (
              <div
                key={org.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOrgClick(org)}
                onKeyDown={(e) => e.key === "Enter" && handleOrgClick(org)}
                className={`dashboard-card group cursor-pointer transition-all hover:shadow-lg ${isCurrent ? "ring-2 ring-text-primary/20" : ""}`}
              >
                <div className="flex items-start gap-5">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isCurrent ? "bg-gradient-to-br from-red-500 to-orange-500" : "bg-gradient-to-br from-blue-400 to-purple-400"}`}>
                    <span className="text-[18px] font-bold text-white">
                      {org.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[17px] font-semibold text-text-primary">{org.name}</h3>
                      {isCurrent && (
                        <span className="rounded-full bg-success-light px-2.5 py-0.5 text-[10px] font-semibold text-success">
                          CURRENT
                        </span>
                      )}
                      <span className={`ml-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${roleColors[org.role] ?? roleColors.Viewer}`}>
                        {org.role}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-5 text-[12px] text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> {org.currency}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> FY starts {fiscalMonthNames[org.fiscalYearStart] ?? "Jan"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        Tokens: {org.tokenBalance}
                      </span>
                    </div>

                    {isCurrent && (
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

                  <div className="flex items-center self-center">
                    <ArrowRight className="h-5 w-5 text-text-meta transition-transform group-hover:translate-x-1 group-hover:text-text-primary" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
