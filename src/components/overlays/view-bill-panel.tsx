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
import { PaymentReceiptSection } from "@/components/overlays/payment-receipt-section";
import type { ReceiptItem } from "@/components/overlays/payment-receipt-section";
import { formatNumber } from "@/lib/accounting/engine";
import { FileText, Calendar, Building2, DollarSign, Receipt, CreditCard, Send } from "lucide-react";
type BillLine = { id: string; description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number };
type Bill = { id: string; supplierId: string; supplierName: string; billNumber: string; issueDate: string; dueDate: string; status: "draft" | "received" | "paid" | "partial" | "overdue" | "cancelled"; subtotal: number; taxAmount: number; total: number; amountPaid: number; amountDue: number; documentId?: string | null; paymentId?: string | null; receipts?: ReceiptItem[]; lines: BillLine[] };
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-text-secondary",
  received: "bg-blue-100 text-blue-700",
  paid: "bg-success-light text-success",
  partial: "bg-accent-yellow/20 text-amber-700",
  overdue: "bg-error-light text-error",
  cancelled: "bg-muted text-text-meta",
};

interface ViewBillPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | undefined | null;
  onRecordPayment?: () => void;
  onViewPaymentReceipt?: (paymentId: string) => void;
  onConfirm?: () => void;
  confirming?: boolean;
}

export function ViewBillPanel({ open, onOpenChange, bill, onRecordPayment, onViewPaymentReceipt, onConfirm, confirming }: ViewBillPanelProps) {
  if (!bill) return null;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="lg">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title={`Bill ${bill.billNumber}`} showAiButton={false} />

            <EntityPanelAvatar
              name={bill.supplierName}
              subtitle={bill.billNumber}
              fallbackGradient="from-amber-300 via-orange-200 to-red-200"
            />

            <EntityPanelFieldGroup>
              <EntityPanelField
                icon={<Building2 className="h-4 w-4" />}
                label="Supplier"
                value={bill.supplierName}
              />
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Issue Date"
                  value={bill.issueDate}
                />
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Due Date"
                  value={bill.dueDate}
                />
              </EntityPanelFieldRow>
              <EntityPanelField icon={<FileText className="h-4 w-4" />} label="Status">
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[bill.status]}`}
                >
                  {bill.status}
                </span>
              </EntityPanelField>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Subtotal"
                  value={`AED ${formatNumber(bill.subtotal)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="VAT"
                  value={`AED ${formatNumber(bill.taxAmount)}`}
                />
              </EntityPanelFieldRow>
              <EntityPanelFieldRow>
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Total"
                  value={`AED ${formatNumber(bill.total)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Amount Paid"
                  value={`AED ${formatNumber(bill.amountPaid)}`}
                />
                <EntityPanelField
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Balance Due"
                  value={`AED ${formatNumber(bill.amountDue)}`}
                />
              </EntityPanelFieldRow>
              {(bill.status === "paid" || bill.amountPaid > 0) && (
                <PaymentReceiptSection
                  receipts={bill.receipts ?? []}
                  documentId={bill.documentId}
                  paymentId={bill.paymentId}
                  amountPaid={bill.amountPaid}
                  onViewPaymentReceipt={onViewPaymentReceipt}
                />
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
                  <div className="col-span-1 text-right">VAT %</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                {bill.lines.map((line) => (
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

        <EntityPanelFooter onCancel={() => onOpenChange(false)} cancelLabel="Close">
          {bill.status === "draft" && onConfirm && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={confirming}
              className="mr-auto gap-1.5 rounded-xl bg-text-primary px-5 text-white hover:bg-text-primary/90"
            >
              <Send className="h-3.5 w-3.5" /> {confirming ? "Confirming…" : "Confirm Bill"}
            </Button>
          )}
          {onRecordPayment && bill.amountDue > 0 && bill.status !== "draft" && (
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
    </EntityPanel>
  );
}
