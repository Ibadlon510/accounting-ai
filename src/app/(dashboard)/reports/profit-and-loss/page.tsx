"use client";

import { useEffect, useState, useCallback } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { comingSoon } from "@/lib/utils/toast-helpers";

type Row = { label: string; amount: number; isHeader?: boolean; isTotal?: boolean; indent?: number };

type AccountLine = { code: string; name: string; amount: number };
type PnlData = { revenue: AccountLine[]; expense: AccountLine[]; totalRevenue: number; totalExpenses: number; netIncome: number };

function getDefaultDates() {
  const now = new Date();
  const y = now.getFullYear();
  const from = `${y}-01-01`;
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default function ProfitAndLossPage() {
  const defaults = getDefaultDates();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [pnl, setPnl] = useState<PnlData>({ revenue: [], expense: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 });

  const loadReport = useCallback(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/accounting/report-data?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.pnl) setPnl(data.pnl);
      })
      .catch(() => {});
  }, [from, to]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const netIncome = pnl.netIncome;
  const rows: Row[] = [
    { label: "Revenue", amount: 0, isHeader: true },
    ...pnl.revenue.map((r) => ({ label: `${r.code} — ${r.name}`, amount: r.amount, indent: 1 })),
    { label: "Total Revenue", amount: pnl.totalRevenue, isTotal: true },
    { label: "Expenses", amount: 0, isHeader: true },
    ...pnl.expense.map((r) => ({ label: `${r.code} — ${r.name}`, amount: r.amount, indent: 1 })),
    { label: "Total Expenses", amount: pnl.totalExpenses, isTotal: true },
  ];

  const formatDisplayDate = (d: string) => {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-[12px] font-medium text-text-meta">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40 rounded-xl border-border-subtle text-[13px]" />
          <label className="text-[12px] font-medium text-text-meta">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40 rounded-xl border-border-subtle text-[13px]" />
        </div>
        <Button onClick={() => comingSoon("Export PDF")} variant="outline" className="h-9 gap-2 rounded-xl border-border-subtle text-[12px]">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      <p className="mb-6 text-[13px] text-text-secondary">
        For the period {formatDisplayDate(from)} — {formatDisplayDate(to)}
      </p>

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
