import { db } from "@/lib/db";
import {
  assetDisposals,
  depreciationRuns,
  depreciationSchedules,
  fixedAssets,
} from "@/lib/db/schema";
import { postJournalEntry } from "@/lib/accounting/post-journal-entry";
import { AccountingError } from "@/lib/accounting/engine";
import { and, count, eq, lte, ne, sql } from "drizzle-orm";
import {
  CATEGORY_ASSET_CODE,
  FA_ACCOUNT_CODES,
  monthlyDepreciation,
  resolveAccountsByCode,
  roundMoney,
} from "./accounts";

export type FixedAssetRow = typeof fixedAssets.$inferSelect;

export function mapFixedAsset(row: FixedAssetRow) {
  const cost = parseFloat(row.cost ?? "0");
  const accum = parseFloat(row.accumulatedDepreciation ?? "0");
  const salvage = parseFloat(row.salvageValue ?? "0");
  return {
    id: row.id,
    assetNumber: row.assetNumber,
    name: row.name,
    description: row.description,
    category: row.category,
    assetAccountId: row.assetAccountId,
    accumDepAccountId: row.accumDepAccountId,
    depExpenseAccountId: row.depExpenseAccountId,
    acquisitionDate: row.acquisitionDate,
    cost,
    salvageValue: salvage,
    usefulLifeMonths: row.usefulLifeMonths,
    depreciationMethod: row.depreciationMethod,
    status: row.status,
    accumulatedDepreciation: accum,
    bookValue: roundMoney(cost - accum),
    capitalizationJournalEntryId: row.capitalizationJournalEntryId,
    disposalDate: row.disposalDate,
    disposalProceeds: row.disposalProceeds != null ? parseFloat(row.disposalProceeds) : null,
    disposalJournalEntryId: row.disposalJournalEntryId,
    notes: row.notes,
    isActive: row.isActive,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  };
}

export async function nextAssetNumber(organizationId: string): Promise<string> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(fixedAssets)
    .where(eq(fixedAssets.organizationId, organizationId));
  return `FA-${String((value ?? 0) + 1).padStart(4, "0")}`;
}

export async function resolveDefaultFaAccounts(
  organizationId: string,
  category: string
): Promise<{
  assetAccountId: string;
  accumDepAccountId: string;
  depExpenseAccountId: string;
}> {
  const assetCode = CATEGORY_ASSET_CODE[category] ?? FA_ACCOUNT_CODES.ppe;
  const byCode = await resolveAccountsByCode(organizationId, [
    assetCode,
    FA_ACCOUNT_CODES.ppe,
    FA_ACCOUNT_CODES.accumDep,
    FA_ACCOUNT_CODES.depExpense,
  ]);

  const asset =
    byCode.get(assetCode) ?? byCode.get(FA_ACCOUNT_CODES.ppe);
  const accum = byCode.get(FA_ACCOUNT_CODES.accumDep);
  const expense = byCode.get(FA_ACCOUNT_CODES.depExpense);

  if (!asset || !accum || !expense) {
    throw new AccountingError(
      `Missing UAE CoA accounts for fixed assets (need ${assetCode}/${FA_ACCOUNT_CODES.ppe}, ${FA_ACCOUNT_CODES.accumDep}, ${FA_ACCOUNT_CODES.depExpense})`
    );
  }

  return {
    assetAccountId: asset.id,
    accumDepAccountId: accum.id,
    depExpenseAccountId: expense.id,
  };
}

function periodEndDate(year: number, month: number): string {
  const last = new Date(Date.UTC(year, month, 0));
  const y = last.getUTCFullYear();
  const m = String(last.getUTCMonth() + 1).padStart(2, "0");
  const d = String(last.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function periodLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Run straight-line depreciation for all eligible active assets in a calendar period.
 * Posts one immutable JE: Dr Depreciation Expense (6700) / Cr Accumulated Depreciation (1600).
 */
export async function runDepreciation(params: {
  organizationId: string;
  periodYear: number;
  periodMonth: number;
  postedBy?: string;
}): Promise<{
  runId: string;
  journalEntryId: string;
  entryNumber: string;
  totalAmount: number;
  assetCount: number;
}> {
  const { organizationId, periodYear, periodMonth, postedBy } = params;

  if (periodMonth < 1 || periodMonth > 12) {
    throw new AccountingError("periodMonth must be 1–12");
  }

  const [existing] = await db
    .select({ id: depreciationRuns.id })
    .from(depreciationRuns)
    .where(
      and(
        eq(depreciationRuns.organizationId, organizationId),
        eq(depreciationRuns.periodYear, periodYear),
        eq(depreciationRuns.periodMonth, periodMonth)
      )
    )
    .limit(1);

  if (existing) {
    throw new AccountingError(
      `Depreciation already posted for ${periodLabel(periodYear, periodMonth)}. Ledger entries can only be reversed, not edited.`
    );
  }

  const periodEnd = periodEndDate(periodYear, periodMonth);

  const assets = await db
    .select()
    .from(fixedAssets)
    .where(
      and(
        eq(fixedAssets.organizationId, organizationId),
        eq(fixedAssets.isActive, true),
        ne(fixedAssets.status, "disposed"),
        lte(fixedAssets.acquisitionDate, periodEnd)
      )
    );

  type LinePlan = {
    asset: FixedAssetRow;
    amount: number;
    accumAfter: number;
    bookAfter: number;
  };

  const plans: LinePlan[] = [];

  for (const asset of assets) {
    if (asset.status === "fully_depreciated") continue;

    const cost = parseFloat(asset.cost);
    const salvage = parseFloat(asset.salvageValue ?? "0");
    const accum = parseFloat(asset.accumulatedDepreciation ?? "0");
    const remaining = roundMoney(cost - salvage - accum);
    if (remaining <= 0) continue;

    // Skip if already scheduled for this period (safety)
    const [prior] = await db
      .select({ id: depreciationSchedules.id })
      .from(depreciationSchedules)
      .where(
        and(
          eq(depreciationSchedules.organizationId, organizationId),
          eq(depreciationSchedules.fixedAssetId, asset.id),
          eq(depreciationSchedules.periodYear, periodYear),
          eq(depreciationSchedules.periodMonth, periodMonth)
        )
      )
      .limit(1);
    if (prior) continue;

    // Only start depreciating in/after acquisition month
    const [acqY, acqM] = asset.acquisitionDate.split("-").map(Number);
    if (periodYear < acqY! || (periodYear === acqY && periodMonth < acqM!)) continue;

    const monthly = monthlyDepreciation(cost, salvage, asset.usefulLifeMonths);
    const amount = roundMoney(Math.min(monthly, remaining));
    if (amount <= 0) continue;

    const accumAfter = roundMoney(accum + amount);
    const bookAfter = roundMoney(cost - accumAfter);
    plans.push({ asset, amount, accumAfter, bookAfter });
  }

  if (plans.length === 0) {
    throw new AccountingError(
      `No depreciable assets for ${periodLabel(periodYear, periodMonth)}`
    );
  }

  const totalAmount = roundMoney(plans.reduce((s, p) => s + p.amount, 0));

  // Group by dep expense / accum dep accounts (normally single UAE pair)
  const expenseGroups = new Map<string, number>();
  const accumGroups = new Map<string, number>();
  for (const p of plans) {
    expenseGroups.set(
      p.asset.depExpenseAccountId,
      roundMoney((expenseGroups.get(p.asset.depExpenseAccountId) ?? 0) + p.amount)
    );
    accumGroups.set(
      p.asset.accumDepAccountId,
      roundMoney((accumGroups.get(p.asset.accumDepAccountId) ?? 0) + p.amount)
    );
  }

  const jeLines: Array<{
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
  }> = [];

  for (const [accountId, amount] of expenseGroups) {
    jeLines.push({
      accountId,
      description: `Depreciation ${periodLabel(periodYear, periodMonth)}`,
      debit: amount,
      credit: 0,
    });
  }
  for (const [accountId, amount] of accumGroups) {
    jeLines.push({
      accountId,
      description: `Accum. depreciation ${periodLabel(periodYear, periodMonth)}`,
      debit: 0,
      credit: amount,
    });
  }

  return db.transaction(async (tx) => {
    const [run] = await tx
      .insert(depreciationRuns)
      .values({
        organizationId,
        periodYear,
        periodMonth,
        runDate: periodEnd,
        totalAmount: totalAmount.toFixed(2),
        assetCount: plans.length,
        status: "posted",
        createdBy: postedBy,
      })
      .returning();

    if (!run) throw new AccountingError("Failed to create depreciation run");

    const posted = await postJournalEntry({
      organizationId,
      entryDate: periodEnd,
      description: `Depreciation run ${periodLabel(periodYear, periodMonth)}`,
      reference: `DEP-${periodLabel(periodYear, periodMonth)}`,
      sourceType: "depreciation",
      sourceId: run.id,
      lines: jeLines,
      postedBy,
      tx,
    });

    await tx
      .update(depreciationRuns)
      .set({ journalEntryId: posted.journalEntryId })
      .where(eq(depreciationRuns.id, run.id));

    for (const p of plans) {
      await tx.insert(depreciationSchedules).values({
        organizationId,
        depreciationRunId: run.id,
        fixedAssetId: p.asset.id,
        periodYear,
        periodMonth,
        amount: p.amount.toFixed(2),
        accumulatedAfter: p.accumAfter.toFixed(2),
        bookValueAfter: p.bookAfter.toFixed(2),
        journalEntryId: posted.journalEntryId,
      });

      const fully =
        p.accumAfter >= roundMoney(parseFloat(p.asset.cost) - parseFloat(p.asset.salvageValue ?? "0"));

      await tx
        .update(fixedAssets)
        .set({
          accumulatedDepreciation: p.accumAfter.toFixed(2),
          status: fully ? "fully_depreciated" : "active",
          updatedAt: new Date(),
        })
        .where(eq(fixedAssets.id, p.asset.id));
    }

    return {
      runId: run.id,
      journalEntryId: posted.journalEntryId,
      entryNumber: posted.entryNumber,
      totalAmount,
      assetCount: plans.length,
    };
  });
}

/**
 * Dispose an asset: post immutable JE and mark disposed.
 * Dr Accum. Dep / Dr Cash (proceeds) / Dr Loss (or Cr Gain) / Cr Asset cost.
 */
export async function disposeAsset(params: {
  organizationId: string;
  assetId: string;
  disposalDate: string;
  proceeds: number;
  proceedsAccountId?: string;
  notes?: string;
  postedBy?: string;
}): Promise<{
  disposalId: string;
  journalEntryId: string;
  entryNumber: string;
  gainOrLoss: number;
  asset: ReturnType<typeof mapFixedAsset>;
}> {
  const {
    organizationId,
    assetId,
    disposalDate,
    proceeds: rawProceeds,
    proceedsAccountId,
    notes,
    postedBy,
  } = params;

  const proceeds = roundMoney(Math.max(0, rawProceeds));

  const [asset] = await db
    .select()
    .from(fixedAssets)
    .where(
      and(
        eq(fixedAssets.id, assetId),
        eq(fixedAssets.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!asset) throw new AccountingError("Asset not found");
  if (asset.status === "disposed") throw new AccountingError("Asset already disposed");
  if (!asset.isActive) throw new AccountingError("Asset is inactive");

  const cost = parseFloat(asset.cost);
  const accum = parseFloat(asset.accumulatedDepreciation ?? "0");
  const bookValue = roundMoney(cost - accum);
  const gainOrLoss = roundMoney(proceeds - bookValue);

  const byCode = await resolveAccountsByCode(organizationId, [
    FA_ACCOUNT_CODES.bank,
    FA_ACCOUNT_CODES.otherIncome,
    FA_ACCOUNT_CODES.otherExpense,
  ]);

  const proceedsAcctId =
    proceedsAccountId ||
    byCode.get(FA_ACCOUNT_CODES.bank)?.id ||
    null;

  if (proceeds > 0 && !proceedsAcctId) {
    throw new AccountingError(
      `Proceeds account required (default ${FA_ACCOUNT_CODES.bank} not found)`
    );
  }

  const gainAcct = byCode.get(FA_ACCOUNT_CODES.otherIncome);
  const lossAcct = byCode.get(FA_ACCOUNT_CODES.otherExpense);

  if (gainOrLoss > 0 && !gainAcct) {
    throw new AccountingError(`Missing gain account ${FA_ACCOUNT_CODES.otherIncome}`);
  }
  if (gainOrLoss < 0 && !lossAcct) {
    throw new AccountingError(`Missing loss account ${FA_ACCOUNT_CODES.otherExpense}`);
  }

  const lines: Array<{
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
  }> = [];

  if (accum > 0) {
    lines.push({
      accountId: asset.accumDepAccountId,
      description: `Clear accum. dep — ${asset.assetNumber}`,
      debit: accum,
      credit: 0,
    });
  }

  if (proceeds > 0 && proceedsAcctId) {
    lines.push({
      accountId: proceedsAcctId,
      description: `Disposal proceeds — ${asset.assetNumber}`,
      debit: proceeds,
      credit: 0,
    });
  }

  if (gainOrLoss < 0 && lossAcct) {
    lines.push({
      accountId: lossAcct.id,
      description: `Loss on disposal — ${asset.assetNumber}`,
      debit: Math.abs(gainOrLoss),
      credit: 0,
    });
  }

  lines.push({
    accountId: asset.assetAccountId,
    description: `Dispose asset — ${asset.assetNumber}`,
    debit: 0,
    credit: cost,
  });

  if (gainOrLoss > 0 && gainAcct) {
    lines.push({
      accountId: gainAcct.id,
      description: `Gain on disposal — ${asset.assetNumber}`,
      debit: 0,
      credit: gainOrLoss,
    });
  }

  // Ensure balanced when proceeds=0 and fully depreciated (accum = cost)
  const debitSum = roundMoney(lines.reduce((s, l) => s + l.debit, 0));
  const creditSum = roundMoney(lines.reduce((s, l) => s + l.credit, 0));
  if (debitSum !== creditSum) {
    throw new AccountingError(
      `Disposal JE not balanced: Dr ${debitSum} ≠ Cr ${creditSum}`
    );
  }

  return db.transaction(async (tx) => {
    const [disposal] = await tx
      .insert(assetDisposals)
      .values({
        organizationId,
        fixedAssetId: asset.id,
        disposalDate,
        proceeds: proceeds.toFixed(2),
        costAtDisposal: cost.toFixed(2),
        accumDepAtDisposal: accum.toFixed(2),
        bookValueAtDisposal: bookValue.toFixed(2),
        gainOrLoss: gainOrLoss.toFixed(2),
        proceedsAccountId: proceedsAcctId,
        notes: notes ?? null,
        createdBy: postedBy,
      })
      .returning();

    if (!disposal) throw new AccountingError("Failed to record disposal");

    const posted = await postJournalEntry({
      organizationId,
      entryDate: disposalDate,
      description: `Dispose ${asset.assetNumber} — ${asset.name}`,
      reference: asset.assetNumber,
      sourceType: "asset_disposal",
      sourceId: disposal.id,
      lines,
      postedBy,
      tx,
    });

    await tx
      .update(assetDisposals)
      .set({ journalEntryId: posted.journalEntryId })
      .where(eq(assetDisposals.id, disposal.id));

    const [updated] = await tx
      .update(fixedAssets)
      .set({
        status: "disposed",
        disposalDate,
        disposalProceeds: proceeds.toFixed(2),
        disposalJournalEntryId: posted.journalEntryId,
        notes: notes ?? asset.notes,
        updatedAt: new Date(),
      })
      .where(eq(fixedAssets.id, asset.id))
      .returning();

    return {
      disposalId: disposal.id,
      journalEntryId: posted.journalEntryId,
      entryNumber: posted.entryNumber,
      gainOrLoss,
      asset: mapFixedAsset(updated!),
    };
  });
}

export async function listDepreciationRuns(organizationId: string) {
  const rows = await db
    .select()
    .from(depreciationRuns)
    .where(eq(depreciationRuns.organizationId, organizationId))
    .orderBy(
      sql`${depreciationRuns.periodYear} desc`,
      sql`${depreciationRuns.periodMonth} desc`
    );

  return rows.map((r) => ({
    id: r.id,
    periodYear: r.periodYear,
    periodMonth: r.periodMonth,
    period: periodLabel(r.periodYear, r.periodMonth),
    runDate: r.runDate,
    totalAmount: parseFloat(r.totalAmount ?? "0"),
    assetCount: r.assetCount,
    journalEntryId: r.journalEntryId,
    status: r.status,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  }));
}
