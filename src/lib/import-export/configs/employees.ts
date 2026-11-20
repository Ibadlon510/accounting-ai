import { employees } from "@/lib/db/schema";
import type { EntityConfig } from "../types";

export const employeesConfig: EntityConfig = {
  slug: "employees",
  label: "Employees",
  table: employees,
  idField: "id",
  orgScoped: true,
  columns: [
    { field: "id", header: "ID", type: "string" },
    { field: "employeeNumber", header: "Employee Number", type: "string", sample: "EMP-001" },
    { field: "name", header: "Name", type: "string", required: true, sample: "John Smith" },
    { field: "email", header: "Email", type: "string", sample: "john@company.com" },
    { field: "phone", header: "Phone", type: "string", sample: "+971501234567" },
    { field: "position", header: "Position", type: "string", sample: "Accountant" },
    { field: "department", header: "Department", type: "string", sample: "Finance" },
    { field: "joinDate", header: "Join Date", type: "date", sample: "2025-01-15" },
    { field: "basicSalary", header: "Basic Salary", type: "number", sample: "10000.00" },
    { field: "housingAllowance", header: "Housing Allowance", type: "number", sample: "3000.00" },
    { field: "transportAllowance", header: "Transport Allowance", type: "number", sample: "1500.00" },
    { field: "labourCardNumber", header: "Labour Card Number", type: "string", sample: "784-1990-1234567-1" },
    { field: "iban", header: "IBAN", type: "string", sample: "AE070331234567890123456" },
    { field: "bankRoutingCode", header: "Bank Routing Code", type: "string", sample: "403510101" },
    { field: "isActive", header: "Active", type: "boolean", sample: "true" },
  ],
};
