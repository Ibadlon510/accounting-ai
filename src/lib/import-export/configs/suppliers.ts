import { suppliers } from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const suppliersConfig: EntityConfig = {
  slug: "suppliers",
  label: "Suppliers",
  table: suppliers,
  idField: "id",
  orgScoped: true,
  protectedFieldChecks: [
    { field: "isDemo", value: true, reason: "Demo record skipped" },
  ],
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "name", header: "Name", type: "string", required: true, sample: "Office Supplies Co" },
    { field: "email", header: "Email", type: "string", sample: "info@officesupplies.com" },
    { field: "phone", header: "Phone", type: "string", sample: "+971501234567" },
    { field: "taxNumber", header: "Tax Number", type: "string", sample: "100987654300003" },
    { field: "address", header: "Address", type: "string", sample: "456 Industrial Area" },
    { field: "city", header: "City", type: "string", sample: "Abu Dhabi" },
    { field: "country", header: "Country", type: "string", sample: "UAE" },
    { field: "currency", header: "Currency", type: "string", sample: "AED" },
    { field: "paymentTermsDays", header: "Payment Terms (Days)", type: "integer", sample: "30" },
    { field: "isActive", header: "Active", type: "boolean", sample: "true" },
    { field: "notes", header: "Notes", type: "string" },
  ],
};
