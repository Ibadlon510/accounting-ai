"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockPaymentsReceived, mockInvoices } from "@/lib/mock/sales-data";
import type { Payment } from "@/lib/mock/sales-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentPanel } from "@/components/modals/record-payment-panel";

export default function PaymentsReceivedPage() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payments, setPayments] = useState(mockPaymentsReceived);

  const unpaidInvoices = mockInvoices
    .filter((inv) => inv.amountDue > 0)
    .map((inv) => ({ id: inv.id, invoiceNumber: inv.invoiceNumber, customerName: inv.customerName, amountDue: inv.amountDue }));

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
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Sales", href: "/sales" }, { label: "Payments Received" }]} />
      <PageHeader title="Payments Received" showActions={false} />

      <div className="mb-6 flex justify-end">
        <Button onClick={() => setPaymentOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
        <RecordPaymentPanel open={paymentOpen} onOpenChange={setPaymentOpen} invoices={unpaidInvoices} onCreate={handleCreate} />
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
          <div key={p.id} className="grid grid-cols-12 gap-4 border-b border-border-subtle/50 px-6 py-3.5 text-[13px] transition-colors hover:bg-black/[0.01]">
            <div className="col-span-2 font-mono font-medium text-text-primary">{p.paymentNumber}</div>
            <div className="col-span-2 text-text-secondary">{p.paymentDate}</div>
            <div className="col-span-3 text-text-primary">{p.entityName}</div>
            <div className="col-span-2 font-mono text-text-secondary">{p.invoiceNumber}</div>
            <div className="col-span-1 text-[12px] text-text-secondary">{p.method}</div>
            <div className="col-span-2 text-right font-mono font-semibold text-success">AED {formatNumber(p.amount)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
