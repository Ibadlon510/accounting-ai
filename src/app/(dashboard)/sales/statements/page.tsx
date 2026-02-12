"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockCustomers, mockInvoices, mockPaymentsReceived } from "@/lib/mock/sales-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Users, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

export default function CustomerStatementsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statements = mockCustomers
    .filter((c) => c.isActive)
    .map((customer) => {
      const invoices = mockInvoices.filter((inv) => inv.customerId === customer.id);
      const payments = mockPaymentsReceived.filter((p) => invoices.some((inv) => inv.invoiceNumber === p.invoiceNumber));
      const totalInvoiced = invoices.reduce((s, inv) => s + inv.total, 0);
      const totalPaid = invoices.reduce((s, inv) => s + inv.amountPaid, 0);
      const balance = invoices.reduce((s, inv) => s + inv.amountDue, 0);
      return { customer, invoices, payments, totalInvoiced, totalPaid, balance };
    })
    .filter((s) => s.invoices.length > 0);

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Sales", href: "/sales" }, { label: "Customer Statements" }]} />
      <PageHeader title="Customer Statements" showActions={false} />

      <p className="mb-6 text-[14px] text-text-secondary">
        Account statements for all active customers with transaction history.
      </p>

      <div className="space-y-4">
        {statements.map(({ customer, invoices, payments, totalInvoiced, totalPaid, balance }) => {
          const isExpanded = expandedId === customer.id;
          return (
            <div key={customer.id} className="dashboard-card !p-0 overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : customer.id)} className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-black/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-400">
                    <span className="text-[13px] font-bold text-white">
                      {customer.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-text-primary">{customer.name}</h3>
                    <p className="text-[12px] text-text-meta">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} • {customer.city}, {customer.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[11px] text-text-meta">Total Invoiced</p>
                    <p className="font-mono text-[14px] font-semibold text-text-primary">AED {formatNumber(totalInvoiced)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-text-meta">Paid</p>
                    <p className="font-mono text-[14px] font-semibold text-success">AED {formatNumber(totalPaid)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-text-meta">Balance Due</p>
                    <p className={`font-mono text-[14px] font-bold ${balance > 0 ? "text-error" : "text-success"}`}>AED {formatNumber(balance)}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-text-meta" /> : <ChevronDown className="h-4 w-4 text-text-meta" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border-subtle bg-canvas/30 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-text-meta">Transaction History</p>
                    <Button onClick={() => comingSoon("Export Statement PDF")} variant="outline" className="h-8 gap-1.5 rounded-lg border-border-subtle text-[12px]">
                      <Download className="h-3.5 w-3.5" /> Export PDF
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border-subtle overflow-hidden">
                    <div className="grid grid-cols-12 gap-3 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-meta">
                      <div className="col-span-2">Date</div>
                      <div className="col-span-1">Type</div>
                      <div className="col-span-3">Reference</div>
                      <div className="col-span-2 text-right">Debit</div>
                      <div className="col-span-2 text-right">Credit</div>
                      <div className="col-span-2 text-right">Balance</div>
                    </div>

                    {(() => {
                      let runningBalance = 0;
                      const entries = [
                        ...invoices.map((inv) => ({ date: inv.issueDate, type: "Invoice" as const, ref: inv.invoiceNumber, debit: inv.total, credit: 0 })),
                        ...payments.map((p) => ({ date: p.paymentDate, type: "Payment" as const, ref: p.paymentNumber, debit: 0, credit: p.amount })),
                      ].sort((a, b) => a.date.localeCompare(b.date));

                      return entries.map((entry, i) => {
                        runningBalance += entry.debit - entry.credit;
                        return (
                          <div key={i} className="grid grid-cols-12 gap-3 border-t border-border-subtle/50 px-4 py-2.5 text-[13px]">
                            <div className="col-span-2 text-text-secondary">{entry.date}</div>
                            <div className="col-span-1">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${entry.type === "Invoice" ? "bg-blue-100 text-blue-700" : "bg-success-light text-success"}`}>{entry.type}</span>
                            </div>
                            <div className="col-span-3 font-mono text-text-primary">{entry.ref}</div>
                            <div className="col-span-2 text-right font-mono text-text-primary">{entry.debit > 0 ? formatNumber(entry.debit) : "—"}</div>
                            <div className="col-span-2 text-right font-mono text-success">{entry.credit > 0 ? formatNumber(entry.credit) : "—"}</div>
                            <div className={`col-span-2 text-right font-mono font-semibold ${runningBalance > 0 ? "text-error" : "text-success"}`}>{formatNumber(runningBalance)}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
