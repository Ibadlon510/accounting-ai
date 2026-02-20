import { formatNumber } from "@/lib/accounting/engine";

export interface ReportRow {
  label: string;
  amount: number;
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
}

export function getProfitAndLoss(): { rows: ReportRow[]; netIncome: number } {
  const rows: ReportRow[] = [
    { label: "Revenue", amount: 0, isHeader: true },
    { label: "Product Sales", amount: 0, indent: 1 },
    { label: "Service Revenue", amount: 230000, indent: 1 },
    { label: "Total Revenue", amount: 230000, isTotal: true },

    { label: "Cost of Goods Sold", amount: 0, isHeader: true },
    { label: "Purchase Cost", amount: 0, indent: 1 },
    { label: "Freight In", amount: 0, indent: 1 },
    { label: "Total COGS", amount: 0, isTotal: true },

    { label: "Gross Profit", amount: 230000, isTotal: true },

    { label: "Operating Expenses", amount: 0, isHeader: true },
    { label: "Basic Salaries", amount: 35000, indent: 1 },
    { label: "Housing Allowance", amount: 7000, indent: 1 },
    { label: "Transport Allowance", amount: 3000, indent: 1 },
    { label: "Office Rent", amount: 15000, indent: 1 },
    { label: "Electricity (DEWA)", amount: 3200, indent: 1 },
    { label: "Water", amount: 800, indent: 1 },
    { label: "Telephone & Internet", amount: 2000, indent: 1 },
    { label: "Office Supplies", amount: 1250, indent: 1 },
    { label: "Total Operating Expenses", amount: 67250, isTotal: true },

    { label: "Operating Income", amount: 162750, isTotal: true },

    { label: "Other Income", amount: 0, isHeader: true },
    { label: "Interest Income", amount: 0, indent: 1 },
    { label: "Total Other Income", amount: 0, isTotal: true },

    { label: "Other Expenses", amount: 0, isHeader: true },
    { label: "Bank Charges", amount: 150, indent: 1 },
    { label: "Total Other Expenses", amount: 150, isTotal: true },
  ];

  const netIncome = 162750 - 150;

  return { rows, netIncome };
}

export function getBalanceSheet(): { assets: ReportRow[]; liabilities: ReportRow[]; equity: ReportRow[]; totalAssets: number; totalLiabilitiesEquity: number } {
  const assets: ReportRow[] = [
    { label: "Current Assets", amount: 0, isHeader: true },
    { label: "Main Bank Account (AED)", amount: 482000, indent: 1 },
    { label: "Trade Receivables", amount: 462750, indent: 1 },
    { label: "VAT Input (Recoverable)", amount: 1890, indent: 1 },
    { label: "Prepaid Expenses", amount: 0, indent: 1 },
    { label: "Total Current Assets", amount: 946640, isTotal: true },

    { label: "Non-Current Assets", amount: 0, isHeader: true },
    { label: "Office Equipment", amount: 10000, indent: 1 },
    { label: "Total Non-Current Assets", amount: 10000, isTotal: true },

    { label: "Total Assets", amount: 956640, isTotal: true },
  ];

  const liabilities: ReportRow[] = [
    { label: "Current Liabilities", amount: 0, isHeader: true },
    { label: "Trade Payables", amount: 23100, indent: 1 },
    { label: "VAT Output", amount: 11500, indent: 1 },
    { label: "Accrued Expenses", amount: 0, indent: 1 },
    { label: "Total Current Liabilities", amount: 34600, isTotal: true },

    { label: "Total Liabilities", amount: 34600, isTotal: true },
  ];

  const equity: ReportRow[] = [
    { label: "Equity", amount: 0, isHeader: true },
    { label: "Share Capital", amount: 500000, indent: 1 },
    { label: "Retained Earnings", amount: 259440, indent: 1 },
    { label: "Current Year Earnings", amount: 162600, indent: 1 },
    { label: "Total Equity", amount: 922040, isTotal: true },

    { label: "Total Liabilities & Equity", amount: 956640, isTotal: true },
  ];

  return { assets, liabilities, equity, totalAssets: 956640, totalLiabilitiesEquity: 956640 };
}
