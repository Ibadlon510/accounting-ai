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
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { User, DollarSign, FileText, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportPdfButton } from "@/components/pdf/export-pdf-button";
import { SendDocumentModal } from "@/components/email/send-document-modal";

interface StatementEntry {
  date: string;
  type: "Invoice" | "Credit Note" | "Receipt" | "Refund";
  ref: string;
  debit: number;
  credit: number;
}

export interface Statement {
  customer: { id: string; name: string; email?: string | null; city: string; country: string };
  invoices: Array<{ id: string; issueDate: string; invoiceNumber: string; total: number }>;
  creditNotes: Array<{ id: string; issueDate: string; creditNoteNumber: string; total: number }>;
  payments: Array<{ id: string; paymentDate: string; paymentNumber: string; amount: number }>;
  refunds: Array<{ id: string; paymentDate: string; paymentNumber: string; amount: number }>;
  totalInvoiced: number;
  totalCreditNotes: number;
  totalPaid: number;
  totalRefunded: number;
  balance: number;
}

interface ViewStatementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement: Statement | undefined | null;
}

export function ViewStatementPanel({ open, onOpenChange, statement }: ViewStatementPanelProps) {
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  if (!statement) return null;

  const entries: StatementEntry[] = [
    ...statement.invoices.map((inv) => ({
      date: inv.issueDate,
      type: "Invoice" as const,
      ref: inv.invoiceNumber,
      debit: inv.total,
      credit: 0,
    })),
    ...(statement.creditNotes ?? []).map((cn) => ({
      date: cn.issueDate,
      type: "Credit Note" as const,
      ref: cn.creditNoteNumber,
      debit: 0,
      credit: cn.total,
    })),
    ...statement.payments.map((p) => ({
      date: p.paymentDate,
      type: "Receipt" as const,
      ref: p.paymentNumber,
      debit: 0,
      credit: p.amount,
    })),
    ...(statement.refunds ?? []).map((r) => ({
      date: r.paymentDate,
      type: "Refund" as const,
      ref: r.paymentNumber,
      debit: r.amount,
      credit: 0,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg" panelTitle="Customer Statement">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title="Customer Statement" showAiButton={false} />

            <EntityPanelAvatar
              name={statement.customer.name}
              subtitle={`${statement.customer.city}, ${statement.customer.country}`}
              fallbackGradient="from-blue-400 via-indigo-300 to-purple-400"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField
                icon={<User className="h-4 w-4" />}
                label="Customer"
                value={statement.customer.name}
              />
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<FileText className="h-4 w-4" />}
                  label="Total Invoiced"
                  value={`AED ${formatNumber(statement.totalInvoiced)}`}
                />
                <EntityPanelField
                  icon={<FileText className="h-4 w-4" />}
                  label="Credit Notes"
                  value={`AED ${formatNumber(statement.totalCreditNotes ?? 0)}`}
                />
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Receipts"
                  value={`AED ${formatNumber(statement.totalPaid)}`}
                />
                <EntityPanelField
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Refunds"
                  value={`AED ${formatNumber(statement.totalRefunded ?? 0)}`}
                />
              </EntityPanelFieldRow>
              <EntityPanelField
                icon={<DollarSign className="h-4 w-4" />}
                label="Balance Due"
                value={`AED ${formatNumber(statement.balance)}`}
              />
            </EntityPanelFieldGroup>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                  Transaction History
                </p>
                <div className="flex gap-2">
                  <ExportPdfButton
                    documentType="statement"
                    data={{ statement }}
                    label="Export PDF"
                    className="h-8 gap-1.5 rounded-lg border-border-subtle text-[12px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailModal(true)}
                    className="h-8 gap-1.5 rounded-lg border-border-subtle text-[12px]"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email Statement
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border-subtle overflow-hidden">
                <div className="grid grid-cols-12 gap-3 bg-canvas/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-3">Reference</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Credit</div>
                  <div className="col-span-2 text-right">Balance</div>
                </div>

                {(() => {
                  let runningBalance = 0;
                  return entries.map((entry, i) => {
                    runningBalance += entry.debit - entry.credit;
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-12 gap-3 border-t border-border-subtle/50 px-4 py-2.5 text-[13px]"
                      >
                        <div className="col-span-2 text-text-secondary">{formatDate(entry.date)}</div>
                        <div className="col-span-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              entry.type === "Invoice"
                                ? "bg-blue-100 text-blue-700"
                                : entry.type === "Credit Note"
                                  ? "bg-purple-100 text-purple-700"
                                  : entry.type === "Refund"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-success-light text-success"
                            }`}
                          >
                            {entry.type}
                          </span>
                        </div>
                        <div className="col-span-3 font-mono text-text-primary">{entry.ref}</div>
                        <div className="col-span-2 text-right font-mono text-text-primary">
                          {entry.debit > 0 ? formatNumber(entry.debit) : "—"}
                        </div>
                        <div className="col-span-2 text-right font-mono text-success">
                          {entry.credit > 0 ? formatNumber(entry.credit) : "—"}
                        </div>
                        <div
                          className={`col-span-2 text-right font-mono font-semibold ${runningBalance > 0 ? "text-error" : "text-success"}`}
                        >
                          {formatNumber(runningBalance)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </EntityPanelMain>
        </EntityPanelBody>

        <EntityPanelFooter onCancel={() => onOpenChange(false)} cancelLabel="Close" />
      </EntityPanelContent>

      <SendDocumentModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        documentType="statement"
        recipientEmail={statement.customer.email ?? undefined}
        recipientName={statement.customer.name}
        data={{ statement }}
      />
    </EntityPanel>
  );
}
