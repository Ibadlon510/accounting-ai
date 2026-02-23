"use client";

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
type Payment = { id: string; paymentNumber: string; paymentDate: string; entityName: string; amount: number; method: string; reference: string; invoiceNumber: string };
import { CreditCard, Calendar, User, FileText, Hash } from "lucide-react";

interface ViewPaymentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | undefined | null;
}

export function ViewPaymentPanel({ open, onOpenChange, payment }: ViewPaymentPanelProps) {
  if (!payment) return null;

  return (
    <EntityPanel open={open} onOpenChange={onOpenChange}>
      <EntityPanelContent size="md">
        <EntityPanelBody>
          <EntityPanelMain>
            <EntityPanelHeader title={`Payment ${payment.paymentNumber}`} showAiButton={false} />

            <EntityPanelAvatar
              name={payment.entityName}
              subtitle={`AED ${formatNumber(payment.amount)}`}
              fallbackGradient="from-emerald-300 via-green-200 to-teal-200"
            />

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
                label="Customer"
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
              {payment.invoiceNumber && (
                <EntityPanelField
                  icon={<FileText className="h-4 w-4" />}
                  label="Invoice"
                  value={payment.invoiceNumber}
                />
              )}
              {payment.reference && (
                <EntityPanelField
                  icon={<Hash className="h-4 w-4" />}
                  label="Reference"
                  value={payment.reference}
                />
              )}
            </EntityPanelFieldGroup>
          </EntityPanelMain>
        </EntityPanelBody>

        <EntityPanelFooter onCancel={() => onOpenChange(false)} cancelLabel="Close" />
      </EntityPanelContent>
    </EntityPanel>
  );
}
