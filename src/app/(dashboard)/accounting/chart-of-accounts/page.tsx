"use client";

import { useState, useEffect } from "react";
import { Search, Plus, ChevronDown, ChevronRight, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StyledSelect } from "@/components/ui/styled-select";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { ImportExportButtons } from "@/components/import-export/import-export-buttons";

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

type AccountType = {
  id: string;
  name: string;
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
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(["Current Assets", "Current Liabilities", "Revenue", "Operating Expenses", "Equity"])
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formAccountTypeId, setFormAccountTypeId] = useState("");
  const [formTaxCode, setFormTaxCode] = useState("");

  const fetchAccounts = () => {
    fetch("/api/org/chart-of-accounts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [], accountTypes: [] }))
      .then((data) => {
        setAccounts(data.accounts ?? []);
        setAccountTypes(data.accountTypes ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
  );

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

  function resetForm() {
    setFormCode("");
    setFormName("");
    setFormAccountTypeId("");
    setFormTaxCode("");
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim() || !formAccountTypeId) {
      showError("Validation error", "Code, name, and account type are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/org/chart-of-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode.trim(),
          name: formName.trim(),
          accountTypeId: formAccountTypeId,
          taxCode: formTaxCode.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to create account" }));
        showError("Failed to create account", data.error);
        return;
      }

      showSuccess("Account created", `${formCode.trim()} — ${formName.trim()}`);
      resetForm();
      setShowAddDialog(false);
      setLoading(true);
      fetchAccounts();
    } catch {
      showError("Network error", "Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
        <ImportExportButtons entity="chart-of-accounts" entityLabel="Chart of Accounts" onImportComplete={fetchAccounts} />
        <Button
          onClick={() => setShowAddDialog(true)}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Add Account Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-text-primary">Add Account</h2>
              <button
                onClick={() => { setShowAddDialog(false); resetForm(); }}
                className="rounded-lg p-1.5 text-text-meta transition-colors hover:bg-black/5 hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Account Code <span className="text-error">*</span>
                </label>
                <Input
                  placeholder="e.g. 1100"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  maxLength={20}
                  className="h-9 rounded-xl border-border-subtle bg-surface text-[13px] focus-visible:ring-text-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Account Name <span className="text-error">*</span>
                </label>
                <Input
                  placeholder="e.g. Cash in Hand"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={255}
                  className="h-9 rounded-xl border-border-subtle bg-surface text-[13px] focus-visible:ring-text-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Account Type <span className="text-error">*</span>
                </label>
                <StyledSelect
                  value={formAccountTypeId}
                  onChange={(e) => setFormAccountTypeId(e.target.value)}
                >
                  <option value="">Select account type...</option>
                  {accountTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </StyledSelect>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Tax Code <span className="text-text-meta">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. VAT5, EXEMPT"
                  value={formTaxCode}
                  onChange={(e) => setFormTaxCode(e.target.value)}
                  maxLength={20}
                  className="h-9 rounded-xl border-border-subtle bg-surface text-[13px] focus-visible:ring-text-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowAddDialog(false); resetForm(); }}
                  className="h-9 rounded-xl border-border-subtle px-4 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
