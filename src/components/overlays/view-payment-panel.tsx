"use client";

import { useEffect, useState } from "react";
import {
  EntityPanel,
  EntityPanelContent,
  EntityPanelBody,
  EntityPanelMain,
  EntityPanelHeader,
  EntityPanelAvatar,
  EntityPanelFieldGroup,
  EntityPanelField,
  EntityPanelFooter,
} from "@/components/overlays/entity-panel";
import { formatNumber } from "@/lib/accounting/engine";
type Payment = { id: string; paymentNumber: string; paymentDate: string; entityName: string; entityType?: string; amount: number; method: string; reference: string; invoiceNumber: string; invoiceId?: string | null; billId?: string | null };
import { CreditCard, Calendar, User, FileText, Hash, ExternalLink } from "lucide-react";

interface ViewPaymentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  paymentId?: string | null;
  onViewInvoice?: (invoiceId: string) => void;
  onViewBill?: (billId: string) => void;
}

export function ViewPaymentPanel({ open, onOpenChange, payment: paymentProp, paymentId, onViewInvoice, onViewBill }: ViewPaymentPanelProps) {
  const [payment, setPayment] = useState<Payment | null>(paymentProp ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paymentProp) {
      setPayment(paymentProp);
      return;
    }
    if (!open || !paymentId) {
      setPayment(null);
      return;
    }
    setLoading(true);
    fetch(`/api/sales/payments/${paymentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPayment(data ?? null))
      .finally(() => setLoading(false));
  }, [open, paymentId, paymentProp]);

  const showPanel = open && (!!paymentProp || !!paymentId);
  if (!showPanel) return null;

  return (
    <EntityPanel open={showPanel} onOpenChange={onOpenChange}>
      <EntityPanelContent size="md">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader
              title={payment ? `Payment ${payment.paymentNumber}` : "Payment"}
              showAiButton={false}
            />

            <EntityPanelAvatar
              name={payment?.entityName ?? "—"}
              subtitle={payment ? `AED ${formatNumber(payment.amount)}` : "Loading…"}
              fallbackGradient="from-emerald-300 via-green-200 to-teal-200"
            />

            {payment && (
              <EntityPanelFieldGroup>
                <EntityPanelField
                  icon={<Hash className="h-4 w-4" />}
                  label="Payment Number"
                  value={payment.paymentNumber}
                />
                <EntityPanelField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date"
                  value={payment.paymentDate}
                />
                <EntityPanelField
                  icon={<User className="h-4 w-4" />}
                  label={payment.entityType === "supplier" ? "Supplier" : "Customer"}
                  value={payment.entityName}
                />
                <EntityPanelField
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Amount"
                  value={`AED ${formatNumber(payment.amount)}`}
                />
                <EntityPanelField
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Method"
                  value={payment.method}
                />
                {payment.invoiceNumber && payment.invoiceNumber !== "—" && (
                  <EntityPanelField
                    icon={<FileText className="h-4 w-4" />}
                    label={payment.entityType === "supplier" ? "Bill" : "Invoice"}
                  >
                    {((payment.entityType === "supplier" && payment.billId) || (payment.entityType !== "supplier" && payment.invoiceId)) && (onViewInvoice || onViewBill) ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (payment.entityType === "supplier" && payment.billId && onViewBill) onViewBill(payment.billId);
                          else if (payment.invoiceId && onViewInvoice) onViewInvoice(payment.invoiceId);
                        }}
                        className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-ai)] hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> {payment.invoiceNumber}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="mt-0.5 text-[13px] text-text-primary">{payment.invoiceNumber}</span>
                    )}
                  </EntityPanelField>
                )}
                {payment.reference && (
                  <EntityPanelField
                    icon={<Hash className="h-4 w-4" />}
                    label="Reference"
                    value={payment.reference}
                  />
                )}
              </EntityPanelFieldGroup>
            )}
          </EntityPanelMain>
        </EntityPanelBody>

        <EntityPanelFooter onCancel={() => onOpenChange(false)} cancelLabel="Close" />
      </EntityPanelContent>
    </EntityPanel>
  );
}
