"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { getBalanceSheet } from "@/lib/mock/reports-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";
import type { ReportRow } from "@/lib/mock/reports-data";

function ReportSection({ title, rows }: { title: string; rows: ReportRow[] }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-[16px] font-bold text-text-primary">{title}</h3>
      <div className="rounded-xl border border-border-subtle overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-2 border-b border-border-subtle/40 px-5 py-2.5 text-[13px] ${
              row.isHeader ? "bg-canvas/30 font-semibold text-text-primary" :
              row.isTotal ? "bg-surface/50 font-bold text-text-primary" :
              "text-text-primary"
            }`}
          >
            <div style={{ paddingLeft: row.indent ? row.indent * 24 : 0 }}>{row.label}</div>
            <div className="text-right font-mono">
              {row.isHeader ? "" : row.amount === 0 && !row.isTotal ? "—" : `AED ${formatNumber(row.amount)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BalanceSheetPage() {
  const { assets, liabilities, equity, totalAssets, totalLiabilitiesEquity } = getBalanceSheet();
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Reports", href: "/reports" }, { label: "Balance Sheet" }]} />
      <div className="flex items-center justify-between">
        <PageHeader title="Balance Sheet" showActions={false} />
        <Button onClick={() => comingSoon("Export PDF")} variant="outline" className="h-9 gap-2 rounded-xl border-border-subtle text-[12px]">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      <p className="mb-4 text-[13px] text-text-secondary">As of February 28, 2026</p>

      <div className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-3 ${isBalanced ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
        {isBalanced ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        <span className="text-[14px] font-semibold">
          {isBalanced ? "Balance sheet is in balance" : "Balance sheet is out of balance"}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6">
          <ReportSection title="Assets" rows={assets} />
        </div>
        <div className="col-span-6">
          <ReportSection title="Liabilities" rows={liabilities} />
          <ReportSection title="Equity" rows={equity} />
        </div>
      </div>
    </>
  );
}
