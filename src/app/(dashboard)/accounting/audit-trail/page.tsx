"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

// Audit logs will be populated from the database audit_logs table
// For now, show an empty state until real audit logging is implemented
type AuditLog = { id: string; timestamp: string; user: string; action: string; module: string; entity: string; entityId: string; description: string; ipAddress: string };
const mockAuditLogs: AuditLog[] = [];

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

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const modules = ["all", ...Array.from(new Set(mockAuditLogs.map((l) => l.module)))];

  const filtered = mockAuditLogs.filter((log) => {
    const matchesSearch = log.description.toLowerCase().includes(search.toLowerCase()) || log.entityId.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search audit logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-meta" />
          {modules.map((mod) => (
            <button key={mod} onClick={() => setModuleFilter(mod)} className={`rounded-full px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${moduleFilter === mod ? "bg-text-primary text-white" : "bg-muted text-text-secondary hover:bg-black/5"}`}>
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
          <div className="col-span-2 text-right">IP Address</div>
        </div>

        {filtered.map((log) => (
          <div key={log.id} className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]">
            <div className="col-span-2 font-mono text-[12px] text-text-secondary">{log.timestamp}</div>
            <div className="col-span-1 text-text-primary">{log.user}</div>
            <div className="col-span-1">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${actionColors[log.action] || "bg-muted text-text-meta"}`}>{log.action}</span>
            </div>
            <div className="col-span-1">
              <span className={`text-[12px] font-semibold ${moduleColors[log.module] || "text-text-secondary"}`}>{log.module}</span>
            </div>
            <div className="col-span-5 text-text-primary">{log.description}</div>
            <div className="col-span-2 text-right font-mono text-[12px] text-text-meta">{log.ipAddress}</div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-[14px] text-text-meta">No audit logs match your filters</div>
        )}
      </div>
    </>
  );
}
