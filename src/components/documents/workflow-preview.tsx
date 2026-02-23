"use client";

import { Info } from "lucide-react";
import type { DocumentType } from "@/lib/db/schema";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  purchase_invoice: "Purchase Invoice (Bill)",
  sales_invoice: "Sales Invoice",
  receipt: "Receipt / Expense",
  credit_note: "Credit Note",
  bank_statement: "Bank Statement",
};

type WorkflowPreviewProps = {
  documentType: DocumentType | string | null;
  summary: string;
  nextStep: string;
  nextStepHref?: string;
  className?: string;
};

export function WorkflowPreview({
  documentType,
  summary,
  nextStep,
  nextStepHref,
  className = "",
}: WorkflowPreviewProps) {
  const label = documentType ? DOCUMENT_TYPE_LABELS[documentType] ?? documentType : "Document";
  return (
    <div
      className={`rounded-xl border border-border-subtle bg-muted/20 px-4 py-3 text-[13px] ${className}`}
      role="status"
      aria-label={`Workflow: ${label}`}
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-meta" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-text-primary">Workflow: {label}</p>
          <p className="text-text-secondary">{summary}</p>
          <p className="text-text-meta">
            → Next step: {nextStepHref ? <a href={nextStepHref} className="text-[var(--accent-ai)] hover:underline">{nextStep}</a> : nextStep}
          </p>
        </div>
      </div>
    </div>
  );
}
