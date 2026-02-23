"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateBillPanel } from "@/components/modals/create-bill-panel";
import { ViewBillPanel } from "@/components/overlays/view-bill-panel";
import { ViewPaymentPanel } from "@/components/overlays/view-payment-panel";
import { RecordBillPaymentPanel } from "@/components/modals/record-bill-payment-panel";

type BillLine = { id: string; productId?: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type ReceiptItem = { type: "document" | "payment"; date: string; amount: number; documentId?: string; paymentId?: string };
type Bill = { id: string; supplierId: string; supplierName: string; billNumber: string; issueDate: string; dueDate: string; status: "draft" | "received" | "paid" | "partial" | "overdue" | "cancelled"; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; documentId?: string | null; paymentId?: string | null; receipts?: ReceiptItem[]; lines: BillLine[] };
type Supplier = { id: string; name: string; email: string; phone: string; isActive: boolean };
type BankAccount = { id: string; accountName: string; currency: string };

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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentBillId, setPaymentBillId] = useState<string | null>(null);
  const [viewingPaymentId, setViewingPaymentId] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  function loadBills() {
    fetch("/api/purchases/bills", { cache: "no-store" }).then((r) => r.ok ? r.json() : { bills: [] }).then((d) => setBills(d.bills ?? [])).catch(() => {});
  }

  useEffect(() => {
    loadBills();
    fetch("/api/purchases/suppliers", { cache: "no-store" }).then((r) => r.ok ? r.json() : { suppliers: [] }).then((d) => setSuppliers(d.suppliers ?? [])).catch(() => {});
    fetch("/api/banking", { cache: "no-store" }).then((r) => r.ok ? r.json() : { accounts: [] }).then((d) => setBankAccounts(d.accounts ?? [])).catch(() => {});
  }, []);

  async function handleCreate(data: { supplierId: string; supplierName: string; billNumber: string; issueDate: string; dueDate: string; lines: BillLine[]; subtotal: number; taxAmount: number; total: number }) {
    const res = await fetch("/api/purchases/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: data.supplierId,
        billNumber: data.billNumber,
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
      showError(json.error ?? "Failed to create bill");
      throw new Error(json.error ?? "Failed to create bill");
    }
    const bill = json.bill as Bill;
    setBills((prev) => [bill, ...prev]);
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
          onViewPaymentReceipt={(id) => setViewingPaymentId(id)}
          onRecordPayment={() => {
            setPaymentBillId(viewingId);
            setViewingId(null);
            setPaymentOpen(true);
          }}
        />
        <ViewPaymentPanel
          open={!!viewingPaymentId}
          onOpenChange={(o) => !o && setViewingPaymentId(null)}
          paymentId={viewingPaymentId}
          onViewBill={(id) => {
            setViewingPaymentId(null);
            setViewingId(id);
          }}
        />
        <RecordBillPaymentPanel
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          bankAccounts={bankAccounts}
          bills={bills.filter((b) => b.amountDue > 0).map((b) => ({ id: b.id, supplierId: b.supplierId, billNumber: b.billNumber, supplierName: b.supplierName, amountDue: b.amountDue }))}
          preSelectedBillId={paymentBillId}
          onCreate={async (data) => {
            const res = await fetch("/api/banking/payments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentType: "supplier_payment",
                date: data.paymentDate,
                bankAccountId: data.bankAccountId,
                amount: data.amount,
                supplierId: data.supplierId,
                allocations: [{ billId: data.billId, amount: data.amount }],
                reference: data.reference || undefined,
              }),
            });
            const json = await res.json();
            if (!res.ok) {
              const { showError } = await import("@/lib/utils/toast-helpers");
              showError(json.error ?? "Failed to record payment");
              throw new Error(json.error);
            }
            loadBills();
            setPaymentBillId(null);
          }}
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
