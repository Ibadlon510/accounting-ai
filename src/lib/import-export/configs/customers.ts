import { customers } from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const customersConfig: EntityConfig = {
  slug: "customers",
  label: "Customers",
  table: customers,
  idField: "id",
  orgScoped: true,
  protectedFieldChecks: [
    { field: "isDemo", value: true, reason: "Demo record skipped" },
  ],
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "name", header: "Name", type: "string", required: true, sample: "Acme Corp" },
    { field: "email", header: "Email", type: "string", sample: "contact@acme.com" },
    { field: "phone", header: "Phone", type: "string", sample: "+971501234567" },
    { field: "taxNumber", header: "Tax Number", type: "string", sample: "100123456700003" },
    { field: "address", header: "Address", type: "string", sample: "123 Business Bay" },
    { field: "city", header: "City", type: "string", sample: "Dubai" },
    { field: "country", header: "Country", type: "string", sample: "UAE" },
    { field: "currency", header: "Currency", type: "string", sample: "AED" },
    { field: "creditLimit", header: "Credit Limit", type: "number", sample: "50000.00" },
    { field: "paymentTermsDays", header: "Payment Terms (Days)", type: "integer", sample: "30" },
    { field: "isActive", header: "Active", type: "boolean", sample: "true" },
    { field: "notes", header: "Notes", type: "string" },
  ],
};
