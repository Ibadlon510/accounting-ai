"use client";

import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { ViewStatementPanel, type Statement } from "@/components/overlays/view-statement-panel";

type Inv = { id: string; customerId: string; customerName: string; invoiceNumber: string; issueDate: string; total: number; amountPaid: number; amountDue: number };
type Cust = { id: string; name: string; city: string; country: string; isActive: boolean };

export default function CustomerStatementsPage() {
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Cust[]>([]);
  const [invoicesList, setInvoicesList] = useState<Inv[]>([]);

  useEffect(() => {
    fetch("/api/sales/customers").then((r) => r.ok ? r.json() : { customers: [] }).then((d) => setCustomers(d.customers ?? [])).catch(() => {});
    fetch("/api/sales/invoices").then((r) => r.ok ? r.json() : { invoices: [] }).then((d) => setInvoicesList(d.invoices ?? [])).catch(() => {});
  }, []);

  const statements: Statement[] = customers
    .filter((c) => c.isActive)
    .map((customer) => {
      const invoices = invoicesList.filter((inv) => inv.customerId === customer.id);
      const totalInvoiced = invoices.reduce((s, inv) => s + inv.total, 0);
      const totalPaid = invoices.reduce((s, inv) => s + inv.amountPaid, 0);
      const balance = invoices.reduce((s, inv) => s + inv.amountDue, 0);
      return { customer, invoices, payments: [] as Statement["payments"], totalInvoiced, totalPaid, balance };
    })
    .filter((s) => s.invoices.length > 0);

  const selectedStatement = statements.find((s) => s.customer.id === viewingCustomerId) ?? null;

  return (
    <>
      <ViewStatementPanel
        open={!!viewingCustomerId}
        onOpenChange={(o) => !o && setViewingCustomerId(null)}
        statement={selectedStatement}
      />
      <p className="mb-6 text-[14px] text-text-secondary">
        Account statements for all active customers with transaction history.
      </p>

      <div className="space-y-4">
        {statements.map(({ customer, invoices, totalInvoiced, totalPaid, balance }) => (
          <button
            key={customer.id}
            onClick={() => setViewingCustomerId(customer.id)}
            className="w-full dashboard-card !p-0 overflow-hidden text-left transition-colors hover:shadow-lg cursor-pointer"
          >
            <div className="flex w-full items-center justify-between px-6 py-4">
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
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
