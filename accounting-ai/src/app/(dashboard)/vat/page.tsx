"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { getVATSummary } from "@/lib/mock/vat-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Receipt, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/utils/toast-helpers";
import { StyledSelect } from "@/components/ui/styled-select";

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

export default function VATPage() {
  const mockSummary = getVATSummary();
  const [quarter, setQuarter] = useState("Q1-2026");
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
    : mockSummary;

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "VAT" }]} />
      <PageHeader title="VAT Management" showActions={false} />

      {/* Summary Cards */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-error/10">
              <ArrowRight className="h-4 w-4 text-error" />
            </div>
            <p className="text-[13px] text-text-secondary">Output VAT (Sales)</p>
          </div>
          <p className="text-[28px] font-bold text-error">AED {formatNumber(summary.totalOutputVat)}</p>
          <p className="mt-1 text-[12px] text-text-meta">Q1 2026 (current period)</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
              <ArrowRight className="h-4 w-4 rotate-180 text-success" />
            </div>
            <p className="text-[13px] text-text-secondary">Input VAT (Purchases)</p>
          </div>
          <p className="text-[28px] font-bold text-success">AED {formatNumber(summary.totalInputVat)}</p>
          <p className="mt-1 text-[12px] text-text-meta">Q1 2026 (current period)</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-text-primary/5">
              <Receipt className="h-4 w-4 text-text-primary" />
            </div>
            <p className="text-[13px] text-text-secondary">Net VAT Payable</p>
          </div>
          <p className="text-[28px] font-bold text-text-primary">AED {formatNumber(summary.netPayable)}</p>
          <p className="mt-1 text-[12px] text-text-meta">Due by Apr 28, 2026</p>
        </div>
      </div>

      {/* VAT 201 Report */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-semibold text-text-primary">VAT 201 Report (FTA)</h2>
        <div className="flex items-center gap-2">
          <StyledSelect
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="h-10 w-40"
          >
            <option value="Q1-2025">Q1 2025</option>
            <option value="Q2-2025">Q2 2025</option>
            <option value="Q3-2025">Q3 2025</option>
            <option value="Q4-2025">Q4 2025</option>
            <option value="Q1-2026">Q1 2026</option>
            <option value="Q2-2026">Q2 2026</option>
            <option value="Q3-2026">Q3 2026</option>
            <option value="Q4-2026">Q4 2026</option>
          </StyledSelect>
          <Button
            className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
            disabled={!report}
            onClick={() => {
              if (!report) return;
              const ftaData = {
                quarter: report.quarter,
                period: `${report.periodStart} to ${report.periodEnd}`,
                box1a_standard_rated_sales: report.taxableSales,
                box1b_total_output_vat: report.outputVat,
                box8_standard_rated_purchases: report.taxablePurchases,
                box9_total_input_vat: report.inputVat,
                box15_net_vat_payable: report.netVat,
                zero_rated_sales: report.zeroRatedSales ?? 0,
                exempt_sales: report.exemptSales ?? 0,
              };
              navigator.clipboard.writeText(JSON.stringify(ftaData, null, 2)).then(
                () => showSuccess("Copied", "VAT 201 data copied to clipboard."),
                () => showError("Copy failed", "Unable to copy to clipboard.")
              );
            }}
          >
            <FileCheck className="h-4 w-4" /> Export / Copy for FTA
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-card py-8 text-center text-text-secondary">Loading report...</div>
      ) : report ? (
        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-[15px] font-semibold text-text-primary">
              {report.periodStart} — {report.periodEnd}
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-text-secondary">Draft</span>
          </div>
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            <div className="grid grid-cols-4 gap-4 bg-canvas/50 px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide text-text-meta">
              <div>Category</div>
              <div className="text-right">Amount (AED)</div>
              <div className="text-right">VAT Rate</div>
              <div className="text-right">VAT Amount (AED)</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
              <div className="text-text-primary">Standard Rated Sales (Box 1a)</div>
              <div className="text-right font-mono text-text-primary">{formatNumber(report.taxableSales)}</div>
              <div className="text-right text-text-secondary">5%</div>
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
              <div className="text-text-primary">Total Output VAT (Box 1b)</div>
              <div></div><div></div>
              <div className="text-right font-mono text-error">{formatNumber(report.outputVat)}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
              <div className="text-text-primary">Standard Rated Purchases (Box 8)</div>
              <div className="text-right font-mono text-text-primary">{formatNumber(report.taxablePurchases)}</div>
              <div className="text-right text-text-secondary">5%</div>
              <div className="text-right font-mono text-text-primary">{formatNumber(report.inputVat)}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t border-border-subtle bg-canvas/30 px-5 py-2.5 text-[13px] font-semibold">
              <div className="text-text-primary">Total Input VAT (Box 9)</div>
              <div></div><div></div>
              <div className="text-right font-mono text-success">{formatNumber(report.inputVat)}</div>
            </div>
            <div className="grid grid-cols-4 gap-4 border-t-2 border-text-primary/20 bg-surface px-5 py-3 text-[14px] font-bold">
              <div className="text-text-primary">Net VAT Payable (Box 15)</div>
              <div></div><div></div>
              <div className="text-right font-mono text-text-primary">AED {formatNumber(report.netVat)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-card py-8 text-center text-text-secondary">Select a quarter to view VAT 201 report.</div>
      )}
    </>
  );
}
