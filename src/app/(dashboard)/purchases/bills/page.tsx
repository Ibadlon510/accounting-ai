"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateBillPanel } from "@/components/modals/create-bill-panel";
import { ViewBillPanel } from "@/components/overlays/view-bill-panel";

type BillLine = { id: string; productId?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type Bill = { id: string; supplierId: string; supplierName: string; billNumber: string; issueDate: string; dueDate: string; status: "draft" | "received" | "paid" | "partial" | "overdue" | "cancelled"; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; lines: BillLine[] };
type Supplier = { id: string; name: string; email: string; phone: string; isActive: boolean };

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
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    fetch("/api/purchases/bills").then((r) => r.ok ? r.json() : { bills: [] }).then((d) => setBills(d.bills ?? [])).catch(() => {});
    fetch("/api/purchases/suppliers").then((r) => r.ok ? r.json() : { suppliers: [] }).then((d) => setSuppliers(d.suppliers ?? [])).catch(() => {});
  }, []);

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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search bills..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> New Bill
        </Button>
        <CreateBillPanel open={createOpen} onOpenChange={setCreateOpen} suppliers={suppliers} onCreate={handleCreate} />
        <ViewBillPanel
          open={!!viewingId}
          onOpenChange={(o) => !o && setViewingId(null)}
          bill={bills.find((b) => b.id === viewingId) ?? null}
        />
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

        {filtered.map((bill) => (
          <button
            key={bill.id}
            onClick={() => setViewingId(bill.id)}
            className="grid w-full grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-left text-[13px] transition-colors hover:bg-black/[0.01] cursor-pointer"
          >
            <div className="col-span-2 font-mono font-medium text-text-primary">{bill.billNumber}</div>
            <div className="col-span-3 text-text-primary">{bill.supplierName}</div>
            <div className="col-span-1 text-text-secondary">{bill.issueDate}</div>
            <div className="col-span-1 text-text-secondary">{bill.dueDate}</div>
            <div className="col-span-1">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[bill.status]}`}>{bill.status}</span>
            </div>
            <div className="col-span-2 text-right font-mono font-medium text-text-primary">AED {formatNumber(bill.total)}</div>
            <div className="col-span-2 text-right">
              <span className={`font-mono font-medium ${bill.amountDue > 0 ? "text-error" : "text-success"}`}>AED {formatNumber(bill.amountDue)}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
