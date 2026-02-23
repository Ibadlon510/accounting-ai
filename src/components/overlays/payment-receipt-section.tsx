"use client";

import { useState } from "react";
import Link from "next/link";
import { EntityPanelField } from "@/components/overlays/entity-panel";
import { formatNumber } from "@/lib/accounting/engine";
import { Receipt, ChevronDown, ChevronRight } from "lucide-react";

export type ReceiptItem = {
  type: "document" | "payment";
  date: string;
  amount: number;
  documentId?: string;
  paymentId?: string;
};

interface PaymentReceiptSectionProps {
  receipts: ReceiptItem[];
  documentId?: string | null;
  paymentId?: string | null;
  amountPaid?: number;
  onViewPaymentReceipt?: (id: string) => void;
}

export function PaymentReceiptSection({
  receipts,
  documentId,
  paymentId,
  amountPaid,
  onViewPaymentReceipt,
}: PaymentReceiptSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const items: ReceiptItem[] =
    receipts.length > 0
      ? receipts
      : documentId || paymentId
        ? [
            {
              type: documentId ? "document" : "payment",
              date: "",
              amount: amountPaid ?? 0,
              documentId: documentId ?? undefined,
              paymentId: paymentId ?? undefined,
            },
          ]
        : [];

  if (items.length === 0) {
    return (
      <EntityPanelField icon={<Receipt className="h-4 w-4" />} label="Payment Receipt">
        <span className="mt-0.5 text-[13px] text-text-meta">No receipt attached</span>
      </EntityPanelField>
    );
  }

  const singleReceipt = items.length === 1;

  const ReceiptLink = ({ r }: { r: ReceiptItem }) => (
    <>
      {r.documentId && (
        <Link
          href={`/documents/${r.documentId}/verify`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-ai)] hover:underline"
        >
          <Receipt className="h-3.5 w-3.5" /> View receipt
        </Link>
      )}
      {r.paymentId && onViewPaymentReceipt && !r.documentId && (
        <button
          type="button"
          onClick={() => onViewPaymentReceipt(r.paymentId!)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-ai)] hover:underline"
        >
          <Receipt className="h-3.5 w-3.5" /> View payment receipt
        </button>
      )}
      {r.paymentId && onViewPaymentReceipt && r.documentId && (
        <button
          type="button"
          onClick={() => onViewPaymentReceipt(r.paymentId!)}
          className="ml-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-ai)] hover:underline"
        >
          View payment
        </button>
      )}
    </>
  );

  const ReceiptRow = ({ r }: { r: ReceiptItem }) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
      <span className="text-text-secondary">{r.date || "—"}</span>
      <span className="font-mono font-medium text-text-primary">AED {formatNumber(r.amount)}</span>
      <ReceiptLink r={r} />
    </div>
  );

  if (singleReceipt) {
    const r = items[0];
    return (
      <EntityPanelField icon={<Receipt className="h-4 w-4" />} label="Payment Receipt">
        <div className="mt-0.5 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span className="text-text-secondary">{r.date || "—"}</span>
            <span className="font-mono font-medium text-text-primary">AED {formatNumber(r.amount)}</span>
          </div>
          <ReceiptLink r={r} />
        </div>
      </EntityPanelField>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left transition-colors hover:bg-black/[0.02] rounded-lg -m-1 p-1"
      >
        <Receipt className="h-4 w-4 shrink-0 text-text-meta" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">Payment Receipt</span>
        <span className="text-[13px] text-text-secondary">
          {items.length} receipt{items.length !== 1 ? "s" : ""}
        </span>
        {expanded ? <ChevronDown className="ml-auto h-4 w-4 text-text-meta" /> : <ChevronRight className="ml-auto h-4 w-4 text-text-meta" />}
      </button>
      {expanded && (
        <div className="ml-7 space-y-3 border-l-2 border-border-subtle pl-3">
          {items.map((r, i) => (
            <ReceiptRow key={i} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
