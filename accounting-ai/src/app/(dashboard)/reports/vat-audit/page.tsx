"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockInvoices } from "@/lib/mock/sales-data";
import { mockBills } from "@/lib/mock/purchases-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

export default function VATAuditPage() {
  const outputVAT = mockInvoices.reduce((s, inv) => s + inv.taxAmount, 0);
  const inputVAT = mockBills.reduce((s, b) => s + b.taxAmount, 0);
  const netPayable = outputVAT - inputVAT;

  const outputLines = mockInvoices.map((inv) => ({
    date: inv.issueDate,
    ref: inv.invoiceNumber,
    entity: inv.customerName,
    taxable: inv.subtotal,
    vat: inv.taxAmount,
    type: "output" as const,
  }));

  const inputLines = mockBills.map((b) => ({
    date: b.issueDate,
    ref: b.billNumber,
    entity: b.supplierName,
    taxable: b.subtotal,
    vat: b.taxAmount,
    type: "input" as const,
  }));

  const allLines = [...outputLines, ...inputLines].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Reports", href: "/reports" }, { label: "VAT Audit" }]} />
      <div className="flex items-center justify-between">
        <PageHeader title="VAT Audit Report" showActions={false} />
        <Button onClick={() => comingSoon("Export PDF")} variant="outline" className="h-9 gap-2 rounded-xl border-border-subtle text-[12px]">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      <p className="mb-6 text-[13px] text-text-secondary">Tax period: January 1, 2026 — March 31, 2026 (Q1)</p>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Output VAT (Sales)</p>
          <p className="mt-1 text-[28px] font-bold text-error">AED {formatNumber(outputVAT)}</p>
          <p className="mt-1 text-[12px] text-text-meta">{outputLines.length} taxable transactions</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Input VAT (Purchases)</p>
          <p className="mt-1 text-[28px] font-bold text-success">AED {formatNumber(inputVAT)}</p>
          <p className="mt-1 text-[12px] text-text-meta">{inputLines.length} taxable transactions</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Net VAT Payable</p>
          <p className={`mt-1 text-[28px] font-bold ${netPayable >= 0 ? "text-error" : "text-success"}`}>AED {formatNumber(Math.abs(netPayable))}</p>
          <p className="mt-1 text-[12px] text-text-meta">{netPayable >= 0 ? "Payable to FTA" : "Refund due"}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-success-light px-5 py-3">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <span className="text-[14px] font-semibold text-success">All transactions have valid TRN references and correct VAT rates applied</span>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-3">Entity</div>
          <div className="col-span-2 text-right">Taxable Amount</div>
          <div className="col-span-1 text-right">Rate</div>
          <div className="col-span-2 text-right">VAT Amount</div>
        </div>

        {allLines.map((line, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]">
            <div className="col-span-1 text-text-secondary">{line.date}</div>
            <div className="col-span-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${line.type === "output" ? "bg-error-light text-error" : "bg-success-light text-success"}`}>
                {line.type === "output" ? "Output" : "Input"}
              </span>
            </div>
            <div className="col-span-2 font-mono text-text-primary">{line.ref}</div>
            <div className="col-span-3 text-text-primary">{line.entity}</div>
            <div className="col-span-2 text-right font-mono text-text-primary">AED {formatNumber(line.taxable)}</div>
            <div className="col-span-1 text-right text-text-secondary">5%</div>
            <div className={`col-span-2 text-right font-mono font-medium ${line.type === "output" ? "text-error" : "text-success"}`}>
              AED {formatNumber(line.vat)}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-12 gap-3 bg-muted/30 px-6 py-3 text-[14px] font-bold">
          <div className="col-span-7 text-text-primary">Totals</div>
          <div className="col-span-2 text-right font-mono text-text-primary">AED {formatNumber(allLines.reduce((s, l) => s + l.taxable, 0))}</div>
          <div className="col-span-1"></div>
          <div className="col-span-2 text-right font-mono text-text-primary">AED {formatNumber(allLines.reduce((s, l) => s + l.vat, 0))}</div>
        </div>
      </div>
    </>
  );
}
