"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StyledSelect } from "@/components/ui/styled-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { ContactSelect } from "./contact-select";
import { ProductSelect, getProductPrice } from "./product-select";
import type { Customer, Supplier, InvoiceLine } from "./verify-types";

function emptyLine(): InvoiceLine {
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    taxRate: 5,
    taxAmount: 0,
  };
}

export type CreditNoteFormState = {
  creditNoteType: "sales" | "purchase";
  date: string;
  creditNoteNumber: string;
  customerId: string;
  supplierId: string;
  linkedInvoiceId: string;
  linkedBillId: string;
  lines: InvoiceLine[];
};

type InvoiceOption = { id: string; customerId: string; invoiceNumber: string; total: number; amountDue: number };
type BillOption = { id: string; supplierId: string; billNumber: string; total: number; amountDue: number };

type VerifyCreditNoteFormProps = {
  form: CreditNoteFormState;
  setForm: React.Dispatch<React.SetStateAction<CreditNoteFormState>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  invoices: InvoiceOption[];
  bills: BillOption[];
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function VerifyCreditNoteForm({
  form,
  setForm,
  customers,
  setCustomers,
  suppliers,
  setSuppliers,
  invoices,
  bills,
  saving,
  onSubmit,
}: VerifyCreditNoteFormProps) {
  const isSales = form.creditNoteType === "sales";

  function updateLine(index: number, field: keyof InvoiceLine, value: string | number) {
    setForm((prev) => {
      const lines = prev.lines.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const rate = Number(updated.taxRate) || 0;
        updated.amount = Math.round(qty * price * 100) / 100;
        updated.taxAmount = Math.round((updated.amount * rate) / 100 * 100) / 100;
        return updated;
      });
      return { ...prev, lines };
    });
  }

  function updateLineFields(index: number, fields: Partial<InvoiceLine>) {
    setForm((prev) => {
      const lines = prev.lines.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, ...fields };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const rate = Number(updated.taxRate) || 0;
        updated.amount = Math.round(qty * price * 100) / 100;
        updated.taxAmount = Math.round((updated.amount * rate) / 100 * 100) / 100;
        return updated;
      });
      return { ...prev, lines };
    });
  }

  const subtotal = form.lines.reduce((s, l) => s + l.amount, 0);
  const taxAmount = form.lines.reduce((s, l) => s + l.taxAmount, 0);
  const total = subtotal + taxAmount;

  const linkedDocs = isSales
    ? invoices.filter((inv) => form.customerId && inv.customerId === form.customerId && inv.amountDue > 0)
    : bills.filter((bill) => form.supplierId && bill.supplierId === form.supplierId && bill.amountDue > 0);

  return (
    <form onSubmit={onSubmit} className="flex-1 space-y-4">
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Type</Label>
          <SearchableSelect
            value={form.creditNoteType}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                creditNoteType: v as "sales" | "purchase",
                customerId: "",
                supplierId: "",
                linkedInvoiceId: "",
                linkedBillId: "",
              }))
            }
            options={[
              { value: "sales", label: "Sales credit note" },
              { value: "purchase", label: "Purchase credit note" },
            ]}
            placeholder="Select type"
            searchPlaceholder="Search..."
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">
            {isSales ? "Customer" : "Supplier"}
          </Label>
          <ContactSelect
            type={isSales ? "customer" : "supplier"}
            value={isSales ? form.customerId : form.supplierId}
            onChange={(id) =>
              setForm((f) => ({
                ...f,
                [isSales ? "customerId" : "supplierId"]: id,
                linkedInvoiceId: "",
                linkedBillId: "",
              }))
            }
            contacts={isSales ? customers : suppliers}
            onContactCreated={(contact) => {
              if (isSales) {
                setCustomers((prev) => [...prev, { ...contact, email: "", phone: "", isActive: true }]);
              } else {
                setSuppliers((prev) => [...prev, { ...contact, email: "", phone: "", isActive: true }]);
              }
            }}
            placeholder={`Select ${isSales ? "customer" : "supplier"}`}
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
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">CN Number</Label>
          <Input
            value={form.creditNoteNumber}
            onChange={(e) => setForm((f) => ({ ...f, creditNoteNumber: e.target.value }))}
            placeholder="CN-001"
            className="h-9 rounded-xl border-border-subtle text-[13px]"
          />
        </div>
      </div>

      {linkedDocs.length > 0 && (
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">
            Against {isSales ? "Invoice" : "Bill"} (optional)
          </Label>
          <SearchableSelect
            value={isSales ? form.linkedInvoiceId : form.linkedBillId}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                [isSales ? "linkedInvoiceId" : "linkedBillId"]: v,
              }))
            }
            options={linkedDocs.map((d) => ({
              value: d.id,
              label:
                isSales
                  ? `${(d as InvoiceOption).invoiceNumber} — AED ${formatNumber((d as InvoiceOption).amountDue)} due`
                  : `${(d as BillOption).billNumber} — AED ${formatNumber((d as BillOption).amountDue)} due`,
            }))}
            placeholder="— None —"
            allowEmpty
            emptyLabel="— None —"
            searchPlaceholder={`Search ${isSales ? "invoices" : "bills"}...`}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border-subtle overflow-hidden">
        <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
          <div className="col-span-5">Product</div>
          <div className="col-span-1 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-1 text-center">VAT</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1"></div>
        </div>
        {form.lines.map((line, i) => (
          <div key={line.id} className="grid grid-cols-12 items-start gap-2 border-t border-border-subtle px-4 py-3">
            <div className="col-span-5 space-y-1.5">
              <ProductSelect
                value={line.productId ?? ""}
                onChange={(productId, product) => {
                  if (product) {
                    updateLineFields(i, {
                      productId,
                      description: product.name,
                      unitPrice: getProductPrice(product, isSales ? "sales" : "purchase"),
                    });
                  } else {
                    updateLine(i, "productId", productId);
                  }
                }}
                placeholder="Select product"
                className="h-8 min-h-8"
              />
              <Input
                value={line.description}
                onChange={(e) => updateLine(i, "description", e.target.value)}
                placeholder="Add description (optional)"
                className="h-8 rounded-lg border-border-subtle text-[13px]"
              />
            </div>
            <div className="col-span-1 pt-1">
              <Input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                className="h-8 rounded-lg border-border-subtle text-right text-[13px]"
              />
            </div>
            <div className="col-span-2 pt-1">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.unitPrice || ""}
                onChange={(e) => updateLine(i, "unitPrice", Number(e.target.value))}
                placeholder="0.00"
                className="h-8 rounded-lg border-border-subtle text-right text-[13px]"
              />
            </div>
            <div className="col-span-1 pt-1">
              <StyledSelect
                value={line.taxRate}
                onChange={(e) => updateLine(i, "taxRate", Number(e.target.value))}
                className="h-8 text-center text-[12px]"
              >
                <option value={5}>5%</option>
                <option value={0}>0%</option>
              </StyledSelect>
            </div>
            <div className="col-span-2 pt-1 text-right font-mono text-[13px] font-medium text-text-primary">
              {formatNumber(line.amount)}
            </div>
            <div className="col-span-1 flex justify-center pt-1">
              <button
                type="button"
                onClick={() =>
                  form.lines.length > 1 &&
                  setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))
                }
                className="text-text-meta hover:text-error disabled:opacity-30"
                disabled={form.lines.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }))}
          className="flex w-full items-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[13px] font-medium text-success hover:bg-muted/20"
        >
          <Plus className="h-3.5 w-3.5" /> Add line item
        </button>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1.5 text-[13px]">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-text-primary">AED {formatNumber(subtotal)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>VAT</span>
            <span className="font-mono font-medium text-text-primary">AED {formatNumber(taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-1.5 text-[15px] font-bold text-text-primary">
            <span>Credit Total</span>
            <span className="font-mono">AED {formatNumber(total)}</span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={saving || !(isSales ? form.customerId : form.supplierId) || subtotal <= 0 || form.lines.some((l) => !l.productId)}
          className="gap-2 rounded-xl bg-success px-6 text-[13px] font-semibold text-white hover:bg-success/90"
        >
          <ShieldCheck className="h-4 w-4" />
          {saving ? "Saving..." : "Verify & Create Credit Note"}
        </Button>
      </div>
    </form>
  );
}
