import { db } from "@/lib/db";
import { chartOfAccounts } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

/** UAE CoA codes used by Fixed Assets (seed-aligned). */
export const FA_ACCOUNT_CODES = {
  ppe: "1500",
  furniture: "1510",
  officeEquipment: "1520",
  vehicles: "1530",
  computers: "1540",
  accumDep: "1600",
  depExpense: "6700",
  bank: "1110",
  otherIncome: "4900",
  otherExpense: "7000",
} as const;

export const CATEGORY_ASSET_CODE: Record<string, string> = {
  furniture: FA_ACCOUNT_CODES.furniture,
  equipment: FA_ACCOUNT_CODES.officeEquipment,
  vehicle: FA_ACCOUNT_CODES.vehicles,
  computer: FA_ACCOUNT_CODES.computers,
  other: FA_ACCOUNT_CODES.ppe,
};

export async function resolveAccountsByCode(
  organizationId: string,
  codes: string[]
): Promise<Map<string, { id: string; code: string; name: string }>> {
  const unique = [...new Set(codes)];
  const rows = await db
    .select({
      id: chartOfAccounts.id,
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
    })
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.organizationId, organizationId),
        eq(chartOfAccounts.isActive, true),
        inArray(chartOfAccounts.code, unique)
      )
    );

  return new Map(rows.map((r) => [r.code, r]));
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Straight-line monthly depreciation amount (before remaining-life clamp). */
export function monthlyDepreciation(
  cost: number,
  salvageValue: number,
  usefulLifeMonths: number
): number {
  if (usefulLifeMonths <= 0) return 0;
  const depreciable = Math.max(0, cost - salvageValue);
  return roundMoney(depreciable / usefulLifeMonths);
}
