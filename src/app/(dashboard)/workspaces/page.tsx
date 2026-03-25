"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import {
  Calendar,
  ArrowRight,
  Plus,
  Globe,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
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

const COMMON_CURRENCIES = [
  "AED", "USD", "EUR", "GBP", "SAR", "QAR", "BHD", "KWD", "OMR",
  "INR", "PKR", "EGP", "JOD", "LBP", "TRY", "ZAR", "AUD", "CAD",
];

export default function WorkspacesPage() {
  const router = useRouter();
  const currentOrgId = useCurrentOrgId();
  const setCurrentOrg = useSetCurrentOrg();
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingRestore, setCheckingRestore] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalExpenses: 0, totalBalance: 0 });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgCurrency, setOrgCurrency] = useState("AED");

  useEffect(() => {
    fetch("/api/org/auto-restore", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { singleOrgId?: string | null; orgCount?: number }) => {
        const orgCount = data.orgCount ?? 0;
        if (orgCount === 0) {
          router.replace("/onboarding");
          return;
        }
        if (data.singleOrgId && !currentOrgId) {
          return fetch("/api/org/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId: data.singleOrgId }),
          }).then(() => {
            router.replace("/dashboard");
          });
        }
        setCheckingRestore(false);
      })
      .catch(() => setCheckingRestore(false));
  }, [router, currentOrgId]);

  const fetchOrganizations = () => {
    fetch("/api/org/list", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : { organizations: [] })
      .then((data: { organizations: OrgItem[] }) => {
        setOrganizations(data.organizations ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (checkingRestore) return;

    fetchOrganizations();

    fetch("/api/dashboard/stats", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setStats({
            totalRevenue: data.sales?.totalRevenue ?? 0,
            totalExpenses: data.purchases?.totalExpenses ?? 0,
            totalBalance: data.banking?.totalBalance ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [checkingRestore]);

  const handleOrgClick = async (org: OrgItem) => {
    if (org.id === currentOrgId) {
      window.location.href = "/dashboard";
      return;
    }
    try {
      await setCurrentOrg(org.id);
    } catch {
      showError("Switch failed", "Could not switch to this organization. Please try again.");
    }
  };

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) {
      showError("Validation error", "Organization name is required.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          currency: orgCurrency,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to create organization" }));
        showError("Failed to create organization", data.error);
        return;
      }

      const data = await res.json();
      showSuccess("Organization created", `${orgName.trim()} is ready.`);
      setOrgName("");
      setOrgCurrency("AED");
      setShowCreateDialog(false);

      // Switch to the new org
      await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: data.organization.id }),
      });
      window.location.href = "/dashboard";
    } catch {
      showError("Network error", "Could not reach the server.");
    } finally {
      setCreating(false);
    }
  }

  if (checkingRestore) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-[14px] text-text-secondary">Loading workspaces...</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces" }]} />
      <div className="flex items-center justify-between">
        <PageHeader title="Workspaces" showActions={false} />
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" /> New Organization
        </Button>
      </div>

      <p className="mb-6 text-[14px] text-text-secondary">
        Organizations you have access to. Select a workspace to manage its accounting.
      </p>

      {/* Create Organization Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-text-primary">Create Organization</h2>
              <button
                onClick={() => { setShowCreateDialog(false); setOrgName(""); setOrgCurrency("AED"); }}
                className="rounded-lg p-1.5 text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Organization Name <span className="text-error">*</span>
                </label>
                <Input
                  placeholder="e.g. Acme Trading LLC"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  maxLength={255}
                  autoFocus
                  className="h-9 rounded-xl border-border-subtle bg-surface text-[13px] focus-visible:ring-text-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Currency
                </label>
                <StyledSelect
                  value={orgCurrency}
                  onChange={(e) => setOrgCurrency(e.target.value)}
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </StyledSelect>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowCreateDialog(false); setOrgName(""); setOrgCurrency("AED"); }}
                  className="h-9 rounded-xl border-border-subtle px-4 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="h-9 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {creating ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                          <p className="text-[15px] font-bold text-success">AED {formatNumber(stats.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-text-meta">Expenses</p>
                          <p className="text-[15px] font-bold text-error">AED {formatNumber(stats.totalExpenses)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-text-meta">Bank Balance</p>
                          <p className="text-[15px] font-bold text-text-primary">AED {formatNumber(stats.totalBalance)}</p>
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
