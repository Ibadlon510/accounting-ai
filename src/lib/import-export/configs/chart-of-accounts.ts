import { chartOfAccounts, accountTypes } from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const chartOfAccountsConfig: EntityConfig = {
  slug: "chart-of-accounts",
  label: "Chart of Accounts",
  table: chartOfAccounts,
  idField: "id",
  orgScoped: true,
  selfReferentialField: "parentId",
  protectedFieldChecks: [
    { field: "isSystem", value: true, reason: "System account cannot be modified via import" },
  ],
  foreignKeyLookups: [
    {
      field: "accountTypeId",
      lookupTable: accountTypes,
      lookupField: "name",
      displayField: "name",
      orgScoped: false,
    },
  ],
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "code", header: "Account Code", type: "string", required: true, sample: "1100" },
    { field: "name", header: "Account Name", type: "string", required: true, sample: "Cash in Hand" },
    { field: "accountTypeId", header: "Account Type", type: "string", required: true, sample: "Current Assets" },
    { field: "description", header: "Description", type: "string", sample: "Main cash account" },
    { field: "parentId", header: "Parent Account ID", type: "string" },
    { field: "isActive", header: "Active", type: "boolean", sample: "true" },
    { field: "isSystem", header: "System Account", type: "boolean", exportOnly: true },
    { field: "taxCode", header: "Tax Code", type: "string", sample: "VAT5" },
    { field: "currency", header: "Currency", type: "string", sample: "AED" },
  ],
};
