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
  EntityPanelAiHint,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, Trash2, Info } from "lucide-react";
import type { Customer, InvoiceLine } from "@/lib/mock/sales-data";

interface CreateInvoicePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onCreate: (invoice: {
    customerId: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    lines: InvoiceLine[];
    subtotal: number;
    taxAmount: number;
    total: number;
  }) => void;
}

function emptyLine(): InvoiceLine {
  return { id: `new-${Date.now()}-${Math.random()}`, description: "", quantity: 1, unitPrice: 0, amount: 0, taxRate: 5, taxAmount: 0 };
}

export function CreateInvoicePanel({ open, onOpenChange, customers, onCreate }: CreateInvoicePanelProps) {
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [autoSendEmail, setAutoSendEmail] = useState(false);

  function updateLine(index: number, field: keyof InvoiceLine, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const rate = Number(updated.taxRate) || 0;
        updated.amount = Math.round(qty * price * 100) / 100;
        updated.taxAmount = Math.round(updated.amount * rate / 100 * 100) / 100;
        return updated;
      })
    );
  }

  function addLine() { setLines((prev) => [...prev, emptyLine()]); }
  function removeLine(index: number) { if (lines.length > 1) setLines((prev) => prev.filter((_, i) => i !== index)); }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
  const total = subtotal + taxAmount;

  function reset() {
    setCustomerId(""); setLines([emptyLine()]); setAutoSendEmail(false);
    setIssueDate(new Date().toISOString().slice(0, 10));
    const d = new Date(); d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().slice(0, 10));
  }

  function handleSave() {
    if (!customerId) { showError("Select a customer"); return; }
    if (lines.some((l) => !l.description.trim())) { showError("All lines need a description"); return; }
    if (subtotal <= 0) { showError("Invoice total must be greater than zero"); return; }
    const customer = customers.find((c) => c.id === customerId);
    onCreate({
      customerId, customerName: customer?.name ?? "", issueDate, dueDate, lines,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    });
    showSuccess("Invoice created", `Invoice for AED ${formatNumber(total)} has been created.`);
    reset();
    onOpenChange(false);
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Create Invoice" showAiButton={false} />

            {/* Customer + dates row */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Customer</Label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border-subtle bg-transparent px-3 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                >
                  <option value="">Select customer</option>
                  {customers.filter((c) => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Issue Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-9 rounded-xl border-border-subtle text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 rounded-xl border-border-subtle text-[13px]" />
              </div>
            </div>

            {/* Line items table */}
            <div className="rounded-2xl border border-border-subtle overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                <div className="col-span-5">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-center">VAT</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>
              {lines.map((line, i) => (
                <div key={line.id} className="grid grid-cols-12 items-center gap-2 border-t border-border-subtle px-4 py-2">
                  <div className="col-span-5">
                    <Input value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Service or product description" className="h-8 rounded-lg border-border-subtle text-[13px]" />
                  </div>
                  <div className="col-span-1">
                    <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", Number(e.target.value))} className="h-8 rounded-lg border-border-subtle text-right text-[13px]" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0" step="0.01" value={line.unitPrice || ""} onChange={(e) => updateLine(i, "unitPrice", Number(e.target.value))} placeholder="0.00" className="h-8 rounded-lg border-border-subtle text-right text-[13px]" />
                  </div>
                  <div className="col-span-1">
                    <select value={line.taxRate} onChange={(e) => updateLine(i, "taxRate", Number(e.target.value))} className="h-8 w-full rounded-lg border border-border-subtle bg-transparent text-center text-[12px]">
                      <option value={5}>5%</option>
                      <option value={0}>0%</option>
                    </select>
                  </div>
                  <div className="col-span-2 text-right font-mono text-[13px] font-medium text-text-primary">{formatNumber(line.amount)}</div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" onClick={() => removeLine(i)} className="text-text-meta hover:text-error disabled:opacity-30" disabled={lines.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {/* Add line */}
              <button onClick={addLine} className="flex w-full items-center gap-1.5 border-t border-border-subtle px-4 py-2.5 text-[13px] font-medium text-success hover:bg-muted/20">
                <Plus className="h-3.5 w-3.5" /> Add line item
              </button>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-text-primary">AED {formatNumber(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>VAT (5%)</span>
                  <span className="font-mono font-medium text-text-primary">AED {formatNumber(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-1.5 text-[15px] font-bold text-text-primary">
                  <span>Total</span>
                  <span className="font-mono">AED {formatNumber(total)}</span>
                </div>
              </div>
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Invoice Settings" />

            <EntityPanelSidebarSection title="Currency">
              <p className="text-[14px] font-medium text-text-primary">AED — UAE Dirham</p>
            </EntityPanelSidebarSection>

            <EntityPanelSidebarSection title="Tax">
              <p className="text-[13px] text-text-secondary">UAE VAT at 5% applied to taxable line items</p>
            </EntityPanelSidebarSection>

            <EntityPanelSidebarSection>
              <h3 className="mb-3 text-[15px] font-semibold text-text-primary">Email</h3>
              <div className="flex items-start gap-2">
                <Checkbox id="auto-send" checked={autoSendEmail} onCheckedChange={(v) => setAutoSendEmail(!!v)} className="mt-0.5" />
                <Label htmlFor="auto-send" className="text-[13px] leading-snug text-text-primary font-normal cursor-pointer">
                  Automatically send invoice to customer on save
                </Label>
              </div>
            </EntityPanelSidebarSection>

            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              Invoice number will be auto-generated on save
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Create Invoice"
          saveDisabled={!customerId || subtotal <= 0}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
