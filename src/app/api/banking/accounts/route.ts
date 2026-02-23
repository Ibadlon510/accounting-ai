import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankAccounts, chartOfAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type CreateBody = {
  accountName: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  currency?: string;
};

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { accountName, bankName, accountNumber, iban, swiftCode, currency = "AED" } = body;
  if (!accountName?.trim()) {
    return NextResponse.json({ error: "Account name is required" }, { status: 400 });
  }

  try {
    let ledgerAccountId: string | null = null;
    const [cashAcct] = await db
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1010")))
      .limit(1);
    if (cashAcct) ledgerAccountId = cashAcct.id;

    const [account] = await db
      .insert(bankAccounts)
      .values({
        organizationId: orgId,
        accountName: accountName.trim(),
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        iban: iban?.trim() || null,
        swiftCode: swiftCode?.trim() || null,
        currency: currency?.trim()?.toUpperCase().slice(0, 3) || "AED",
        ledgerAccountId,
        currentBalance: "0",
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      account: {
        id: account!.id,
        accountName: account!.accountName,
        bankName: account!.bankName,
        accountNumber: account!.accountNumber,
        iban: account!.iban,
        currency: account!.currency,
        currentBalance: 0,
        isActive: account!.isActive,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create bank account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
