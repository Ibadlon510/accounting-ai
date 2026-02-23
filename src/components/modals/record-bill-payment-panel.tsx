"use client";

import { useState, useEffect } from "react";
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

type BankAccount = { id: string; accountName: string; currency: string };

interface RecordBillPaymentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: BankAccount[];
  bills: { id: string; supplierId: string; billNumber: string; supplierName: string; amountDue: number }[];
  preSelectedBillId?: string | null;
  onCreate: (payment: {
    paymentDate: string;
    bankAccountId: string;
    supplierId: string;
    billId: string;
    billNumber: string;
    supplierName: string;
    amount: number;
    method: string;
    reference: string;
  }) => void | Promise<void>;
}

export function RecordBillPaymentPanel({ open, onOpenChange, bankAccounts, bills, preSelectedBillId, onCreate }: RecordBillPaymentPanelProps) {
  const [bankAccountId, setBankAccountId] = useState("");
  const [billId, setBillId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");

  const selectedBill = bills.find((b) => b.id === billId);

  useEffect(() => {
    if (open && bankAccounts.length === 1 && !bankAccountId) setBankAccountId(bankAccounts[0].id);
    if (open && preSelectedBillId) {
      setBillId(preSelectedBillId);
      const bill = bills.find((b) => b.id === preSelectedBillId);
      if (bill) setAmount(bill.amountDue);
    }
  }, [open, bankAccounts, bankAccountId, preSelectedBillId, bills]);

  function reset() {
    setBankAccountId(bankAccounts.length === 1 ? bankAccounts[0].id : "");
    setBillId(""); setAmount(""); setMethod("bank_transfer"); setReference("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSave() {
    if (!bankAccountId) { showError("Select a bank account"); return; }
    if (!billId || !selectedBill) { showError("Select a bill"); return; }
    const amt = Number(amount) || 0;
    if (amt <= 0) { showError("Amount must be greater than zero"); return; }
    if (amt > selectedBill.amountDue) { showError(`Amount exceeds balance due (AED ${formatNumber(selectedBill.amountDue)})`); return; }

    try {
      await onCreate({
        paymentDate,
        bankAccountId,
        supplierId: selectedBill.supplierId,
        billId,
        billNumber: selectedBill.billNumber,
        supplierName: selectedBill.supplierName,
        amount: amt,
        method,
        reference,
      });
      showSuccess("Payment recorded", `AED ${formatNumber(amt)} paid for ${selectedBill.billNumber}.`);
      reset();
      onOpenChange(false);
    } catch {
      // Error already shown by onCreate
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="md">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Record Bill Payment" showAiButton={false} />

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Pay From</Label>
                <StyledSelect value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="h-10">
                  <option value="">Select bank account</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.currency})
                    </option>
                  ))}
                </StyledSelect>
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Bill</Label>
                <StyledSelect value={billId} onChange={(e) => { setBillId(e.target.value); const b = bills.find((b) => b.id === e.target.value); if (b) setAmount(b.amountDue); }} className="h-10">
                  <option value="">Select bill</option>
                  {bills.filter((b) => b.amountDue > 0).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} — {b.supplierName} — AED {formatNumber(b.amountDue)} due
                    </option>
                  ))}
                </StyledSelect>
              </div>

              {selectedBill && (
                <div className="rounded-xl bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-text-secondary">Supplier</span>
                    <span className="font-medium text-text-primary">{selectedBill.supplierName}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-text-secondary">Outstanding Balance</span>
                    <span className="font-mono font-bold text-error">AED {formatNumber(selectedBill.amountDue)}</span>
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
            <EntityPanelSidebarSection title="Pay From">
              <p className="text-[14px] font-medium text-text-primary">
                {bankAccounts.find((a) => a.id === bankAccountId)?.accountName ?? "Select account"}
              </p>
              <p className="text-[11px] text-text-meta">
                {bankAccounts.find((a) => a.id === bankAccountId)?.currency ?? "AED"} Account
              </p>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              A journal entry will be automatically created to debit accounts payable and credit the bank account.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Record Payment"
          saveDisabled={!bankAccountId || !billId || !amount || Number(amount) <= 0}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
