"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/use-page-title";
import { useOrgConfig } from "@/hooks/use-organization";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import {
  Building2,
  GitMerge,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
} from "lucide-react";

type OrgOption = {
  id: string;
  name: string;
  currency: string;
  subscriptionPlan: string;
  role: string;
};

type GroupMember = {
  id: string;
  organizationId: string;
  organizationName: string;
  subscriptionPlan: string;
  currency: string;
};

type EliminationRule = {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  isActive: boolean;
};

type Group = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  members: GroupMember[];
  eliminationRules: EliminationRule[];
};

type Reports = {
  method: string;
  limitations: string[];
  eliminationsApplied: boolean;
  period: { from: string | null; to: string | null };
  members: Array<{
    organizationId: string;
    name: string;
    currency: string;
    subscriptionPlan: string;
    archived: boolean;
  }>;
  trialBalance: Array<{
    accountCode: string;
    accountName: string;
    accountCategory: string;
    debit: number;
    credit: number;
  }>;
  pnl: {
    revenue: { code: string; name: string; amount: number }[];
    expense: { code: string; name: string; amount: number }[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  bs: {
    asset: { code: string; name: string; amount: number }[];
    liability: { code: string; name: string; amount: number }[];
    equity: { code: string; name: string; amount: number }[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    retainedEarnings: number;
  };
};

type ReportTab = "trial_balance" | "pnl" | "bs";

export default function ConsolidationPage() {
  usePageTitle("Consolidation");
  const orgConfig = useOrgConfig();
  const ccy = orgConfig.currency || "AED";

  const [groups, setGroups] = useState<Group[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [addMemberId, setAddMemberId] = useState("");
  const [busy, setBusy] = useState(false);

  const [from, setFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [reports, setReports] = useState<Reports | null>(null);
  const [reportTab, setReportTab] = useState<ReportTab>("trial_balance");
  const [reportsLoading, setReportsLoading] = useState(false);

  const selected = useMemo(
    () => groups.find((g) => g.id === selectedId) ?? null,
    [groups, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, oRes] = await Promise.all([
        fetch("/api/consolidation/groups", { cache: "no-store" }),
        fetch("/api/org/list", { cache: "no-store" }),
      ]);
      const gJson = gRes.ok ? await gRes.json() : { groups: [] };
      const oJson = oRes.ok ? await oRes.json() : { organizations: [] };
      const nextGroups: Group[] = gJson.groups ?? [];
      setGroups(nextGroups);
      setOrgs(oJson.organizations ?? []);
      setSelectedId((prev) => {
        if (prev && nextGroups.some((g) => g.id === prev)) return prev;
        return nextGroups[0]?.id ?? "";
      });
    } catch {
      setGroups([]);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const availableToAdd = useMemo(() => {
    if (!selected) return orgs;
    const memberSet = new Set(selected.members.map((m) => m.organizationId));
    return orgs.filter((o) => !memberSet.has(o.id));
  }, [orgs, selected]);

  async function handleCreate() {
    if (!name.trim()) {
      showError("Group name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/consolidation/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          memberOrganizationIds: selectedMemberIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to create group");
        return;
      }
      showSuccess("Consolidation group created");
      setName("");
      setDescription("");
      setSelectedMemberIds([]);
      setGroups((prev) => [json.group, ...prev]);
      setSelectedId(json.group.id);
      setReports(null);
    } catch {
      showError("Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this consolidation group?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/consolidation/groups/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Delete failed");
        return;
      }
      showSuccess("Group deleted");
      setGroups((prev) => prev.filter((g) => g.id !== id));
      if (selectedId === id) {
        setSelectedId("");
        setReports(null);
      }
    } catch {
      showError("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddMember() {
    if (!selected || !addMemberId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/consolidation/groups/${selected.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: addMemberId }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to add company");
        return;
      }
      showSuccess("Company added");
      setGroups((prev) =>
        prev.map((g) => (g.id === json.group.id ? json.group : g))
      );
      setAddMemberId("");
      setReports(null);
    } catch {
      showError("Failed to add company");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMember(organizationId: string) {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/consolidation/groups/${selected.id}/members?organizationId=${encodeURIComponent(organizationId)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to remove company");
        return;
      }
      showSuccess("Company removed");
      setGroups((prev) =>
        prev.map((g) => (g.id === json.group.id ? json.group : g))
      );
      setReports(null);
    } catch {
      showError("Failed to remove company");
    } finally {
      setBusy(false);
    }
  }

  async function loadReports() {
    if (!selected) {
      showError("Select a consolidation group first");
      return;
    }
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(
        `/api/consolidation/groups/${selected.id}/reports?${params}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to generate consolidated reports");
        return;
      }
      setReports(json);
    } catch {
      showError("Failed to generate consolidated reports");
    } finally {
      setReportsLoading(false);
    }
  }

  function toggleCreateMember(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Consolidation" },
        ]}
      />
      <PageHeader title="Consolidation" />
      <p className="mt-1 text-[13px] text-text-secondary">
        Combine several companies into one set of group figures. MVP sums posted
        journals by account code or name.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-surface p-5">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-text-primary" />
              <h2 className="text-[15px] font-semibold text-text-primary">
                New group
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-xl"
              />
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 rounded-xl"
              />
              <div>
                <p className="mb-2 text-[12px] font-medium text-text-meta">
                  Member companies (you must have a role in each)
                </p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-border-subtle p-2">
                  {orgs.length === 0 ? (
                    <p className="px-2 py-1 text-[12px] text-text-meta">
                      No accessible organizations
                    </p>
                  ) : (
                    orgs.map((o) => (
                      <label
                        key={o.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-canvas"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(o.id)}
                          onChange={() => toggleCreateMember(o.id)}
                          className="rounded border-border-subtle"
                        />
                        <span className="text-[13px] text-text-primary">
                          {o.name}
                        </span>
                        {o.subscriptionPlan === "ARCHIVE" && (
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-text-meta">
                            <Lock className="h-2.5 w-2.5" />
                            Archive
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full rounded-xl"
              >
                {creating ? "Creating…" : "Create group"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-text-primary">
                Groups
              </h2>
              <button
                type="button"
                onClick={load}
                className="rounded-lg p-1.5 text-text-meta hover:bg-canvas"
                aria-label="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {loading ? (
              <p className="text-[13px] text-text-meta">Loading…</p>
            ) : groups.length === 0 ? (
              <p className="text-[13px] text-text-meta">
                No consolidation groups yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {groups.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(g.id);
                        setReports(null);
                      }}
                      className={`flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selectedId === g.id
                          ? "border-text-primary/20 bg-canvas"
                          : "border-border-subtle hover:bg-canvas/60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <GitMerge className="h-3.5 w-3.5 text-text-primary" />
                          <span className="text-[13px] font-semibold text-text-primary">
                            {g.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-text-meta">
                          {g.members.length} compan
                          {g.members.length === 1 ? "y" : "ies"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(g.id);
                        }}
                        className="rounded-lg p-1 text-text-meta hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete group"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="xl:col-span-8 space-y-4">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-border-subtle bg-surface p-10 text-center">
              <Building2 className="mx-auto h-8 w-8 text-text-meta" />
              <p className="mt-3 text-[14px] text-text-secondary">
                Select or create a consolidation group to manage membership and
                generate group reports.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border-subtle bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-semibold text-text-primary">
                      {selected.name}
                    </h2>
                    {selected.description && (
                      <p className="mt-1 text-[13px] text-text-secondary">
                        {selected.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-[13px] font-semibold text-text-primary">
                    Member companies
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {selected.members.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-text-meta" />
                          <span className="text-[13px] text-text-primary">
                            {m.organizationName}
                          </span>
                          <span className="text-[11px] text-text-meta">
                            {m.currency}
                          </span>
                          {m.subscriptionPlan === "ARCHIVE" && (
                            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-text-meta">
                              <Lock className="h-2.5 w-2.5" />
                              Archive (reports only)
                            </span>
                          )}
                          {m.organizationId === selected.organizationId && (
                            <span className="rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-text-meta">
                              Owner
                            </span>
                          )}
                        </div>
                        {m.organizationId !== selected.organizationId && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleRemoveMember(m.organizationId)
                            }
                            className="text-[12px] text-text-meta hover:text-destructive"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {availableToAdd.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={addMemberId}
                        onChange={(e) => setAddMemberId(e.target.value)}
                        className="h-9 rounded-xl border border-border-subtle bg-surface px-3 text-[13px]"
                      >
                        <option value="">Add company…</option>
                        {availableToAdd.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                            {o.subscriptionPlan === "ARCHIVE"
                              ? " (Archive)"
                              : ""}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!addMemberId || busy}
                        onClick={handleAddMember}
                        className="rounded-xl"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {selected.eliminationRules.length > 0 && (
                  <div className="mt-5 rounded-xl border border-dashed border-border-subtle bg-canvas/50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-text-meta" />
                      <div>
                        <p className="text-[12px] font-semibold text-text-primary">
                          Elimination rules (stub)
                        </p>
                        {selected.eliminationRules.map((r) => (
                          <p
                            key={r.id}
                            className="mt-1 text-[12px] text-text-secondary"
                          >
                            {r.name}
                            {r.isActive ? "" : " — inactive / not applied"}
                            {r.description ? `. ${r.description}` : ""}
                          </p>
                        ))}
                        <p className="mt-1 text-[11px] text-text-meta">
                          TODO: apply intercompany eliminations when generating
                          consolidated reports.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border-subtle bg-surface p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-primary">
                      Consolidated reports
                    </h3>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      Simple aggregation of posted journals by CoA code/name.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="h-9 w-40 rounded-xl"
                    />
                    <Input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="h-9 w-40 rounded-xl"
                    />
                    <Button
                      onClick={loadReports}
                      disabled={reportsLoading}
                      className="rounded-xl"
                    >
                      {reportsLoading ? "Generating…" : "Generate"}
                    </Button>
                  </div>
                </div>

                {reports && (
                  <div className="mt-5 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["trial_balance", "Trial balance"],
                          ["pnl", "Profit & loss"],
                          ["bs", "Balance sheet"],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setReportTab(key)}
                          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                            reportTab === key
                              ? "bg-text-primary text-white"
                              : "bg-canvas text-text-secondary"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-xl bg-canvas/70 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-meta">
                        Method: {reports.method}
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-text-secondary">
                        {reports.limitations.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>

                    {reportTab === "trial_balance" && (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-[13px]">
                          <thead>
                            <tr className="border-b border-border-subtle text-text-meta">
                              <th className="py-2 pr-3 font-medium">Code</th>
                              <th className="py-2 pr-3 font-medium">Account</th>
                              <th className="py-2 pr-3 text-right font-medium">
                                Debit
                              </th>
                              <th className="py-2 text-right font-medium">
                                Credit
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {reports.trialBalance.map((r) => (
                              <tr
                                key={`${r.accountCode}-${r.accountName}`}
                                className="border-b border-border-subtle/60"
                              >
                                <td className="py-2 pr-3 text-text-meta">
                                  {r.accountCode}
                                </td>
                                <td className="py-2 pr-3 text-text-primary">
                                  {r.accountName}
                                </td>
                                <td className="py-2 pr-3 text-right tabular-nums">
                                  {ccy} {formatNumber(r.debit)}
                                </td>
                                <td className="py-2 text-right tabular-nums">
                                  {ccy} {formatNumber(r.credit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {reports.trialBalance.length === 0 && (
                          <p className="py-6 text-center text-[13px] text-text-meta">
                            No posted activity in this period.
                          </p>
                        )}
                      </div>
                    )}

                    {reportTab === "pnl" && (
                      <div className="space-y-3 text-[13px]">
                        <p className="font-semibold text-text-primary">
                          Revenue
                        </p>
                        {reports.pnl.revenue.map((r) => (
                          <div
                            key={`rev-${r.code}`}
                            className="flex justify-between"
                          >
                            <span className="text-text-secondary">
                              {r.code} — {r.name}
                            </span>
                            <span className="tabular-nums">
                              {formatNumber(r.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t border-border-subtle pt-2 font-semibold">
                          <span>Total revenue</span>
                          <span className="tabular-nums">
                            {formatNumber(reports.pnl.totalRevenue)}
                          </span>
                        </div>
                        <p className="pt-2 font-semibold text-text-primary">
                          Expenses
                        </p>
                        {reports.pnl.expense.map((r) => (
                          <div
                            key={`exp-${r.code}`}
                            className="flex justify-between"
                          >
                            <span className="text-text-secondary">
                              {r.code} — {r.name}
                            </span>
                            <span className="tabular-nums">
                              {formatNumber(r.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t border-border-subtle pt-2 font-semibold">
                          <span>Total expenses</span>
                          <span className="tabular-nums">
                            {formatNumber(reports.pnl.totalExpenses)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border-subtle pt-2 text-[14px] font-semibold">
                          <span>Net income</span>
                          <span className="tabular-nums">
                            {ccy} {formatNumber(reports.pnl.netIncome)}
                          </span>
                        </div>
                      </div>
                    )}

                    {reportTab === "bs" && (
                      <div className="space-y-3 text-[13px]">
                        {(
                          [
                            ["Assets", reports.bs.asset, reports.bs.totalAssets],
                            [
                              "Liabilities",
                              reports.bs.liability,
                              reports.bs.totalLiabilities,
                            ],
                            ["Equity", reports.bs.equity, reports.bs.totalEquity],
                          ] as const
                        ).map(([title, rows, total]) => (
                          <div key={title}>
                            <p className="font-semibold text-text-primary">
                              {title}
                            </p>
                            {rows.map((r) => (
                              <div
                                key={`${title}-${r.code}`}
                                className="mt-1 flex justify-between"
                              >
                                <span className="text-text-secondary">
                                  {r.code} — {r.name}
                                </span>
                                <span className="tabular-nums">
                                  {formatNumber(r.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="mt-2 flex justify-between border-t border-border-subtle pt-2 font-semibold">
                              <span>Total {title.toLowerCase()}</span>
                              <span className="tabular-nums">
                                {formatNumber(total)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between border-t border-border-subtle pt-2 text-[12px] text-text-meta">
                          <span>Retained earnings (period P&amp;L)</span>
                          <span className="tabular-nums">
                            {formatNumber(reports.bs.retainedEarnings)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
