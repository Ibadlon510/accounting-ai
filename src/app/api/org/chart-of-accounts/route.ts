import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { chartOfAccounts, accountTypes } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";

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

  const types = await db
    .select({
      id: accountTypes.id,
      name: accountTypes.name,
      category: accountTypes.category,
    })
    .from(accountTypes)
    .orderBy(asc(accountTypes.displayOrder));

  return NextResponse.json({ accounts, accountTypes: types });
}

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: string; name?: string; accountTypeId?: string; taxCode?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code, name, accountTypeId, taxCode, description } = body;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "Account code is required" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Account name is required" }, { status: 400 });
  }
  if (!accountTypeId || typeof accountTypeId !== "string") {
    return NextResponse.json({ error: "Account type is required" }, { status: 400 });
  }

  try {
    const [existingType] = await db
      .select({ id: accountTypes.id })
      .from(accountTypes)
      .where(eq(accountTypes.id, accountTypeId))
      .limit(1);
    if (!existingType) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }

    const [duplicate] = await db
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, code.trim())))
      .limit(1);
    if (duplicate) {
      return NextResponse.json({ error: `Account code "${code.trim()}" already exists` }, { status: 409 });
    }

    const [newAccount] = await db
      .insert(chartOfAccounts)
      .values({
        organizationId: orgId,
        accountTypeId,
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        taxCode: taxCode?.trim() || null,
        isSystem: false,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ account: newAccount }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
