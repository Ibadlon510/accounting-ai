import type { EntityConfig } from "../types";
import { chartOfAccountsConfig } from "./chart-of-accounts";
import { customersConfig } from "./customers";
import { suppliersConfig } from "./suppliers";
import { itemsConfig } from "./items";
import { taxCodesConfig } from "./tax-codes";
import { employeesConfig } from "./employees";
import { bankTransactionsConfig } from "./bank-transactions";
import { invoicesConfig } from "./invoices";
import { billsConfig } from "./bills";
import { journalEntriesConfig } from "./journal-entries";

const registry: Record<string, EntityConfig> = {
  "chart-of-accounts": chartOfAccountsConfig,
  customers: customersConfig,
  suppliers: suppliersConfig,
  items: itemsConfig,
  "tax-codes": taxCodesConfig,
  employees: employeesConfig,
  "bank-transactions": bankTransactionsConfig,
  invoices: invoicesConfig,
  bills: billsConfig,
  "journal-entries": journalEntriesConfig,
};

export function getEntityConfig(slug: string): EntityConfig | null {
  return registry[slug] ?? null;
}

export function getAllEntitySlugs(): string[] {
  return Object.keys(registry);
}

export { registry };
