"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StyledSelect } from "@/components/ui/styled-select";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { ContactSelect } from "./contact-select";
import { ProductSelect, getProductPrice } from "./product-select";
import type { Customer, InvoiceLine } from "./verify-types";

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

type VerifyInvoiceFormProps = {
  form: {
    customerId: string;
    issueDate: string;
    dueDate: string;
    lines: InvoiceLine[];
  };
  setForm: React.Dispatch<React.SetStateAction<{
    customerId: string;
    issueDate: string;
    dueDate: string;
    lines: InvoiceLine[];
  }>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function VerifyInvoiceForm({
  form,
  setForm,
  customers,
  setCustomers,
  saving,
  onSubmit,
}: VerifyInvoiceFormProps) {
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

  return (
    <form onSubmit={onSubmit} className="flex-1 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Customer</Label>
          <ContactSelect
            type="customer"
            value={form.customerId}
            onChange={(id) => setForm((f) => ({ ...f, customerId: id }))}
            contacts={customers}
            onContactCreated={(contact) =>
              setCustomers((prev) => [...prev, { ...contact, email: "", phone: "", isActive: true }])
            }
            placeholder="Select customer"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Issue Date</Label>
          <Input
            type="date"
            value={form.issueDate}
            onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
            className="h-9 rounded-xl border-border-subtle text-[13px]"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Due Date</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="h-9 rounded-xl border-border-subtle text-[13px]"
          />
        </div>
      </div>

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
                      unitPrice: getProductPrice(product, "sales"),
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
            <span>Total</span>
            <span className="font-mono">AED {formatNumber(total)}</span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={saving || !form.customerId || subtotal <= 0 || form.lines.some((l) => !l.productId)}
          className="gap-2 rounded-xl bg-success px-6 text-[13px] font-semibold text-white hover:bg-success/90"
        >
          <ShieldCheck className="h-4 w-4" />
          {saving ? "Saving..." : "Verify & Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
