import type { AccountCategory, NormalBalance } from "@/types/accounting";

// Standard account types used across all organizations
export const ACCOUNT_TYPES = [
  { name: "Current Assets", category: "asset" as AccountCategory, normalBalance: "debit" as NormalBalance, displayOrder: 1 },
  { name: "Non-Current Assets", category: "asset" as AccountCategory, normalBalance: "debit" as NormalBalance, displayOrder: 2 },
  { name: "Current Liabilities", category: "liability" as AccountCategory, normalBalance: "credit" as NormalBalance, displayOrder: 3 },
  { name: "Non-Current Liabilities", category: "liability" as AccountCategory, normalBalance: "credit" as NormalBalance, displayOrder: 4 },
  { name: "Equity", category: "equity" as AccountCategory, normalBalance: "credit" as NormalBalance, displayOrder: 5 },
  { name: "Revenue", category: "revenue" as AccountCategory, normalBalance: "credit" as NormalBalance, displayOrder: 6 },
  { name: "Cost of Goods Sold", category: "expense" as AccountCategory, normalBalance: "debit" as NormalBalance, displayOrder: 7 },
  { name: "Operating Expenses", category: "expense" as AccountCategory, normalBalance: "debit" as NormalBalance, displayOrder: 8 },
  { name: "Other Income", category: "revenue" as AccountCategory, normalBalance: "credit" as NormalBalance, displayOrder: 9 },
  { name: "Other Expenses", category: "expense" as AccountCategory, normalBalance: "debit" as NormalBalance, displayOrder: 10 },
];

// UAE-specific Chart of Accounts template
// Codes follow standard numbering: 1xxx=Assets, 2xxx=Liabilities, 3xxx=Equity, 4xxx=Revenue, 5xxx=COGS, 6xxx=Expenses
export interface ChartOfAccountsSeed {
  code: string;
  name: string;
  typeName: string; // maps to ACCOUNT_TYPES.name
  isSystem: boolean;
  taxCode?: string;
}

export const UAE_CHART_OF_ACCOUNTS: ChartOfAccountsSeed[] = [
  // ── CURRENT ASSETS (1000-1499) ──
  { code: "1000", name: "Cash and Cash Equivalents", typeName: "Current Assets", isSystem: true },
  { code: "1010", name: "Cash in Hand", typeName: "Current Assets", isSystem: true },
  { code: "1020", name: "Petty Cash", typeName: "Current Assets", isSystem: false },
  { code: "1100", name: "Bank Accounts", typeName: "Current Assets", isSystem: true },
  { code: "1110", name: "Main Bank Account (AED)", typeName: "Current Assets", isSystem: false },
  { code: "1120", name: "USD Bank Account", typeName: "Current Assets", isSystem: false },
  { code: "1200", name: "Accounts Receivable", typeName: "Current Assets", isSystem: true },
  { code: "1210", name: "Trade Receivables", typeName: "Current Assets", isSystem: true },
  { code: "1220", name: "Other Receivables", typeName: "Current Assets", isSystem: false },
  { code: "1300", name: "Inventory", typeName: "Current Assets", isSystem: true },
  { code: "1310", name: "Finished Goods", typeName: "Current Assets", isSystem: false },
  { code: "1320", name: "Raw Materials", typeName: "Current Assets", isSystem: false },
  { code: "1400", name: "Prepaid Expenses", typeName: "Current Assets", isSystem: false },
  { code: "1410", name: "Prepaid Rent", typeName: "Current Assets", isSystem: false },
  { code: "1420", name: "Prepaid Insurance", typeName: "Current Assets", isSystem: false },
  { code: "1450", name: "VAT Input (Recoverable)", typeName: "Current Assets", isSystem: true, taxCode: "VAT_INPUT" },

  // ── NON-CURRENT ASSETS (1500-1999) ──
  { code: "1500", name: "Property, Plant & Equipment", typeName: "Non-Current Assets", isSystem: false },
  { code: "1510", name: "Furniture & Fixtures", typeName: "Non-Current Assets", isSystem: false },
  { code: "1520", name: "Office Equipment", typeName: "Non-Current Assets", isSystem: false },
  { code: "1530", name: "Vehicles", typeName: "Non-Current Assets", isSystem: false },
  { code: "1540", name: "Computer Equipment", typeName: "Non-Current Assets", isSystem: false },
  { code: "1600", name: "Accumulated Depreciation", typeName: "Non-Current Assets", isSystem: false },
  { code: "1700", name: "Intangible Assets", typeName: "Non-Current Assets", isSystem: false },
  { code: "1710", name: "Software Licenses", typeName: "Non-Current Assets", isSystem: false },
  { code: "1800", name: "Security Deposits", typeName: "Non-Current Assets", isSystem: false },

  // ── CURRENT LIABILITIES (2000-2499) ──
  { code: "2000", name: "Accounts Payable", typeName: "Current Liabilities", isSystem: true },
  { code: "2010", name: "Trade Payables", typeName: "Current Liabilities", isSystem: true },
  { code: "2020", name: "Other Payables", typeName: "Current Liabilities", isSystem: false },
  { code: "2100", name: "Accrued Expenses", typeName: "Current Liabilities", isSystem: false },
  { code: "2110", name: "Accrued Salaries", typeName: "Current Liabilities", isSystem: false },
  { code: "2120", name: "Accrued Rent", typeName: "Current Liabilities", isSystem: false },
  { code: "2200", name: "VAT Payable", typeName: "Current Liabilities", isSystem: true, taxCode: "VAT_OUTPUT" },
  { code: "2210", name: "VAT Output", typeName: "Current Liabilities", isSystem: true, taxCode: "VAT_OUTPUT" },
  { code: "2300", name: "End of Service Benefits (Current)", typeName: "Current Liabilities", isSystem: false },
  { code: "2400", name: "Short-term Loans", typeName: "Current Liabilities", isSystem: false },

  // ── NON-CURRENT LIABILITIES (2500-2999) ──
  { code: "2500", name: "Long-term Loans", typeName: "Non-Current Liabilities", isSystem: false },
  { code: "2600", name: "End of Service Benefits (Long-term)", typeName: "Non-Current Liabilities", isSystem: false },

  // ── EQUITY (3000-3999) ──
  { code: "3000", name: "Owner's Equity", typeName: "Equity", isSystem: true },
  { code: "3010", name: "Share Capital", typeName: "Equity", isSystem: true },
  { code: "3020", name: "Owner's Drawings", typeName: "Equity", isSystem: false },
  { code: "3100", name: "Retained Earnings", typeName: "Equity", isSystem: true },
  { code: "3200", name: "Current Year Earnings", typeName: "Equity", isSystem: true },

  // ── REVENUE (4000-4999) ──
  { code: "4000", name: "Sales Revenue", typeName: "Revenue", isSystem: true },
  { code: "4010", name: "Product Sales", typeName: "Revenue", isSystem: false },
  { code: "4020", name: "Service Revenue", typeName: "Revenue", isSystem: false },
  { code: "4100", name: "Sales Returns & Allowances", typeName: "Revenue", isSystem: false },
  { code: "4200", name: "Sales Discounts", typeName: "Revenue", isSystem: false },
  { code: "4900", name: "Other Income", typeName: "Other Income", isSystem: false },
  { code: "4910", name: "Interest Income", typeName: "Other Income", isSystem: false },
  { code: "4920", name: "Foreign Exchange Gain", typeName: "Other Income", isSystem: false },

  // ── COST OF GOODS SOLD (5000-5999) ──
  { code: "5000", name: "Cost of Goods Sold", typeName: "Cost of Goods Sold", isSystem: true },
  { code: "5010", name: "Purchase Cost", typeName: "Cost of Goods Sold", isSystem: false },
  { code: "5020", name: "Freight In", typeName: "Cost of Goods Sold", isSystem: false },
  { code: "5030", name: "Purchase Returns", typeName: "Cost of Goods Sold", isSystem: false },
  { code: "5040", name: "Purchase Discounts", typeName: "Cost of Goods Sold", isSystem: false },
  { code: "5100", name: "Inventory Adjustments", typeName: "Cost of Goods Sold", isSystem: false },

  // ── OPERATING EXPENSES (6000-6999) ──
  { code: "6000", name: "Salaries & Wages", typeName: "Operating Expenses", isSystem: false },
  { code: "6010", name: "Basic Salaries", typeName: "Operating Expenses", isSystem: false },
  { code: "6020", name: "Housing Allowance", typeName: "Operating Expenses", isSystem: false },
  { code: "6030", name: "Transport Allowance", typeName: "Operating Expenses", isSystem: false },
  { code: "6040", name: "End of Service Provision", typeName: "Operating Expenses", isSystem: false },
  { code: "6100", name: "Rent Expense", typeName: "Operating Expenses", isSystem: false },
  { code: "6110", name: "Office Rent", typeName: "Operating Expenses", isSystem: false },
  { code: "6120", name: "Warehouse Rent", typeName: "Operating Expenses", isSystem: false },
  { code: "6200", name: "Utilities", typeName: "Operating Expenses", isSystem: false },
  { code: "6210", name: "Electricity (DEWA/SEWA/FEWA)", typeName: "Operating Expenses", isSystem: false },
  { code: "6220", name: "Water", typeName: "Operating Expenses", isSystem: false },
  { code: "6230", name: "Telephone & Internet", typeName: "Operating Expenses", isSystem: false },
  { code: "6300", name: "Office Supplies", typeName: "Operating Expenses", isSystem: false },
  { code: "6400", name: "Travel & Entertainment", typeName: "Operating Expenses", isSystem: false },
  { code: "6500", name: "Professional Fees", typeName: "Operating Expenses", isSystem: false },
  { code: "6510", name: "Legal Fees", typeName: "Operating Expenses", isSystem: false },
  { code: "6520", name: "Audit Fees", typeName: "Operating Expenses", isSystem: false },
  { code: "6530", name: "Consultancy Fees", typeName: "Operating Expenses", isSystem: false },
  { code: "6600", name: "Insurance Expense", typeName: "Operating Expenses", isSystem: false },
  { code: "6700", name: "Depreciation Expense", typeName: "Operating Expenses", isSystem: false },
  { code: "6800", name: "Government Fees & Licenses", typeName: "Operating Expenses", isSystem: false },
  { code: "6810", name: "Trade License Renewal", typeName: "Operating Expenses", isSystem: false },
  { code: "6820", name: "Visa & Labour Fees", typeName: "Operating Expenses", isSystem: false },
  { code: "6900", name: "Marketing & Advertising", typeName: "Operating Expenses", isSystem: false },
  { code: "6950", name: "Bank Charges", typeName: "Operating Expenses", isSystem: false },

  // ── OTHER EXPENSES (7000-7999) ──
  { code: "7000", name: "Other Expenses", typeName: "Other Expenses", isSystem: false },
  { code: "7010", name: "Foreign Exchange Loss", typeName: "Other Expenses", isSystem: false },
  { code: "7020", name: "Penalties & Fines", typeName: "Other Expenses", isSystem: false },
];
