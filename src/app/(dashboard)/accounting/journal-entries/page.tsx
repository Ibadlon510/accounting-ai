"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockJournalEntries } from "@/lib/accounting/mock-data";
import { formatNumber } from "@/lib/accounting/engine";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateJournalEntryPanel } from "@/components/modals/create-journal-entry-panel";
import type { JournalEntry } from "@/types/accounting";

const statusColors: Record<string, string> = {
  posted: "bg-success-light text-success",
  draft: "bg-accent-yellow/20 text-accent-yellow",
  reversed: "bg-error-light text-error",
};

export default function JournalEntriesPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [entries, setEntries] = useState(mockJournalEntries);

  function handleCreate(data: { entryDate: string; description: string; reference: string; lines: { id: string; accountId: string; description: string; debit: number; credit: number }[]; totalDebit: number; totalCredit: number }) {
    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      organizationId: "org-001",
      periodId: "period-02",
      entryNumber: `JE-${data.entryDate.slice(0, 4)}${data.entryDate.slice(5, 7)}-${String(entries.length + 1).padStart(4, "0")}`,
      entryDate: data.entryDate,
      description: data.description,
      reference: data.reference || undefined,
      sourceType: "manual",
      status: "posted",
      currency: "AED",
      exchangeRate: 1,
      totalDebit: data.totalDebit,
      totalCredit: data.totalCredit,
      lines: data.lines.map((l, i) => ({ ...l, accountCode: "", accountName: "", lineOrder: i + 1 })),
      postedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
  }

  const filtered = entries.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.entryNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.reference ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Accounting", href: "/accounting" },
          { label: "Journal Entries" },
        ]}
      />
      <PageHeader title="Journal Entries" showActions={false} />

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" />
          New Journal Entry
        </Button>
        <CreateJournalEntryPanel open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {filtered.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <div key={entry.id} className="dashboard-card !p-0 overflow-hidden">
              {/* Entry header */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : (entry.id ?? null))
                }
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-black/[0.01]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-text-primary/5">
                  <FileText
                    className="h-4 w-4 text-text-primary"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-primary">
                      {entry.entryNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                        statusColors[entry.status] ?? ""
                      }`}
                    >
                      {entry.status}
                    </span>
                    {entry.reference && (
                      <span className="text-[11px] text-text-meta">
                        Ref: {entry.reference}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {entry.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold text-text-primary">
                    AED {formatNumber(entry.totalDebit)}
                  </p>
                  <p className="text-[11px] text-text-meta">
                    {entry.entryDate}
                  </p>
                </div>
                <div className="ml-2">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-text-meta" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-meta" />
                  )}
                </div>
              </button>

              {/* Expanded lines */}
              {isExpanded && (
                <div className="border-t border-border-subtle bg-canvas/30">
                  <div className="grid grid-cols-12 gap-4 px-6 py-2 text-[11px] font-medium uppercase tracking-wide text-text-meta">
                    <div className="col-span-1">#</div>
                    <div className="col-span-2">Code</div>
                    <div className="col-span-4">Account</div>
                    <div className="col-span-2 text-right">Debit</div>
                    <div className="col-span-2 text-right">Credit</div>
                    <div className="col-span-1"></div>
                  </div>
                  {entry.lines.map((line, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-4 border-t border-border-subtle/40 px-6 py-2.5 text-[13px]"
                    >
                      <div className="col-span-1 text-text-meta">
                        {line.lineOrder}
                      </div>
                      <div className="col-span-2 font-mono text-text-secondary">
                        {line.accountCode}
                      </div>
                      <div className="col-span-4 text-text-primary">
                        {line.accountName}
                        {line.taxCode && (
                          <span className="ml-1.5 rounded bg-accent-yellow/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-yellow">
                            {line.taxCode}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-right font-mono text-text-primary">
                        {line.debit > 0 ? formatNumber(line.debit) : "—"}
                      </div>
                      <div className="col-span-2 text-right font-mono text-text-primary">
                        {line.credit > 0 ? formatNumber(line.credit) : "—"}
                      </div>
                      <div className="col-span-1"></div>
                    </div>
                  ))}
                  {/* Totals */}
                  <div className="grid grid-cols-12 gap-4 border-t border-border-subtle bg-surface/50 px-6 py-2.5 text-[13px] font-semibold">
                    <div className="col-span-7 text-right text-text-secondary">
                      Total
                    </div>
                    <div className="col-span-2 text-right font-mono text-text-primary">
                      {formatNumber(entry.totalDebit)}
                    </div>
                    <div className="col-span-2 text-right font-mono text-text-primary">
                      {formatNumber(entry.totalCredit)}
                    </div>
                    <div className="col-span-1"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
