"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { mockItems, getInventoryStats } from "@/lib/mock/inventory-data";
import type { Item } from "@/lib/mock/inventory-data";
import { formatNumber } from "@/lib/accounting/engine";
import { Search, Plus, Package, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddItemPanel } from "@/components/modals/add-item-panel";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [items, setItems] = useState(mockItems);
  const stats = getInventoryStats();

  function handleCreate(data: Omit<Item, "id" | "totalValue">) {
    const newItem: Item = {
      id: `item-${Date.now()}`,
      ...data,
      totalValue: data.quantityOnHand * data.costPrice,
    };
    setItems((prev) => [newItem, ...prev]);
  }

  const filtered = items.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Inventory" }]} />
      <PageHeader title="Inventory" showActions={false} />

      {/* Stats */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-3 dashboard-card">
          <p className="text-[13px] text-text-secondary">Total Items</p>
          <p className="mt-1 text-[28px] font-bold text-text-primary">{stats.totalItems}</p>
        </div>
        <div className="col-span-3 dashboard-card">
          <p className="text-[13px] text-text-secondary">Products</p>
          <p className="mt-1 text-[28px] font-bold text-text-primary">{stats.totalProducts}</p>
        </div>
        <div className="col-span-3 dashboard-card">
          <p className="text-[13px] text-text-secondary">Inventory Value</p>
          <p className="mt-1 text-[28px] font-bold text-success">AED {formatNumber(stats.totalValue)}</p>
        </div>
        <div className="col-span-3 dashboard-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-error" />
            <p className="text-[13px] text-text-secondary">Low Stock</p>
          </div>
          <p className="mt-1 text-[28px] font-bold text-error">{stats.lowStock}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <Button onClick={() => setAddOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
        <AddItemPanel open={addOpen} onOpenChange={setAddOpen} onCreate={handleCreate} />
      </div>

      {/* Items Table */}
      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">SKU</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1 text-right">Sale Price</div>
          <div className="col-span-1 text-right">Cost</div>
          <div className="col-span-1 text-right">On Hand</div>
          <div className="col-span-1 text-right">Reorder</div>
          <div className="col-span-2 text-right">Value</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {filtered.map((item) => {
          const isLow = item.type === "product" && item.quantityOnHand <= item.reorderLevel;
          return (
            <div key={item.id} className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]">
              <div className="col-span-1 font-mono text-text-secondary">{item.sku}</div>
              <div className="col-span-3 font-medium text-text-primary">{item.name}</div>
              <div className="col-span-1">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${item.type === "product" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{item.type}</span>
              </div>
              <div className="col-span-1 text-right font-mono text-text-primary">{formatNumber(item.salesPrice)}</div>
              <div className="col-span-1 text-right font-mono text-text-secondary">{formatNumber(item.costPrice)}</div>
              <div className={`col-span-1 text-right font-mono font-medium ${isLow ? "text-error" : "text-text-primary"}`}>
                {item.type === "product" ? item.quantityOnHand : "—"}
              </div>
              <div className="col-span-1 text-right font-mono text-text-meta">
                {item.type === "product" ? item.reorderLevel : "—"}
              </div>
              <div className="col-span-2 text-right font-mono font-medium text-text-primary">
                {item.totalValue > 0 ? `AED ${formatNumber(item.totalValue)}` : "—"}
              </div>
              <div className="col-span-1 text-right">
                {isLow ? (
                  <span className="rounded-full bg-error-light px-2 py-0.5 text-[10px] font-medium text-error">Low</span>
                ) : (
                  <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-medium text-success">OK</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
