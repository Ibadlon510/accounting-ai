"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockVATReturns, getVATSummary } from "@/lib/mock/vat-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Receipt, FileCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

const statusColors: Record<string, string> = {
  draft: "bg-accent-yellow/20 text-amber-700",
  filed: "bg-success-light text-success",
  amended: "bg-blue-100 text-blue-700",
};

export default function VATPage() {
  const summary = getVATSummary();

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

      {/* VAT Returns */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-semibold text-text-primary">VAT Returns</h2>
        <Button onClick={() => comingSoon("Prepare VAT Return")} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <FileCheck className="h-4 w-4" /> Prepare Return
        </Button>
      </div>

      <div className="space-y-4">
        {mockVATReturns.map((vr) => (
          <div key={vr.id} className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[15px] font-semibold text-text-primary">
                  {vr.periodStart} — {vr.periodEnd}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[vr.status]}`}>
                  {vr.status}
                </span>
                {vr.filedAt && <span className="text-[11px] text-text-meta">Filed: {vr.filedAt}</span>}
              </div>
              {vr.status === "draft" && (
                <Button onClick={() => comingSoon("File VAT Return")} variant="outline" className="h-8 gap-1.5 rounded-lg border-border-subtle text-[12px]">
                  <AlertTriangle className="h-3.5 w-3.5" /> Review & File
                </Button>
              )}
            </div>

            {/* VAT breakdown table */}
            <div className="rounded-xl border border-border-subtle overflow-hidden">
              <div className="grid grid-cols-4 gap-4 bg-canvas/50 px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide text-text-meta">
                <div>Category</div>
                <div className="text-right">Amount (AED)</div>
                <div className="text-right">VAT Rate</div>
                <div className="text-right">VAT Amount (AED)</div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
                <div className="text-text-primary">Standard Rated Sales</div>
                <div className="text-right font-mono text-text-primary">{formatNumber(vr.taxableSales)}</div>
                <div className="text-right text-text-secondary">5%</div>
                <div className="text-right font-mono text-text-primary">{formatNumber(vr.outputVat)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
                <div className="text-text-primary">Zero Rated Sales</div>
                <div className="text-right font-mono text-text-secondary">{formatNumber(vr.zeroRatedSales)}</div>
                <div className="text-right text-text-secondary">0%</div>
                <div className="text-right font-mono text-text-secondary">0.00</div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
                <div className="text-text-primary">Exempt Sales</div>
                <div className="text-right font-mono text-text-secondary">{formatNumber(vr.exemptSales)}</div>
                <div className="text-right text-text-secondary">—</div>
                <div className="text-right font-mono text-text-secondary">0.00</div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-border-subtle bg-canvas/30 px-5 py-2.5 text-[13px] font-semibold">
                <div className="text-text-primary">Total Output VAT</div>
                <div></div><div></div>
                <div className="text-right font-mono text-error">{formatNumber(vr.outputVat)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-border-subtle/50 px-5 py-2.5 text-[13px]">
                <div className="text-text-primary">Standard Rated Purchases</div>
                <div className="text-right font-mono text-text-primary">{formatNumber(vr.taxablePurchases)}</div>
                <div className="text-right text-text-secondary">5%</div>
                <div className="text-right font-mono text-text-primary">{formatNumber(vr.inputVat)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t border-border-subtle bg-canvas/30 px-5 py-2.5 text-[13px] font-semibold">
                <div className="text-text-primary">Total Input VAT</div>
                <div></div><div></div>
                <div className="text-right font-mono text-success">{formatNumber(vr.inputVat)}</div>
              </div>
              <div className="grid grid-cols-4 gap-4 border-t-2 border-text-primary/20 bg-surface px-5 py-3 text-[14px] font-bold">
                <div className="text-text-primary">Net VAT {vr.netVat >= 0 ? "Payable" : "Refundable"}</div>
                <div></div><div></div>
                <div className="text-right font-mono text-text-primary">AED {formatNumber(vr.netVat)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
