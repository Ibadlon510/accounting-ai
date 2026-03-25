import { bankTransactions, bankAccounts } from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const bankTransactionsConfig: EntityConfig = {
  slug: "bank-transactions",
  label: "Bank Transactions",
  table: bankTransactions,
  idField: "id",
  orgScoped: true,
  computedFields: ["confidence"],
  protectedFieldChecks: [
    { field: "isDemo", value: true, reason: "Demo record skipped" },
  ],
  foreignKeyLookups: [
    {
      field: "bankAccountId",
      lookupTable: bankAccounts,
      lookupField: "accountName",
      displayField: "accountName",
      orgScoped: true,
    },
  ],
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "bankAccountId", header: "Bank Account", type: "string", required: true, sample: "Main Business Account" },
    { field: "transactionDate", header: "Date", type: "date", required: true, sample: "2025-03-15" },
    { field: "description", header: "Description", type: "string", required: true, sample: "Office rent payment" },
    { field: "amount", header: "Amount", type: "number", required: true, sample: "5000.00" },
    { field: "type", header: "Type", type: "string", required: true, sample: "debit" },
    { field: "reference", header: "Reference", type: "string", sample: "REF-001" },
    { field: "category", header: "Category", type: "string", sample: "Rent" },
    { field: "confidence", header: "Confidence", type: "number", exportOnly: true },
    { field: "isReconciled", header: "Reconciled", type: "boolean", sample: "false" },
  ],
};
