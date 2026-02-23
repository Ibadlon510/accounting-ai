export interface SalesMiniStats {
  monthlyRevenue: { month: string; revenue: number }[];
  revenueTrend: { month: string; revenue: number; cumulative: number }[];
  statusBreakdown: { status: string; count: number; amount: number }[];
  topCustomers: { name: string; total: number; invoiceCount: number }[];
  topProducts: { name: string; total: number }[];
  scatterData: { amount: number; dueDate: string | null }[];
  avgInvoiceValue: number;
  collectionRate: number;
  yoyGrowth: number;
}

export interface PurchasesMiniStats {
  monthlyExpenses: { month: string; expenses: number }[];
  statusBreakdown: { status: string; count: number; amount: number }[];
  topSuppliers: { name: string; total: number; billCount: number }[];
  topExpenseCategories: { name: string; total: number }[];
  avgBillValue: number;
  paymentRate: number;
  supplierCountTrend: number;
  upcomingPayables7d: number;
  upcomingPayables30d: number;
}

export interface DocumentsMiniStats {
  pendingCount: number;
  verifiedCount: number;
  flaggedCount: number;
  failedCount: number;
  totalCount: number;
  successRate: number;
  avgConfidence: number;
  oldestPendingDays: number;
  monthlyProcessed: { month: string; processed: number; failed: number }[];
  processingByMonth: { month: string; processed: number; failed: number }[];
  statusBreakdown: { status: string; count: number }[];
  documentsByType: { type: string; count: number }[];
  recentDocuments: { id: string; fileName: string; status: string; createdAt: string }[];
}

export interface InventoryMiniStats {
  typeBreakdown: { type: string; count: number; value: number }[];
  valueByCategory: { name: string; value: number }[];
  lowStockItems: { id?: string; name: string; sku: string | null; quantityOnHand: number; reorderLevel: number }[];
  topItemsByValue: { id?: string; name: string; sku: string | null; value: number }[];
  monthlyValue: { month: string; value: number }[];
  reorderAlerts: number;
  stockOutRisk: number;
  totalValue: number;
  turnover?: number;
}

export interface BankingMiniStats {
  totalBalance: number;
  accountCount: number;
  unreconciledCount: number;
  reconciliationRate: number;
  inVsOutThisMonth: { in: number; out: number };
  pendingAiMatches: number;
  monthlyCashFlow: { month: string; in: number; out: number; net: number }[];
  balanceTrend: { month: string; in: number; out: number; net: number }[];
  accountBalances: { name: string; balance: number }[];
  recentTransactions: { id: string; description: string; amount: number; type: string; date: string }[];
  largestTransactions: { id: string; description: string; amount: number; type: string; date: string }[];
  chartOfAccountsSummary?: {
    byAccount: { code: string; name: string; balance: number }[];
    total: number;
  };
}

export interface DashboardStats {
  sales: {
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    invoiceCount: number;
    customerCount: number;
  };
  purchases: {
    totalExpenses: number;
    totalPaid: number;
    totalOutstanding: number;
    billCount: number;
    supplierCount: number;
  };
  banking: {
    totalBalance: number;
    unreconciled: number;
  };
  vat: {
    totalOutputVat: number;
    totalInputVat: number;
    netPayable: number;
  };
  inventory: {
    totalProducts: number;
    totalValue: number;
    lowStock: number;
  };
}
