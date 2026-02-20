import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { chartOfAccounts, accountTypes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await db
    .select({
      id: chartOfAccounts.id,
      code: chartOfAccounts.code,
      name: chartOfAccounts.name,
      isActive: chartOfAccounts.isActive,
      isSystem: chartOfAccounts.isSystem,
      taxCode: chartOfAccounts.taxCode,
      typeName: accountTypes.name,
      category: accountTypes.category,
    })
    .from(chartOfAccounts)
    .innerJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
    .where(eq(chartOfAccounts.organizationId, orgId))
    .orderBy(asc(chartOfAccounts.code));

  return NextResponse.json({ accounts });
}
