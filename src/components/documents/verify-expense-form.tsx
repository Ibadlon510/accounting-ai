"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SmartField } from "@/components/workspace/smart-field";
import { GLCombobox } from "@/components/ai/gl-combobox";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { ShakeWrapper } from "@/components/ui/motion-wrappers";
import { StyledSelect } from "@/components/ui/styled-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ContactSelect } from "./contact-select";
import { ProductSelect, getProductPrice } from "./product-select";
import type { Account, ExpenseLine, Supplier } from "./verify-types";

function emptyLine(accounts: Account[]): ExpenseLine {
  const defaultGlId = accounts.find((a) => a.code === "6300" || a.code?.startsWith("6"))?.id ?? accounts[0]?.id ?? "";
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    taxRate: 5,
    taxAmount: 0,
    glAccountId: defaultGlId,
  };
}

type VerifyExpenseFormProps = {
  form: {
    date: string;
    currency: string;
    merchantName: string;
    supplierId: string;
    lines: ExpenseLine[];
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      date: string;
      currency: string;
      merchantName: string;
      supplierId: string;
      lines: ExpenseLine[];
    }>
  >;
  accounts: Account[];
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  fieldConfidence: (field: string) => number | undefined;
  ex: { gl_prediction?: { code?: string; confidence?: number } } | null;
  saving: boolean;
  shakeBtn: boolean;
  setShakeBtn: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function VerifyExpenseForm({
  form,
  setForm,
  accounts,
  suppliers,
  setSuppliers,
  fieldConfidence,
  ex,
  saving,
  shakeBtn,
  setShakeBtn,
  onSubmit,
}: VerifyExpenseFormProps) {
  function updateLine(index: number, field: keyof ExpenseLine, value: string | number) {
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

  function updateLineFields(index: number, fields: Partial<ExpenseLine>) {
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
  const netAmount = subtotal;

  return (
    <form onSubmit={onSubmit} className="flex-1 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <SmartField label="Date" confidence={fieldConfidence("date")}>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="h-9 rounded-lg border-border-subtle text-[13px]"
            required
          />
        </SmartField>
        <div>
          <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">
            Supplier
          </Label>
          <ContactSelect
            type="supplier"
            value={form.supplierId}
            onChange={(id) =>
              setForm((f) => ({
                ...f,
                supplierId: id,
                merchantName: suppliers.find((s) => s.id === id)?.name ?? f.merchantName,
              }))
            }
            contacts={suppliers}
            onContactCreated={(contact) => {
              setSuppliers((prev) => [...prev, { ...contact, email: "", phone: "", isActive: true }]);
              setForm((f) => ({
                ...f,
                supplierId: contact.id,
                merchantName: contact.name ?? f.merchantName,
              }));
            }}
            placeholder="Select supplier"
          />
        </div>
        <SmartField label="Currency" confidence={fieldConfidence("currency")}>
          <SearchableSelect
            value={form.currency}
            onChange={(v) => setForm((f) => ({ ...f, currency: v }))}
            options={[
              { value: "AED", label: "AED" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
              { value: "GBP", label: "GBP" },
            ]}
            placeholder="AED"
            searchPlaceholder="Search currency..."
          />
        </SmartField>
      </div>

      <div className="rounded-2xl border border-border-subtle overflow-hidden">
        <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
          <div className="col-span-4">Product</div>
          <div className="col-span-1 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-1 text-center">VAT</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2">GL Account</div>
          <div className="col-span-1"></div>
        </div>
        {form.lines.map((line, i) => (
          <div key={line.id} className="grid grid-cols-12 items-start gap-2 border-t border-border-subtle px-4 py-3">
            <div className="col-span-4 space-y-1.5">
              <ProductSelect
                value={line.productId ?? ""}
                onChange={(productId, product) => {
                  if (product) {
                    updateLineFields(i, {
                      productId,
                      description: product.name,
                      unitPrice: getProductPrice(product, "purchase"),
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
            <div className="col-span-2 pt-1">
              <GLCombobox
                accounts={accounts}
                value={line.glAccountId}
                onChange={(id) => updateLine(i, "glAccountId", id)}
                aiSuggestion={
                  i === 0 && ex?.gl_prediction?.code
                    ? {
                        accountId: accounts.find((a) => ex.gl_prediction!.code!.startsWith(a.code) || ex.gl_prediction!.code!.includes(a.name))?.id ?? "",
                        confidence: ex.gl_prediction.confidence ?? 0,
                      }
                    : null
                }
              />
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
          onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine(accounts)] }))}
          className="flex w-full items-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[13px] font-medium text-success hover:bg-muted/20"
        >
          <Plus className="h-3.5 w-3.5" /> Add line item
        </button>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1.5 text-[13px]">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-text-primary">
              {form.currency} {formatNumber(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>VAT</span>
            <span className="font-mono font-medium text-text-primary">
              {form.currency} {formatNumber(taxAmount)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-1.5 text-[15px] font-bold text-text-primary">
            <span>Total</span>
            <span className="font-mono">
              {form.currency} {formatNumber(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <ShakeWrapper shake={shakeBtn}>
          <Button
            type="submit"
            disabled={
              saving ||
              subtotal <= 0 ||
              !form.supplierId ||
              form.lines.some((l) => !l.productId || !l.glAccountId)
            }
            className="gap-2 rounded-xl bg-success px-6 text-[13px] font-semibold text-white hover:bg-success/90"
          >
            <ShieldCheck className="h-4 w-4" />
            {saving ? "Saving..." : "Verify & File"}
          </Button>
        </ShakeWrapper>
      </div>
    </form>
  );
}
