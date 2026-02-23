"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

type Row = { label: string; amount: number; isHeader?: boolean; isTotal?: boolean; indent?: number };

export default function ProfitAndLossPage() {
  const [stats, setStats] = useState({ revenue: 0, expenses: 0 });

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setStats({ revenue: data.sales?.totalRevenue ?? 0, expenses: data.purchases?.totalExpenses ?? 0 });
      })
      .catch(() => {});
  }, []);

  const netIncome = stats.revenue - stats.expenses;
  const rows: Row[] = [
    { label: "Revenue", amount: 0, isHeader: true },
    { label: "Sales Revenue", amount: stats.revenue, indent: 1 },
    { label: "Total Revenue", amount: stats.revenue, isTotal: true },
    { label: "Expenses", amount: 0, isHeader: true },
    { label: "Total Expenses", amount: stats.expenses, indent: 1 },
    { label: "Total Expenses", amount: stats.expenses, isTotal: true },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-end">
        <Button onClick={() => comingSoon("Export PDF")} variant="outline" className="h-9 gap-2 rounded-xl border-border-subtle text-[12px]">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      <p className="mb-6 text-[13px] text-text-secondary">For the period January 1, 2026 — February 28, 2026</p>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-2 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div>Account</div>
          <div className="text-right">Amount (AED)</div>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-2 border-b border-border-subtle/40 px-6 py-2.5 text-[13px] ${
              row.isHeader ? "bg-canvas/30 font-semibold text-text-primary" :
              row.isTotal ? "bg-surface/50 font-bold text-text-primary" :
              "text-text-primary"
            }`}
          >
            <div style={{ paddingLeft: row.indent ? row.indent * 24 : 0 }}>
              {row.label}
            </div>
            <div className={`text-right font-mono ${row.isHeader ? "" : ""}`}>
              {row.isHeader ? "" : row.amount === 0 && !row.isTotal ? "—" : formatNumber(row.amount)}
            </div>
          </div>
        ))}

        {/* Net Income */}
        <div className="grid grid-cols-2 border-t-2 border-text-primary/20 bg-surface px-6 py-4 text-[15px] font-bold">
          <div className="text-text-primary">Net Income</div>
          <div className={`text-right font-mono ${netIncome >= 0 ? "text-success" : "text-error"}`}>
            AED {formatNumber(netIncome)}
          </div>
        </div>
      </div>
    </>
  );
}
