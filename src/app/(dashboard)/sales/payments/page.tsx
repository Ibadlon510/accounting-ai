"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentPanel } from "@/components/modals/record-payment-panel";
import { ViewPaymentPanel } from "@/components/overlays/view-payment-panel";

type Payment = { id: string; paymentNumber: string; paymentDate: string; entityName: string; amount: number; method: string; reference: string; invoiceNumber: string };
type UnpaidInvoice = { id: string; invoiceNumber: string; customerName: string; amountDue: number };

export default function PaymentsReceivedPage() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);

  useEffect(() => {
    // No payments API yet - will show empty state
    fetch("/api/sales/invoices")
      .then((r) => r.ok ? r.json() : { invoices: [] })
      .then((d) => {
        const invs = d.invoices ?? [];
        setUnpaidInvoices(invs.filter((inv: UnpaidInvoice & { amountDue: number }) => inv.amountDue > 0).map((inv: UnpaidInvoice & { customerName: string }) => ({ id: inv.id, invoiceNumber: inv.invoiceNumber, customerName: inv.customerName, amountDue: inv.amountDue })));
      })
      .catch(() => {});
  }, []);

  function handleCreate(data: { paymentDate: string; invoiceId: string; invoiceNumber: string; customerName: string; amount: number; method: string; reference: string }) {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-${String(payments.length + 1).padStart(4, "0")}`,
      paymentDate: data.paymentDate,
      entityName: data.customerName,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      invoiceNumber: data.invoiceNumber,
    };
    setPayments((prev) => [newPayment, ...prev]);
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setPaymentOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
        <RecordPaymentPanel open={paymentOpen} onOpenChange={setPaymentOpen} invoices={unpaidInvoices} onCreate={handleCreate} />
        <ViewPaymentPanel
          open={!!viewingId}
          onOpenChange={(o) => !o && setViewingId(null)}
          payment={payments.find((p) => p.id === viewingId) ?? null}
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
