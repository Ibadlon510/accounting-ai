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
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, Trash2, Info } from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";
import { AttachDocumentZone } from "@/components/workspace/attach-document-zone";
import type { Supplier, BillLine } from "@/lib/mock/purchases-data";

interface CreateBillPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  onCreate: (bill: {
    supplierId: string;
    supplierName: string;
    billNumber: string;
    issueDate: string;
    dueDate: string;
    lines: BillLine[];
    subtotal: number;
    taxAmount: number;
    total: number;
  }) => void;
}

function emptyLine(): BillLine {
  return { id: `new-${Date.now()}-${Math.random()}`, description: "", quantity: 1, unitPrice: 0, amount: 0, taxRate: 5, taxAmount: 0 };
}

export function CreateBillPanel({ open, onOpenChange, suppliers, onCreate }: CreateBillPanelProps) {
  const [supplierId, setSupplierId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [lines, setLines] = useState<BillLine[]>([emptyLine()]);
  const [autoPost, setAutoPost] = useState(true);

  function updateLine(index: number, field: keyof BillLine, value: string | number) {
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
    setSupplierId(""); setBillNumber(""); setLines([emptyLine()]); setAutoPost(true);
    setIssueDate(new Date().toISOString().slice(0, 10));
    const d = new Date(); d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().slice(0, 10));
  }

  function handleSave() {
    if (!supplierId) { showError("Select a supplier"); return; }
    if (!billNumber.trim()) { showError("Bill number is required"); return; }
    if (lines.some((l) => !l.description.trim())) { showError("All lines need a description"); return; }
    if (subtotal <= 0) { showError("Bill total must be greater than zero"); return; }
    const supplier = suppliers.find((s) => s.id === supplierId);
    onCreate({
      supplierId, supplierName: supplier?.name ?? "", billNumber, issueDate, dueDate, lines,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    });
    showSuccess("Bill recorded", `Bill ${billNumber} for AED ${formatNumber(total)} has been recorded.`);
    reset();
    onOpenChange(false);
  }

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="xl">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader
              title="Record Bill"
              onAiClick={() => showSuccess("AI Auto-fill", "Scan a supplier invoice or receipt to auto-fill bill details with AI.")}
            />

            <div className="mb-6 grid grid-cols-4 gap-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Supplier</Label>
                <StyledSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Select supplier</option>
                  {suppliers.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </StyledSelect>
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Bill Number</Label>
                <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="BILL-001" className="h-9 rounded-xl border-border-subtle text-[13px]" />
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
                    <Input value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Expense description" className="h-8 rounded-lg border-border-subtle text-[13px]" />
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
                  <div className="col-span-2 text-right font-mono text-[13px] font-medium text-text-primary">{formatNumber(line.amount)}</div>
                  <div className="col-span-1 flex justify-center">
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
            <EntityPanelSidebarHeader title="Bill Settings" />
            <EntityPanelSidebarSection title="Source Document">
              <AttachDocumentZone
                onExtracted={(data) => {
                  const inv = (data as Record<string, Record<string, unknown>>).invoice;
                  const merchant = (data as Record<string, Record<string, unknown>>).merchant;
                  if (inv?.date && typeof inv.date === "string") setIssueDate(inv.date);
                  if (inv?.total_amount != null) {
                    const total = Number(inv.total_amount);
                    const tax = Number(inv.tax_amount ?? 0);
                    const net = Number(inv.net_amount ?? total - tax);
                    if (total > 0 && lines.length === 1 && !lines[0].description.trim()) {
                      setLines([{
                        ...lines[0],
                        description: typeof merchant?.name === "string" ? `${merchant.name} — invoice` : "Scanned line item",
                        quantity: 1,
                        unitPrice: Math.round(net * 100) / 100,
                        amount: Math.round(net * 100) / 100,
                        taxRate: net > 0 ? Math.round((tax / net) * 100) : 5,
                        taxAmount: Math.round(tax * 100) / 100,
                      }]);
                    }
                  }
                  if (merchant?.name && typeof merchant.name === "string" && !supplierId) {
                    const match = suppliers.find((s) => s.name.toLowerCase().includes((merchant.name as string).toLowerCase()));
                    if (match) setSupplierId(match.id);
                  }
                }}
              />
            </EntityPanelSidebarSection>
            <EntityPanelSidebarSection title="Currency">
              <p className="text-[14px] font-medium text-text-primary">AED — UAE Dirham</p>
            </EntityPanelSidebarSection>
            <EntityPanelSidebarSection title="Posting">
              <div className="flex items-start gap-2">
                <Checkbox id="auto-post" checked={autoPost} onCheckedChange={(v) => setAutoPost(!!v)} className="mt-0.5" />
                <Label htmlFor="auto-post" className="text-[13px] leading-snug text-text-primary font-normal cursor-pointer">
                  Automatically post journal entry on save
                </Label>
              </div>
            </EntityPanelSidebarSection>
            <EntityPanelInfoMessage icon={<Info className="h-3.5 w-3.5" />}>
              Input VAT will be automatically tracked for your VAT return
            </EntityPanelInfoMessage>
          </EntityPanelSidebar>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => { reset(); onOpenChange(false); }}
          onSave={handleSave}
          saveLabel="Record Bill"
          saveDisabled={!supplierId || subtotal <= 0 || !billNumber.trim()}
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
