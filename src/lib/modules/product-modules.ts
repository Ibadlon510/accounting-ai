/**
 * Post-MVP product module cards (Coming soon grid).
 * Flip `ready` to unlock a card once its module ships.
 * Consolidation (ACC-18) is unlocked on this branch.
 */
export type ProductModuleStatus = "ready" | "coming_soon";

export type ProductModuleCard = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  note?: string;
  status: ProductModuleStatus;
  href?: string;
};

export const PRODUCT_MODULES: ProductModuleCard[] = [
  {
    id: "fixed-assets",
    title: "Fixed Assets",
    description: "Asset register with depreciation schedules and disposals.",
    tags: ["Asset register", "Depreciation runs", "Disposals"],
    status: "coming_soon",
  },
  {
    id: "expense-claims",
    title: "Expense Claims",
    description: "Staff claims, manager approvals, and reimbursement journals.",
    tags: ["Claims", "Approvals", "Reimbursements"],
    status: "coming_soon",
  },
  {
    id: "budgets",
    title: "Budgets",
    description: "Budget lines per account and period with variance reporting.",
    tags: ["Budget lines", "Periods", "Variance"],
    status: "coming_soon",
  },
  {
    id: "projects",
    title: "Projects & Costing",
    description: "Projects and cost centres with income, cost tracking, and project P&L.",
    tags: ["Projects", "Cost centres", "Project P&L"],
    status: "coming_soon",
  },
  {
    id: "payroll-full",
    title: "Payroll & WPS",
    description: "Full pay runs, gratuity provision, and WPS file export.",
    tags: ["Pay runs", "Gratuity", "WPS"],
    status: "coming_soon",
  },
  {
    id: "client-portal",
    title: "Client Portal",
    description: "Customer-facing statements and invoices without a full account.",
    tags: ["Statements", "Invoices", "Portal"],
    status: "coming_soon",
  },
  {
    id: "payment-links",
    title: "Payment Links",
    description: "Invoice payment links with settlement matching to the ledger.",
    tags: ["Payment links", "Settlement", "Invoices"],
    status: "coming_soon",
  },
  {
    id: "inventory-advanced",
    title: "Inventory",
    description: "Stock movements, COGS journals, and valuation on sale and purchase.",
    tags: ["Stock", "COGS", "Valuation"],
    status: "coming_soon",
  },
  {
    id: "consolidation",
    title: "Consolidation",
    description: "Combine several companies into one set of group figures.",
    tags: ["Group figures", "Multi-company", "Consolidated reports"],
    note: "MVP sums posted journals by account code/name. Intercompany eliminations are stubbed.",
    status: "ready",
    href: "/consolidation",
  },
];
