import {
  bills,
  billLines,
  suppliers,
  chartOfAccounts,
  items,
} from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const billsConfig: EntityConfig = {
  slug: "bills",
  label: "Bills",
  table: bills,
  idField: "id",
  orgScoped: true,
  computedFields: [
    "subtotal",
    "taxAmount",
    "total",
    "amountPaid",
    "amountDue",
  ],
  protectedFieldChecks: [
    { field: "isDemo", value: true, reason: "Demo record skipped" },
  ],
  foreignKeyLookups: [
    {
      field: "supplierId",
      lookupTable: suppliers,
      lookupField: "name",
      displayField: "name",
      orgScoped: true,
    },
  ],
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "billNumber", header: "Bill Number", type: "string", required: true, sample: "BILL-001" },
    { field: "supplierId", header: "Supplier", type: "string", required: true, sample: "Office Supplies Co" },
    { field: "issueDate", header: "Issue Date", type: "date", required: true, sample: "2025-03-01" },
    { field: "dueDate", header: "Due Date", type: "date", required: true, sample: "2025-03-31" },
    { field: "status", header: "Status", type: "string", sample: "draft" },
    { field: "currency", header: "Currency", type: "string", sample: "AED" },
    { field: "exchangeRate", header: "Exchange Rate", type: "number", sample: "1" },
    { field: "subtotal", header: "Subtotal", type: "number", exportOnly: true },
    { field: "taxAmount", header: "Tax Amount (Header)", type: "number", exportOnly: true },
    { field: "total", header: "Total", type: "number", exportOnly: true },
    { field: "amountPaid", header: "Amount Paid", type: "number", exportOnly: true },
    { field: "amountDue", header: "Amount Due", type: "number", exportOnly: true },
    { field: "notes", header: "Notes", type: "string" },
    { field: "terms", header: "Terms", type: "string" },
    { field: "paymentInfo", header: "Payment Info", type: "string" },
  ],
  childConfig: {
    childTable: billLines,
    parentFkField: "billId",
    childForeignKeyLookups: [
      {
        field: "accountId",
        lookupTable: chartOfAccounts,
        lookupField: "code",
        displayField: "code",
        orgScoped: true,
      },
      {
        field: "itemId",
        lookupTable: items,
        lookupField: "sku",
        displayField: "sku",
        orgScoped: true,
      },
    ],
    childColumns: [
      { field: "lineDescription", dbField: "description", header: "Line Description", type: "string", required: true, sample: "Office paper A4" },
      { field: "quantity", header: "Quantity", type: "number", sample: "10" },
      { field: "unitPrice", header: "Unit Price", type: "number", sample: "25.00" },
      { field: "lineAmount", dbField: "amount", header: "Line Amount", type: "number", exportOnly: true },
      { field: "taxCode", header: "Line Tax Code", type: "string", sample: "VAT5" },
      { field: "taxRate", header: "Line Tax Rate", type: "number", sample: "5" },
      { field: "lineTaxAmount", dbField: "taxAmount", header: "Line Tax Amount", type: "number", exportOnly: true },
      { field: "accountId", header: "Line Account Code", type: "string", sample: "5000" },
      { field: "itemId", header: "Line Item SKU", type: "string" },
    ],
  },
};
