"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentPanel } from "@/components/modals/record-payment-panel";
import { ViewPaymentPanel } from "@/components/overlays/view-payment-panel";
import { ViewInvoicePanel } from "@/components/overlays/view-invoice-panel";

type Payment = { id: string; paymentNumber: string; paymentDate: string; entityName: string; amount: number; method: string; reference: string; invoiceNumber: string; invoiceId?: string | null };
type UnpaidInvoice = { id: string; customerId: string; invoiceNumber: string; customerName: string; amountDue: number };
type InvoiceLine = { id: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type ReceiptItem = { type: "document" | "payment"; date: string; amount: number; documentId?: string; paymentId?: string };
type Invoice = { id: string; customerId: string; customerName: string; invoiceNumber: string; issueDate: string; dueDate: string; status: string; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; documentId?: string | null; paymentId?: string | null; receipts?: ReceiptItem[]; lines: InvoiceLine[] };

function PaymentsReceivedContent() {
  const searchParams = useSearchParams();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; accountName: string; currency: string }[]>([]);

  const paymentParam = searchParams.get("payment");

  useEffect(() => {
    fetch("/api/sales/invoices", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { invoices: [] })
      .then((d) => {
        const invs = d.invoices ?? [];
        setInvoices(invs);
        setUnpaidInvoices(
          invs
            .filter((inv: { amountDue: number; status?: string }) => inv.amountDue > 0 && inv.status !== "draft")
            .map((inv: { id: string; customerId: string; invoiceNumber: string; customerName?: string; amountDue: number }) => ({
              id: inv.id,
              customerId: inv.customerId,
              invoiceNumber: inv.invoiceNumber,
              customerName: inv.customerName ?? "",
              amountDue: inv.amountDue,
            }))
        );
      })
      .catch(() => {});
    fetch("/api/sales/payments", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { payments: [] })
      .then((d) => setPayments(d.payments ?? []))
      .catch(() => {});
    fetch("/api/banking", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { accounts: [] })
      .then((d) => setBankAccounts(d.accounts ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paymentParam && payments.length > 0) {
      const exists = payments.some((p) => p.id === paymentParam);
      if (exists) setViewingId(paymentParam);
    }
  }, [paymentParam, payments]);

  async function loadData() {
    const [invRes, payRes] = await Promise.all([
      fetch("/api/sales/invoices", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/sales/payments", { cache: "no-store" }).then((r) => r.json()),
    ]);
    const invs = invRes.invoices ?? [];
    setInvoices(invs);
    setUnpaidInvoices(
      invs
        .filter((inv: { amountDue: number; status?: string }) => inv.amountDue > 0 && inv.status !== "draft")
        .map((inv: { id: string; customerId: string; invoiceNumber: string; customerName?: string; amountDue: number }) => ({
          id: inv.id,
          customerId: inv.customerId,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName ?? "",
          amountDue: inv.amountDue,
        }))
    );
    setPayments(payRes.payments ?? []);
  }

  async function handleCreate(data: {
    paymentDate: string;
    bankAccountId: string;
    customerId: string;
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    method: string;
    reference: string;
  }) {
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
      throw new Error(json.error ?? "Failed to record payment");
    }
    await loadData();
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setPaymentOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
        <RecordPaymentPanel open={paymentOpen} onOpenChange={setPaymentOpen} bankAccounts={bankAccounts} invoices={unpaidInvoices} onCreate={handleCreate} />
        <ViewPaymentPanel
          open={!!viewingId}
          onOpenChange={(o) => !o && setViewingId(null)}
          payment={payments.find((p) => p.id === viewingId) ?? null}
          onViewInvoice={(id) => {
            setViewingInvoiceId(id);
            setViewingId(null);
          }}
        />
        <ViewInvoicePanel
          open={!!viewingInvoiceId}
          onOpenChange={(o) => !o && setViewingInvoiceId(null)}
          invoice={invoices.find((i) => i.id === viewingInvoiceId) ?? null}
        />
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">Payment #</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Invoice</div>
          <div className="col-span-1">Method</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        {payments.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewingId(p.id)}
            className="grid w-full grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-left text-[13px] transition-colors hover:bg-black/[0.01] cursor-pointer"
          >
            <div className="col-span-2 font-mono font-medium text-text-primary">{p.paymentNumber}</div>
            <div className="col-span-2 text-text-secondary">{p.paymentDate}</div>
            <div className="col-span-3 text-text-primary">{p.entityName}</div>
            <div className="col-span-2 font-mono text-text-secondary">{p.invoiceNumber ?? "—"}</div>
            <div className="col-span-1 text-[12px] text-text-secondary">{p.method}</div>
            <div className="col-span-2 text-right font-mono font-semibold text-success">AED {formatNumber(p.amount)}</div>
          </button>
        ))}
      </div>
    </>
  );
}

export default function PaymentsReceivedPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-text-meta">Loading…</div>}>
      <PaymentsReceivedContent />
    </Suspense>
  );
}
