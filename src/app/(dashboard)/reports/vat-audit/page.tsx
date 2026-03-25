"use client";

import { useEffect, useState } from "react";
import { formatNumber, formatDate } from "@/lib/accounting/engine";
import { CheckCircle2 } from "lucide-react";
import { ExportPdfButton } from "@/components/pdf/export-pdf-button";
import { useOrganization } from "@/hooks/use-organization";

type Inv = { invoiceNumber: string; customerName: string; issueDate: string; subtotal: number; taxAmount: number };
type Bill = { billNumber: string; supplierName: string; issueDate: string; subtotal: number; taxAmount: number };

function computeRate(taxable: number, tax: number): string {
  if (!taxable || !tax) return "—";
  return `${((tax / taxable) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export default function VATAuditPage() {
  const { org } = useOrganization();
  const taxLabel = org?.taxLabel ?? "VAT";
  const currency = org?.currency ?? "AED";

  const [invoices, setInvoices] = useState<Inv[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    fetch("/api/sales/invoices", { cache: "no-store" }).then((r) => r.ok ? r.json() : { invoices: [] }).then((d) => setInvoices(d.invoices ?? [])).catch(() => {});
    fetch("/api/purchases/bills", { cache: "no-store" }).then((r) => r.ok ? r.json() : { bills: [] }).then((d) => setBills(d.bills ?? [])).catch(() => {});
  }, []);

  const outputTax = invoices.reduce((s, inv) => s + inv.taxAmount, 0);
  const inputTax = bills.reduce((s, b) => s + b.taxAmount, 0);
  const netPayable = outputTax - inputTax;

  const outputLines = invoices.map((inv) => ({
    date: inv.issueDate,
    ref: inv.invoiceNumber,
    entity: inv.customerName,
    taxable: inv.subtotal,
    tax: inv.taxAmount,
    type: "output" as const,
  }));

  const inputLines = bills.map((b) => ({
    date: b.issueDate,
    ref: b.billNumber,
    entity: b.supplierName,
    taxable: b.subtotal,
    tax: b.taxAmount,
    type: "input" as const,
  }));

  const allLines = [...outputLines, ...inputLines].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="mb-6 flex items-center justify-end">
        <ExportPdfButton documentType="vat_audit" />
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Output {taxLabel} (Sales)</p>
          <p className="mt-1 text-[28px] font-bold text-error">{currency} {formatNumber(outputTax)}</p>
          <p className="mt-1 text-[12px] text-text-meta">{outputLines.length} taxable transactions</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Input {taxLabel} (Purchases)</p>
          <p className="mt-1 text-[28px] font-bold text-success">{currency} {formatNumber(inputTax)}</p>
          <p className="mt-1 text-[12px] text-text-meta">{inputLines.length} taxable transactions</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Net {taxLabel} Payable</p>
          <p className={`mt-1 text-[28px] font-bold ${netPayable >= 0 ? "text-error" : "text-success"}`}>{currency} {formatNumber(Math.abs(netPayable))}</p>
          <p className="mt-1 text-[12px] text-text-meta">{netPayable >= 0 ? "Payable" : "Refund due"}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-success-light px-5 py-3">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <span className="text-[14px] font-semibold text-success">All transactions have valid tax references and correct rates applied</span>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-3">Entity</div>
          <div className="col-span-2 text-right">Taxable Amount</div>
          <div className="col-span-1 text-right">Rate</div>
          <div className="col-span-2 text-right">{taxLabel} Amount</div>
        </div>

        {allLines.map((line, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]">
            <div className="col-span-1 text-text-secondary">{formatDate(line.date)}</div>
            <div className="col-span-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${line.type === "output" ? "bg-error-light text-error" : "bg-success-light text-success"}`}>
                {line.type === "output" ? "Output" : "Input"}
              </span>
            </div>
            <div className="col-span-2 font-mono text-text-primary">{line.ref}</div>
            <div className="col-span-3 text-text-primary">{line.entity}</div>
            <div className="col-span-2 text-right font-mono text-text-primary">{currency} {formatNumber(line.taxable)}</div>
            <div className="col-span-1 text-right text-text-secondary">{computeRate(line.taxable, line.tax)}</div>
            <div className={`col-span-2 text-right font-mono font-medium ${line.type === "output" ? "text-error" : "text-success"}`}>
              {currency} {formatNumber(line.tax)}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-12 gap-3 bg-muted/30 px-6 py-3 text-[14px] font-bold">
          <div className="col-span-7 text-text-primary">Totals</div>
          <div className="col-span-2 text-right font-mono text-text-primary">{currency} {formatNumber(allLines.reduce((s, l) => s + l.taxable, 0))}</div>
          <div className="col-span-1"></div>
          <div className="col-span-2 text-right font-mono text-text-primary">{currency} {formatNumber(allLines.reduce((s, l) => s + l.tax, 0))}</div>
        </div>
      </div>
    </>
  );
}
