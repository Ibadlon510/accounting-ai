"use client";

import { useState, useEffect } from "react";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateInvoicePanel } from "@/components/modals/create-invoice-panel";
import { ImportExportButtons } from "@/components/import-export/import-export-buttons";
import { ViewInvoicePanel } from "@/components/overlays/view-invoice-panel";
import { ViewPaymentPanel } from "@/components/overlays/view-payment-panel";
import { RecordPaymentPanel } from "@/components/modals/record-payment-panel";

type InvoiceLine = { id: string; productId?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type ReceiptItem = { type: "document" | "payment"; date: string; amount: number; documentId?: string; paymentId?: string };
type Invoice = { id: string; customerId: string; customerName: string; invoiceNumber: string; issueDate: string; dueDate: string; status: string; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; documentId?: string | null; paymentId?: string | null; receipts?: ReceiptItem[]; lines: InvoiceLine[] };
type Customer = { id: string; name: string; email: string; phone: string; isActive: boolean };
type BankAccount = { id: string; accountName: string; currency: string };

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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [viewingPaymentId, setViewingPaymentId] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function loadInvoices() {
    fetch("/api/sales/invoices", { cache: "no-store" }).then((r) => r.ok ? r.json() : { invoices: [] }).then((d) => setInvoices(d.invoices ?? [])).catch((err) => {
      console.error("[invoices] fetch error:", err);
    });
  }

  function loadCustomers() {
    fetch("/api/sales/customers", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { customers: [] })).then((d) => setCustomers(d.customers ?? [])).catch((err) => {
      console.error("[invoices] customers fetch error:", err);
    });
  }

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    fetch("/api/banking", { cache: "no-store" }).then((r) => r.ok ? r.json() : { accounts: [] }).then((d) => setBankAccounts(d.accounts ?? [])).catch((err) => {
      console.error("[invoices] bank accounts fetch error:", err);
    });
  }, []);

  async function handleCreateInvoice(data: { customerId: string; customerName: string; issueDate: string; dueDate: string; lines: InvoiceLine[]; subtotal: number; taxAmount: number; total: number }) {
    const res = await fetch("/api/sales/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: data.customerId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        lines: data.lines.map((l) => ({ productId: l.productId, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount, taxRate: l.taxRate, taxAmount: l.taxAmount })),
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        total: data.total,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const { showError } = await import("@/lib/utils/toast-helpers");
      showError(json.error ?? "Failed to create invoice");
      throw new Error(json.error ?? "Failed to create invoice");
    }
    const inv = json.invoice as Invoice;
    setInvoices((prev) => [inv, ...prev]);
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
        <ImportExportButtons entity="invoices" entityLabel="Invoices" onImportComplete={loadInvoices} />
        <Button onClick={() => setCreateOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
        <CreateInvoicePanel open={createOpen} onOpenChange={setCreateOpen} customers={customers} onCustomerCreated={loadCustomers} onCreate={handleCreateInvoice} />
        <ViewInvoicePanel
          open={!!viewingId}
          onOpenChange={(o) => !o && setViewingId(null)}
          invoice={invoices.find((i) => i.id === viewingId) ?? null}
          onViewPaymentReceipt={(id) => setViewingPaymentId(id)}
          onRecordPayment={() => {
            setPaymentInvoiceId(viewingId);
            setViewingId(null);
            setPaymentOpen(true);
          }}
          onConfirm={async () => {
            if (!viewingId) return;
            setConfirmingId(viewingId);
            try {
              const res = await fetch(`/api/sales/invoices/${viewingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "sent" }),
              });
              const json = await res.json();
              if (!res.ok) {
                const { showError } = await import("@/lib/utils/toast-helpers");
                showError(json.error ?? "Failed to confirm invoice");
                return;
              }
              const { showSuccess } = await import("@/lib/utils/toast-helpers");
              showSuccess("Invoice confirmed", "You can now record payments against this invoice.");
              loadInvoices();
            } finally {
              setConfirmingId(null);
            }
          }}
          confirming={!!viewingId && confirmingId === viewingId}
        />
        <ViewPaymentPanel
          open={!!viewingPaymentId}
          onOpenChange={(o) => !o && setViewingPaymentId(null)}
          paymentId={viewingPaymentId}
        />
        <RecordPaymentPanel
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          bankAccounts={bankAccounts}
          invoices={invoices.filter((i) => i.amountDue > 0 && i.status !== "draft").map((i) => ({ id: i.id, customerId: i.customerId, invoiceNumber: i.invoiceNumber, customerName: i.customerName, amountDue: i.amountDue }))}
          preSelectedInvoiceId={paymentInvoiceId}
          onCreate={async (data) => {
            const res = await fetch("/api/banking/receipts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                receiptType: "customer_payment",
                date: data.paymentDate,
                bankAccountId: data.bankAccountId,
                amount: data.amount,
                customerId: data.customerId,
                allocations: [{ invoiceId: data.invoiceId, amount: data.amount }],
                reference: data.reference || undefined,
              }),
            });
            const json = await res.json();
            if (!res.ok) {
              const { showError } = await import("@/lib/utils/toast-helpers");
              showError(json.error ?? "Failed to record payment");
              throw new Error(json.error);
            }
            loadInvoices();
            setPaymentInvoiceId(null);
          }}
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
            <div className="col-span-1 text-text-secondary">{formatDate(inv.issueDate)}</div>
            <div className="col-span-1 text-text-secondary">{formatDate(inv.dueDate)}</div>
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
