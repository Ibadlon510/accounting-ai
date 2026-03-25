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
  EntityPanelAiHint,
  EntityPanelInfoMessage,
} from "@/components/overlays/entity-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { formatNumber } from "@/lib/accounting/engine";
import { Plus, Trash2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";
import { ProductSelect, getProductPrice } from "@/components/documents/product-select";
import { ContactSelect } from "@/components/documents/contact-select";
import { GLCombobox, type GLAccount } from "@/components/ai/gl-combobox";
type Customer = { id: string; name: string; email: string; phone: string; isActive: boolean };
type InvoiceLine = { id: string; productId: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number; accountId: string; taxCodeId: string };
type TaxCode = { id: string; code: string; name: string; rate: number; type: string; isActive: boolean };
type OrgConfig = { isVatRegistered: boolean; taxLabel: string; currency: string; defaultTaxRate?: number; defaultTaxCodeId?: string };

interface CreateInvoicePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onCustomerCreated?: (customer: { id: string; name: string }) => void;
  onCreate: (invoice: {
    customerId: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    lines: InvoiceLine[];
    subtotal: number;
    taxAmount: number;
    total: number;
    notes?: string;
    terms?: string;
    paymentInfo?: string;
  }) => void | Promise<void>;
}

function emptyLine(defaultTaxRate = 0, defaultTaxCodeId = ""): InvoiceLine {
  return { id: `new-${Date.now()}-${Math.random()}`, productId: "", description: "", quantity: 1, unitPrice: 0, amount: 0, taxRate: defaultTaxRate, taxAmount: 0, accountId: "", taxCodeId: defaultTaxCodeId };
}

export function CreateInvoicePanel({ open, onOpenChange, customers, onCustomerCreated, onCreate }: CreateInvoicePanelProps) {
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [autoSendEmail, setAutoSendEmail] = useState(false);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [showAdditional, setShowAdditional] = useState(false);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [orgConfig, setOrgConfig] = useState<OrgConfig>({ isVatRegistered: true, taxLabel: "VAT", currency: "AED" });

  useEffect(() => {
    if (!open) return;
    fetch("/api/org/document-defaults")
      .then((r) => r.json())
      .then((d) => {
        const inv = d.defaults?.invoice;
        if (inv) {
          if (inv.defaultTerms) setTerms(inv.defaultTerms);
          if (inv.defaultNotes) setNotes(inv.defaultNotes);
          if (inv.defaultPaymentInfo) setPaymentInfo(inv.defaultPaymentInfo);
        }
      })
      .catch(() => {});
    fetch("/api/org/chart-of-accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setAccounts((d.accounts ?? []).filter((a: GLAccount & { isActive?: boolean }) => a.isActive !== false)))
      .catch(() => {});
    fetch("/api/org/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setOrgConfig({
            isVatRegistered: d.isVatRegistered ?? true,
            taxLabel: d.taxLabel ?? "VAT",
            currency: d.currency ?? "AED",
            defaultTaxRate: d.defaultTaxRate,
            defaultTaxCodeId: d.defaultTaxCodeId,
          });
          if (!d.isVatRegistered) {
            setLines((prev) => prev.map((l) => ({ ...l, taxRate: 0, taxAmount: 0, taxCodeId: "" })));
          } else if (d.defaultTaxRate !== undefined) {
            setLines((prev) => prev.map((l) => {
              if (l.taxCodeId) return l;
              const updated = { ...l, taxRate: d.defaultTaxRate ?? 0, taxCodeId: d.defaultTaxCodeId ?? "" };
              updated.taxAmount = Math.round(updated.amount * updated.taxRate / 100 * 100) / 100;
              return updated;
            }));
          }
        }
      })
      .catch(() => {});
    fetch("/api/org/tax-codes")
      .then((r) => (r.ok ? r.json() : { taxCodes: [] }))
      .then((d) => setTaxCodes((d.taxCodes ?? []).filter((tc: TaxCode) => tc.isActive)))
      .catch(() => {});
  }, [open]);

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

  function updateLineFields(index: number, fields: Partial<InvoiceLine>) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, ...fields };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const rate = Number(updated.taxRate) || 0;
        updated.amount = Math.round(qty * price * 100) / 100;
        updated.taxAmount = Math.round(updated.amount * rate / 100 * 100) / 100;
        return updated;
      })
    );
  }

  function addLine() { setLines((prev) => [...prev, emptyLine(orgConfig.isVatRegistered ? (orgConfig.defaultTaxRate ?? 0) : 0, orgConfig.isVatRegistered ? (orgConfig.defaultTaxCodeId ?? "") : "")]); }
  function removeLine(index: number) { if (lines.length > 1) setLines((prev) => prev.filter((_, i) => i !== index)); }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
  const total = subtotal + taxAmount;

  function reset() {
    setCustomerId(""); setLines([emptyLine(orgConfig.isVatRegistered ? (orgConfig.defaultTaxRate ?? 0) : 0, orgConfig.isVatRegistered ? (orgConfig.defaultTaxCodeId ?? "") : "")]); setAutoSendEmail(false);
    setNotes(""); setTerms(""); setPaymentInfo(""); setShowAdditional(false);
    setIssueDate(new Date().toISOString().slice(0, 10));
    const d = new Date(); d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().slice(0, 10));
  }

  async function handleSave() {
    if (!customerId) { showError("Select a customer"); return; }
    if (subtotal <= 0) { showError("Invoice total must be greater than zero"); return; }
    const customer = customers.find((c) => c.id === customerId);
    try {
      await onCreate({
        customerId, customerName: customer?.name ?? "", issueDate, dueDate, lines,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        paymentInfo: paymentInfo.trim() || undefined,
      });
      showSuccess("Invoice created", `Invoice for ${orgConfig.currency} ${formatNumber(total)} has been created.`);
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
            <EntityPanelHeader
              title="Create Invoice"
              onAiClick={() => showSuccess("AI Auto-fill", "Attach a document or paste text to auto-fill invoice details with AI.")}
            />

            {/* Customer + dates row */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Customer</Label>
                <ContactSelect
                  type="customer"
                  value={customerId}
                  onChange={setCustomerId}
                  contacts={customers.map((c) => ({ id: c.id, name: c.name, email: c.email, isActive: c.isActive }))}
                  onContactCreated={(contact) => onCustomerCreated?.(contact)}
                  placeholder="Select customer"
                  className="h-9"
                />
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
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Account</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-center">{orgConfig.taxLabel}</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>
              {lines.map((line, i) => (
                <div key={line.id} className="grid grid-cols-12 items-start gap-2 border-t border-border-subtle px-4 py-3">
                  <div className="col-span-3 space-y-1.5">
                    <ProductSelect
                      value={line.productId}
                      onChange={(productId, product) => {
                        if (product) {
                          updateLineFields(i, {
                            productId,
                            description: product.name,
                            unitPrice: getProductPrice(product, "sales"),
                            accountId: product.salesAccountId ?? "",
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
                  <div className="col-span-2 pt-1">
                    <GLCombobox
                      accounts={accounts}
                      value={line.accountId}
                      onChange={(accountId) => updateLine(i, "accountId", accountId)}
                      disabled={!!line.productId}
                      className="h-8 min-h-8 [&_button]:h-8 [&_button]:text-[12px]"
                    />
                  </div>
                  <div className="col-span-1 pt-1">
                    <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", Number(e.target.value))} className="h-8 rounded-lg border-border-subtle text-right text-[13px]" />
                  </div>
                  <div className="col-span-2 pt-1">
                    <Input type="number" min="0" step="0.01" value={line.unitPrice || ""} onChange={(e) => updateLine(i, "unitPrice", Number(e.target.value))} placeholder="0.00" className="h-8 rounded-lg border-border-subtle text-right text-[13px]" />
                  </div>
                  <div className="col-span-1 pt-1">
                    {orgConfig.isVatRegistered ? (
                      <StyledSelect
                        value={line.taxCodeId || String(line.taxRate)}
                        onChange={(e) => {
                          const tc = taxCodes.find((t) => t.id === e.target.value);
                          if (tc) {
                            updateLineFields(i, { taxRate: tc.rate, taxCodeId: tc.id });
                          } else {
                            updateLineFields(i, { taxRate: Number(e.target.value), taxCodeId: "" });
                          }
                        }}
                        className="h-8 text-center text-[12px]"
                      >
                        {taxCodes.length > 0
                          ? taxCodes.map((tc) => (
                              <option key={tc.id} value={tc.id}>{tc.name} ({tc.rate}%)</option>
                            ))
                          : <option value={0}>0% (No tax codes configured)</option>
                        }
                      </StyledSelect>
                    ) : (
                      <span className="flex h-8 items-center justify-center text-[12px] text-text-meta">0%</span>
                    )}
                  </div>
                  <div className="col-span-2 pt-1 text-right font-mono text-[13px] font-medium text-text-primary">{formatNumber(line.amount)}</div>
                  <div className="col-span-1 flex justify-center pt-1">
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
                  <span className="font-mono font-medium text-text-primary">{orgConfig.currency} {formatNumber(subtotal)}</span>
                </div>
                {orgConfig.isVatRegistered && (
                  <div className="flex justify-between text-text-secondary">
                    <span>{orgConfig.taxLabel}</span>
                    <span className="font-mono font-medium text-text-primary">{orgConfig.currency} {formatNumber(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border-subtle pt-1.5 text-[15px] font-bold text-text-primary">
                  <span>Total</span>
                  <span className="font-mono">{orgConfig.currency} {formatNumber(total)}</span>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowAdditional(!showAdditional)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary"
              >
                {showAdditional ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Additional Details
              </button>
              {showAdditional && (
                <div className="mt-3 space-y-4 rounded-xl border border-border-subtle p-4">
                  <div>
                    <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Terms &amp; Conditions</Label>
                    <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, conditions..." rows={3} className="resize-none rounded-xl border-border-subtle text-[13px]" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes for this invoice..." rows={3} className="resize-none rounded-xl border-border-subtle text-[13px]" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-meta">Payment Information</Label>
                    <Textarea value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} placeholder="Bank details, payment methods..." rows={3} className="resize-none rounded-xl border-border-subtle text-[13px]" />
                  </div>
                </div>
              )}
            </div>
          </EntityPanelMain>

          <EntityPanelSidebar>
            <EntityPanelSidebarHeader title="Invoice Settings" />

            <EntityPanelSidebarSection title="Currency">
              <p className="text-[14px] font-medium text-text-primary">{orgConfig.currency}</p>
            </EntityPanelSidebarSection>

            <EntityPanelSidebarSection title="Tax">
              <p className="text-[13px] text-text-secondary">
                {orgConfig.isVatRegistered
                  ? `${orgConfig.taxLabel} applied to taxable line items`
                  : "Tax is not applicable"}
              </p>
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
