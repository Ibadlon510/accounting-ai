"use client";

import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelHeader,
  EntityPanelAvatar,
  EntityPanelFieldGroup,
  EntityPanelFieldRow,
  EntityPanelField,
  EntityPanelFooter,
} from "@/components/overlays/entity-panel";
import { formatNumber } from "@/lib/accounting/engine";
type InvoiceLine = { id: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type Invoice = { id: string; customerId: string; customerName: string; invoiceNumber: string; issueDate: string; dueDate: string; status: string; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; lines: InvoiceLine[] };
import { FileText, Calendar, User, DollarSign } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-text-secondary",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-success-light text-success",
  partial: "bg-accent-yellow/20 text-amber-700",
  overdue: "bg-error-light text-error",
  cancelled: "bg-muted text-text-meta",
};

interface ViewInvoicePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | undefined | null;
}

export function ViewInvoicePanel({ open, onOpenChange, invoice }: ViewInvoicePanelProps) {
  if (!invoice) return null;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title={`Invoice ${invoice.invoiceNumber}`} showAiButton={false} />

            <EntityPanelAvatar
              name={invoice.customerName}
              subtitle={invoice.invoiceNumber}
              fallbackGradient="from-blue-300 via-indigo-200 to-purple-200"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField
                icon={<User className="h-4 w-4" />}
                label="Customer"
                value={invoice.customerName}
              />
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Issue Date"
                  value={invoice.issueDate}
                />
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Due Date"
                  value={invoice.dueDate}
                />
              </EntityPanelFieldRow>
              <EntityPanelField icon={<FileText className="h-4 w-4" />} label="Status">
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[invoice.status]}`}
                >
                  {invoice.status}
                </span>
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Subtotal"
                  value={`AED ${formatNumber(invoice.subtotal)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="VAT (5%)"
                  value={`AED ${formatNumber(invoice.taxAmount)}`}
                />
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Total"
                  value={`AED ${formatNumber(invoice.total)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Amount Paid"
                  value={`AED ${formatNumber(invoice.amountPaid)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Balance Due"
                  value={`AED ${formatNumber(invoice.amountDue)}`}
                />
              </EntityPanelFieldRow>
            </EntityPanelFieldGroup>

            <div className="mt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                Line Items
              </p>
              <div className="rounded-2xl border border-border-subtle overflow-hidden">
                <div className="grid grid-cols-12 gap-3 bg-canvas/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-1 text-right">VAT %</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                {invoice.lines.map((line) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-3 border-t border-border-subtle/50 px-4 py-2.5 text-[13px]"
                  >
                    <div className="col-span-5 text-text-primary">{line.description}</div>
                    <div className="col-span-2 text-right text-text-secondary">{line.quantity}</div>
                    <div className="col-span-2 text-right font-mono text-text-secondary">
                      {formatNumber(line.unitPrice)}
                    </div>
                    <div className="col-span-1 text-right text-text-secondary">{line.taxRate}%</div>
                    <div className="col-span-2 text-right font-mono text-text-primary">
                      {formatNumber(line.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </EntityPanelMain>
        </EntityPanelBody>

        <EntityPanelFooter
          onCancel={() => onOpenChange(false)}
          cancelLabel="Close"
        />
      </EntityPanelContent>
    </EntityPanel>
  );
}
