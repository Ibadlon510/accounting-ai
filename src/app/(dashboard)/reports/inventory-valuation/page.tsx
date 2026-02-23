"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/accounting/engine";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/utils/toast-helpers";

type Item = { id: string; name: string; sku: string; type: string; unitOfMeasure: string; costPrice: number; quantityOnHand: number; isActive: boolean; totalValue: number };

export default function InventoryValuationPage() {
  const [allItems, setAllItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((d) => setAllItems((d.items ?? []).map((i: Item) => ({ ...i, totalValue: i.quantityOnHand * i.costPrice }))))
      .catch(() => {});
  }, []);

  const products = allItems.filter((i) => i.type === "product" && i.isActive);
  const totalValue = products.reduce((s, i) => s + i.totalValue, 0);
  const totalUnits = products.reduce((s, i) => s + i.quantityOnHand, 0);

  return (
    <>
      <div className="mb-6 flex items-center justify-end">
        <Button onClick={() => comingSoon("Export PDF")} variant="outline" className="h-9 gap-2 rounded-xl border-border-subtle text-[12px]">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      <p className="mb-6 text-[13px] text-text-secondary">As of February 28, 2026 • Costing method: Weighted Average</p>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Total Inventory Value</p>
          <p className="mt-1 text-[28px] font-bold text-text-primary">AED {formatNumber(totalValue)}</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Total Units on Hand</p>
          <p className="mt-1 text-[28px] font-bold text-text-primary">{totalUnits}</p>
        </div>
        <div className="col-span-4 dashboard-card">
          <p className="text-[13px] text-text-secondary">Product Count</p>
          <p className="mt-1 text-[28px] font-bold text-text-primary">{products.length}</p>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="grid grid-cols-12 gap-3 border-b border-border-subtle bg-canvas/50 px-6 py-3 text-[12px] font-medium uppercase tracking-wide text-text-meta">
          <div className="col-span-1">SKU</div>
          <div className="col-span-3">Item</div>
          <div className="col-span-1 text-right">On Hand</div>
          <div className="col-span-1">Unit</div>
          <div className="col-span-2 text-right">Cost Price</div>
          <div className="col-span-2 text-right">Total Value</div>
          <div className="col-span-2 text-right">% of Total</div>
        </div>

        {products
          .sort((a, b) => b.totalValue - a.totalValue)
          .map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 border-b border-border-subtle/50 px-6 py-3 text-[13px] transition-colors hover:bg-black/[0.01]">
              <div className="col-span-1 font-mono text-text-secondary">{item.sku}</div>
              <div className="col-span-3 font-medium text-text-primary">{item.name}</div>
              <div className="col-span-1 text-right font-mono text-text-primary">{item.quantityOnHand}</div>
              <div className="col-span-1 text-text-secondary">{item.unitOfMeasure}</div>
              <div className="col-span-2 text-right font-mono text-text-secondary">AED {formatNumber(item.costPrice)}</div>
              <div className="col-span-2 text-right font-mono font-medium text-text-primary">AED {formatNumber(item.totalValue)}</div>
              <div className="col-span-2 text-right font-mono text-text-secondary">
                {totalValue > 0 ? `${((item.totalValue / totalValue) * 100).toFixed(1)}%` : "0%"}
              </div>
            </div>
          ))}

        <div className="grid grid-cols-12 gap-3 bg-muted/30 px-6 py-3 text-[14px] font-bold">
          <div className="col-span-4 text-text-primary">Total</div>
          <div className="col-span-1 text-right font-mono text-text-primary">{totalUnits}</div>
          <div className="col-span-3"></div>
          <div className="col-span-2 text-right font-mono text-text-primary">AED {formatNumber(totalValue)}</div>
          <div className="col-span-2 text-right font-mono text-text-primary">100%</div>
        </div>
      </div>
    </>
  );
}
