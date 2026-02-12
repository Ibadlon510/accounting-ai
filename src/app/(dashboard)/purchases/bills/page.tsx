"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockBills, mockSuppliers } from "@/lib/mock/purchases-data";
import type { Bill, BillLine } from "@/lib/mock/purchases-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateBillPanel } from "@/components/modals/create-bill-panel";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-text-secondary",
  received: "bg-blue-100 text-blue-700",
  paid: "bg-success-light text-success",
  partial: "bg-accent-yellow/20 text-amber-700",
  overdue: "bg-error-light text-error",
  cancelled: "bg-muted text-text-meta",
};

export default function BillsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bills, setBills] = useState(mockBills);

  function handleCreate(data: { supplierId: string; supplierName: string; billNumber: string; issueDate: string; dueDate: string; lines: BillLine[]; subtotal: number; taxAmount: number; total: number }) {
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      ...data,
      status: "received",
      amountPaid: 0,
      amountDue: data.total,
    };
    setBills((prev) => [newBill, ...prev]);
  }

  const filtered = bills.filter(
    (b) => b.supplierName.toLowerCase().includes(search.toLowerCase()) || b.billNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Purchases", href: "/purchases" }, { label: "Bills" }]} />
      <PageHeader title="Bills" showActions={false} />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search bills..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> New Bill
        </Button>
        <CreateBillPanel open={createOpen} onOpenChange={setCreateOpen} suppliers={mockSuppliers} onCreate={handleCreate} />
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">Bill #</div>
          <div className="col-span-3">Supplier</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Due</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right">Balance Due</div>
        </div>

        {filtered.map((bill) => {
          const isExpanded = expandedId === bill.id;
          return (
            <div key={bill.id}>
              <button onClick={() => setExpandedId(isExpanded ? null : bill.id)} className="grid w-full grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-left text-[13px] transition-colors hover:bg-black/[0.01]">
                <div className="col-span-2 font-mono font-medium text-text-primary">{bill.billNumber}</div>
                <div className="col-span-3 text-text-primary">{bill.supplierName}</div>
                <div className="col-span-1 text-text-secondary">{bill.issueDate}</div>
                <div className="col-span-1 text-text-secondary">{bill.dueDate}</div>
                <div className="col-span-1">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[bill.status]}`}>{bill.status}</span>
                </div>
                <div className="col-span-2 text-right font-mono font-medium text-text-primary">AED {formatNumber(bill.total)}</div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className={`font-mono font-medium ${bill.amountDue > 0 ? "text-error" : "text-success"}`}>AED {formatNumber(bill.amountDue)}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-text-meta" /> : <ChevronDown className="h-3.5 w-3.5 text-text-meta" />}
                </div>
              </button>
              {isExpanded && (
                <div className="border-b border-border-subtle bg-canvas/30 px-6 py-4">
                  <div className="grid grid-cols-12 gap-3 text-[11px] font-medium uppercase text-text-meta mb-2">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-1 text-right">VAT %</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  {bill.lines.map((line) => (
                    <div key={line.id} className="grid grid-cols-12 gap-3 border-t border-border-subtle/30 py-2 text-[13px]">
                      <div className="col-span-5 text-text-primary">{line.description}</div>
                      <div className="col-span-2 text-right text-text-secondary">{line.quantity}</div>
                      <div className="col-span-2 text-right font-mono text-text-secondary">{formatNumber(line.unitPrice)}</div>
                      <div className="col-span-1 text-right text-text-secondary">{line.taxRate}%</div>
                      <div className="col-span-2 text-right font-mono text-text-primary">{formatNumber(line.amount)}</div>
                    </div>
                  ))}
                  <div className="mt-3 flex justify-end gap-8 border-t border-border-subtle pt-3 text-[13px]">
                    <div className="text-right">
                      <p className="text-text-meta">Subtotal: <span className="font-mono font-medium text-text-primary">AED {formatNumber(bill.subtotal)}</span></p>
                      <p className="text-text-meta">VAT: <span className="font-mono font-medium text-text-primary">AED {formatNumber(bill.taxAmount)}</span></p>
                      <p className="mt-1 text-[14px] font-semibold text-text-primary">Total: AED {formatNumber(bill.total)}</p>
                    </div>
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
