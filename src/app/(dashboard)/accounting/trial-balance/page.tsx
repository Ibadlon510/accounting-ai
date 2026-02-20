"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { getTrialBalance } from "@/lib/accounting/mock-data";
import { formatNumber } from "@/lib/accounting/engine";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const categoryColors: Record<string, string> = {
  asset: "text-blue-600",
  liability: "text-orange-600",
  equity: "text-purple-600",
  revenue: "text-green-600",
  expense: "text-red-600",
};

export default function TrialBalancePage() {
  const { rows, totalDebit, totalCredit } = getTrialBalance();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Workspaces", href: "/workspaces" },
          { label: "Accounting", href: "/accounting" },
          { label: "Trial Balance" },
        ]}
      />
      <PageHeader title="Trial Balance" showActions={false} />

      {/* Balance status banner */}
      <div
        className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-3 ${
          isBalanced
            ? "bg-success-light text-success"
            : "bg-error-light text-error"
        }`}
      >
        {isBalanced ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <AlertTriangle className="h-5 w-5" />
        )}
        <span className="text-[14px] font-semibold">
          {isBalanced
            ? "Trial balance is in balance"
            : `Trial balance is out of balance by AED ${formatNumber(Math.abs(totalDebit - totalCredit))}`}
        </span>
      </div>

      {/* Table */}
      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-4 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-2">Code</div>
          <div className="col-span-4">Account Name</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Debit (AED)</div>
          <div className="col-span-2 text-right">Credit (AED)</div>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-4 border-b border-border-subtle/40 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]"
          >
            <div className="col-span-2 font-mono text-text-secondary">
              {row.accountCode}
            </div>
            <div className="col-span-4 font-medium text-text-primary">
              {row.accountName}
            </div>
            <div className="col-span-2">
              <span
                className={`text-[12px] font-medium capitalize ${
                  categoryColors[row.accountCategory] ?? ""
                }`}
              >
                {row.accountCategory}
              </span>
            </div>
            <div className="col-span-2 text-right font-mono text-text-primary">
              {row.debit > 0 ? formatNumber(row.debit) : "—"}
            </div>
            <div className="col-span-2 text-right font-mono text-text-primary">
              {row.credit > 0 ? formatNumber(row.credit) : "—"}
            </div>
          </div>
        ))}

        {/* Totals row */}
        <div className="grid grid-cols-12 gap-4 border-t-2 border-text-primary/20 bg-surface px-6 py-4 text-[14px] font-bold">
          <div className="col-span-8 text-text-primary">Total</div>
          <div className="col-span-2 text-right font-mono text-text-primary">
            {formatNumber(totalDebit)}
          </div>
          <div className="col-span-2 text-right font-mono text-text-primary">
            {formatNumber(totalCredit)}
          </div>
        </div>
      </div>
    </>
  );
}
