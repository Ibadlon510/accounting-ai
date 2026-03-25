"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/formatting";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  user: string;
  createdAt: string;
};

const actionColors: Record<string, string> = {
  create: "bg-success-light text-success",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-error-light text-error",
  post: "bg-purple-100 text-purple-700",
  reconcile: "bg-accent-yellow/20 text-amber-700",
  close: "bg-muted text-text-secondary",
};

const moduleColors: Record<string, string> = {
  Sales: "text-success",
  Purchases: "text-error",
  Accounting: "text-purple-600",
  Banking: "text-blue-600",
  Inventory: "text-teal-600",
  Settings: "text-text-secondary",
  VAT: "text-amber-600",
};

const entityModuleMap: Record<string, string> = {
  invoice: "Sales",
  customer: "Sales",
  payment_received: "Sales",
  credit_note_sales: "Sales",
  statement: "Sales",
  bill: "Purchases",
  supplier: "Purchases",
  payment_made: "Purchases",
  credit_note_purchase: "Purchases",
  expense: "Purchases",
  journal_entry: "Accounting",
  chart_of_accounts: "Accounting",
  fiscal_year: "Accounting",
  accounting_period: "Accounting",
  bank_account: "Banking",
  bank_transaction: "Banking",
  reconciliation: "Banking",
  transfer: "Banking",
  item: "Inventory",
  inventory_movement: "Inventory",
  vat_return: "VAT",
  organization: "Settings",
  user: "Settings",
  team: "Settings",
};

function deriveModule(entity: string): string {
  return entityModuleMap[entity] ?? "Accounting";
}

function buildDescription(action: string, entity: string, metadata: Record<string, unknown> | null): string {
  const entityLabel = entity.replace(/_/g, " ");
  const ref = metadata?.reference ?? metadata?.number ?? metadata?.name ?? "";
  const base = `${capitalize(action)} ${entityLabel}`;
  return ref ? `${base}: ${ref}` : base;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(iso)} ${time}`;
}

const PAGE_SIZE = 50;
const MODULES = ["all", "Sales", "Purchases", "Accounting", "Banking", "Inventory", "VAT", "Settings"];

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/audit-trail?page=${p}&limit=${PAGE_SIZE}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? p);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const module = deriveModule(log.entity);
    const desc = buildDescription(log.action, log.entity, log.metadata);
    const matchesSearch =
      !search ||
      desc.toLowerCase().includes(search.toLowerCase()) ||
      (log.entityId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "all" || module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search audit logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-meta" />
          {MODULES.map((mod) => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                moduleFilter === mod
                  ? "bg-text-primary text-white"
                  : "bg-muted text-text-secondary hover:bg-black/5"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1">User</div>
          <div className="col-span-1">Action</div>
          <div className="col-span-1">Module</div>
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-right">Entity ID</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-6 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-text-meta" />
            <span className="ml-2 text-[13px] text-text-meta">Loading audit logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-text-meta">
            No audit logs match your filters
          </div>
        ) : (
          filtered.map((log) => {
            const module = deriveModule(log.entity);
            const description = buildDescription(log.action, log.entity, log.metadata);
            return (
              <div
                key={log.id}
                className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]"
              >
                <div className="col-span-2 font-mono text-[12px] text-text-secondary">
                  {formatTimestamp(log.createdAt)}
                </div>
                <div className="col-span-1 truncate text-text-primary">{log.user}</div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      actionColors[log.action] || "bg-muted text-text-meta"
                    }`}
                  >
                    {log.action}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`text-[12px] font-semibold ${moduleColors[module] || "text-text-secondary"}`}>
                    {module}
                  </span>
                </div>
                <div className="col-span-5 truncate text-text-primary">{description}</div>
                <div className="col-span-2 truncate text-right font-mono text-[12px] text-text-meta">
                  {log.entityId ? log.entityId.slice(0, 8) + "..." : "—"}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[12px] text-text-meta">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-colors hover:bg-black/[0.02] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-[12px] font-medium text-text-secondary">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-colors hover:bg-black/[0.02] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
