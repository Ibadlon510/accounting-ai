import { taxCodes } from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const taxCodesConfig: EntityConfig = {
  slug: "tax-codes",
  label: "Tax Codes",
  table: taxCodes,
  idField: "id",
  orgScoped: true,
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "code", header: "Code", type: "string", required: true, sample: "VAT5" },
    { field: "name", header: "Name", type: "string", required: true, sample: "Standard VAT 5%" },
    { field: "rate", header: "Rate", type: "number", required: true, sample: "5.00" },
    { field: "type", header: "Type", type: "string", required: true, sample: "output" },
    { field: "isActive", header: "Active", type: "boolean", sample: "true" },
  ],
};
