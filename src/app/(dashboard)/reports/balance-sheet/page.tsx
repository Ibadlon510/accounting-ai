"use client";

import { useEffect, useState, useCallback } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type AccountLine = { code: string; name: string; amount: number };
type BsData = {
  asset: AccountLine[]; liability: AccountLine[]; equity: AccountLine[];
  totalAssets: number; totalLiabilities: number; totalEquity: number; retainedEarnings: number;
};

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [bs, setBs] = useState<BsData>({ asset: [], liability: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, retainedEarnings: 0 });

  const loadReport = useCallback(() => {
    const params = new URLSearchParams();
    if (asOf) params.set("to", asOf);
    fetch(`/api/accounting/report-data?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.bs) setBs(data.bs);
      })
      .catch(() => {});
  }, [asOf]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const totalAssets = bs.totalAssets;
  const totalLiabilitiesEquity = bs.totalLiabilities + bs.totalEquity + bs.retainedEarnings;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

  const formatDisplayDate = (d: string) => {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const assets: ReportRow[] = [
    { label: "Assets", amount: 0, isHeader: true },
    ...bs.asset.map((a) => ({ label: `${a.code} — ${a.name}`, amount: a.amount, indent: 1 })),
    { label: "Total Assets", amount: totalAssets, isTotal: true },
  ];
  const liabilities: ReportRow[] = [
    { label: "Liabilities", amount: 0, isHeader: true },
    ...bs.liability.map((l) => ({ label: `${l.code} — ${l.name}`, amount: l.amount, indent: 1 })),
    { label: "Total Liabilities", amount: bs.totalLiabilities, isTotal: true },
  ];
  const equity: ReportRow[] = [
    { label: "Equity", amount: 0, isHeader: true },
    ...bs.equity.map((e) => ({ label: `${e.code} — ${e.name}`, amount: e.amount, indent: 1 })),
    { label: "Retained Earnings", amount: bs.retainedEarnings, indent: 1 },
    { label: "Total Equity", amount: bs.totalEquity + bs.retainedEarnings, isTotal: true },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-[12px] font-medium text-text-meta">As of</label>
          <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="h-9 w-40 rounded-xl border-border-subtle text-[13px]" />
        </div>
        <Button onClick={() => comingSoon("Export PDF")} variant="outline" className="h-9 gap-2 rounded-xl border-border-subtle text-[12px]">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      <p className="mb-4 text-[13px] text-text-secondary">As of {formatDisplayDate(asOf)}</p>

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
