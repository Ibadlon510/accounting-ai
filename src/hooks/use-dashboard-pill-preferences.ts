"use client";

import { useState, useCallback, useEffect } from "react";

export type DashboardVariant = "sales" | "purchases" | "documents" | "inventory" | "banking";

const STORAGE_KEY = "dashboard-pill-preferences";

export const WIDGET_IDS: Record<DashboardVariant, string[]> = {
  sales: ["metricsRow", "avgInvoiceValue", "collectionRate", "yoyGrowth", "barChart", "revenueTrend", "pieChart", "topCustomers", "topProducts", "scatterChart"],
  purchases: ["metricsRow", "avgBillValue", "paymentRate", "upcomingPayables", "supplierCountTrend", "barChart", "pieChart", "topExpenseCategories", "topSuppliers"],
  documents: ["metricsRow", "successRate", "avgConfidence", "oldestPending", "barChart", "processingByMonth", "pieChart", "documentsByType", "recentDocuments"],
  inventory: ["metricsRow", "reorderAlerts", "stockOutRisk", "inventoryTurnover", "barChart", "pieChart", "valueByCategory", "topItemsByValue", "lowStockTable"],
  banking: ["metricsRow", "reconciliationRate", "inVsOutThisMonth", "pendingAiMatches", "barChart", "balanceTrend", "pieChart", "recentTransactions", "largestTransactions"],
};

export const WIDGET_LABELS: Record<string, string> = {
  metricsRow: "Key metrics",
  avgInvoiceValue: "Average invoice value",
  collectionRate: "Collection rate",
  yoyGrowth: "Year-over-year growth",
  barChart: "Monthly chart",
  revenueTrend: "Revenue trend",
  pieChart: "Status breakdown",
  topCustomers: "Top customers",
  topProducts: "Top products",
  scatterChart: "Amount vs due date",
  avgBillValue: "Average bill value",
  paymentRate: "Payment rate",
  upcomingPayables: "Upcoming payables",
  supplierCountTrend: "Supplier count",
  topExpenseCategories: "Expense categories",
  topSuppliers: "Top suppliers",
  successRate: "Success rate",
  avgConfidence: "AI confidence",
  oldestPending: "Oldest pending",
  processingByMonth: "Processed vs failed",
  documentsByType: "Documents by type",
  recentDocuments: "Recent documents",
  reorderAlerts: "Reorder alerts",
  stockOutRisk: "Stock-out risk",
  inventoryTurnover: "Inventory turnover",
  valueByCategory: "Value by category",
  topItemsByValue: "Top items by value",
  lowStockTable: "Low stock items",
  reconciliationRate: "Reconciliation rate",
  inVsOutThisMonth: "In vs out this month",
  pendingAiMatches: "Pending AI matches",
  balanceTrend: "Balance trend",
  recentTransactions: "Recent transactions",
  largestTransactions: "Largest transactions",
};

function loadPreferences(): Record<DashboardVariant, Record<string, boolean>> {
  if (typeof window === "undefined") return {} as Record<DashboardVariant, Record<string, boolean>>;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as Record<DashboardVariant, Record<string, boolean>>;
    return JSON.parse(raw) as Record<DashboardVariant, Record<string, boolean>>;
  } catch {
    return {} as Record<DashboardVariant, Record<string, boolean>>;
  }
}

function savePreferences(prefs: Record<DashboardVariant, Record<string, boolean>>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function useDashboardPillPreferences(variant: DashboardVariant) {
  const [prefs, setPrefs] = useState<Record<DashboardVariant, Record<string, boolean>>>(() => loadPreferences());

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const visible = useCallback(
    (widgetId: string): boolean => {
      const variantPrefs = prefs[variant];
      if (!variantPrefs || variantPrefs[widgetId] === undefined) return true;
      return variantPrefs[widgetId];
    },
    [prefs, variant]
  );

  const setVisible = useCallback(
    (widgetId: string, value: boolean) => {
      const next = {
        ...prefs,
        [variant]: {
          ...(prefs[variant] ?? {}),
          [widgetId]: value,
        },
      };
      setPrefs(next);
      savePreferences(next);
    },
    [prefs, variant]
  );

  const reset = useCallback(() => {
    const next = { ...prefs };
    delete next[variant];
    setPrefs(next);
    savePreferences(next);
  }, [prefs, variant]);

  const allVisible = WIDGET_IDS[variant] ?? [];
  const visibleMap = Object.fromEntries(allVisible.map((id) => [id, visible(id)]));

  return {
    visible: visibleMap,
    isVisible: visible,
    setVisible,
    reset,
    widgetIds: allVisible,
  };
}
