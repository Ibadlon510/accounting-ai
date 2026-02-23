"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ContactSelect } from "./contact-select";
import type { Customer, Supplier } from "./verify-types";

type InvoiceOption = { id: string; customerId: string; invoiceNumber: string; total: number; amountDue: number };
type BillOption = { id: string; supplierId: string; billNumber: string; total: number; amountDue: number };

type AllocationLine = { id: string; documentId: string; amount: number };

type ReceiptFormState = {
  receiptType: "sales" | "purchase";
  date: string;
  customerId: string;
  supplierId: string;
  totalAmount: string;
  allocations: AllocationLine[];
  bankAccountId: string;
};

function emptyAllocation(): AllocationLine {
  return { id: `alloc-${Date.now()}-${Math.random()}`, documentId: "", amount: 0 };
}

type VerifyReceiptFormProps = {
  form: ReceiptFormState;
  setForm: React.Dispatch<React.SetStateAction<ReceiptFormState>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  invoices: InvoiceOption[];
  bills: BillOption[];
  bankAccounts: { id: string; accountName: string; bankName: string; currency: string }[];
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function VerifyReceiptForm({
  form,
  setForm,
  customers,
  setCustomers,
  suppliers,
  setSuppliers,
  invoices,
  bills,
  bankAccounts,
  saving,
  onSubmit,
}: VerifyReceiptFormProps) {
  const receiptType = form.receiptType;
  const entities = receiptType === "sales" ? customers : suppliers;
  const docs = receiptType === "sales"
    ? invoices.filter((inv) => form.customerId && inv.customerId === form.customerId && inv.amountDue > 0)
    : bills.filter((bill) => form.supplierId && bill.supplierId === form.supplierId && bill.amountDue > 0);

  const totalNum = parseFloat(form.totalAmount) || 0;
  const allocSum = form.allocations.reduce((s, a) => s + a.amount, 0);
  const sumMismatch = totalNum > 0 && Math.abs(allocSum - totalNum) > 0.01;

  function updateAllocation(index: number, field: keyof AllocationLine, value: string | number) {
    setForm((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a, i) =>
        i === index ? { ...a, [field]: typeof value === "string" && field !== "id" ? (field === "documentId" ? value : parseFloat(value) || 0) : value } : a
      ),
    }));
  }

  function addAllocation() {
    setForm((prev) => ({ ...prev, allocations: [...prev.allocations, emptyAllocation()] }));
  }

  function removeAllocation(index: number) {
    setForm((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index),
    }));
  }

  return (
    <form onSubmit={onSubmit} className="flex-1 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Receipt type</Label>
          <SearchableSelect
            value={form.receiptType}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                receiptType: v as "sales" | "purchase",
                customerId: "",
                supplierId: "",
                allocations: [emptyAllocation()],
              }))
            }
            options={[
              { value: "sales", label: "Payment received (customer)" },
              { value: "purchase", label: "Payment made (supplier)" },
            ]}
            placeholder="Select type"
            searchPlaceholder="Search..."
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">
            {receiptType === "sales" ? "Customer" : "Supplier"}
          </Label>
          <ContactSelect
            type={receiptType === "sales" ? "customer" : "supplier"}
            value={receiptType === "sales" ? form.customerId : form.supplierId}
            onChange={(id) =>
              setForm((f) => ({
                ...f,
                [receiptType === "sales" ? "customerId" : "supplierId"]: id,
                allocations: [emptyAllocation()],
              }))
            }
            contacts={entities}
            onContactCreated={(contact) => {
              if (receiptType === "sales") {
                setCustomers((prev) => [...prev, { ...contact, email: "", phone: "", isActive: true }]);
              } else {
                setSuppliers((prev) => [...prev, { ...contact, email: "", phone: "", isActive: true }]);
              }
            }}
            placeholder={`Select ${receiptType === "sales" ? "customer" : "supplier"}`}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="h-9 rounded-xl border-border-subtle text-[13px]"
            required
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Total amount</Label>
          <Input
            type="number"
            step="0.01"
            value={form.totalAmount}
            onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
            placeholder="0.00"
            className="h-9 rounded-xl border-border-subtle text-[13px] font-mono"
            required
          />
        </div>
      </div>

      {bankAccounts.length > 0 && (
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Bank account (optional)</Label>
          <SearchableSelect
            value={form.bankAccountId}
            onChange={(v) => setForm((f) => ({ ...f, bankAccountId: v }))}
            options={bankAccounts.map((ba) => ({
              value: ba.id,
              label: `${ba.accountName} (${ba.bankName})`,
            }))}
            placeholder="—"
            allowEmpty
            emptyLabel="—"
            searchPlaceholder="Search accounts..."
          />
        </div>
      )}

      <div className="rounded-2xl border border-border-subtle overflow-hidden">
        <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
          <div className="col-span-8">{receiptType === "sales" ? "Invoice" : "Bill"}</div>
          <div className="col-span-3 text-right">Amount</div>
          <div className="col-span-1"></div>
        </div>
        {form.allocations.map((alloc, i) => (
          <div key={alloc.id} className="grid grid-cols-12 items-center gap-2 border-t border-border-subtle px-4 py-2">
            <div className="col-span-8">
              <SearchableSelect
                value={alloc.documentId}
                onChange={(v) => updateAllocation(i, "documentId", v)}
                options={docs.map((d) => ({
                  value: d.id,
                  label:
                    receiptType === "sales"
                      ? `${(d as InvoiceOption).invoiceNumber} — AED ${formatNumber((d as InvoiceOption).amountDue)} due`
                      : `${(d as BillOption).billNumber} — AED ${formatNumber((d as BillOption).amountDue)} due`,
                }))}
                placeholder={`Select ${receiptType === "sales" ? "invoice" : "bill"}`}
                allowEmpty
                emptyLabel="—"
                searchPlaceholder={`Search ${receiptType === "sales" ? "invoices" : "bills"}...`}
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                step="0.01"
                value={alloc.amount || ""}
                onChange={(e) => updateAllocation(i, "amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="h-8 rounded-lg border-border-subtle text-right text-[13px] font-mono"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                type="button"
                onClick={() => removeAllocation(i)}
                className="text-text-meta hover:text-error disabled:opacity-30"
                disabled={form.allocations.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addAllocation}
          className="flex w-full items-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[13px] font-medium text-success hover:bg-muted/20"
        >
          <Plus className="h-3.5 w-3.5" /> Add allocation
        </button>
      </div>

      {sumMismatch && (
        <p className="text-[13px] font-medium text-error">
          Sum of allocations (AED {formatNumber(allocSum)}) does not match total (AED {formatNumber(totalNum)})
        </p>
      )}

      <div className="pt-4">
        <Button
          type="submit"
          disabled={
            saving ||
            !(receiptType === "sales" ? form.customerId : form.supplierId) ||
            totalNum <= 0 ||
            sumMismatch ||
            form.allocations.some((a) => !a.documentId || a.amount <= 0)
          }
          className="gap-2 rounded-xl bg-success px-6 text-[13px] font-semibold text-white hover:bg-success/90"
        >
          <ShieldCheck className="h-4 w-4" />
          {saving ? "Saving..." : "Verify & Record"}
        </Button>
      </div>
    </form>
  );
}
