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
import { Plus, Trash2, Info } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ContactSelect } from "@/components/documents/contact-select";
import type { BankAccount, Customer, Supplier, BillOption, InvoiceOption, Allocation } from "@/lib/banking/types";

const PAYMENT_TYPES = [
  { value: "supplier_payment", label: "Supplier Payment" },
  { value: "owner_withdrawal", label: "Owner's Withdrawal" },
  { value: "refund_to_customer", label: "Refund to Customer" },
] as const;

function emptyAllocation(): Allocation {
  return { id: `alloc-${Date.now()}-${Math.random()}`, documentId: "", amount: 0 };
}

export type PaymentInitialValues = {
  date?: string;
  amount?: number;
  description?: string;
  bankAccountId?: string;
  paymentType?: "supplier_payment" | "owner_withdrawal" | "refund_to_customer";
};

interface RecordPaymentBankingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data?: { bankTransactionId?: string; paymentId?: string }) => void;
  initialValues?: PaymentInitialValues | null;
}

export function RecordPaymentBankingPanel({ open, onOpenChange, onSuccess, initialValues }: RecordPaymentBankingPanelProps) {
  const [paymentType, setPaymentType] = useState<(typeof PAYMENT_TYPES)[number]["value"]>("supplier_payment");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bankAccountId, setBankAccountId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([emptyAllocation()]);
  const [saving, setSaving] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<BillOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      if (initialValues.date) setDate(initialValues.date);
      if (initialValues.amount != null) setAmount(initialValues.amount);
      if (initialValues.description != null) setDescription(initialValues.description);
      if (initialValues.bankAccountId) setBankAccountId(initialValues.bankAccountId);
      if (initialValues.paymentType) setPaymentType(initialValues.paymentType);
    } else {
      reset();
    }
    Promise.all([
      fetch("/api/banking").then((r) => (r.ok ? r.json() : { accounts: [] })),
      fetch("/api/purchases/suppliers").then((r) => (r.ok ? r.json() : { suppliers: [] })),
      fetch("/api/sales/customers").then((r) => (r.ok ? r.json() : { customers: [] })),
      fetch("/api/purchases/bills").then((r) => (r.ok ? r.json() : { bills: [] })),
      fetch("/api/sales/invoices").then((r) => (r.ok ? r.json() : { invoices: [] })),
    ]).then(([bank, supp, cust, bil, inv]) => {
      setBankAccounts(bank.accounts ?? []);
      setSuppliers(supp.suppliers ?? []);
      setCustomers(cust.customers ?? []);
      const bils = (bil.bills ?? []).filter((b: BillOption) => b.amountDue > 0);
      setBills(bils.map((b: BillOption) => ({ id: b.id, supplierId: b.supplierId, billNumber: b.billNumber, total: b.total, amountDue: b.amountDue })));
      const invs = (inv.invoices ?? []).filter((i: InvoiceOption) => i.amountDue > 0);
      setInvoices(invs.map((i: InvoiceOption) => ({ id: i.id, customerId: i.customerId, invoiceNumber: i.invoiceNumber, total: i.total, amountDue: i.amountDue })));
      if (initialValues?.bankAccountId) setBankAccountId(initialValues.bankAccountId);
      else if ((bank.accounts ?? []).length === 1 && !bankAccountId) setBankAccountId(bank.accounts[0].id);
    });
  }, [open, initialValues]);

  const selectedCurrency = bankAccounts.find((a) => a.id === bankAccountId)?.currency ?? "AED";
  const unpaidBills = bills.filter((b) => supplierId && b.supplierId === supplierId && b.amountDue > 0);
  const unpaidInvoices = invoices.filter((i) => customerId && i.customerId === customerId && i.amountDue > 0);
  const amt = Number(amount) || 0;
  const allocSum = allocations.reduce((s, a) => s + a.amount, 0);
  const sumMismatch = amt > 0 && Math.abs(allocSum - amt) > 0.01;

  function updateAllocation(index: number, field: keyof Allocation, value: string | number) {
    setAllocations((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function addAllocation() {
    setAllocations((prev) => [...prev, emptyAllocation()]);
  }

  function removeAllocation(index: number) {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setPaymentType("supplier_payment");
    setDate(new Date().toISOString().slice(0, 10));
    setBankAccountId("");
    setAmount("");
    setReference("");
    setDescription("");
    setSupplierId("");
    setCustomerId("");
    setAllocations([emptyAllocation()]);
  }

  function handleSave() {
    if (!bankAccountId) {
      showError("Select a bank account");
      return;
    }
    if (amt <= 0) {
      showError("Amount must be greater than zero");
      return;
    }

    if (paymentType === "supplier_payment") {
      if (!supplierId) {
        showError("Select a supplier");
        return;
      }
      const validAllocs = allocations.filter((a) => a.documentId && a.amount > 0);
      if (!validAllocs.length) {
        showError("Add at least one allocation to a bill");
        return;
      }
      if (sumMismatch) {
        showError("Sum of allocations must equal total amount");
        return;
      }
    }

    if (paymentType === "refund_to_customer" && allocations.some((a) => a.documentId && a.amount > 0) && sumMismatch) {
      showError("Sum of allocations must equal total amount");
      return;
    }

    setSaving(true);
    const body: Record<string, unknown> = {
      paymentType,
      date,
      bankAccountId,
      amount: amt,
      reference: reference || undefined,
      description: description || undefined,
    };

    if (paymentType === "supplier_payment") {
      body.supplierId = supplierId;
      body.allocations = allocations.filter((a) => a.documentId && a.amount > 0).map((a) => ({ billId: a.documentId, amount: a.amount }));
    } else if (paymentType === "refund_to_customer") {
      body.customerId = customerId;
      const validAllocs = allocations.filter((a) => a.documentId && a.amount > 0);
      if (validAllocs.length) {
        body.allocations = validAllocs.map((a) => ({ invoiceId: a.documentId, amount: a.amount }));
      }
    }

    fetch("/api/banking/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          showError(data.error);
          return;
        }
        showSuccess("Payment recorded", `${selectedCurrency} ${formatNumber(amt)} has been recorded.`);
        reset();
        onOpenChange(false);
        onSuccess?.({ bankTransactionId: data.bankTransactionId, paymentId: data.paymentId });
      })
      .catch(() => showError("Failed to record payment"))
      .finally(() => setSaving(false));
  }

  const isSupplierPayment = paymentType === "supplier_payment";
  const isRefundToCustomer = paymentType === "refund_to_customer";
  const docs = isSupplierPayment ? unpaidBills : unpaidInvoices;
  const showAllocations = (isSupplierPayment || isRefundToCustomer) && (supplierId || customerId);
  const saveDisabled =
    !bankAccountId ||
    amt <= 0 ||
    saving ||
    (isSupplierPayment && (!supplierId || sumMismatch || allocations.every((a) => !a.documentId || a.amount <= 0))) ||
    (isRefundToCustomer && (!customerId || (allocations.some((a) => a.documentId && a.amount > 0) && sumMismatch)));

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Record Payment" showAiButton={false} />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Payment type</Label>
                  <SearchableSelect
                    value={paymentType}
                    onChange={(v) => {
                      setPaymentType(v as (typeof PAYMENT_TYPES)[number]["value"]);
                      setSupplierId("");
                      setCustomerId("");
                      setAllocations([emptyAllocation()]);
                    }}
                    options={PAYMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    placeholder="Select type"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Bank account</Label>
                  <SearchableSelect
                    value={bankAccountId}
                    onChange={setBankAccountId}
                    options={bankAccounts.map((ba) => ({
                      value: ba.id,
                      label: `${ba.accountName}${ba.bankName ? ` (${ba.bankName})` : ""} — ${ba.currency}`,
                    }))}
                    placeholder="Select account"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>

              {isSupplierPayment && (
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Supplier</Label>
                  <ContactSelect
                    type="supplier"
                    value={supplierId}
                    onChange={(v) => {
                      setSupplierId(v);
                      setAllocations([emptyAllocation()]);
                    }}
                    contacts={suppliers}
                    onContactCreated={(s) => setSuppliers((prev) => [...prev, { ...s, email: "", isActive: true }])}
                    placeholder="Select supplier"
                  />
                </div>
              )}

              {isRefundToCustomer && (
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Customer</Label>
                  <ContactSelect
                    type="customer"
                    value={customerId}
                    onChange={(v) => {
                      setCustomerId(v);
                      setAllocations([emptyAllocation()]);
                    }}
                    contacts={customers}
                    onContactCreated={(c) => setCustomers((prev) => [...prev, { ...c, email: "", isActive: true }])}
                    placeholder="Select customer"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-xl border-border-subtle text-[13px]" required />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Amount</Label>
                  <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} placeholder="0.00" className="h-10 rounded-xl border-border-subtle text-[13px] font-mono" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Reference</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Transfer #12345" className="h-10 rounded-xl border-border-subtle text-[13px]" />
                </div>
              </div>

              {(paymentType === "owner_withdrawal" || (paymentType === "refund_to_customer" && !showAllocations)) && (
                <div>
                  <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Drawings" className="h-10 rounded-xl border-border-subtle text-[13px]" />
                </div>
              )}

              {showAllocations && (
                <div className="rounded-2xl border border-border-subtle overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                    <div className="col-span-8">{isSupplierPayment ? "Bill" : "Invoice"}</div>
                    <div className="col-span-3 text-right">Amount</div>
                    <div className="col-span-1"></div>
                  </div>
                  {allocations.map((alloc, i) => (
                    <div key={alloc.id} className="grid grid-cols-12 items-center gap-2 border-t border-border-subtle px-4 py-2">
                      <div className="col-span-8">
                        <SearchableSelect
                          value={alloc.documentId}
                          onChange={(v) => updateAllocation(i, "documentId", v)}
                          options={docs.map((d) => ({
                            value: d.id,
                            label: isSupplierPayment ? `${(d as BillOption).billNumber} — ${selectedCurrency} ${formatNumber((d as BillOption).amountDue)} due` : `${(d as InvoiceOption).invoiceNumber} — ${selectedCurrency} ${formatNumber((d as InvoiceOption).amountDue)} due`,
                          }))}
                          placeholder={`Select ${isSupplierPayment ? "bill" : "invoice"}`}
                          allowEmpty
                          emptyLabel="—"
                          searchPlaceholder={`Search ${isSupplierPayment ? "bills" : "invoices"}...`}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" step="0.01" value={alloc.amount || ""} onChange={(e) => updateAllocation(i, "amount", parseFloat(e.target.value) || 0)} placeholder="0.00" className="h-8 rounded-lg border-border-subtle text-right text-[13px] font-mono" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button type="button" onClick={() => removeAllocation(i)} className="text-text-meta hover:text-error disabled:opacity-30" disabled={allocations.length <= 1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addAllocation} className="flex w-full items-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[13px] font-medium text-success hover:bg-muted/20">
                    <Plus className="h-3.5 w-3.5" /> Add allocation
                  </button>
                </div>
              )}

              {sumMismatch && (
                <p className="text-[13px] font-medium text-error">Sum of allocations ({selectedCurrency} {formatNumber(allocSum)}) does not match total ({selectedCurrency} {formatNumber(amt)})</p>
              )}
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Payment Info" />
            <EntityPanelSidebarSection title="Type">
              <p className="text-[14px] font-medium text-text-primary">{PAYMENT_TYPES.find((t) => t.value === paymentType)?.label ?? paymentType}</p>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>A bank transaction (debit) and journal entry will be created. For supplier payments, bill allocations are updated.</EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter onCancel={() => { reset(); onOpenChange(false); }} onSave={handleSave} saveLabel={saving ? "Saving..." : "Record Payment"} saveDisabled={saveDisabled} />
      </EntityPanelContent>
    </EntityPanel>
  );
}
