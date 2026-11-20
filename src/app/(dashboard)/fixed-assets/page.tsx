"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import {
  AddFixedAssetPanel,
  type FixedAssetRecord,
} from "@/components/modals/add-fixed-asset-panel";
import { usePageTitle } from "@/hooks/use-page-title";
import { useOrgConfig } from "@/hooks/use-organization";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import {
  Building2,
  CalendarClock,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";

type DepRun = {
  id: string;
  period: string;
  periodYear: number;
  periodMonth: number;
  totalAmount: number;
  assetCount: number;
  entryNumber?: string;
  journalEntryId: string | null;
};

export default function FixedAssetsPage() {
  usePageTitle("Fixed Assets");
  const orgConfig = useOrgConfig();
  const ccy = orgConfig.currency;

  const [assets, setAssets] = useState<FixedAssetRecord[]>([]);
  const [runs, setRuns] = useState<DepRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const now = new Date();
  const [depYear, setDepYear] = useState(String(now.getFullYear()));
  const [depMonth, setDepMonth] = useState(String(now.getMonth() + 1));
  const [runningDep, setRunningDep] = useState(false);

  const [disposeId, setDisposeId] = useState<string | null>(null);
  const [disposeDate, setDisposeDate] = useState(() => now.toISOString().slice(0, 10));
  const [disposeProceeds, setDisposeProceeds] = useState("0");
  const [disposing, setDisposing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/fixed-assets", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : { assets: [] }
      ),
      fetch("/api/fixed-assets/depreciate", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : { runs: [] }
      ),
    ])
      .then(([a, d]) => {
        setAssets(a.assets ?? []);
        setRuns(d.runs ?? []);
      })
      .catch(() => {
        setAssets([]);
        setRuns([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.assetNumber.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [assets, search]);

  const stats = useMemo(() => {
    const active = assets.filter((a) => a.isActive && a.status !== "disposed");
    return {
      count: active.length,
      cost: active.reduce((s, a) => s + a.cost, 0),
      book: active.reduce((s, a) => s + a.bookValue, 0),
      accum: active.reduce((s, a) => s + a.accumulatedDepreciation, 0),
    };
  }, [assets]);

  function handleSaved(asset: FixedAssetRecord) {
    setAssets((prev) => [asset, ...prev]);
  }

  async function handleRunDepreciation() {
    setRunningDep(true);
    try {
      const res = await fetch("/api/fixed-assets/depreciate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodYear: Number(depYear),
          periodMonth: Number(depMonth),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Depreciation failed");
        return;
      }
      showSuccess(
        "Depreciation posted",
        `${json.run.entryNumber}: ${ccy} ${formatNumber(json.run.totalAmount)} across ${json.run.assetCount} assets.`
      );
      load();
    } catch {
      showError("Depreciation failed");
    } finally {
      setRunningDep(false);
    }
  }

  async function handleDispose() {
    if (!disposeId) return;
    setDisposing(true);
    try {
      const res = await fetch(`/api/fixed-assets/${disposeId}/dispose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposalDate: disposeDate,
          proceeds: Number(disposeProceeds) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Disposal failed");
        return;
      }
      showSuccess(
        "Asset disposed",
        `${json.disposal.entryNumber} posted. Gain/loss: ${ccy} ${formatNumber(json.disposal.gainOrLoss)}.`
      );
      setDisposeId(null);
      load();
    } catch {
      showError("Disposal failed");
    } finally {
      setDisposing(false);
    }
  }

  async function handleDeactivate(asset: FixedAssetRecord) {
    const res = await fetch(`/api/fixed-assets/${asset.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError(json.error ?? "Cannot deactivate");
      return;
    }
    showSuccess("Asset deactivated");
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? json.asset : a)));
  }

  const statusClass = (status: string) => {
    if (status === "active") return "bg-success/10 text-success";
    if (status === "fully_depreciated") return "bg-blue-500/10 text-blue-700";
    if (status === "disposed") return "bg-muted text-text-meta";
    return "bg-muted text-text-meta";
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Fixed Assets" },
        ]}
      />
      <PageHeader title="Fixed Assets" />

      <p className="mb-6 max-w-2xl text-[14px] text-text-secondary">
        Asset register with depreciation schedules and disposals. Records post to the ledger;
        entries can only be reversed, not edited or deleted.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="dashboard-card border-l-[3px] border-l-text-primary">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/10">
            <Building2 className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Active assets
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-text-primary">
            {stats.count}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-[var(--accent-ai)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
            <Wallet className="h-5 w-5 text-[var(--accent-ai)]" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Gross cost
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[var(--accent-ai)]">
            {ccy} {formatNumber(stats.cost)}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-amber-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
            <CalendarClock className="h-5 w-5 text-amber-700" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Accum. dep.
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-amber-700">
            {ccy} {formatNumber(stats.accum)}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-success">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
            <Wallet className="h-5 w-5 text-success" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Net book value
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-success">
            {ccy} {formatNumber(stats.book)}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="dashboard-card lg:col-span-7">
          <h3 className="text-[15px] font-semibold text-text-primary">Run depreciation</h3>
          <p className="mt-1 text-[12px] text-text-meta">
            Posts Dr 6700 Depreciation Expense / Cr 1600 Accumulated Depreciation for the period.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-meta">
                Year
              </label>
              <Input
                type="number"
                value={depYear}
                onChange={(e) => setDepYear(e.target.value)}
                className="h-10 w-28 rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-meta">
                Month
              </label>
              <StyledSelect
                value={depMonth}
                onChange={(e) => setDepMonth(e.target.value)}
                className="h-10 w-36 rounded-xl"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {new Date(2000, i, 1).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </StyledSelect>
            </div>
            <Button
              onClick={handleRunDepreciation}
              disabled={runningDep}
              className="h-10 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
            >
              {runningDep ? "Posting…" : "Run depreciation"}
            </Button>
          </div>
        </div>

        <div className="dashboard-card lg:col-span-5">
          <h3 className="text-[15px] font-semibold text-text-primary">Recent runs</h3>
          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
            {runs.length === 0 && (
              <p className="text-[13px] text-text-meta">No depreciation runs yet.</p>
            )}
            {runs.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2"
              >
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{r.period}</p>
                  <p className="text-[11px] text-text-meta">{r.assetCount} assets</p>
                </div>
                <p className="font-mono text-[13px] font-semibold text-text-primary">
                  {ccy} {formatNumber(r.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px]"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" /> Register asset
        </Button>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-3">Asset</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1 text-right">Cost</div>
          <div className="col-span-1 text-right">Accum.</div>
          <div className="col-span-1 text-right">Book</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            Loading assets…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            No fixed assets yet. Register one to capitalize and depreciate.
          </div>
        )}

        {!loading &&
          filtered.map((asset) => (
            <div
              key={asset.id}
              className="grid grid-cols-12 items-center gap-3 border-b border-border-subtle px-6 py-3 last:border-0"
            >
              <div className="col-span-3">
                <p className="text-[13px] font-semibold text-text-primary">{asset.name}</p>
                <p className="text-[11px] text-text-meta">{asset.assetNumber}</p>
              </div>
              <div className="col-span-2 text-[13px] capitalize text-text-secondary">
                {asset.category}
              </div>
              <div className="col-span-1 text-right font-mono text-[13px]">
                {formatNumber(asset.cost)}
              </div>
              <div className="col-span-1 text-right font-mono text-[13px]">
                {formatNumber(asset.accumulatedDepreciation)}
              </div>
              <div className="col-span-1 text-right font-mono text-[13px] font-semibold">
                {formatNumber(asset.bookValue)}
              </div>
              <div className="col-span-1">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(asset.status)}`}
                >
                  {asset.status.replace("_", " ")}
                </span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                {asset.status !== "disposed" && asset.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-[12px]"
                    onClick={() => {
                      setDisposeId(asset.id);
                      setDisposeDate(new Date().toISOString().slice(0, 10));
                      setDisposeProceeds("0");
                    }}
                  >
                    Dispose
                  </Button>
                )}
                {asset.status === "active" &&
                  asset.accumulatedDepreciation === 0 &&
                  asset.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg text-[12px] text-error"
                      onClick={() => handleDeactivate(asset)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
              </div>
            </div>
          ))}
      </div>

      {disposeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="text-[16px] font-semibold text-text-primary">Dispose asset</h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              Posts an immutable disposal journal (clear cost &amp; accum. dep., record
              proceeds and gain/loss).
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-text-meta">
                  Disposal date
                </label>
                <Input
                  type="date"
                  value={disposeDate}
                  onChange={(e) => setDisposeDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase text-text-meta">
                  Proceeds
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={disposeProceeds}
                  onChange={(e) => setDisposeProceeds(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setDisposeId(null)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-text-primary text-white hover:bg-text-primary/90"
                disabled={disposing}
                onClick={handleDispose}
              >
                {disposing ? "Posting…" : "Dispose & post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddFixedAssetPanel
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={handleSaved}
      />
    </>
  );
}
