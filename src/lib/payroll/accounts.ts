import { db } from "@/lib/db";
import { chartOfAccounts } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type CoaAccount = { id: string; code: string; name: string };

export async function resolveAccountsByCode(
  orgId: string,
  codes: string[]
): Promise<Map<string, CoaAccount>> {
  const unique = [...new Set(codes)];
  const accounts = await db
    .select({ id: chartOfAccounts.id, code: chartOfAccounts.code, name: chartOfAccounts.name })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.organizationId, orgId), inArray(chartOfAccounts.code, unique)));

  return new Map(accounts.map((a) => [a.code, a]));
}

export function missingCodes(byCode: Map<string, CoaAccount>, needed: string[]): string[] {
  return needed.filter((c) => !byCode.has(c));
}
