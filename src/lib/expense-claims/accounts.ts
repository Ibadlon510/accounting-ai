import { db } from "@/lib/db";
import { chartOfAccounts } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

/** UAE CoA codes used by Expense Claims (seed-aligned). */
export const CLAIM_ACCOUNT_CODES = {
  /** Default expense when category is travel / entertainment */
  travel: "6400",
  officeSupplies: "6300",
  utilities: "6200",
  professionalFees: "6500",
  marketing: "6900",
  otherExpense: "7000",
  /** Cash / bank credit on reimbursement */
  bank: "1110",
  cashInHand: "1010",
  /** Payable credit when reimbursing via accrual */
  otherPayables: "2020",
  tradePayables: "2010",
} as const;

export const CATEGORY_EXPENSE_CODE: Record<string, string> = {
  travel: CLAIM_ACCOUNT_CODES.travel,
  entertainment: CLAIM_ACCOUNT_CODES.travel,
  supplies: CLAIM_ACCOUNT_CODES.officeSupplies,
  office: CLAIM_ACCOUNT_CODES.officeSupplies,
  utilities: CLAIM_ACCOUNT_CODES.utilities,
  professional: CLAIM_ACCOUNT_CODES.professionalFees,
  marketing: CLAIM_ACCOUNT_CODES.marketing,
  other: CLAIM_ACCOUNT_CODES.otherExpense,
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
