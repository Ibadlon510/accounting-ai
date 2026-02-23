import { db } from "@/lib/db";
import { accountingPeriods, fiscalYears } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

// Accept db or transaction client (both expose select/insert)
type DbClient = typeof db;

export async function resolveOrCreatePeriod(
  orgId: string,
  txnDate: string,
  client?: DbClient | Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<string | null> {
  const dbClient = (client ?? db) as DbClient;
  const [existing] = await dbClient
    .select({ id: accountingPeriods.id })
    .from(accountingPeriods)
    .where(and(eq(accountingPeriods.organizationId, orgId), lte(accountingPeriods.startDate, txnDate), gte(accountingPeriods.endDate, txnDate)))
    .limit(1);
  if (existing) return existing.id;

  const d = new Date(txnDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const fyStart = `${year}-01-01`;
  const fyEnd = `${year}-12-31`;
  const fyName = `FY ${year}`;

  let fyId: string;
  const [existingFy] = await dbClient.select({ id: fiscalYears.id }).from(fiscalYears).where(and(eq(fiscalYears.organizationId, orgId), eq(fiscalYears.name, fyName))).limit(1);
  if (existingFy) {
    fyId = existingFy.id;
  } else {
    const [newFy] = await dbClient.insert(fiscalYears).values({ organizationId: orgId, name: fyName, startDate: fyStart, endDate: fyEnd }).returning({ id: fiscalYears.id });
    if (!newFy) return null;
    fyId = newFy.id;
  }

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const periodName = `${monthNames[month]} ${year}`;

  const [newPeriod] = await dbClient
    .insert(accountingPeriods)
    .values({ organizationId: orgId, fiscalYearId: fyId, name: periodName, startDate: monthStart, endDate: monthEnd, status: "open" })
    .returning({ id: accountingPeriods.id });
  return newPeriod?.id ?? null;
}
