import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type PatchBody = {
  accountType?: "bank" | "credit_card";
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  currency?: string;
  isActive?: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Account ID required" }, { status: 400 });

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { accountType, accountName, bankName, accountNumber, iban, swiftCode, currency, isActive } = body;

  try {
    const [existing] = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (accountType !== undefined) updates.accountType = accountType === "credit_card" ? "credit_card" : "bank";
    if (accountName !== undefined) updates.accountName = accountName.trim();
    if (bankName !== undefined) updates.bankName = bankName?.trim() || null;
    if (accountNumber !== undefined) updates.accountNumber = accountNumber?.trim() || null;
    if (iban !== undefined) updates.iban = iban?.trim() || null;
    if (swiftCode !== undefined) updates.swiftCode = swiftCode?.trim() || null;
    if (currency !== undefined) updates.currency = currency?.trim()?.toUpperCase().slice(0, 3) || "AED";
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        account: {
          id: existing.id,
          accountType: existing.accountType ?? "bank",
          accountName: existing.accountName,
          bankName: existing.bankName,
          accountNumber: existing.accountNumber,
          iban: existing.iban,
          currency: existing.currency,
          currentBalance: parseFloat(existing.currentBalance ?? "0"),
          isActive: existing.isActive,
        },
      });
    }

    const [updated] = await db
      .update(bankAccounts)
      .set(updates)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.organizationId, orgId)))
      .returning();

    return NextResponse.json({
      account: {
        id: updated!.id,
        accountType: updated!.accountType ?? "bank",
        accountName: updated!.accountName,
        bankName: updated!.bankName,
        accountNumber: updated!.accountNumber,
        iban: updated!.iban,
        currency: updated!.currency,
        currentBalance: parseFloat(updated!.currentBalance ?? "0"),
        isActive: updated!.isActive,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update bank account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
