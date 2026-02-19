"use client";

import { useState } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelSidebar,
  EntityPanelHeader,
  EntityPanelSidebarHeader,
  EntityPanelSidebarSection,
  EntityPanelFooter,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { formatNumber } from "@/lib/accounting/engine";
import { Info } from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";

interface RecordPaymentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: { id: string; invoiceNumber: string; customerName: string; amountDue: number }[];
  onCreate: (payment: {
    paymentDate: string;
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    method: string;
    reference: string;
  }) => void;
}

export function RecordPaymentPanel({ open, onOpenChange, invoices, onCreate }: RecordPaymentPanelProps) {
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");

  const selectedInvoice = invoices.find((i) => i.id === invoiceId);

  function reset() {
    setInvoiceId(""); setAmount(""); setMethod("bank_transfer"); setReference("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
  }

  function handleSave() {
    if (!invoiceId || !selectedInvoice) { showError("Select an invoice"); return; }
    const amt = Number(amount) || 0;
    if (amt <= 0) { showError("Amount must be greater than zero"); return; }
    if (amt > selectedInvoice.amountDue) { showError(`Amount exceeds balance due (AED ${formatNumber(selectedInvoice.amountDue)})`); return; }

    onCreate({
      paymentDate,
      invoiceId,
      invoiceNumber: selectedInvoice.invoiceNumber,
      customerName: selectedInvoice.customerName,
      amount: amt,
      method,
      reference,
    });
    showSuccess("Payment recorded", `AED ${formatNumber(amt)} received for ${selectedInvoice.invoiceNumber}.`);
    reset();
    onOpenChange(false);
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="md">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Record Payment" showAiButton={false} />

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Invoice</Label>
                <StyledSelect value={invoiceId} onChange={(e) => { setInvoiceId(e.target.value); const inv = invoices.find((i) => i.id === e.target.value); if (inv) setAmount(inv.amountDue); }} className="h-10">
                  <option value="">Select invoice</option>
                  {invoices.filter((i) => i.amountDue > 0).map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} — AED {formatNumber(inv.amountDue)} due
                    </option>
                  ))}
                </StyledSelect>
              </div>

              {selectedInvoice && (
                <div className="rounded-xl bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-text-secondary">Customer</span>
                    <span className="font-medium text-text-primary">{selectedInvoice.customerName}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-text-secondary">Outstanding Balance</span>
                    <span className="font-mono font-bold text-error">AED {formatNumber(selectedInvoice.amountDue)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Payment Date</Label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="h-10 rounded-xl border-border-subtle text-[13px]" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Amount (AED)</Label>
                  <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} placeholder="0.00" className="h-10 rounded-xl border-border-subtle text-[13px] font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Payment Method</Label>
                  <StyledSelect value={method} onChange={(e) => setMethod(e.target.value)} className="h-10">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="online">Online Payment</option>
                  </StyledSelect>
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Reference</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Transfer #12345" className="h-10 rounded-xl border-border-subtle text-[13px]" />
                </div>
              </div>
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Payment Info" />
            <EntityPanelSidebarSection title="Deposit To">
              <p className="text-[14px] font-medium text-text-primary">Emirates NBD — Current</p>
              <p className="text-[11px] text-text-meta">AED Account</p>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              A journal entry will be automatically created to debit the bank account and credit accounts receivable.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Record Payment"
          saveDisabled={!invoiceId || !amount || Number(amount) <= 0}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
