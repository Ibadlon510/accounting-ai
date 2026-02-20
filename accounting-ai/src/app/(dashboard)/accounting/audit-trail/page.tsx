"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockAuditLogs = [
  { id: "al-001", timestamp: "2026-02-11 23:45:12", user: "Demo User", action: "create", module: "Sales", entity: "Invoice", entityId: "INV-202602-0001", description: "Created invoice INV-202602-0001 for ADNOC (AED 78,750.00)", ipAddress: "192.168.1.10" },
  { id: "al-002", timestamp: "2026-02-11 22:30:05", user: "Demo User", action: "create", module: "Purchases", entity: "Bill", entityId: "DEWA-JAN-2026", description: "Recorded bill DEWA-JAN-2026 from DEWA (AED 4,200.00)", ipAddress: "192.168.1.10" },
  { id: "al-003", timestamp: "2026-02-11 21:15:33", user: "Demo User", action: "post", module: "Accounting", entity: "Journal Entry", entityId: "JE-202602-0012", description: "Posted journal entry JE-202602-0012 — Monthly depreciation", ipAddress: "192.168.1.10" },
  { id: "al-004", timestamp: "2026-02-11 20:00:18", user: "Demo User", action: "update", module: "Sales", entity: "Customer", entityId: "cust-001", description: "Updated ADNOC credit limit from AED 200,000 to AED 300,000", ipAddress: "192.168.1.10" },
  { id: "al-005", timestamp: "2026-02-11 18:45:44", user: "Demo User", action: "create", module: "Sales", entity: "Payment", entityId: "PAY-0001", description: "Recorded payment PAY-0001 from Dubai Holding (AED 157,500.00)", ipAddress: "192.168.1.10" },
  { id: "al-006", timestamp: "2026-02-10 17:30:22", user: "Demo User", action: "reconcile", module: "Banking", entity: "Transaction", entityId: "txn-001", description: "Reconciled bank transaction — Emirates NBD deposit AED 157,500.00", ipAddress: "192.168.1.10" },
  { id: "al-007", timestamp: "2026-02-10 16:15:09", user: "Demo User", action: "close", module: "Accounting", entity: "Period", entityId: "period-01", description: "Closed accounting period January 2026", ipAddress: "192.168.1.10" },
  { id: "al-008", timestamp: "2026-02-10 15:00:55", user: "Demo User", action: "create", module: "Inventory", entity: "Item", entityId: "item-001", description: "Added inventory item Dell Monitor 27\" 4K (SKU: MON-D27-4K)", ipAddress: "192.168.1.10" },
  { id: "al-009", timestamp: "2026-02-10 14:30:11", user: "Demo User", action: "update", module: "Settings", entity: "Organization", entityId: "org-001", description: "Updated organization tax registration number", ipAddress: "192.168.1.10" },
  { id: "al-010", timestamp: "2026-02-10 13:00:00", user: "Demo User", action: "create", module: "VAT", entity: "VAT Return", entityId: "vr-q1-2026", description: "Prepared VAT return for Q1 2026 (Net payable: AED 12,450.00)", ipAddress: "192.168.1.10" },
  { id: "al-011", timestamp: "2026-02-09 11:45:33", user: "Demo User", action: "create", module: "Purchases", entity: "Supplier", entityId: "sup-004", description: "Added supplier Gulf IT Solutions", ipAddress: "192.168.1.10" },
  { id: "al-012", timestamp: "2026-02-09 10:30:17", user: "Demo User", action: "create", module: "Sales", entity: "Invoice", entityId: "INV-202602-0002", description: "Created invoice INV-202602-0002 for Dubai Holding (AED 210,000.00)", ipAddress: "192.168.1.10" },
];

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
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Accounting", href: "/accounting" }, { label: "Audit Trail" }]} />
      <PageHeader title="Audit Trail" showActions={false} />

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
