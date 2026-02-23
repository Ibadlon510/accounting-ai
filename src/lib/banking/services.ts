/**
 * Shared banking services for receipt/payment creation.
 * Used by API routes and create-from-line reconciliation flow.
 * All functions accept a transaction client for atomic multi-step writes.
 */

import {
  bankAccounts,
  bankTransactions,
  chartOfAccounts,
  journalEntries,
  journalLines,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { resolveOrCreatePeriod } from "./period";
import { db } from "@/lib/db";

export type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CreateOwnerDepositInput = {
  date: string;
  bankAccountId: string;
  amount: number;
  description?: string;
  reference?: string;
};

export type CreateOwnerWithdrawalInput = {
  date: string;
  bankAccountId: string;
  amount: number;
  description?: string;
  reference?: string;
};

/** Create an owner's deposit receipt (credit). No payment record. */
export async function createOwnerDepositReceipt(
  orgId: string,
  input: CreateOwnerDepositInput,
  tx: TxClient
): Promise<{ bankTransactionId: string | null }> {
  const { date, bankAccountId, amount, description, reference } = input;
  const [ba] = await tx
    .select({ ledgerAccountId: bankAccounts.ledgerAccountId, currency: bankAccounts.currency })
    .from(bankAccounts)
    .where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.organizationId, orgId)))
    .limit(1);
  const currency = ba?.currency ?? "AED";
  let cashAccountId = ba?.ledgerAccountId ?? null;
  if (!cashAccountId) {
    const [cashAcct] = await tx
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1010")))
      .limit(1);
    cashAccountId = cashAcct?.id ?? null;
  }
  if (!cashAccountId) {
    throw new Error("Chart of accounts missing cash (1010) or bank ledger");
  }

  const [bt] = await tx
    .insert(bankTransactions)
    .values({
      organizationId: orgId,
      bankAccountId,
      transactionDate: date,
      description: description ?? "Owner's deposit",
      amount: String(amount),
      type: "credit",
      reference: reference ?? null,
      category: "owner_deposit",
    })
    .returning();

  const periodId = await resolveOrCreatePeriod(orgId, date, tx);
  const [equityAcct] = await tx
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "3100")))
    .limit(1);
  const drAccountId = equityAcct?.id ?? cashAccountId;

  if (periodId && drAccountId) {
    const [entryCountRow] = await tx
      .select({ c: count() })
      .from(journalEntries)
      .where(eq(journalEntries.organizationId, orgId));
    const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
    const [je] = await tx
      .insert(journalEntries)
      .values({
        organizationId: orgId,
        periodId,
        entryNumber,
        entryDate: date,
        description: description ?? "Owner's deposit",
        reference: bt?.id ?? null,
        sourceType: "manual",
        sourceId: bt?.id ?? null,
        status: "posted",
        currency,
        totalDebit: String(amount),
        totalCredit: String(amount),
        postedAt: new Date(),
      })
      .returning({ id: journalEntries.id });
    if (je) {
      await tx.insert(journalLines).values([
        { journalEntryId: je.id, organizationId: orgId, accountId: cashAccountId!, description: "Deposit", debit: String(amount), credit: "0", currency, baseCurrencyDebit: String(amount), baseCurrencyCredit: "0", lineOrder: 1 },
        { journalEntryId: je.id, organizationId: orgId, accountId: drAccountId, description: "Owner's equity", debit: "0", credit: String(amount), currency, baseCurrencyDebit: "0", baseCurrencyCredit: String(amount), lineOrder: 2 },
      ]);
    }
  }

  const [acc] = await tx
    .select({ currentBalance: bankAccounts.currentBalance })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);
  if (acc) {
    const bal = parseFloat(acc.currentBalance ?? "0") + amount;
    await tx.update(bankAccounts).set({ currentBalance: String(bal) }).where(eq(bankAccounts.id, bankAccountId));
  }

  return { bankTransactionId: bt?.id ?? null };
}

/** Create an owner's withdrawal payment (debit). No payment record. */
export async function createOwnerWithdrawalPayment(
  orgId: string,
  input: CreateOwnerWithdrawalInput,
  tx: TxClient
): Promise<{ bankTransactionId: string | null }> {
  const { date, bankAccountId, amount, description, reference } = input;
  const [ba] = await tx
    .select({ ledgerAccountId: bankAccounts.ledgerAccountId, currency: bankAccounts.currency })
    .from(bankAccounts)
    .where(and(eq(bankAccounts.id, bankAccountId), eq(bankAccounts.organizationId, orgId)))
    .limit(1);
  const currency = ba?.currency ?? "AED";
  let cashAccountId = ba?.ledgerAccountId ?? null;
  if (!cashAccountId) {
    const [cashAcct] = await tx
      .select({ id: chartOfAccounts.id })
      .from(chartOfAccounts)
      .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "1010")))
      .limit(1);
    cashAccountId = cashAcct?.id ?? null;
  }
  if (!cashAccountId) {
    throw new Error("Chart of accounts missing cash (1010) or bank ledger");
  }

  const [bt] = await tx
    .insert(bankTransactions)
    .values({
      organizationId: orgId,
      bankAccountId,
      transactionDate: date,
      description: description ?? "Owner's withdrawal",
      amount: String(amount),
      type: "debit",
      reference: reference ?? null,
      category: "owner_withdrawal",
    })
    .returning();

  const periodId = await resolveOrCreatePeriod(orgId, date, tx);
  const [equityAcct] = await tx
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.organizationId, orgId), eq(chartOfAccounts.code, "3100")))
    .limit(1);
  const crAccountId = equityAcct?.id ?? cashAccountId;

  if (periodId && crAccountId) {
    const [entryCountRow] = await tx
      .select({ c: count() })
      .from(journalEntries)
      .where(eq(journalEntries.organizationId, orgId));
    const seq = (Number(entryCountRow?.c ?? 0) + 1).toString().padStart(4, "0");
    const entryNumber = `JE-${date.slice(0, 7).replace("-", "")}-${seq}`;
    const [je] = await tx
      .insert(journalEntries)
      .values({
        organizationId: orgId,
        periodId,
        entryNumber,
        entryDate: date,
        description: description ?? "Bank payment",
        reference: bt?.id ?? null,
        sourceType: "manual",
        sourceId: bt?.id ?? null,
        status: "posted",
        currency,
        totalDebit: String(amount),
        totalCredit: String(amount),
        postedAt: new Date(),
      })
      .returning({ id: journalEntries.id });
    if (je) {
      await tx.insert(journalLines).values([
        { journalEntryId: je.id, organizationId: orgId, accountId: crAccountId, description: "Owner's equity / Drawings", debit: String(amount), credit: "0", currency, baseCurrencyDebit: String(amount), baseCurrencyCredit: "0", lineOrder: 1 },
        { journalEntryId: je.id, organizationId: orgId, accountId: cashAccountId, description: "Withdrawal", debit: "0", credit: String(amount), currency, baseCurrencyDebit: "0", baseCurrencyCredit: String(amount), lineOrder: 2 },
      ]);
    }
  }

  const [acc] = await tx
    .select({ currentBalance: bankAccounts.currentBalance })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);
  if (acc) {
    const bal = parseFloat(acc.currentBalance ?? "0") - amount;
    await tx.update(bankAccounts).set({ currentBalance: String(bal) }).where(eq(bankAccounts.id, bankAccountId));
  }

  return { bankTransactionId: bt?.id ?? null };
}
