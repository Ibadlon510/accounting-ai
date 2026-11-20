"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import {
  AddProjectPanel,
  type ProjectRecord,
} from "@/components/modals/add-project-panel";
import { usePageTitle } from "@/hooks/use-page-title";
import { useOrgConfig } from "@/hooks/use-organization";
import { showError, showSuccess } from "@/lib/utils/toast-helpers";
import {
  BarChart3,
  FolderKanban,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type PnLReport = {
  project: ProjectRecord;
  summary: {
    journalIncome: number;
    journalCost: number;
    documentIncome: number;
    documentCost: number;
    totalIncome: number;
    totalCost: number;
    netProfit: number;
    marginPercent: number | null;
  };
  incomeAccounts: { code: string; name: string; amount: number }[];
  costAccounts: { code: string; name: string; amount: number }[];
  invoices: Array<{
    id: string;
    number: string;
    issueDate: string;
    status: string;
    subtotal: number;
    countedInJournal: boolean;
  }>;
  bills: Array<{
    id: string;
    number: string;
    issueDate: string;
    status: string;
    subtotal: number;
    countedInJournal: boolean;
  }>;
};

export default function ProjectsPage() {
  usePageTitle("Projects & Costing");
  const orgConfig = useOrgConfig();
  const ccy = orgConfig.currency;

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pnl, setPnl] = useState<PnLReport | null>(null);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [from, setFrom] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-01-01`;
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignType, setAssignType] = useState<"invoice" | "bill" | "journal_line">(
    "invoice"
  );
  const [assignTargetId, setAssignTargetId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/projects", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code ?? "").toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      costCentres: projects.filter((p) => p.kind === "cost_centre").length,
      projects: projects.filter((p) => p.kind === "project").length,
    };
  }, [projects]);

  function handleSaved(project: ProjectRecord) {
    setProjects((prev) => [project, ...prev]);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this project? Tags on invoices, bills, and journal lines will be cleared.")) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Delete failed");
        return;
      }
      showSuccess("Project deleted");
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (pnl?.project.id === id) setPnl(null);
    } catch {
      showError("Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function loadPnL(id: string) {
    setPnlLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/projects/${id}/pnl?${params}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Failed to load project P&L");
        return;
      }
      setPnl(json);
      setAssignProjectId(id);
    } catch {
      showError("Failed to load project P&L");
    } finally {
      setPnlLoading(false);
    }
  }

  async function handleAssign() {
    if (!assignProjectId) {
      showError("Select a project first");
      return;
    }
    if (!assignTargetId.trim()) {
      showError("Enter an invoice, bill, or journal line id");
      return;
    }
    setAssignBusy(true);
    try {
      const res = await fetch(`/api/projects/${assignProjectId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: assignType,
          id: assignTargetId.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error ?? "Assign failed");
        return;
      }
      showSuccess("Tagged with project");
      setAssignTargetId("");
      await loadPnL(assignProjectId);
    } catch {
      showError("Assign failed");
    } finally {
      setAssignBusy(false);
    }
  }

  const statusClass = (status: string) => {
    if (status === "active") return "bg-success/10 text-success";
    if (status === "completed") return "bg-blue-500/10 text-blue-700";
    return "bg-muted text-text-meta";
  };

  const kindLabel = (kind: string) =>
    kind === "cost_centre" ? "Cost centre" : "Project";

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Projects & Costing" },
        ]}
      />
      <PageHeader title="Projects & Costing" />

      <p className="mb-6 max-w-2xl text-[14px] text-text-secondary">
        Track income and cost by project or cost centre. Tag invoices, bills, or
        journal lines, then open project profit and loss.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="dashboard-card border-l-[3px] border-l-text-primary">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-text-primary/10">
            <FolderKanban className="h-5 w-5 text-text-primary" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            All
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
            <FolderKanban className="h-5 w-5 text-amber-700" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Projects
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-amber-700">
            {stats.projects}
          </p>
        </div>
        <div className="dashboard-card border-l-[3px] border-l-[var(--accent-ai)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-ai)]/10">
            <TrendingDown className="h-5 w-5 text-[var(--accent-ai)]" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
            Cost centres
          </p>
          <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-[var(--accent-ai)]">
            {stats.costCentres}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 w-40 rounded-xl border-border-subtle text-[13px]"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 w-40 rounded-xl border-border-subtle text-[13px]"
          />
          <Button
            onClick={() => setAddOpen(true)}
            className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
          >
            <Plus className="h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      <div className="dashboard-card mb-8 overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Code</div>
          <div className="col-span-2">Kind</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            Loading projects…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-[13px] text-text-meta">
            No projects yet. Create a project or cost centre to start tagging
            activity.
          </div>
        )}

        {!loading &&
          filtered.map((project) => (
            <div
              key={project.id}
              className="grid grid-cols-12 items-center gap-3 border-b border-border-subtle px-6 py-3 last:border-0"
            >
              <div className="col-span-3">
                <p className="text-[13px] font-semibold text-text-primary">
                  {project.name}
                </p>
                {(project.startDate || project.endDate) && (
                  <p className="text-[11px] text-text-meta">
                    {project.startDate ?? "—"} → {project.endDate ?? "—"}
                  </p>
                )}
              </div>
              <div className="col-span-2 font-mono text-[13px] text-text-secondary">
                {project.code ?? "—"}
              </div>
              <div className="col-span-2 text-[13px] text-text-secondary">
                {kindLabel(project.kind)}
              </div>
              <div className="col-span-2">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(project.status)}`}
                >
                  {project.status}
                </span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-lg text-[12px]"
                  disabled={pnlLoading && pnl?.project.id === project.id}
                  onClick={() => loadPnL(project.id)}
                >
                  <BarChart3 className="h-3.5 w-3.5" /> P&amp;L
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 rounded-lg text-[12px] text-error"
                  disabled={busyId === project.id}
                  onClick={() => handleDelete(project.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
      </div>

      <div className="dashboard-card mb-8">
        <h3 className="mb-3 text-[15px] font-semibold text-text-primary">
          Tag activity
        </h3>
        <p className="mb-4 text-[13px] text-text-secondary">
          Assign a project to an existing invoice, bill, or journal line by id.
          Posted invoice/bill journals are stamped so P&amp;L picks them up.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-meta">
              Project
            </label>
            <StyledSelect
              value={assignProjectId}
              onChange={(e) => setAssignProjectId(e.target.value)}
              className="h-10 rounded-xl"
            >
              <option value="">Select…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} — ` : ""}
                  {p.name}
                </option>
              ))}
            </StyledSelect>
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-meta">
              Type
            </label>
            <StyledSelect
              value={assignType}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "invoice" || v === "bill" || v === "journal_line") {
                  setAssignType(v);
                }
              }}
              className="h-10 rounded-xl"
            >
              <option value="invoice">Invoice</option>
              <option value="bill">Bill</option>
              <option value="journal_line">Journal line</option>
            </StyledSelect>
          </div>
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-meta">
              Record id
            </label>
            <Input
              value={assignTargetId}
              onChange={(e) => setAssignTargetId(e.target.value)}
              placeholder="UUID"
              className="h-10 rounded-xl font-mono text-[13px]"
            />
          </div>
          <Button
            onClick={handleAssign}
            disabled={assignBusy}
            className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
          >
            <Tag className="h-4 w-4" />
            {assignBusy ? "Tagging…" : "Tag"}
          </Button>
        </div>
      </div>

      {pnl && (
        <div className="dashboard-card overflow-hidden !p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-6 py-4">
            <div>
              <h3 className="text-[16px] font-semibold text-text-primary">
                Project P&amp;L — {pnl.project.name}
              </h3>
              <p className="mt-0.5 text-[12px] text-text-meta">
                Income vs cost from tagged journal lines and documents
                {from || to ? ` (${from || "…"} → ${to || "…"})` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-[13px]">
              <span>
                Income{" "}
                <strong className="font-mono">
                  {ccy} {formatNumber(pnl.summary.totalIncome)}
                </strong>
              </span>
              <span>
                Cost{" "}
                <strong className="font-mono">
                  {ccy} {formatNumber(pnl.summary.totalCost)}
                </strong>
              </span>
              <span
                className={
                  pnl.summary.netProfit >= 0 ? "text-success" : "text-error"
                }
              >
                Net{" "}
                <strong className="font-mono">
                  {ccy} {formatNumber(pnl.summary.netProfit)}
                  {pnl.summary.marginPercent != null
                    ? ` (${pnl.summary.marginPercent}%)`
                    : ""}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 border-b border-border-subtle md:grid-cols-2">
            <div className="border-b border-border-subtle md:border-b-0 md:border-r">
              <div className="bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
                Income accounts
              </div>
              {pnl.incomeAccounts.length === 0 ? (
                <p className="px-6 py-4 text-[13px] text-text-meta">
                  No tagged revenue journal lines
                  {pnl.summary.documentIncome > 0
                    ? ` · document income ${formatNumber(pnl.summary.documentIncome)}`
                    : ""}
                </p>
              ) : (
                pnl.incomeAccounts.map((a) => (
                  <div
                    key={`inc-${a.code}`}
                    className="flex items-center justify-between border-b border-border-subtle/40 px-6 py-2.5 text-[13px] last:border-0"
                  >
                    <span>
                      {a.code} — {a.name}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatNumber(a.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div>
              <div className="bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
                Cost accounts
              </div>
              {pnl.costAccounts.length === 0 ? (
                <p className="px-6 py-4 text-[13px] text-text-meta">
                  No tagged expense journal lines
                  {pnl.summary.documentCost > 0
                    ? ` · document cost ${formatNumber(pnl.summary.documentCost)}`
                    : ""}
                </p>
              ) : (
                pnl.costAccounts.map((a) => (
                  <div
                    key={`cost-${a.code}`}
                    className="flex items-center justify-between border-b border-border-subtle/40 px-6 py-2.5 text-[13px] last:border-0"
                  >
                    <span>
                      {a.code} — {a.name}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatNumber(a.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {(pnl.invoices.length > 0 || pnl.bills.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="border-b border-border-subtle md:border-b-0 md:border-r">
                <div className="bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
                  Tagged invoices
                </div>
                {pnl.invoices.length === 0 ? (
                  <p className="px-6 py-4 text-[13px] text-text-meta">None</p>
                ) : (
                  pnl.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between border-b border-border-subtle/40 px-6 py-2.5 text-[13px] last:border-0"
                    >
                      <span>
                        {inv.number}{" "}
                        <span className="text-text-meta">
                          ({inv.status}
                          {inv.countedInJournal ? ", in ledger" : ""})
                        </span>
                      </span>
                      <span className="font-mono">{formatNumber(inv.subtotal)}</span>
                    </div>
                  ))
                )}
              </div>
              <div>
                <div className="bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
                  Tagged bills
                </div>
                {pnl.bills.length === 0 ? (
                  <p className="px-6 py-4 text-[13px] text-text-meta">None</p>
                ) : (
                  pnl.bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between border-b border-border-subtle/40 px-6 py-2.5 text-[13px] last:border-0"
                    >
                      <span>
                        {bill.number}{" "}
                        <span className="text-text-meta">
                          ({bill.status}
                          {bill.countedInJournal ? ", in ledger" : ""})
                        </span>
                      </span>
                      <span className="font-mono">{formatNumber(bill.subtotal)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <AddProjectPanel
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={handleSaved}
      />
    </>
  );
}
