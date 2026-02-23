"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useDashboardPillPreferences,
  type DashboardVariant,
} from "@/hooks/use-dashboard-pill-preferences";
import { DashboardCustomizePanel } from "./dashboard-customize-panel";
import { SalesDashboard } from "./variants/sales-dashboard";
import { PurchasesDashboard } from "./variants/purchases-dashboard";
import { DocumentsDashboard } from "./variants/documents-dashboard";
import { InventoryDashboard } from "./variants/inventory-dashboard";
import { BankingDashboard } from "./variants/banking-dashboard";
import type {
  DashboardStats,
  SalesMiniStats,
  PurchasesMiniStats,
  DocumentsMiniStats,
  InventoryMiniStats,
  BankingMiniStats,
} from "@/lib/dashboard/mini-stats-types";

type MiniStatsMap = {
  sales: SalesMiniStats;
  purchases: PurchasesMiniStats;
  documents: DocumentsMiniStats;
  inventory: InventoryMiniStats;
  banking: BankingMiniStats;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json() as Promise<T>;
}

interface DashboardPillContentProps {
  variant: DashboardVariant;
}

export function DashboardPillContent({ variant }: DashboardPillContentProps) {
  const [showCustomize, setShowCustomize] = useState(false);
  const { isVisible } = useDashboardPillPreferences(variant);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchJson<DashboardStats>("/api/dashboard/stats"),
  });

  const { data: mini, isLoading, error } = useQuery({
    queryKey: ["mini-stats", variant],
    queryFn: () => fetchJson<MiniStatsMap[typeof variant]>(`/api/${variant}/mini-stats`),
  });

  if (showCustomize) {
    return (
      <div className="w-[480px] max-h-[500px] overflow-y-auto p-4">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-sm font-medium">Customize dashboard</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowCustomize(false)}>
            Back
          </Button>
        </div>
        <DashboardCustomizePanel variant={variant} />
      </div>
    );
  }

  return (
    <div className="w-[520px] max-h-[560px] overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Dashboard</h3>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setShowCustomize(true)} title="Customize">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-6 p-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {error && (
          <p className="text-sm text-destructive">Failed to load data.</p>
        )}
        {!isLoading && !error && mini && (
          <>
            {variant === "sales" && <SalesDashboard mini={mini as SalesMiniStats} stats={stats} isVisible={isVisible} />}
            {variant === "purchases" && <PurchasesDashboard mini={mini as PurchasesMiniStats} stats={stats} isVisible={isVisible} />}
            {variant === "documents" && <DocumentsDashboard mini={mini as DocumentsMiniStats} isVisible={isVisible} />}
            {variant === "inventory" && <InventoryDashboard mini={mini as InventoryMiniStats} isVisible={isVisible} />}
            {variant === "banking" && <BankingDashboard mini={mini as BankingMiniStats} isVisible={isVisible} />}
          </>
        )}
      </div>
    </div>
  );
}
