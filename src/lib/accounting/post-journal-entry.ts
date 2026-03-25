import { db } from "@/lib/db";
import {
  journalEntries,
  journalLines,
  accountingPeriods,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { resolveOrCreatePeriod } from "@/lib/banking/period";
import { AccountingError, generateEntryNumber } from "./engine";

type DbClient = typeof db;
type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface JournalLine {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  taxCode?: string;
  taxAmount?: number;
}

interface PostJournalEntryParams {
  organizationId: string;
  entryDate: string; // YYYY-MM-DD
  description: string;
  reference?: string;
  sourceType?: string;
  sourceId?: string;
  currency?: string;
  lines: JournalLine[];
  postedBy?: string;
  tx?: DbClient | TxClient;
}

async function execute(
  client: DbClient | TxClient,
  params: Omit<PostJournalEntryParams, "tx">
): Promise<{ journalEntryId: string; entryNumber: string }> {
  const {
    organizationId,
    entryDate,
    description,
    reference,
    sourceType,
    sourceId,
    currency = "AED",
    lines,
    postedBy,
  } = params;

  if (lines.length < 2) {
    throw new AccountingError("Journal entry must have at least 2 lines");
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    totalDebit += line.debit;
    totalCredit += line.credit;
  }
  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  if (totalDebit !== totalCredit) {
    throw new AccountingError(
      `Entry is not balanced: Debits (${totalDebit.toFixed(2)}) ≠ Credits (${totalCredit.toFixed(2)})`
    );
  }

  const periodId = await resolveOrCreatePeriod(organizationId, entryDate, client);
  if (!periodId) {
    throw new AccountingError("Could not resolve or create accounting period");
  }

  const [period] = await (client as DbClient)
    .select({ status: accountingPeriods.status })
    .from(accountingPeriods)
    .where(eq(accountingPeriods.id, periodId))
    .limit(1);

  if (period?.status === "closed" || period?.status === "locked") {
    throw new AccountingError(
      `Cannot post to a ${period.status} period`
    );
  }

  const [{ value: existingCount }] = await (client as DbClient)
    .select({ value: count() })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.organizationId, organizationId),
        eq(journalEntries.periodId, periodId)
      )
    );

  const entryNumber = generateEntryNumber(entryDate, existingCount + 1);

  const [entry] = await (client as DbClient)
    .insert(journalEntries)
    .values({
      organizationId,
      periodId,
      entryNumber,
      entryDate,
      description,
      reference,
      sourceType,
      sourceId,
      currency,
      status: "posted",
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      postedAt: new Date(),
      postedBy,
    })
    .returning({ id: journalEntries.id });

  if (!entry) {
    throw new AccountingError("Failed to insert journal entry");
  }

  await (client as DbClient).insert(journalLines).values(
    lines.map((line, idx) => ({
      journalEntryId: entry.id,
      organizationId,
      accountId: line.accountId,
      description: line.description,
      debit: line.debit.toFixed(2),
      credit: line.credit.toFixed(2),
      currency,
      baseCurrencyDebit: line.debit.toFixed(2),
      baseCurrencyCredit: line.credit.toFixed(2),
      taxCode: line.taxCode,
      taxAmount: line.taxAmount != null ? line.taxAmount.toFixed(2) : undefined,
      lineOrder: idx,
    }))
  );

  return { journalEntryId: entry.id, entryNumber };
}

export async function postJournalEntry(
  params: PostJournalEntryParams
): Promise<{ journalEntryId: string; entryNumber: string }> {
  const { tx, ...rest } = params;

  if (tx) {
    return execute(tx, rest);
  }

  return db.transaction(async (trx) => execute(trx, rest));
}
