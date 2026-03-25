"use client";

import React from "react";
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
import { PaymentReceiptSection } from "@/components/overlays/payment-receipt-section";
import type { ReceiptItem } from "@/components/overlays/payment-receipt-section";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { FileText, Calendar, User, DollarSign, CreditCard, Send, Mail, ReceiptText, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportPdfButton } from "@/components/pdf/export-pdf-button";
import { SendDocumentModal } from "@/components/email/send-document-modal";
import { ApplyCreditsPanel } from "@/components/modals/apply-credits-panel";
import { useOrgConfig } from "@/hooks/use-organization";

type InvoiceLine = { id: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type AppliedCredit = { id: string; creditNoteNumber: string; date: string; amount: number };
type Invoice = { id: string; customerId: string; customerName: string; customerEmail?: string | null; invoiceNumber: string; issueDate: string; dueDate: string; status: string; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; creditsApplied?: number; appliedCredits?: AppliedCredit[]; notes?: string | null; terms?: string | null; paymentInfo?: string | null; documentId?: string | null; paymentId?: string | null; receipts?: ReceiptItem[]; lines: InvoiceLine[] };

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
  onRecordPayment?: () => void;
  onViewPaymentReceipt?: (paymentId: string) => void;
  onConfirm?: () => void;
  confirming?: boolean;
}

export function ViewInvoicePanel({ open, onOpenChange, invoice, onRecordPayment, onViewPaymentReceipt, onConfirm, confirming }: ViewInvoicePanelProps) {
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showCreditsPanel, setShowCreditsPanel] = React.useState(false);
  const [creditsExpanded, setCreditsExpanded] = React.useState(false);
  const { currency, taxLabel } = useOrgConfig();
  if (!invoice) return null;

  const totalCreditsApplied = invoice.creditsApplied ?? (invoice.appliedCredits?.reduce((s, c) => s + c.amount, 0) ?? 0);

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg" panelTitle={`Invoice ${invoice.invoiceNumber}`}>
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
                  value={formatDate(invoice.issueDate)}
                />
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Due Date"
                  value={formatDate(invoice.dueDate)}
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
                  value={`${currency} ${formatNumber(invoice.subtotal)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label={taxLabel}
                  value={`${currency} ${formatNumber(invoice.taxAmount)}`}
                />
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Total"
                  value={`${currency} ${formatNumber(invoice.total)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Payments Received"
                  value={`${currency} ${formatNumber(invoice.amountPaid)}`}
                />
              </EntityPanelFieldRow>
              {totalCreditsApplied > 0 && (
                <EntityPanelFieldRow>
                  <EntityPanelField
                    icon={<ReceiptText className="h-4 w-4" />}
                    label="Credits Applied"
                    value={`- ${currency} ${formatNumber(totalCreditsApplied)}`}
                  />
                  <EntityPanelField
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Amount Due"
                    value={`${currency} ${formatNumber(invoice.amountDue)}`}
                  />
                </EntityPanelFieldRow>
              )}
              {totalCreditsApplied <= 0 && (
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Amount Due"
                  value={`${currency} ${formatNumber(invoice.amountDue)}`}
                />
              )}
              {(invoice.status === "paid" || invoice.amountPaid > 0) && (
                <PaymentReceiptSection
                  receipts={invoice.receipts ?? []}
                  documentId={invoice.documentId}
                  paymentId={invoice.paymentId}
                  amountPaid={invoice.amountPaid}
                  onViewPaymentReceipt={onViewPaymentReceipt}
                />
              )}
              {invoice.appliedCredits && invoice.appliedCredits.length > 0 && (
                <div className="flex flex-col gap-2 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setCreditsExpanded(!creditsExpanded)}
                    className="flex w-full items-center gap-3 text-left transition-colors hover:bg-black/[0.02] rounded-lg -m-1 p-1"
                  >
                    <ReceiptText className="h-4 w-4 shrink-0 text-text-meta" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">Applied Credits</span>
                    <span className="text-[13px] text-text-secondary">
                      {invoice.appliedCredits.length} credit{invoice.appliedCredits.length !== 1 ? "s" : ""}
                    </span>
                    {creditsExpanded ? <ChevronDown className="ml-auto h-4 w-4 text-text-meta" /> : <ChevronRight className="ml-auto h-4 w-4 text-text-meta" />}
                  </button>
                  {creditsExpanded && (
                    <div className="ml-7 space-y-3 border-l-2 border-border-subtle pl-3">
                      {invoice.appliedCredits.map((credit) => (
                        <div key={credit.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                          <span className="font-medium text-text-primary">{credit.creditNoteNumber}</span>
                          <span className="text-text-secondary">{credit.date ? formatDate(credit.date) : "—"}</span>
                          <span className="font-mono font-medium text-text-primary">- {currency} {formatNumber(credit.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                  <div className="col-span-1 text-right">{taxLabel} %</div>
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
        >
          <ExportPdfButton
            documentType="invoice"
            documentId={invoice.id}
            data={{ invoice }}
            size="sm"
            className="gap-1.5 rounded-xl border-border-subtle px-4 text-[12px]"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEmailModal(true)}
            className="mr-auto gap-1.5 rounded-xl border-border-subtle px-4 text-[12px]"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </Button>
          {invoice.status === "draft" && onConfirm && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={confirming}
              className="mr-auto gap-1.5 rounded-xl bg-text-primary px-5 text-white hover:bg-text-primary/90"
            >
              <Send className="h-3.5 w-3.5" /> {confirming ? "Confirming…" : "Confirm invoice"}
            </Button>
          )}
          {invoice.amountDue > 0 && invoice.status !== "draft" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreditsPanel(true)}
              className="mr-auto gap-1.5 rounded-xl border-border-subtle px-4 text-[12px]"
            >
              <ReceiptText className="h-3.5 w-3.5" /> Apply Credit
            </Button>
          )}
          {onRecordPayment && invoice.amountDue > 0 && invoice.status !== "draft" && (
            <Button
              size="sm"
              onClick={onRecordPayment}
              className="mr-auto gap-1.5 rounded-xl bg-success px-5 text-white hover:bg-success/90"
            >
              <CreditCard className="h-3.5 w-3.5" /> Record Payment
            </Button>
          )}
        </EntityPanelFooter>
      </EntityPanelContent>

      <SendDocumentModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        documentType="invoice"
        documentId={invoice.id}
        documentNumber={invoice.invoiceNumber}
        recipientEmail={invoice.customerEmail ?? undefined}
        recipientName={invoice.customerName}
        data={{ invoice }}
      />

      <ApplyCreditsPanel
        open={showCreditsPanel}
        onClose={() => setShowCreditsPanel(false)}
        documentType="invoice"
        documentId={invoice.id}
        documentNumber={invoice.invoiceNumber}
        amountDue={invoice.amountDue}
        contactType="customer"
        contactId={invoice.customerId}
        contactName={invoice.customerName}
        currency={currency}
        onSuccess={() => {
          setShowCreditsPanel(false);
          window.location.reload();
        }}
      />
    </EntityPanel>
  );
}
