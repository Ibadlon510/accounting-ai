"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateInvoicePanel } from "@/components/modals/create-invoice-panel";
import { ViewInvoicePanel } from "@/components/overlays/view-invoice-panel";

type InvoiceLine = { id: string; productId?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type Invoice = { id: string; customerId: string; customerName: string; invoiceNumber: string; issueDate: string; dueDate: string; status: string; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; lines: InvoiceLine[] };
type Customer = { id: string; name: string; email: string; phone: string; isActive: boolean };

const statusColors: Record<string, string> = {
  draft: "bg-muted text-text-secondary",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-success-light text-success",
  partial: "bg-accent-yellow/20 text-amber-700",
  overdue: "bg-error-light text-error",
  cancelled: "bg-muted text-text-meta",
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetch("/api/sales/invoices").then((r) => r.ok ? r.json() : { invoices: [] }).then((d) => setInvoices(d.invoices ?? [])).catch(() => {});
    fetch("/api/sales/customers").then((r) => r.ok ? r.json() : { customers: [] }).then((d) => setCustomers(d.customers ?? [])).catch(() => {});
  }, []);

  function handleCreateInvoice(data: { customerId: string; customerName: string; issueDate: string; dueDate: string; lines: InvoiceLine[]; subtotal: number; taxAmount: number; total: number }) {
    const newInv: Invoice = {
      id: `inv-${Date.now()}`, ...data,
      invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(3, "0")}`,
      status: "draft", amountPaid: 0, amountDue: data.total,
    };
    setInvoices((prev) => [newInv, ...prev]);
  }

  const filtered = invoices.filter(
    (inv) =>
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
        <CreateInvoicePanel open={createOpen} onOpenChange={setCreateOpen} customers={customers} onCreate={handleCreateInvoice} />
        <ViewInvoicePanel
          open={!!viewingId}
          onOpenChange={(o) => !o && setViewingId(null)}
          invoice={invoices.find((i) => i.id === viewingId) ?? null}
        />
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">Invoice #</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Due</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right">Balance Due</div>
        </div>

        {filtered.map((inv) => (
          <button
            key={inv.id}
            onClick={() => setViewingId(inv.id)}
            className="grid w-full grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-left text-[13px] transition-colors hover:bg-black/[0.01] cursor-pointer"
          >
            <div className="col-span-2 font-mono font-medium text-text-primary">{inv.invoiceNumber}</div>
            <div className="col-span-3 text-text-primary">{inv.customerName}</div>
            <div className="col-span-1 text-text-secondary">{inv.issueDate}</div>
            <div className="col-span-1 text-text-secondary">{inv.dueDate}</div>
            <div className="col-span-1">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[inv.status]}`}>{inv.status}</span>
            </div>
            <div className="col-span-2 text-right font-mono font-medium text-text-primary">AED {formatNumber(inv.total)}</div>
            <div className="col-span-2 text-right">
              <span className={`font-mono font-medium ${inv.amountDue > 0 ? "text-error" : "text-success"}`}>
                AED {formatNumber(inv.amountDue)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
