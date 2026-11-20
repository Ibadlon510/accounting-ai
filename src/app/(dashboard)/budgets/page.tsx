"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AddBudgetPanel,
  type BudgetRecord,
} from "@/components/modals/add-budget-panel";
import { usePageTitle } from "@/hooks/use-page-title";
import { useOrgConfig } from "@/hooks/use-organization";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import {
  BarChart3,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type VarianceLine = {
  lineId: string;
  accountCode: string | null;
  accountName: string | null;
  periodName: string | null;
  startDate: string;
  endDate: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number | null;
  isOverBudget: boolean;
  isUnderBudget: boolean;
};

type VarianceReport = {
  budget: { id: string; name: string; currency: string };
  summary: {
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
    totalVariancePercent: number | null;
    overBudgetCount: number;
    underBudgetCount: number;
  };
  lines: VarianceLine[];
};

export default function BudgetsPage() {
  usePageTitle("Budgets");
  const orgConfig = useOrgConfig();
  const ccy = orgConfig.currency;

  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [variance, setVariance] = useState<VarianceReport | null>(null);
  const [varianceLoading, setVarianceLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/budgets", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { budgets: [] }))
      .then((d) => setBudgets(d.budgets ?? []))
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return budgets;
    return budgets.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q)
    );
  }, [budgets, search]);

  const stats = useMemo(() => {
    return {
      total: budgets.length,
      active: budgets.filter((b) => b.status === "active").length,
      draft: budgets.filter((b) => b.status === "draft").length,
      budgeted: budgets.reduce((s, b) => s + (b.totalBudgeted ?? 0), 0),
    };
  }, [budgets]);

  function handleSaved(budget: BudgetRecord) {
    setBudgets((prev) => [budget, ...prev]);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this budget and all of its lines?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Delete failed");
        return;
      }
      showSuccess("Budget deleted");
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      if (variance?.budget.id === id) setVariance(null);
    } catch {
      showError("Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function loadVariance(id: string) {
    setVarianceLoading(true);
    try {
      const res = await fetch(`/api/budgets/${id}/variance`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to load variance");
        return;
      }
      setVariance(json);
    } catch {
      showError("Failed to load variance");
    } finally {
      setVarianceLoading(false);
    }
  }

  const statusClass = (status: string) => {
    if (status === "active") return "bg-success/10 text-success";
    if (status === "draft") return "bg-amber-500/10 text-amber-700";
    if (status === "closed") return "bg-muted text-text-meta";
    return "bg-muted text-text-meta";
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Budgets" },
        ]}
      />
      <PageHeader title="Budgets" />

      <p className="mb-6 max-w-2xl text-[14px] text-text-secondary">
        Set budgets per account and period, then compare budgeted amounts to posted
        journal actuals.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="dashboard-card border-l-[3px] border-l-text-primary">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/10">
            <PiggyBank className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            All budgets
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-text-primary">
            {stats.total}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-success">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Active
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-success">
            {stats.active}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-amber-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
            <TrendingDown className="h-5 w-5 text-amber-700" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Draft
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-amber-700">
            {stats.draft}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-[var(--accent-ai)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
            <BarChart3 className="h-5 w-5 text-[var(--accent-ai)]" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Total budgeted
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[var(--accent-ai)]">
            {ccy} {formatNumber(stats.budgeted)}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search budgets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px]"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" /> New budget
        </Button>
      </div>

      <div className="dashboard-card mb-8 overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-3">Budget</div>
          <div className="col-span-2">Period</div>
          <div className="col-span-1">Lines</div>
          <div className="col-span-2 text-right">Budgeted</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            Loading budgets…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            No budgets yet. Create one with account lines to track variance.
          </div>
        )}

        {!loading &&
          filtered.map((budget) => (
            <div
              key={budget.id}
              className="grid grid-cols-12 items-center gap-3 border-b border-border-subtle px-6 py-3 last:border-0"
            >
              <div className="col-span-3">
                <p className="text-[13px] font-semibold text-text-primary">
                  {budget.name}
                </p>
                <p className="text-[11px] text-text-meta">
                  {budget.startDate} → {budget.endDate}
                </p>
              </div>
              <div className="col-span-2 text-[13px] text-text-secondary">
                {budget.periodId
                  ? budget.lines.find((l) => l.periodName)?.periodName ?? "Linked period"
                  : "Date range"}
              </div>
              <div className="col-span-1 text-[13px] text-text-secondary">
                {budget.lineCount}
              </div>
              <div className="col-span-2 text-right font-mono text-[13px] font-semibold">
                {formatNumber(budget.totalBudgeted)}
              </div>
              <div className="col-span-1">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(budget.status)}`}
                >
                  {budget.status}
                </span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg text-[12px]"
                  disabled={varianceLoading && variance?.budget.id === budget.id}
                  onClick={() => loadVariance(budget.id)}
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Variance
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-lg text-[12px] text-error"
                  disabled={busyId === budget.id}
                  onClick={() => handleDelete(budget.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
      </div>

      {variance && (
        <div className="dashboard-card overflow-hidden !p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-6 py-4">
            <div>
              <h3 className="text-[16px] font-semibold text-text-primary">
                Variance — {variance.budget.name}
              </h3>
              <p className="mt-0.5 text-[12px] text-text-meta">
                Budget vs posted journal actuals (normal-balance signed)
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-[13px]">
              <span>
                Budgeted{" "}
                <strong className="font-mono">
                  {formatNumber(variance.summary.totalBudgeted)}
                </strong>
              </span>
              <span>
                Actual{" "}
                <strong className="font-mono">
                  {formatNumber(variance.summary.totalActual)}
                </strong>
              </span>
              <span
                className={
                  variance.summary.totalVariance > 0
                    ? "text-error"
                    : variance.summary.totalVariance < 0
                      ? "text-success"
                      : ""
                }
              >
                Variance{" "}
                <strong className="font-mono">
                  {formatNumber(variance.summary.totalVariance)}
                  {variance.summary.totalVariancePercent != null
                    ? ` (${variance.summary.totalVariancePercent}%)`
                    : ""}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            <div className="col-span-3">Account</div>
            <div className="col-span-2">Window</div>
            <div className="col-span-2 text-right">Budgeted</div>
            <div className="col-span-2 text-right">Actual</div>
            <div className="col-span-3 text-right">Variance</div>
          </div>

          {variance.lines.map((line) => (
            <div
              key={line.lineId}
              className="grid grid-cols-12 items-center gap-3 border-b border-border-subtle px-6 py-3 last:border-0"
            >
              <div className="col-span-3">
                <p className="text-[13px] font-semibold text-text-primary">
                  {line.accountCode} — {line.accountName}
                </p>
                {line.periodName && (
                  <p className="text-[11px] text-text-meta">{line.periodName}</p>
                )}
              </div>
              <div className="col-span-2 text-[12px] text-text-secondary">
                {line.startDate} → {line.endDate}
              </div>
              <div className="col-span-2 text-right font-mono text-[13px]">
                {formatNumber(line.budgeted)}
              </div>
              <div className="col-span-2 text-right font-mono text-[13px]">
                {formatNumber(line.actual)}
              </div>
              <div
                className={`col-span-3 text-right font-mono text-[13px] font-semibold ${
                  line.isOverBudget
                    ? "text-error"
                    : line.isUnderBudget
                      ? "text-success"
                      : "text-text-primary"
                }`}
              >
                {formatNumber(line.variance)}
                {line.variancePercent != null ? ` (${line.variancePercent}%)` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddBudgetPanel
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={handleSaved}
      />
    </>
  );
}
