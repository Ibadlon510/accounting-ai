"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateCreditNotePanel } from "@/components/modals/create-credit-note-panel";

type CreditNote = {
  id: string;
  creditNoteNumber: string;
  creditNoteType: string;
  date: string;
  customerId: string | null;
  customerName: string | null;
  invoiceId: string | null;
  reason: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  journalEntryId: string | null;
  createdAt: string;
};
type Customer = { id: string; name: string; email: string; phone: string; isActive: boolean };
type Account = { id: string; code: string; name: string };
type Invoice = { id: string; invoiceNumber: string; customerId: string; total: number; amountDue: number };

const statusColors: Record<string, string> = {
  draft: "bg-muted text-text-secondary",
  confirmed: "bg-blue-100 text-blue-700",
  applied: "bg-success-light text-success",
};

export default function SalesCreditNotesPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  function loadCreditNotes() {
    fetch("/api/accounting/credit-notes?type=sales", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { creditNotes: [] }))
      .then((d) => setCreditNotes(d.creditNotes ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    loadCreditNotes();
    fetch("/api/sales/customers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { customers: [] }))
      .then((d) => setCustomers(d.customers ?? []))
      .catch(() => {});
    fetch("/api/accounting/chart-of-accounts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => {});
    fetch("/api/sales/invoices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { invoices: [] }))
      .then((d) => setInvoices((d.invoices ?? []).filter((i: Invoice) => i.amountDue > 0)))
      .catch(() => {});
  }, []);

  async function handleCreate(data: {
    date: string;
    customerId?: string;
    supplierId?: string;
    invoiceId?: string;
    billId?: string;
    reason?: string;
    lines: { description: string; accountId: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number }[];
  }) {
    const res = await fetch("/api/accounting/credit-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, creditNoteType: "sales" }),
    });
    const json = await res.json();
    if (!res.ok) {
      const { showError } = await import("@/lib/utils/toast-helpers");
      showError(json.error ?? "Failed to create credit note");
      throw new Error(json.error);
    }
    loadCreditNotes();
  }

  const filtered = creditNotes.filter(
    (cn) =>
      cn.creditNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cn.customerName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input
            placeholder="Search credit notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20"
          />
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Plus className="h-4 w-4" /> New Credit Note
        </Button>
        <CreateCreditNotePanel
          open={createOpen}
          onOpenChange={setCreateOpen}
          type="sales"
          customers={customers}
          suppliers={[]}
          accounts={accounts}
          invoices={invoices}
          bills={[]}
          onCreate={handleCreate}
        />
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">CN #</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Total</div>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-[13px] text-text-meta">
            No sales credit notes found.
          </div>
        )}

        {filtered.map((cn) => (
          <div
            key={cn.id}
            className="grid w-full grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-left text-[13px] transition-colors hover:bg-black/[0.01]"
          >
            <div className="col-span-2 font-mono font-medium text-text-primary">{cn.creditNoteNumber}</div>
            <div className="col-span-2 text-text-secondary">{cn.date}</div>
            <div className="col-span-3 text-text-primary">{cn.customerName || "—"}</div>
            <div className="col-span-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[cn.status] ?? ""}`}>
                {cn.status}
              </span>
            </div>
            <div className="col-span-3 text-right font-mono font-medium text-error">
              -{cn.currency} {formatNumber(cn.total)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
