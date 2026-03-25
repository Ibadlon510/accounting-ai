"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { formatNumber } from "@/lib/accounting/engine";
import {
  Search, Plus, Package, AlertTriangle, LayoutDashboard, Settings,
  RefreshCw, Sparkles, X, Box, BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddItemPanel } from "@/components/modals/add-item-panel";
import { ImportExportButtons } from "@/components/import-export/import-export-buttons";
import { DashboardPill } from "@/components/dashboard/dashboard-pill";
import { InventoryDashboard } from "@/components/dashboard/variants/inventory-dashboard";
import { useDashboardPillPreferences } from "@/hooks/use-dashboard-pill-preferences";
import { DashboardCustomizePanel } from "@/components/dashboard/dashboard-customize-panel";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import type { InventoryMiniStats } from "@/lib/dashboard/mini-stats-types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
}

type Item = {
  id: string;
  name: string;
  sku: string;
  type: string;
  unitOfMeasure: string;
  salesPrice: number;
  purchasePrice: number;
  costPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  taxCode: string | null;
  trackInventory: boolean;
  isActive: boolean;
  totalValue?: number;
};

export default function InventoryPage() {
  usePageTitle("Inventory");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [showCustomize, setShowCustomize] = useState(false);
  const [dismissedInsight, setDismissedInsight] = useState(false);
  const { isVisible } = useDashboardPillPreferences("inventory");

  const { data: mini, isLoading: miniLoading, error: miniError, refetch: refetchMini } = useQuery({
    queryKey: ["mini-stats", "inventory"],
    queryFn: () => fetchJson<InventoryMiniStats>("/api/inventory/mini-stats"),
  });

  const loadItems = useCallback(() => {
    fetch("/api/inventory", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((d) => setItems((d.items ?? []).map((i: Item) => ({ ...i, totalValue: i.quantityOnHand * i.costPrice }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const stats = {
    totalItems: items.length,
    totalProducts: items.filter((i) => i.type === "product").length,
    totalValue: items.reduce((s, i) => s + (i.totalValue ?? 0), 0),
    lowStock: items.filter((i) => i.type === "product" && i.trackInventory && i.quantityOnHand <= i.reorderLevel).length,
  };

  async function handleCreate(data: Omit<Item, "id" | "totalValue" | "sku"> & { sku?: string }) {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        sku: data.sku,
        type: data.type,
        unitOfMeasure: data.unitOfMeasure,
        salesPrice: data.salesPrice,
        purchasePrice: data.purchasePrice,
        quantityOnHand: data.quantityOnHand,
        reorderLevel: data.reorderLevel,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const { showError } = await import("@/lib/utils/toast-helpers");
      showError(json.error ?? "Failed to create item");
      throw new Error(json.error ?? "Failed to create item");
    }
    const created = json.item as { id: string; name: string; sku: string; type: string; unitOfMeasure: string; salesPrice: number; purchasePrice: number; costPrice: number; quantityOnHand: number; reorderLevel: number; taxCode: string; trackInventory: boolean; isActive: boolean };
    const newItem: Item = {
      id: created.id,
      name: created.name,
      sku: created.sku,
      type: created.type,
      unitOfMeasure: created.unitOfMeasure,
      salesPrice: created.salesPrice,
      purchasePrice: created.purchasePrice,
      costPrice: created.costPrice,
      quantityOnHand: created.quantityOnHand,
      reorderLevel: created.reorderLevel,
      taxCode: created.taxCode,
      trackInventory: created.trackInventory,
      isActive: created.isActive,
      totalValue: created.quantityOnHand * created.costPrice,
    };
    setItems((prev) => [newItem, ...prev]);
  }

  const filtered = items.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const cards = [
    {
      title: "Total Items",
      value: String(stats.totalItems),
      icon: Box,
      href: "#",
      color: "text-text-primary",
      accentBorder: "border-l-text-primary",
      iconBg: "bg-text-primary/10",
      subtitle: "In catalog",
    },
    {
      title: "Products",
      value: String(stats.totalProducts),
      icon: Package,
      href: "#",
      color: "text-[var(--accent-ai)]",
      accentBorder: "border-l-[var(--accent-ai)]",
      iconBg: "bg-[var(--accent-ai)]/10",
      subtitle: "Trackable",
    },
    {
      title: "Inventory Value",
      value: `AED ${formatNumber(stats.totalValue)}`,
      icon: BarChart3,
      href: "#",
      color: "text-success",
      accentBorder: "border-l-success",
      iconBg: "bg-success/10",
      subtitle: "Total",
    },
    {
      title: "Low Stock",
      value: String(stats.lowStock),
      icon: AlertTriangle,
      href: "#",
      color: "text-error",
      accentBorder: "border-l-error",
      iconBg: "bg-error/10",
      subtitle: "Reorder alerts",
    },
  ];

  const insightText = stats.lowStock > 0
    ? `${stats.lowStock} item(s) at or below reorder level — restock soon`
    : stats.totalItems > 0
    ? "All items are adequately stocked"
    : "No inventory yet. Add items to track stock and value.";

  return (
    <>
      <Breadcrumbs items={[{ label: "Workspaces", href: "/workspaces" }, { label: "Inventory" }]} />
      <PageHeader title="Inventory" />

      {!dismissedInsight && (
        <div className="dashboard-card !py-3.5 !px-5 border-l-4 border-l-[var(--accent-ai)] flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-ai)]/10 shrink-0">
            <Sparkles className="h-4 w-4 text-[var(--accent-ai)]" />
          </div>
          <p className="flex-1 text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">AI Insight: </span>
            {insightText}
          </p>
          <button
            onClick={() => setDismissedInsight(true)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-text-meta hover:bg-muted/50 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`dashboard-card border-l-[3px] ${card.accentBorder} transition-all`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.8} />
              </div>
              <p className="mt-3 text-[12px] font-medium text-text-meta uppercase tracking-wide">{card.title}</p>
              <p className={`mt-0.5 text-[28px] font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
              <p className="mt-1 text-[11px] text-text-meta">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
              <LayoutDashboard className="h-4 w-4 text-text-secondary" />
              <h2 className="text-[15px] font-semibold text-text-primary">Dashboard</h2>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomize(!showCustomize)}
            className="rounded-xl text-[12px]"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            {showCustomize ? "Back" : "Customize"}
          </Button>
        </div>

        {showCustomize ? (
          <div className="dashboard-card">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
              <h3 className="text-[14px] font-semibold text-text-primary">Customize widgets</h3>
            </div>
            <DashboardCustomizePanel variant="inventory" />
          </div>
        ) : (
          <>
            {miniLoading && <DashboardSkeleton />}
            {miniError && (
              <div className="dashboard-card border-l-4 border-l-destructive">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-text-primary">Failed to load dashboard</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">There was an error fetching inventory data. Please try again.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchMini()} className="shrink-0 rounded-xl">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            {!miniLoading && !miniError && mini && (
              <InventoryDashboard mini={mini} isVisible={isVisible} layout="page" />
            )}
          </>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <DashboardPill />
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-meta" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-xl border-border-subtle bg-surface pl-10 text-[13px] focus-visible:ring-text-primary/20" />
        </div>
        <ImportExportButtons entity="items" entityLabel="Items" onImportComplete={loadItems} />
        <Button onClick={() => setAddOpen(true)} className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
        <AddItemPanel open={addOpen} onOpenChange={setAddOpen} onCreate={handleCreate} />
      </div>

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
                {(item.totalValue ?? 0) > 0 ? `AED ${formatNumber(item.totalValue ?? 0)}` : "—"}
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
