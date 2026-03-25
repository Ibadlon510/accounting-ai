import type {
  PlaceholderDefinition,
  PlaceholderRegistry,
  PdfDocumentType,
} from "./types";

const companyPlaceholders: PlaceholderDefinition[] = [
  { key: "company.name", label: "Company Name", category: "company", description: "Organization registered name", sampleValue: "Agar Trading LLC", type: "string" },
  { key: "company.address", label: "Company Address", category: "company", description: "Organization address", sampleValue: "Office 301, Business Bay, Dubai, UAE", type: "string" },
  { key: "company.phone", label: "Company Phone", category: "company", description: "Organization phone number", sampleValue: "+971 4 123 4567", type: "string" },
  { key: "company.email", label: "Company Email", category: "company", description: "Organization email address", sampleValue: "info@agartrading.ae", type: "string" },
  { key: "company.logoUrl", label: "Company Logo URL", category: "company", description: "URL to the organization logo", sampleValue: "https://example.com/logo.png", type: "string" },
  { key: "company.taxRegistrationNumber", label: "TRN", category: "company", description: "Tax Registration Number", sampleValue: "100234567890003", type: "string" },
  { key: "company.currency", label: "Currency", category: "company", description: "Organization base currency", sampleValue: "AED", type: "string" },
];

const invoicePlaceholders: PlaceholderDefinition[] = [
  { key: "invoice.number", label: "Invoice Number", category: "invoice", description: "Invoice reference number", sampleValue: "INV-2026-001", type: "string" },
  { key: "invoice.issueDate", label: "Issue Date", category: "invoice", description: "Date the invoice was issued", sampleValue: "2026-03-15", type: "date" },
  { key: "invoice.dueDate", label: "Due Date", category: "invoice", description: "Payment due date", sampleValue: "2026-04-14", type: "date" },
  { key: "invoice.status", label: "Status", category: "invoice", description: "Invoice status", sampleValue: "sent", type: "string" },
  { key: "invoice.customerName", label: "Customer Name", category: "invoice", description: "Customer/client name", sampleValue: "Al Baraka Group", type: "string" },
  { key: "invoice.customerAddress", label: "Customer Address", category: "invoice", description: "Customer postal address", sampleValue: "PO Box 1234, Abu Dhabi, UAE", type: "string" },
  { key: "invoice.subtotal", label: "Subtotal", category: "invoice", description: "Total before tax", sampleValue: "10000.00", type: "number" },
  { key: "invoice.taxAmount", label: "VAT Amount", category: "invoice", description: "Total VAT", sampleValue: "500.00", type: "number" },
  { key: "invoice.total", label: "Total", category: "invoice", description: "Grand total with tax", sampleValue: "10500.00", type: "number" },
  { key: "invoice.amountPaid", label: "Amount Paid", category: "invoice", description: "Total payments received", sampleValue: "0.00", type: "number" },
  { key: "invoice.amountDue", label: "Balance Due", category: "invoice", description: "Remaining amount owed", sampleValue: "10500.00", type: "number" },
  { key: "invoice.notes", label: "Notes", category: "invoice", description: "Invoice notes/terms", sampleValue: "Payment due within 30 days", type: "string" },
];

const invoiceLinePlaceholders: PlaceholderDefinition[] = [
  { key: "line.description", label: "Description", category: "invoice_lines", description: "Line item description", sampleValue: "Consulting Services", type: "string" },
  { key: "line.quantity", label: "Quantity", category: "invoice_lines", description: "Line item quantity", sampleValue: "10", type: "number" },
  { key: "line.unitPrice", label: "Unit Price", category: "invoice_lines", description: "Price per unit", sampleValue: "1000.00", type: "number" },
  { key: "line.taxRate", label: "Tax Rate %", category: "invoice_lines", description: "VAT rate percentage", sampleValue: "5", type: "number" },
  { key: "line.taxAmount", label: "Tax Amount", category: "invoice_lines", description: "Line VAT amount", sampleValue: "50.00", type: "number" },
  { key: "line.amount", label: "Line Amount", category: "invoice_lines", description: "Line total (qty * price)", sampleValue: "1000.00", type: "number" },
];

const billPlaceholders: PlaceholderDefinition[] = [
  { key: "bill.number", label: "Bill Number", category: "bill", description: "Bill reference number", sampleValue: "BILL-2026-001", type: "string" },
  { key: "bill.issueDate", label: "Issue Date", category: "bill", description: "Date the bill was received", sampleValue: "2026-03-10", type: "date" },
  { key: "bill.dueDate", label: "Due Date", category: "bill", description: "Payment due date", sampleValue: "2026-04-09", type: "date" },
  { key: "bill.supplierName", label: "Supplier Name", category: "bill", description: "Supplier/vendor name", sampleValue: "Dubai Supplies Co.", type: "string" },
  { key: "bill.subtotal", label: "Subtotal", category: "bill", description: "Total before tax", sampleValue: "5000.00", type: "number" },
  { key: "bill.taxAmount", label: "VAT Amount", category: "bill", description: "Total VAT", sampleValue: "250.00", type: "number" },
  { key: "bill.total", label: "Total", category: "bill", description: "Grand total with tax", sampleValue: "5250.00", type: "number" },
  { key: "bill.amountDue", label: "Balance Due", category: "bill", description: "Remaining amount owed", sampleValue: "5250.00", type: "number" },
];

const statementPlaceholders: PlaceholderDefinition[] = [
  { key: "statement.customerName", label: "Customer Name", category: "statement", description: "Customer name on statement", sampleValue: "Al Baraka Group", type: "string" },
  { key: "statement.customerCity", label: "City", category: "statement", description: "Customer city", sampleValue: "Abu Dhabi", type: "string" },
  { key: "statement.customerCountry", label: "Country", category: "statement", description: "Customer country", sampleValue: "UAE", type: "string" },
  { key: "statement.totalInvoiced", label: "Total Invoiced", category: "statement", description: "Sum of all invoices", sampleValue: "50000.00", type: "number" },
  { key: "statement.totalCreditNotes", label: "Total Credit Notes", category: "statement", description: "Sum of all credit notes", sampleValue: "2000.00", type: "number" },
  { key: "statement.totalPaid", label: "Total Paid", category: "statement", description: "Sum of all payments", sampleValue: "35000.00", type: "number" },
  { key: "statement.balance", label: "Balance Due", category: "statement", description: "Outstanding balance", sampleValue: "13000.00", type: "number" },
];

const reportPlaceholders: PlaceholderDefinition[] = [
  { key: "report.title", label: "Report Title", category: "report", description: "Name of the report", sampleValue: "Profit & Loss Statement", type: "string" },
  { key: "report.periodFrom", label: "Period From", category: "report", description: "Report start date", sampleValue: "2026-01-01", type: "date" },
  { key: "report.periodTo", label: "Period To", category: "report", description: "Report end date", sampleValue: "2026-03-24", type: "date" },
  { key: "report.asOfDate", label: "As Of Date", category: "report", description: "Snapshot date for balance reports", sampleValue: "2026-03-24", type: "date" },
  { key: "report.generatedAt", label: "Generated At", category: "report", description: "When the report was generated", sampleValue: "March 24, 2026 at 2:30 PM", type: "string" },
];

const helperPlaceholders: PlaceholderDefinition[] = [
  { key: "currentDate", label: "Current Date", category: "helpers", description: "Today's date", sampleValue: "March 24, 2026", type: "date" },
  { key: "currentYear", label: "Current Year", category: "helpers", description: "Current year", sampleValue: "2026", type: "string" },
];

export const PLACEHOLDER_REGISTRY: PlaceholderDefinition[] = [
  ...companyPlaceholders,
  ...invoicePlaceholders,
  ...invoiceLinePlaceholders,
  ...billPlaceholders,
  ...statementPlaceholders,
  ...reportPlaceholders,
  ...helperPlaceholders,
];

const DOC_TYPE_CATEGORIES: Record<string, string[]> = {
  invoice: ["company", "invoice", "invoice_lines", "helpers"],
  bill: ["company", "bill", "invoice_lines", "helpers"],
  credit_note: ["company", "invoice", "invoice_lines", "helpers"],
  statement: ["company", "statement", "helpers"],
  profit_and_loss: ["company", "report", "helpers"],
  balance_sheet: ["company", "report", "helpers"],
  vat_audit: ["company", "report", "helpers"],
  inventory_valuation: ["company", "report", "helpers"],
};

export function getPlaceholdersForDocumentType(type: PdfDocumentType): PlaceholderDefinition[] {
  const cats = DOC_TYPE_CATEGORIES[type] ?? Object.keys(DOC_TYPE_CATEGORIES);
  return PLACEHOLDER_REGISTRY.filter((p) => cats.includes(p.category));
}

export function getPlaceholderRegistry(documentType?: string): PlaceholderRegistry {
  const grouped = new Map<string, PlaceholderDefinition[]>();
  const items = documentType
    ? getPlaceholdersForDocumentType(documentType as PdfDocumentType)
    : PLACEHOLDER_REGISTRY;

  for (const p of items) {
    const arr = grouped.get(p.category) ?? [];
    arr.push(p);
    grouped.set(p.category, arr);
  }

  const labelMap: Record<string, string> = {
    company: "Company",
    invoice: "Invoice",
    invoice_lines: "Invoice Lines",
    bill: "Bill",
    statement: "Statement",
    report: "Report",
    helpers: "Helpers",
  };

  const categories = Array.from(grouped.entries()).map(([id, placeholders]) => ({
    id,
    label: labelMap[id] ?? id,
    placeholders,
  }));

  return {
    categories,
    helpers: [
      { syntax: "{{formatCurrency value}}", description: "Formats number as currency with the org currency symbol" },
      { syntax: "{{formatDate value}}", description: "Formats ISO date string as a readable date" },
      { syntax: "{{#each array}}...{{/each}}", description: "Loop over array items (e.g., invoice lines)" },
      { syntax: "{{#if condition}}...{{/if}}", description: "Conditional rendering" },
      { syntax: "{{#unless condition}}...{{/unless}}", description: "Negative conditional rendering" },
    ],
  };
}

import {
  formatNumber as fmtNumber,
  formatDate as fmtDate,
} from "@/lib/formatting";

function formatCurrency(value: number | string, currency = "AED", numberFormat?: string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00";
  return `${currency} ${fmtNumber(num, numberFormat)}`;
}

function formatDate(value: string, dateFormat?: string): string {
  if (!value) return "";
  return fmtDate(value, dateFormat);
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export type InterpolateFormatting = {
  numberFormat?: string;
  dateFormat?: string;
};

export function interpolate(
  html: string,
  data: Record<string, unknown>,
  currency = "AED",
  formatting?: InterpolateFormatting,
): string {
  let result = html;

  result = result.replace(/\{\{formatCurrency\s+([^}]+)\}\}/g, (_match, path: string) => {
    const val = getNestedValue(data, path.trim());
    return formatCurrency(val as number, currency, formatting?.numberFormat);
  });

  result = result.replace(/\{\{formatDate\s+([^}]+)\}\}/g, (_match, path: string) => {
    const val = getNestedValue(data, path.trim());
    return formatDate(val as string, formatting?.dateFormat);
  });

  result = result.replace(
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, path: string, body: string) => {
      const arr = getNestedValue(data, path.trim());
      if (!Array.isArray(arr)) return "";
      return arr
        .map((item, index) => {
          let row = body;
          if (typeof item === "object" && item !== null) {
            for (const [k, v] of Object.entries(item)) {
              row = row.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v ?? ""));
              row = row.replace(
                new RegExp(`\\{\\{formatCurrency\\s+${k}\\}\\}`, "g"),
                formatCurrency(v as number, currency, formatting?.numberFormat)
              );
            }
          }
          row = row.replace(/\{\{@index\}\}/g, String(index));
          row = row.replace(/\{\{@number\}\}/g, String(index + 1));
          return row;
        })
        .join("");
    }
  );

  result = result.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, path: string, body: string) => {
      const val = getNestedValue(data, path.trim());
      return val ? body : "";
    }
  );

  result = result.replace(
    /\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_match, path: string, body: string) => {
      const val = getNestedValue(data, path.trim());
      return val ? "" : body;
    }
  );

  result = result.replace(/\{\{([^#/}][^}]*)\}\}/g, (_match, path: string) => {
    const val = getNestedValue(data, path.trim());
    if (val === undefined || val === null) return "";
    return String(val);
  });

  return result;
}

export function getSampleData(documentType: PdfDocumentType): Record<string, unknown> {
  const company = {
    name: "Agar Trading LLC",
    address: "Office 301, Business Bay Tower\nDubai, UAE",
    phone: "+971 4 123 4567",
    email: "info@agartrading.ae",
    logoUrl: "",
    taxRegistrationNumber: "100234567890003",
    currency: "AED",
  };

  const base = { company, currentDate: "March 24, 2026", currentYear: "2026" };

  switch (documentType) {
    case "invoice":
      return {
        ...base,
        invoice: {
          number: "INV-2026-001",
          issueDate: "2026-03-15",
          dueDate: "2026-04-14",
          status: "sent",
          customerName: "Al Baraka Group",
          customerAddress: "PO Box 1234, Abu Dhabi, UAE",
          subtotal: 10000,
          taxAmount: 500,
          total: 10500,
          amountPaid: 0,
          amountDue: 10500,
          notes: "Payment due within 30 days. Bank: Emirates NBD, Acc: 1234567890",
          lines: [
            { description: "Consulting Services - March 2026", quantity: 40, unitPrice: 200, taxRate: 5, taxAmount: 400, amount: 8000 },
            { description: "Software License Fee", quantity: 1, unitPrice: 2000, taxRate: 5, taxAmount: 100, amount: 2000 },
          ],
        },
      };
    case "credit_note":
      return {
        ...base,
        creditNote: {
          number: "CN-2026-001",
          type: "sales" as const,
          date: "2026-03-20",
          entityName: "Al Baraka Group",
          entityAddress: "PO Box 1234, Abu Dhabi, UAE",
          entityEmail: "accounts@albaraka.example",
          reason: "Product return — defective item",
          subtotal: 2000,
          taxAmount: 100,
          total: 2100,
          lines: [
            { description: "Return: Consulting Services - March 2026", quantity: 10, unitPrice: 200, taxRate: 5, taxAmount: 100, amount: 2000 },
          ],
        },
      };
    case "bill":
      return {
        ...base,
        bill: {
          number: "BILL-2026-001",
          issueDate: "2026-03-10",
          dueDate: "2026-04-09",
          status: "received",
          supplierName: "Dubai Supplies Co.",
          supplierAddress: "Warehouse 5, Jebel Ali, Dubai",
          subtotal: 5000,
          taxAmount: 250,
          total: 5250,
          amountPaid: 0,
          amountDue: 5250,
          lines: [
            { description: "Office Supplies", quantity: 100, unitPrice: 30, taxRate: 5, taxAmount: 150, amount: 3000 },
            { description: "Printer Cartridges", quantity: 10, unitPrice: 200, taxRate: 5, taxAmount: 100, amount: 2000 },
          ],
        },
      };
    case "statement":
      return {
        ...base,
        statement: {
          customerName: "Al Baraka Group",
          customerCity: "Abu Dhabi",
          customerCountry: "UAE",
          totalInvoiced: 50000,
          totalCreditNotes: 2000,
          totalPaid: 35000,
          totalRefunded: 0,
          balance: 13000,
          entries: [
            { date: "2026-01-15", type: "Invoice", ref: "INV-2026-001", debit: 10500, credit: 0 },
            { date: "2026-02-01", type: "Receipt", ref: "REC-001", debit: 0, credit: 10500 },
            { date: "2026-02-15", type: "Invoice", ref: "INV-2026-002", debit: 15750, credit: 0 },
            { date: "2026-03-01", type: "Credit Note", ref: "CN-001", debit: 0, credit: 2000 },
          ],
        },
      };
    case "profit_and_loss":
      return {
        ...base,
        report: { title: "Profit & Loss Statement", periodFrom: "2026-01-01", periodTo: "2026-03-24", generatedAt: "March 24, 2026 at 2:30 PM" },
        pnl: {
          revenue: [
            { code: "4000", name: "Sales Revenue", amount: 150000 },
            { code: "4100", name: "Service Revenue", amount: 45000 },
          ],
          expenses: [
            { code: "5000", name: "Cost of Goods Sold", amount: 80000 },
            { code: "6000", name: "Rent Expense", amount: 15000 },
            { code: "6100", name: "Salary Expense", amount: 35000 },
          ],
          totalRevenue: 195000,
          totalExpenses: 130000,
          netIncome: 65000,
        },
      };
    case "balance_sheet":
      return {
        ...base,
        report: { title: "Balance Sheet", asOfDate: "2026-03-24", generatedAt: "March 24, 2026 at 2:30 PM" },
        bs: {
          assets: [
            { code: "1000", name: "Cash & Bank", amount: 120000 },
            { code: "1100", name: "Accounts Receivable", amount: 45000 },
            { code: "1500", name: "Equipment", amount: 30000 },
          ],
          liabilities: [
            { code: "2000", name: "Accounts Payable", amount: 25000 },
            { code: "2100", name: "VAT Payable", amount: 5000 },
          ],
          equity: [
            { code: "3000", name: "Owner's Equity", amount: 100000 },
          ],
          totalAssets: 195000,
          totalLiabilities: 30000,
          totalEquity: 100000,
          retainedEarnings: 65000,
          isBalanced: true,
        },
      };
    case "vat_audit":
      return {
        ...base,
        report: { title: "VAT Audit Report", periodFrom: "2026-01-01", periodTo: "2026-03-31", generatedAt: "March 24, 2026 at 2:30 PM" },
        vat: {
          outputVAT: 7500,
          inputVAT: 4000,
          netPayable: 3500,
          outputCount: 15,
          inputCount: 8,
          transactions: [
            { date: "2026-01-15", type: "output", ref: "INV-2026-001", entity: "Al Baraka Group", taxable: 10000, vat: 500 },
            { date: "2026-02-01", type: "input", ref: "BILL-2026-001", entity: "Dubai Supplies", taxable: 5000, vat: 250 },
          ],
        },
      };
    case "inventory_valuation":
      return {
        ...base,
        report: { title: "Inventory Valuation", asOfDate: "2026-03-24", generatedAt: "March 24, 2026 at 2:30 PM" },
        inventory: {
          items: [
            { sku: "SKU-001", name: "Premium Widget A", quantityOnHand: 150, unitOfMeasure: "pcs", costPrice: 25, totalValue: 3750 },
            { sku: "SKU-002", name: "Standard Widget B", quantityOnHand: 300, unitOfMeasure: "pcs", costPrice: 12, totalValue: 3600 },
            { sku: "SKU-003", name: "Economy Widget C", quantityOnHand: 500, unitOfMeasure: "pcs", costPrice: 8, totalValue: 4000 },
          ],
          totalValue: 11350,
          totalUnits: 950,
          productCount: 3,
        },
      };
    default:
      return base;
  }
}
