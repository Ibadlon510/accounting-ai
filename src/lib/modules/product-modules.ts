/**
 * Post-MVP product module cards (Coming soon grid).
 * Flip `ready` to unlock a card once its module ships.
 * Payments Collection (ACC-16) is unlocked on this branch.
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
    description:
      "Staff submit expenses, managers approve, the ledger records the reimbursement.",
    tags: ["Claims", "Approvals", "Reimbursements"],
    note: "Ledger postings are reverse-only (immutable journals).",
    status: "coming_soon",
  },
  {
    id: "budgets",
    title: "Budgets",
    description: "Set budgets per account and period, and report variance against them.",
    tags: ["Budget lines", "Variance reporting"],
    status: "coming_soon",
  },
  {
    id: "projects",
    title: "Projects & Costing",
    description: "Track income and cost by project or cost centre.",
    tags: ["Projects", "Project profit and loss"],
    status: "coming_soon",
  },
  {
    id: "payroll-full",
    title: "Payroll & WPS",
    description:
      "Salaries, end-of-service provision and the journals they produce.",
    tags: ["Pay runs", "Gratuity provision", "WPS file"],
    note: "Ledger postings are reverse-only (immutable journals).",
    status: "coming_soon",
  },
  {
    id: "client-portal",
    title: "Client Portal",
    description: "Let customers see their statement and invoices without an account here.",
    tags: ["Customer statement", "Invoice viewing"],
    status: "coming_soon",
  },
  {
    id: "payment-links",
    title: "Payments Collection",
    description: "Add payment links to invoices and reconcile what settles.",
    tags: ["Payment links", "Settlement matching"],
    note: "Ledger postings reverse-only.",
    status: "ready",
    href: "/payment-links",
  },
  {
    id: "inventory-advanced",
    title: "Inventory",
    description: "Stock movements, COGS journals, and valuation on sale and purchase.",
    tags: ["Stock", "COGS", "Valuation"],
    status: "coming_soon",
  },
];
