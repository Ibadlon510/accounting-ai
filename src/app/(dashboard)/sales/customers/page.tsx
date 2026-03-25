"use client";

import { useState, useEffect, useCallback } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus, Mail, Phone, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddCustomerPanel } from "@/components/modals/add-customer-modal";
import { ViewCustomerPanel } from "@/components/overlays/view-customer-panel";
import { ImportExportButtons } from "@/components/import-export/import-export-buttons";

type Customer = { id: string; name: string; email: string; phone: string; taxNumber: string; city: string; country: string; currency: string; creditLimit: number; paymentTermsDays: number; isActive: boolean; outstandingBalance: number };

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const loadCustomers = useCallback(() => {
    fetch("/api/sales/customers", { cache: "no-store" }).then((r) => r.ok ? r.json() : { customers: [] }).then((d) => setCustomers(d.customers ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleAddCustomer(data: { id: string; name: string; email: string; phone: string; taxNumber: string; city: string; country: string; creditLimit: number; paymentTermsDays: number }) {
    const newCustomer: Customer = {
      ...data, currency: "AED", isActive: true, outstandingBalance: 0,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
  }

  return (
    <>
      <AddCustomerPanel open={addOpen} onOpenChange={setAddOpen} onAdd={handleAddCustomer} />
      <ViewCustomerPanel
        open={!!viewingId}
        onOpenChange={(o) => !o && setViewingId(null)}
        customer={customers.find((c) => c.id === viewingId) ?? null}
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <ImportExportButtons entity="customers" entityLabel="Customers" onImportComplete={loadCustomers} />
        <Button onClick={() => setAddOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {filtered.map((customer) => (
          <div key={customer.id} className="col-span-4">
            <button
              onClick={() => setViewingId(customer.id)}
              className={`w-full text-left dashboard-card cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
                customer.outstandingBalance > 0 ? "ring-1 ring-error/20" : ""
              }`}
            >
              <div
                className={`-mx-6 -mt-6 mb-4 px-6 py-4 flex items-center justify-between ${
                  customer.outstandingBalance > 0 ? "bg-error/8" : "bg-success/8"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className={`h-5 w-5 ${customer.outstandingBalance > 0 ? "text-error" : "text-success"}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-meta">Outstanding</span>
                </div>
                <p className={`text-[22px] font-bold tabular-nums ${customer.outstandingBalance > 0 ? "text-error" : "text-success"}`}>
                  AED {formatNumber(customer.outstandingBalance)}
                </p>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-text-primary">{customer.name}</h3>
                  <p className="mt-0.5 text-[12px] text-text-meta">{customer.city}, {customer.country}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${customer.isActive ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
                  {customer.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <Mail className="h-3.5 w-3.5 shrink-0" />{customer.email}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <Phone className="h-3.5 w-3.5 shrink-0" />{customer.phone}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <p className="text-[11px] text-text-meta">Credit Limit</p>
                <p className="text-[13px] font-medium text-text-primary">AED {formatNumber(customer.creditLimit)}</p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
