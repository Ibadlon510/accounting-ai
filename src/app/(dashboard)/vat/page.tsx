"use client";

import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { Receipt, FileCheck, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { StyledSelect } from "@/components/ui/styled-select";
import { useOrganization } from "@/hooks/use-organization";

type VAT201Report = {
  quarter: string;
  periodStart: string;
  periodEnd: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  taxableSales: number;
  taxablePurchases: number;
  zeroRatedSales: number;
  exemptSales: number;
};

const emptySummary = { totalOutputVat: 0, totalInputVat: 0, netPayable: 0 };

function buildQuarterOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQ = Math.ceil((now.getMonth() + 1) / 3);
  const options: { value: string; label: string }[] = [];
  for (let y = currentYear - 1; y <= currentYear; y++) {
    for (let q = 1; q <= 4; q++) {
      if (y === currentYear && q > currentQ + 1) break;
      options.push({ value: `Q${q}-${y}`, label: `Q${q} ${y}` });
    }
  }
  return options;
}

function computeRate(amount: number, tax: number): string {
  if (!amount || !tax) return "—";
  return `${((tax / amount) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export default function VATPage() {
  const { org, loading: orgLoading } = useOrganization();
  const taxLabel = org?.taxLabel ?? "VAT";
  const currency = org?.currency ?? "AED";
  const quarterOptions = useMemo(buildQuarterOptions, []);

  const defaultQuarter = useMemo(() => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q}-${now.getFullYear()}`;
  }, []);

  const [quarter, setQuarter] = useState(defaultQuarter);
  const [dbSummary, setDbSummary] = useState(emptySummary);

  useEffect(() => {
    fetch("/api/dashboard/stats", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.vat) setDbSummary(data.vat); })
      .catch(() => {});
  }, []);
  const [report, setReport] = useState<VAT201Report | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/vat-201?quarter=${encodeURIComponent(quarter)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quarter]);

  const summary = report
    ? {
        totalOutputVat: report.outputVat,
        totalInputVat: report.inputVat,
        netPayable: report.netVat,
      }
    : dbSummary;

  if (!orgLoading && org && !org.isVatRegistered) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: taxLabel }]} />
        <PageHeader title={`${taxLabel} Management`} showActions={false} />
        <div className="dashboard-card flex items-center gap-3 py-8 px-6">
          <Info className="h-5 w-5 text-blue-500 shrink-0" />
          <p className="text-[14px] text-text-secondary">
            Tax reporting is not enabled. Enable tax registration in Settings to access tax reports.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: taxLabel }]} />
      <PageHeader title={`${taxLabel} Management`} showActions={false} />

      {/* Summary Cards */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-error/10">
              <ArrowRight className="h-4 w-4 text-error" />
            </div>
            <p className="text-[13px] text-text-secondary">Output {taxLabel} (Sales)</p>
          </div>
          <p className="text-[28px] font-bold text-error">{currency} {formatNumber(summary.totalOutputVat)}</p>
          <p className="mt-1 text-[12px] text-text-meta">{quarter.replace("-", " ")} (current period)</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
              <ArrowRight className="h-4 w-4 rotate-180 text-success" />
            </div>
            <p className="text-[13px] text-text-secondary">Input {taxLabel} (Purchases)</p>
          </div>
          <p className="text-[28px] font-bold text-success">{currency} {formatNumber(summary.totalInputVat)}</p>
          <p className="mt-1 text-[12px] text-text-meta">{quarter.replace("-", " ")} (current period)</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-text-primary/5">
              <Receipt className="h-4 w-4 text-text-primary" />
            </div>
            <p className="text-[13px] text-text-secondary">Net {taxLabel} Payable</p>
          </div>
          <p className="text-[28px] font-bold text-text-primary">{currency} {formatNumber(summary.netPayable)}</p>
        </div>
      </div>

      {/* Tax Report */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-semibold text-text-primary">{taxLabel} Return Report</h2>
        <div className="flex items-center gap-2">
          <StyledSelect
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="h-10 w-40"
          >
            {quarterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </StyledSelect>
          <Button
            className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
            disabled={!report}
            onClick={() => {
              if (!report) return;
              const ftaData = {
                quarter: report.quarter,
                period: `${formatDate(report.periodStart)} to ${formatDate(report.periodEnd)}`,
                standard_rated_sales: report.taxableSales,
                total_output_tax: report.outputVat,
                standard_rated_purchases: report.taxablePurchases,
                total_input_tax: report.inputVat,
                net_tax_payable: report.netVat,
                zero_rated_sales: report.zeroRatedSales ?? 0,
                exempt_sales: report.exemptSales ?? 0,
              };
              navigator.clipboard.writeText(JSON.stringify(ftaData, null, 2)).then(
                () => showSuccess("Copied", `${taxLabel} return data copied to clipboard.`),
                () => showError("Copy failed", "Unable to copy to clipboard.")
              );
            }}
          >
            <FileCheck className="h-4 w-4" /> Export / Copy
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-card py-8 text-center text-text-secondary">Loading report...</div>
      ) : report ? (
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-[15px] font-semibold text-text-primary">
              {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-text-secondary">Draft</span>
          </div>
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            <div className="grid grid-cols-4 gap-4 bg-canvas/50 px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide text-text-meta">
              <div>Category</div>
              <div className="text-right">Amount ({currency})</div>
              <div className="text-right">{taxLabel} Rate</div>
              <div className="text-right">{taxLabel} Amount ({currency})</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
              <div className="text-text-primary">Standard Rated Sales</div>
              <div className="text-right font-mono text-text-primary">{formatNumber(report.taxableSales)}</div>
              <div className="text-right text-text-secondary">{computeRate(report.taxableSales, report.outputVat)}</div>
              <div className="text-right font-mono text-text-primary">{formatNumber(report.outputVat)}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
              <div className="text-text-primary">Zero Rated Sales</div>
              <div className="text-right font-mono text-text-secondary">{formatNumber(report.zeroRatedSales ?? 0)}</div>
              <div className="text-right text-text-secondary">0%</div>
              <div className="text-right font-mono text-text-secondary">0.00</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
              <div className="text-text-primary">Exempt Sales</div>
              <div className="text-right font-mono text-text-secondary">{formatNumber(report.exemptSales ?? 0)}</div>
              <div className="text-right text-text-secondary">—</div>
              <div className="text-right font-mono text-text-secondary">0.00</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle bg-canvas/30 px-5 py-2.5 text-[13px] font-semibold">
              <div className="text-text-primary">Total Output {taxLabel}</div>
              <div></div><div></div>
              <div className="text-right font-mono text-error">{formatNumber(report.outputVat)}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
              <div className="text-text-primary">Standard Rated Purchases</div>
              <div className="text-right font-mono text-text-primary">{formatNumber(report.taxablePurchases)}</div>
              <div className="text-right text-text-secondary">{computeRate(report.taxablePurchases, report.inputVat)}</div>
              <div className="text-right font-mono text-text-primary">{formatNumber(report.inputVat)}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle bg-canvas/30 px-5 py-2.5 text-[13px] font-semibold">
              <div className="text-text-primary">Total Input {taxLabel}</div>
              <div></div><div></div>
              <div className="text-right font-mono text-success">{formatNumber(report.inputVat)}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t-2 border-text-primary/20 bg-surface px-5 py-3 text-[14px] font-bold">
              <div className="text-text-primary">Net {taxLabel} Payable</div>
              <div></div><div></div>
              <div className="text-right font-mono text-text-primary">{currency} {formatNumber(report.netVat)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-card py-8 text-center text-text-secondary">Select a quarter to view {taxLabel} report.</div>
      )}
    </>
  );
}
