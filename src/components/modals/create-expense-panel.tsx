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
import { Plus, Trash2, Info } from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { GLCombobox } from "@/components/ai/gl-combobox";

type Supplier = { id: string; name: string; email: string; phone: string; isActive: boolean };
type BankAccount = { id: string; accountName: string; bankName: string; currency: string };
type Account = { id: string; code: string; name: string };
type ExpenseLine = {
  id: string;
  description: string;
  glAccountId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
};

interface CreateExpensePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  bankAccounts: BankAccount[];
  accounts: Account[];
  onCreate: (data: {
    date: string;
    supplierId?: string;
    supplierName?: string;
    bankAccountId: string;
    description?: string;
    currency?: string;
    reference?: string;
    lines: { description: string; glAccountId: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number }[];
  }) => void | Promise<void>;
}

function emptyLine(accounts: Account[]): ExpenseLine {
  const defaultGlId = accounts.find((a) => a.code === "6300" || a.code?.startsWith("6"))?.id ?? accounts[0]?.id ?? "";
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    description: "",
    glAccountId: defaultGlId,
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    taxRate: 5,
    taxAmount: 0,
  };
}

export function CreateExpensePanel({ open, onOpenChange, suppliers, bankAccounts, accounts, onCreate }: CreateExpensePanelProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [lines, setLines] = useState<ExpenseLine[]>([emptyLine(accounts)]);

  function updateLine(index: number, field: keyof ExpenseLine, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const rate = Number(updated.taxRate) || 0;
        updated.amount = Math.round(qty * price * 100) / 100;
        updated.taxAmount = Math.round((updated.amount * rate) / 100 * 100) / 100;
        return updated;
      })
    );
  }

  function addLine() { setLines((prev) => [...prev, emptyLine(accounts)]); }
  function removeLine(index: number) { if (lines.length > 1) setLines((prev) => prev.filter((_, i) => i !== index)); }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
  const total = subtotal + taxAmount;

  function reset() {
    setDate(new Date().toISOString().slice(0, 10));
    setSupplierId("");
    setBankAccountId("");
    setDescription("");
    setReference("");
    setCurrency("AED");
    setLines([emptyLine(accounts)]);
  }

  async function handleSave() {
    if (!bankAccountId) { showError("Select a bank account"); return; }
    if (lines.some((l) => !l.glAccountId || !l.description.trim())) { showError("Each line needs a description and GL account"); return; }
    if (subtotal <= 0) { showError("Expense total must be greater than zero"); return; }
    const supplier = suppliers.find((s) => s.id === supplierId);
    try {
      await onCreate({
        date,
        supplierId: supplierId || undefined,
        supplierName: supplier?.name,
        bankAccountId,
        description: description.trim() || undefined,
        currency,
        reference: reference.trim() || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          glAccountId: l.glAccountId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
          taxRate: l.taxRate,
          taxAmount: l.taxAmount,
        })),
      });
      showSuccess("Expense recorded", `Expense for ${currency} ${formatNumber(total)} has been recorded.`);
      reset();
      onOpenChange(false);
    } catch {
      // Error already shown by onCreate
    }
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Record Expense" />

            <div className="mb-6 grid grid-cols-4 gap-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-xl border-border-subtle text-[13px]" required />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Supplier</Label>
                <StyledSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Select supplier (optional)</option>
                  {suppliers.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </StyledSelect>
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Paid From</Label>
                <SearchableSelect
                  value={bankAccountId}
                  onChange={setBankAccountId}
                  options={bankAccounts.map((ba) => ({
                    value: ba.id,
                    label: `${ba.accountName} (${ba.bankName})`,
                  }))}
                  placeholder="Select bank account"
                  searchPlaceholder="Search bank accounts..."
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Reference</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="INV-001, receipt #..." className="h-9 rounded-xl border-border-subtle text-[13px]" />
              </div>
            </div>

            <div className="mb-4">
              <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this expense for?" className="h-9 rounded-xl border-border-subtle text-[13px]" />
            </div>

            <div className="rounded-2xl border border-border-subtle overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-center">VAT</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">GL Account</div>
              </div>
              {lines.map((line, i) => (
                <div key={line.id} className="grid grid-cols-12 items-start gap-2 border-t border-border-subtle px-4 py-3">
                  <div className="col-span-4">
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(i, "description", e.target.value)}
                      placeholder="Line description"
                      className="h-8 rounded-lg border-border-subtle text-[13px]"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", Number(e.target.value))} className="h-8 rounded-lg border-border-subtle text-right text-[13px]" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0" step="0.01" value={line.unitPrice || ""} onChange={(e) => updateLine(i, "unitPrice", Number(e.target.value))} placeholder="0.00" className="h-8 rounded-lg border-border-subtle text-right text-[13px]" />
                  </div>
                  <div className="col-span-1">
                    <StyledSelect value={line.taxRate} onChange={(e) => updateLine(i, "taxRate", Number(e.target.value))} className="h-8 text-center text-[12px]">
                      <option value={5}>5%</option>
                      <option value={0}>0%</option>
                    </StyledSelect>
                  </div>
                  <div className="col-span-2 pt-1 text-right font-mono text-[13px] font-medium text-text-primary">{formatNumber(line.amount)}</div>
                  <div className="col-span-2 flex items-center gap-1">
                    <GLCombobox
                      accounts={accounts}
                      value={line.glAccountId}
                      onChange={(id) => updateLine(i, "glAccountId", id)}
                    />
                    <button type="button" onClick={() => removeLine(i)} className="text-text-meta hover:text-error disabled:opacity-30" disabled={lines.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addLine} className="flex w-full items-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[13px] font-medium text-success hover:bg-muted/20">
                <Plus className="h-3.5 w-3.5" /> Add line item
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span className="font-mono font-medium text-text-primary">{currency} {formatNumber(subtotal)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>VAT</span><span className="font-mono font-medium text-text-primary">{currency} {formatNumber(taxAmount)}</span></div>
                <div className="flex justify-between border-t border-border-subtle pt-1.5 text-[15px] font-bold text-text-primary"><span>Total</span><span className="font-mono">{currency} {formatNumber(total)}</span></div>
              </div>
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Expense Settings" />
            <EntityPanelSidebarSection title="Currency">
              <SearchableSelect
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: "AED", label: "AED — UAE Dirham" },
                  { value: "USD", label: "USD — US Dollar" },
                  { value: "EUR", label: "EUR — Euro" },
                  { value: "GBP", label: "GBP — British Pound" },
                ]}
                placeholder="AED"
                searchPlaceholder="Search currency..."
              />
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              Expenses are direct payments. A journal entry (Dr Expense, Cr Bank) and bank transaction will be created automatically.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Record Expense"
          saveDisabled={!bankAccountId || subtotal <= 0 || lines.some((l) => !l.glAccountId || !l.description.trim())}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
