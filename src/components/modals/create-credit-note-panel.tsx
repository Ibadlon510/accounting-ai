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
import { GLCombobox } from "@/components/ai/gl-combobox";

type Customer = { id: string; name: string; email: string; phone: string; isActive: boolean };
type Supplier = { id: string; name: string; email: string; phone: string; isActive: boolean };
type Account = { id: string; code: string; name: string };
type Invoice = { id: string; invoiceNumber: string; customerId: string; total: number; amountDue: number };
type Bill = { id: string; billNumber: string; supplierId: string; total: number; amountDue: number };

type CreditNoteLine = {
  id: string;
  description: string;
  accountId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
};

interface CreateCreditNotePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sales" | "purchase";
  customers: Customer[];
  suppliers: Supplier[];
  accounts: Account[];
  invoices: Invoice[];
  bills: Bill[];
  onCreate: (data: {
    date: string;
    customerId?: string;
    supplierId?: string;
    invoiceId?: string;
    billId?: string;
    reason?: string;
    lines: { description: string; accountId: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number }[];
  }) => void | Promise<void>;
}

function emptyLine(accounts: Account[], type: "sales" | "purchase"): CreditNoteLine {
  const defaultCode = type === "sales" ? "4000" : "6300";
  const defaultGlId = accounts.find((a) => a.code === defaultCode)?.id ?? accounts[0]?.id ?? "";
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    description: "",
    accountId: defaultGlId,
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    taxRate: 5,
    taxAmount: 0,
  };
}

export function CreateCreditNotePanel({
  open, onOpenChange, type, customers, suppliers, accounts, invoices, bills, onCreate,
}: CreateCreditNotePanelProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entityId, setEntityId] = useState("");
  const [linkedDocId, setLinkedDocId] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<CreditNoteLine[]>([emptyLine(accounts, type)]);

  const isSales = type === "sales";

  function updateLine(index: number, field: keyof CreditNoteLine, value: string | number) {
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

  function addLine() { setLines((prev) => [...prev, emptyLine(accounts, type)]); }
  function removeLine(index: number) { if (lines.length > 1) setLines((prev) => prev.filter((_, i) => i !== index)); }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
  const total = subtotal + taxAmount;

  function reset() {
    setDate(new Date().toISOString().slice(0, 10));
    setEntityId("");
    setLinkedDocId("");
    setReason("");
    setLines([emptyLine(accounts, type)]);
  }

  async function handleSave() {
    if (!entityId) {
      showError(isSales ? "Select a customer" : "Select a supplier");
      return;
    }
    if (lines.some((l) => !l.accountId || !l.description.trim())) {
      showError("Each line needs a description and account");
      return;
    }
    if (subtotal <= 0) { showError("Credit note total must be greater than zero"); return; }

    try {
      const data: Record<string, unknown> = {
        date,
        reason: reason.trim() || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          accountId: l.accountId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
          taxRate: l.taxRate,
          taxAmount: l.taxAmount,
        })),
      };

      if (isSales) {
        data.customerId = entityId;
        if (linkedDocId) data.invoiceId = linkedDocId;
      } else {
        data.supplierId = entityId;
        if (linkedDocId) data.billId = linkedDocId;
      }

      await onCreate(data as Parameters<typeof onCreate>[0]);
      showSuccess("Credit note created", `Credit note for AED ${formatNumber(total)} has been recorded.`);
      reset();
      onOpenChange(false);
    } catch {
      // Error already shown by onCreate
    }
  }

  // Filter linked documents by selected entity
  const linkedDocs = isSales
    ? invoices.filter((inv) => inv.customerId === entityId)
    : bills.filter((bill) => bill.supplierId === entityId);

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title={isSales ? "Sales Credit Note" : "Purchase Credit Note"} />

            <div className="mb-6 grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-xl border-border-subtle text-[13px]" required />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                  {isSales ? "Customer" : "Supplier"}
                </Label>
                <StyledSelect value={entityId} onChange={(e) => { setEntityId(e.target.value); setLinkedDocId(""); }}>
                  <option value="">Select {isSales ? "customer" : "supplier"}</option>
                  {(isSales ? customers : suppliers).filter((e) => e.isActive).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </StyledSelect>
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                  {isSales ? "Against Invoice" : "Against Bill"} (optional)
                </Label>
                <StyledSelect value={linkedDocId} onChange={(e) => setLinkedDocId(e.target.value)} disabled={!entityId}>
                  <option value="">None — standalone CN</option>
                  {linkedDocs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isSales ? (d as Invoice).invoiceNumber : (d as Bill).billNumber} (due: AED {formatNumber((d as { amountDue: number }).amountDue)})
                    </option>
                  ))}
                </StyledSelect>
              </div>
            </div>

            <div className="mb-4">
              <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for credit note..." className="h-9 rounded-xl border-border-subtle text-[13px]" />
            </div>

            <div className="rounded-2xl border border-border-subtle overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-center">VAT</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">Account</div>
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
                      value={line.accountId}
                      onChange={(id) => updateLine(i, "accountId", id)}
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
                <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span className="font-mono font-medium text-text-primary">AED {formatNumber(subtotal)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>VAT</span><span className="font-mono font-medium text-text-primary">AED {formatNumber(taxAmount)}</span></div>
                <div className="flex justify-between border-t border-border-subtle pt-1.5 text-[15px] font-bold text-text-primary"><span>Total</span><span className="font-mono">AED {formatNumber(total)}</span></div>
              </div>
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Credit Note Info" />
            <EntityPanelSidebarSection title="Type">
              <p className="text-[14px] font-medium text-text-primary">
                {isSales ? "Sales Credit Note" : "Purchase Credit Note"}
              </p>
              <p className="mt-1 text-[12px] text-text-secondary">
                {isSales
                  ? "Reverses revenue and reduces AR. Journal: Dr Revenue, Cr AR."
                  : "Reverses expense and reduces AP. Journal: Dr AP, Cr Expense."}
              </p>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              A journal entry will be created automatically when this credit note is saved.
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Create Credit Note"
          saveDisabled={!entityId || subtotal <= 0 || lines.some((l) => !l.accountId || !l.description.trim())}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
