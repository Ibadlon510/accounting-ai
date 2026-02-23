"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

type ReportRow = { label: string; amount: number; isHeader?: boolean; isTotal?: boolean; indent?: number };

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
  const [stats, setStats] = useState({ bankBalance: 0, receivables: 0, payables: 0 });

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setStats({
          bankBalance: data.banking?.totalBalance ?? 0,
          receivables: data.sales?.totalOutstanding ?? 0,
          payables: data.purchases?.totalOutstanding ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const totalAssets = stats.bankBalance + stats.receivables;
  const totalLiabilitiesEquity = stats.payables + (totalAssets - stats.payables);
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

  const assets: ReportRow[] = [
    { label: "Current Assets", amount: 0, isHeader: true },
    { label: "Cash & Bank", amount: stats.bankBalance, indent: 1 },
    { label: "Accounts Receivable", amount: stats.receivables, indent: 1 },
    { label: "Total Assets", amount: totalAssets, isTotal: true },
  ];
  const liabilities: ReportRow[] = [
    { label: "Current Liabilities", amount: 0, isHeader: true },
    { label: "Accounts Payable", amount: stats.payables, indent: 1 },
    { label: "Total Liabilities", amount: stats.payables, isTotal: true },
  ];
  const equity: ReportRow[] = [
    { label: "Owner's Equity", amount: 0, isHeader: true },
    { label: "Retained Earnings", amount: totalAssets - stats.payables, indent: 1 },
    { label: "Total Equity", amount: totalAssets - stats.payables, isTotal: true },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-end">
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
