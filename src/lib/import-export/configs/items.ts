import { items, chartOfAccounts } from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const itemsConfig: EntityConfig = {
  slug: "items",
  label: "Items",
  table: items,
  idField: "id",
  orgScoped: true,
  computedFields: ["quantityOnHand"],
  protectedFieldChecks: [
    { field: "isDemo", value: true, reason: "Demo record skipped" },
  ],
  foreignKeyLookups: [
    {
      field: "salesAccountId",
      lookupTable: chartOfAccounts,
      lookupField: "code",
      displayField: "code",
      orgScoped: true,
    },
    {
      field: "purchaseAccountId",
      lookupTable: chartOfAccounts,
      lookupField: "code",
      displayField: "code",
      orgScoped: true,
    },
    {
      field: "inventoryAccountId",
      lookupTable: chartOfAccounts,
      lookupField: "code",
      displayField: "code",
      orgScoped: true,
    },
  ],
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "name", header: "Name", type: "string", required: true, sample: "Widget A" },
    { field: "sku", header: "SKU", type: "string", sample: "WDG-001" },
    { field: "description", header: "Description", type: "string", sample: "Standard widget" },
    { field: "type", header: "Type", type: "string", sample: "product" },
    { field: "unitOfMeasure", header: "Unit of Measure", type: "string", sample: "pcs" },
    { field: "salesPrice", header: "Sales Price", type: "number", sample: "100.00" },
    { field: "purchasePrice", header: "Purchase Price", type: "number", sample: "60.00" },
    { field: "costPrice", header: "Cost Price", type: "number", sample: "60.00" },
    { field: "taxCode", header: "Tax Code", type: "string", sample: "VAT5" },
    { field: "salesAccountId", header: "Sales Account Code", type: "string", sample: "4000" },
    { field: "purchaseAccountId", header: "Purchase Account Code", type: "string", sample: "5000" },
    { field: "inventoryAccountId", header: "Inventory Account Code", type: "string", sample: "1300" },
    { field: "trackInventory", header: "Track Inventory", type: "boolean", sample: "true" },
    { field: "quantityOnHand", header: "Quantity on Hand", type: "number", exportOnly: true },
    { field: "reorderLevel", header: "Reorder Level", type: "number", sample: "10" },
    { field: "isActive", header: "Active", type: "boolean", sample: "true" },
  ],
};
