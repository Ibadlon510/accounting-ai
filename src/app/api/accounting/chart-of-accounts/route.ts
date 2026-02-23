import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { chartOfAccounts, accountTypes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: chartOfAccounts.id,
        code: chartOfAccounts.code,
        name: chartOfAccounts.name,
        isActive: chartOfAccounts.isActive,
        isSystem: chartOfAccounts.isSystem,
        taxCode: chartOfAccounts.taxCode,
        accountTypeName: accountTypes.name,
        category: accountTypes.category,
        normalBalance: accountTypes.normalBalance,
      })
      .from(chartOfAccounts)
      .leftJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
      .where(eq(chartOfAccounts.organizationId, orgId))
      .orderBy(sql`${chartOfAccounts.code} asc`);

    return NextResponse.json({
      accounts: rows.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        accountType: { name: a.accountTypeName ?? "", category: a.category ?? "asset", normalBalance: a.normalBalance ?? "debit" },
        isActive: a.isActive,
        isSystem: a.isSystem,
        taxCode: a.taxCode,
        balance: 0,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load chart of accounts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
