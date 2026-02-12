"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockSuppliers, type Supplier } from "@/lib/mock/purchases-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddSupplierPanel } from "@/components/modals/add-supplier-modal";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [suppliers, setSuppliers] = useState(mockSuppliers);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleAddSupplier(data: { name: string; email: string; phone: string; taxNumber: string; city: string; country: string; paymentTermsDays: number }) {
    const newSupplier: Supplier = { id: `sup-${Date.now()}`, ...data, currency: "AED", isActive: true, outstandingBalance: 0 };
    setSuppliers((prev) => [newSupplier, ...prev]);
  }

  return (
    <>
      <AddSupplierPanel open={addOpen} onOpenChange={setAddOpen} onAdd={handleAddSupplier} />
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Purchases", href: "/purchases" }, { label: "Suppliers" }]} />
      <PageHeader title="Suppliers" showActions={false} />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {filtered.map((supplier) => (
          <div key={supplier.id} className="col-span-4">
            <div className="dashboard-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-text-primary">{supplier.name}</h3>
                  <p className="mt-0.5 text-[12px] text-text-meta">{supplier.city}, {supplier.country}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${supplier.isActive ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
                  {supplier.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[12px] text-text-secondary"><Mail className="h-3.5 w-3.5" />{supplier.email}</div>
                <div className="flex items-center gap-2 text-[12px] text-text-secondary"><Phone className="h-3.5 w-3.5" />{supplier.phone}</div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                <div>
                  <p className="text-[11px] text-text-meta">Outstanding</p>
                  <p className={`text-[15px] font-semibold ${supplier.outstandingBalance > 0 ? "text-error" : "text-success"}`}>
                    AED {formatNumber(supplier.outstandingBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-text-meta">Payment Terms</p>
                  <p className="text-[13px] font-medium text-text-primary">{supplier.paymentTermsDays} days</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
