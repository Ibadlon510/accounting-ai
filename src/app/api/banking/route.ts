import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { bankAccounts, bankTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.organizationId, orgId))
      .orderBy(sql`${bankAccounts.accountName} asc`);

    const transactions = await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.organizationId, orgId))
      .orderBy(sql`${bankTransactions.transactionDate} desc`);

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        accountType: a.accountType ?? "bank",
        accountName: a.accountName,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        iban: a.iban,
        swiftCode: a.swiftCode,
        currency: a.currency,
        currentBalance: parseFloat(a.currentBalance ?? "0"),
        isActive: a.isActive,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        bankAccountId: t.bankAccountId,
        transactionDate: t.transactionDate,
        description: t.description,
        amount: parseFloat(t.amount ?? "0"),
        type: t.type,
        reference: t.reference,
        category: t.category,
        isReconciled: t.isReconciled,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load banking data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
