"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { Search, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

type AccountRow = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isSystem: boolean;
  taxCode: string | null;
  typeName: string;
  category: string;
};

const categoryColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-700",
  liability: "bg-orange-100 text-orange-700",
  equity: "bg-purple-100 text-purple-700",
  revenue: "bg-green-100 text-green-700",
  expense: "bg-red-100 text-red-700",
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(["Current Assets", "Current Liabilities", "Revenue", "Operating Expenses", "Equity"])
  );

  useEffect(() => {
    fetch("/api/org/chart-of-accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((data) => setAccounts(data.accounts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
  );

  // Group by account type
  const grouped = filtered.reduce(
    (acc, account) => {
      const typeName = account.typeName ?? "Other";
      if (!acc[typeName]) acc[typeName] = [];
      acc[typeName].push(account);
      return acc;
    },
    {} as Record<string, typeof filtered>
  );

  function toggleType(typeName: string) {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeName)) next.delete(typeName);
      else next.add(typeName);
      return next;
    });
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Accounting", href: "/accounting" },
          { label: "Chart of Accounts" },
        ]}
      />
      <PageHeader title="Chart of Accounts" showActions={false} />

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20"
          />
        </div>
        <Button onClick={() => comingSoon("Add Account")} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Accounts Table */}
      <div className="dashboard-card overflow-hidden !p-0">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">Code</div>
          <div className="col-span-5">Account Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Grouped rows */}
        {loading ? (
          <div className="px-6 py-8 text-center text-text-secondary">Loading accounts...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="px-6 py-8 text-center text-text-secondary">No accounts found. Create an organization first.</div>
        ) : Object.entries(grouped).map(([typeName, accounts]) => {
          const isExpanded = expandedTypes.has(typeName);
          const category = accounts[0]?.category ?? "asset";

          return (
            <div key={typeName}>
              {/* Group header */}
              <button
                onClick={() => toggleType(typeName)}
                className="flex w-full items-center gap-2 border-b border-border-subtle bg-surface/50 px-6 py-2.5 text-left transition-colors hover:bg-black/[0.02]"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-text-meta" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-text-meta" />
                )}
                <span className="text-[13px] font-semibold text-text-primary">
                  {typeName}
                </span>
                <span className="text-[12px] text-text-meta">
                  ({accounts.length})
                </span>
              </button>

              {/* Account rows */}
              {isExpanded &&
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="grid grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.015]"
                  >
                    <div className="col-span-1 font-mono text-text-secondary">
                      {account.code}
                    </div>
                    <div className="col-span-5 font-medium text-text-primary">
                      {account.name}
                      {account.isSystem && (
                        <span className="ml-2 text-[10px] text-text-meta">
                          SYSTEM
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-text-secondary">
                      {typeName}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                          categoryColors[category] ?? ""
                        }`}
                      >
                        {category}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          account.isActive
                            ? "bg-success-light text-success"
                            : "bg-error-light text-error"
                        }`}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
