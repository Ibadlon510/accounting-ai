import { db } from "@/lib/db";
import { accountTypes, chartOfAccounts } from "@/lib/db/schema";
import {
  ACCOUNT_TYPES,
  UAE_CHART_OF_ACCOUNTS,
} from "@/lib/accounting/uae-chart-of-accounts";
import { eq } from "drizzle-orm";

/**
 * Ensures the global account_types table is populated.
 * Returns a map of typeName → typeId for linking chart_of_accounts rows.
 */
async function ensureAccountTypes(): Promise<Map<string, string>> {
  const existing = await db.select().from(accountTypes);

  if (existing.length >= ACCOUNT_TYPES.length) {
    return new Map(existing.map((t) => [t.name, t.id]));
  }

  const existingNames = new Set(existing.map((t) => t.name));
  const toInsert = ACCOUNT_TYPES.filter((t) => !existingNames.has(t.name));

  if (toInsert.length > 0) {
    await db.insert(accountTypes).values(
      toInsert.map((t) => ({
        name: t.name,
        category: t.category,
        normalBalance: t.normalBalance,
        displayOrder: t.displayOrder,
      }))
    );
  }

  const all = await db.select().from(accountTypes);
  return new Map(all.map((t) => [t.name, t.id]));
}

/**
 * Seeds the chart_of_accounts for a given organization using the UAE template.
 * Skips if the org already has accounts.
 */
export async function seedChartOfAccounts(organizationId: string): Promise<void> {
  const existingAccounts = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.organizationId, organizationId))
    .limit(1);

  if (existingAccounts.length > 0) {
    return; // Already seeded
  }

  const typeMap = await ensureAccountTypes();

  const rows = UAE_CHART_OF_ACCOUNTS.map((a) => {
    const typeId = typeMap.get(a.typeName);
    if (!typeId) {
      throw new Error(`Account type "${a.typeName}" not found in account_types table`);
    }
    return {
      organizationId,
      accountTypeId: typeId,
      code: a.code,
      name: a.name,
      isSystem: a.isSystem,
      taxCode: a.taxCode ?? null,
    };
  });

  await db.insert(chartOfAccounts).values(rows);
}
