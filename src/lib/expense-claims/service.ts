import { db } from "@/lib/db";
import { expenseClaimLines, expenseClaims } from "@/lib/db/schema";
import { postJournalEntry } from "@/lib/accounting/post-journal-entry";
import { AccountingError } from "@/lib/accounting/engine";
import { and, count, desc, eq } from "drizzle-orm";
import {
  CATEGORY_EXPENSE_CODE,
  CLAIM_ACCOUNT_CODES,
  resolveAccountsByCode,
  roundMoney,
} from "./accounts";

export type ExpenseClaimRow = typeof expenseClaims.$inferSelect;
export type ExpenseClaimLineRow = typeof expenseClaimLines.$inferSelect;

export type ClaimLineInput = {
  description?: string;
  category?: string;
  expenseDate?: string | null;
  expenseAccountId?: string;
  amount: number;
  taxAmount?: number;
};

export function mapClaimLine(row: ExpenseClaimLineRow) {
  return {
    id: row.id,
    expenseClaimId: row.expenseClaimId,
    expenseDate: row.expenseDate,
    description: row.description,
    category: row.category,
    expenseAccountId: row.expenseAccountId,
    amount: parseFloat(row.amount ?? "0"),
    taxAmount: parseFloat(row.taxAmount ?? "0"),
    lineOrder: row.lineOrder,
  };
}

export function mapClaim(
  row: ExpenseClaimRow,
  lines: ExpenseClaimLineRow[] = []
) {
  return {
    id: row.id,
    claimNumber: row.claimNumber,
    title: row.title,
    description: row.description,
    claimDate: row.claimDate,
    employeeId: row.employeeId,
    claimantName: row.claimantName,
    submittedBy: row.submittedBy,
    status: row.status,
    currency: row.currency,
    subtotal: parseFloat(row.subtotal ?? "0"),
    taxAmount: parseFloat(row.taxAmount ?? "0"),
    total: parseFloat(row.total ?? "0"),
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt?.toISOString?.() ?? row.approvedAt,
    rejectedBy: row.rejectedBy,
    rejectedAt: row.rejectedAt?.toISOString?.() ?? row.rejectedAt,
    rejectionReason: row.rejectionReason,
    reimbursementMethod: row.reimbursementMethod,
    creditAccountId: row.creditAccountId,
    reimbursedAt: row.reimbursedAt?.toISOString?.() ?? row.reimbursedAt,
    reimbursedBy: row.reimbursedBy,
    journalEntryId: row.journalEntryId,
    notes: row.notes,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    lines: lines.map(mapClaimLine),
  };
}

export async function nextClaimNumber(organizationId: string): Promise<string> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(expenseClaims)
    .where(eq(expenseClaims.organizationId, organizationId));
  return `EC-${String((value ?? 0) + 1).padStart(4, "0")}`;
}

export async function resolveDefaultExpenseAccountId(
  organizationId: string,
  category: string
): Promise<string> {
  const code =
    CATEGORY_EXPENSE_CODE[category] ?? CLAIM_ACCOUNT_CODES.travel;
  const byCode = await resolveAccountsByCode(organizationId, [
    code,
    CLAIM_ACCOUNT_CODES.travel,
    CLAIM_ACCOUNT_CODES.otherExpense,
  ]);
  const account =
    byCode.get(code) ??
    byCode.get(CLAIM_ACCOUNT_CODES.travel) ??
    byCode.get(CLAIM_ACCOUNT_CODES.otherExpense);
  if (!account) {
    throw new AccountingError(
      `Missing UAE CoA expense account (need ${code} or ${CLAIM_ACCOUNT_CODES.travel})`
    );
  }
  return account.id;
}

export async function resolveCreditAccountId(
  organizationId: string,
  method: "cash" | "payable",
  explicitId?: string | null
): Promise<string> {
  if (explicitId) return explicitId;

  if (method === "cash") {
    const byCode = await resolveAccountsByCode(organizationId, [
      CLAIM_ACCOUNT_CODES.bank,
      CLAIM_ACCOUNT_CODES.cashInHand,
    ]);
    const account =
      byCode.get(CLAIM_ACCOUNT_CODES.bank) ??
      byCode.get(CLAIM_ACCOUNT_CODES.cashInHand);
    if (!account) {
      throw new AccountingError(
        `Missing UAE CoA cash/bank account (need ${CLAIM_ACCOUNT_CODES.bank} or ${CLAIM_ACCOUNT_CODES.cashInHand})`
      );
    }
    return account.id;
  }

  const byCode = await resolveAccountsByCode(organizationId, [
    CLAIM_ACCOUNT_CODES.otherPayables,
    CLAIM_ACCOUNT_CODES.tradePayables,
  ]);
  const account =
    byCode.get(CLAIM_ACCOUNT_CODES.otherPayables) ??
    byCode.get(CLAIM_ACCOUNT_CODES.tradePayables);
  if (!account) {
    throw new AccountingError(
      `Missing UAE CoA payable account (need ${CLAIM_ACCOUNT_CODES.otherPayables} or ${CLAIM_ACCOUNT_CODES.tradePayables})`
    );
  }
  return account.id;
}

export async function listClaimsWithLines(organizationId: string) {
  const claims = await db
    .select()
    .from(expenseClaims)
    .where(eq(expenseClaims.organizationId, organizationId))
    .orderBy(desc(expenseClaims.createdAt));

  if (claims.length === 0) return [];

  const lines = await db
    .select()
    .from(expenseClaimLines)
    .where(eq(expenseClaimLines.organizationId, organizationId));

  const byClaim = new Map<string, ExpenseClaimLineRow[]>();
  for (const line of lines) {
    const list = byClaim.get(line.expenseClaimId) ?? [];
    list.push(line);
    byClaim.set(line.expenseClaimId, list);
  }

  return claims.map((c) =>
    mapClaim(
      c,
      (byClaim.get(c.id) ?? []).sort((a, b) => a.lineOrder - b.lineOrder)
    )
  );
}

export async function getClaimWithLines(
  organizationId: string,
  claimId: string
) {
  const [claim] = await db
    .select()
    .from(expenseClaims)
    .where(
      and(
        eq(expenseClaims.id, claimId),
        eq(expenseClaims.organizationId, organizationId)
      )
    )
    .limit(1);
  if (!claim) return null;

  const lines = await db
    .select()
    .from(expenseClaimLines)
    .where(
      and(
        eq(expenseClaimLines.expenseClaimId, claimId),
        eq(expenseClaimLines.organizationId, organizationId)
      )
    )
    .orderBy(expenseClaimLines.lineOrder);

  return mapClaim(claim, lines);
}

export async function submitClaim(params: {
  organizationId: string;
  title: string;
  description?: string | null;
  claimDate: string;
  claimantName: string;
  employeeId?: string | null;
  submittedBy?: string | null;
  currency?: string;
  notes?: string | null;
  lines: ClaimLineInput[];
}) {
  const {
    organizationId,
    title,
    description,
    claimDate,
    claimantName,
    employeeId,
    submittedBy,
    currency = "AED",
    notes,
    lines,
  } = params;

  if (!lines.length) {
    throw new AccountingError("At least one expense line is required");
  }

  let subtotal = 0;
  let taxTotal = 0;
  const normalized: Array<{
    description: string;
    category: string;
    expenseDate: string | null;
    expenseAccountId: string;
    amount: number;
    taxAmount: number;
  }> = [];

  for (const line of lines) {
    const amount = roundMoney(Number(line.amount));
    const taxAmount = roundMoney(Number(line.taxAmount ?? 0));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AccountingError("Each line amount must be a positive number");
    }
    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      throw new AccountingError("Line tax amount must be ≥ 0");
    }
    const category =
      typeof line.category === "string" && line.category.trim()
        ? line.category.trim().toLowerCase()
        : "travel";
    const expenseAccountId =
      typeof line.expenseAccountId === "string" && line.expenseAccountId
        ? line.expenseAccountId
        : await resolveDefaultExpenseAccountId(organizationId, category);

    subtotal = roundMoney(subtotal + amount);
    taxTotal = roundMoney(taxTotal + taxAmount);
    normalized.push({
      description: (line.description ?? "").trim() || category,
      category,
      expenseDate: line.expenseDate || null,
      expenseAccountId,
      amount,
      taxAmount,
    });
  }

  const total = roundMoney(subtotal + taxTotal);
  const claimNumber = await nextClaimNumber(organizationId);

  return db.transaction(async (tx) => {
    const [claim] = await tx
      .insert(expenseClaims)
      .values({
        organizationId,
        claimNumber,
        title,
        description: description?.trim() || null,
        claimDate,
        employeeId: employeeId || null,
        claimantName,
        submittedBy: submittedBy || null,
        status: "submitted",
        currency,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxTotal.toFixed(2),
        total: total.toFixed(2),
        notes: notes?.trim() || null,
      })
      .returning();

    if (!claim) throw new AccountingError("Failed to create expense claim");

    const insertedLines = await tx
      .insert(expenseClaimLines)
      .values(
        normalized.map((line, idx) => ({
          organizationId,
          expenseClaimId: claim.id,
          expenseDate: line.expenseDate,
          description: line.description,
          category: line.category,
          expenseAccountId: line.expenseAccountId,
          amount: line.amount.toFixed(2),
          taxAmount: line.taxAmount.toFixed(2),
          lineOrder: idx,
        }))
      )
      .returning();

    return mapClaim(claim, insertedLines);
  });
}

export async function approveClaim(params: {
  organizationId: string;
  claimId: string;
  approvedBy: string;
}) {
  const { organizationId, claimId, approvedBy } = params;
  const [claim] = await db
    .select()
    .from(expenseClaims)
    .where(
      and(
        eq(expenseClaims.id, claimId),
        eq(expenseClaims.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!claim) throw new AccountingError("Expense claim not found");
  if (claim.status !== "submitted") {
    throw new AccountingError(
      `Only submitted claims can be approved (current: ${claim.status})`
    );
  }

  const [updated] = await db
    .update(expenseClaims)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(expenseClaims.id, claimId))
    .returning();

  const lines = await db
    .select()
    .from(expenseClaimLines)
    .where(eq(expenseClaimLines.expenseClaimId, claimId));

  return mapClaim(updated!, lines);
}

export async function rejectClaim(params: {
  organizationId: string;
  claimId: string;
  rejectedBy: string;
  reason?: string | null;
}) {
  const { organizationId, claimId, rejectedBy, reason } = params;
  const [claim] = await db
    .select()
    .from(expenseClaims)
    .where(
      and(
        eq(expenseClaims.id, claimId),
        eq(expenseClaims.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!claim) throw new AccountingError("Expense claim not found");
  if (claim.status !== "submitted") {
    throw new AccountingError(
      `Only submitted claims can be rejected (current: ${claim.status})`
    );
  }

  const [updated] = await db
    .update(expenseClaims)
    .set({
      status: "rejected",
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(expenseClaims.id, claimId))
    .returning();

  const lines = await db
    .select()
    .from(expenseClaimLines)
    .where(eq(expenseClaimLines.expenseClaimId, claimId));

  return mapClaim(updated!, lines);
}

/**
 * Reimburse an approved claim: Dr expense (per line) / Cr cash (1110) or payable (2020).
 * Posts an immutable journal entry (reverse-only).
 */
export async function reimburseClaim(params: {
  organizationId: string;
  claimId: string;
  reimbursedBy: string;
  method?: "cash" | "payable";
  creditAccountId?: string | null;
  reimbursementDate?: string | null;
}) {
  const {
    organizationId,
    claimId,
    reimbursedBy,
    method = "cash",
    creditAccountId,
    reimbursementDate,
  } = params;

  if (method !== "cash" && method !== "payable") {
    throw new AccountingError("reimbursement method must be cash or payable");
  }

  const [claim] = await db
    .select()
    .from(expenseClaims)
    .where(
      and(
        eq(expenseClaims.id, claimId),
        eq(expenseClaims.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!claim) throw new AccountingError("Expense claim not found");
  if (claim.status !== "approved") {
    throw new AccountingError(
      `Only approved claims can be reimbursed (current: ${claim.status})`
    );
  }
  if (claim.journalEntryId) {
    throw new AccountingError(
      "Claim already reimbursed. Ledger entries can only be reversed, not edited."
    );
  }

  const lines = await db
    .select()
    .from(expenseClaimLines)
    .where(
      and(
        eq(expenseClaimLines.expenseClaimId, claimId),
        eq(expenseClaimLines.organizationId, organizationId)
      )
    )
    .orderBy(expenseClaimLines.lineOrder);

  if (!lines.length) {
    throw new AccountingError("Claim has no lines to reimburse");
  }

  const creditId = await resolveCreditAccountId(
    organizationId,
    method,
    creditAccountId
  );

  const entryDate = reimbursementDate || claim.claimDate;
  const debitByAccount = new Map<string, { amount: number; description: string }>();

  for (const line of lines) {
    const lineTotal = roundMoney(
      parseFloat(line.amount) + parseFloat(line.taxAmount ?? "0")
    );
    if (lineTotal <= 0) continue;
    const existing = debitByAccount.get(line.expenseAccountId);
    if (existing) {
      existing.amount = roundMoney(existing.amount + lineTotal);
    } else {
      debitByAccount.set(line.expenseAccountId, {
        amount: lineTotal,
        description: line.description || line.category,
      });
    }
  }

  const total = roundMoney(
    [...debitByAccount.values()].reduce((s, v) => s + v.amount, 0)
  );
  if (total <= 0) {
    throw new AccountingError("Reimbursement total must be positive");
  }

  const creditLabel = method === "cash" ? "Cash/Bank" : "Payable";

  const result = await db.transaction(async (tx) => {
    const posted = await postJournalEntry({
      organizationId,
      entryDate,
      description: `Reimburse ${claim.claimNumber} — ${claim.title}`,
      reference: claim.claimNumber,
      sourceType: "expense_claim",
      sourceId: claim.id,
      currency: claim.currency,
      postedBy: reimbursedBy,
      tx,
      lines: [
        ...[...debitByAccount.entries()].map(([accountId, info]) => ({
          accountId,
          description: info.description,
          debit: info.amount,
          credit: 0,
        })),
        {
          accountId: creditId,
          description: `Reimbursement via ${creditLabel}`,
          debit: 0,
          credit: total,
        },
      ],
    });

    const [updated] = await tx
      .update(expenseClaims)
      .set({
        status: "reimbursed",
        reimbursementMethod: method,
        creditAccountId: creditId,
        reimbursedAt: new Date(),
        reimbursedBy,
        journalEntryId: posted.journalEntryId,
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, claimId))
      .returning();

    return {
      claim: mapClaim(updated!, lines),
      journalEntryId: posted.journalEntryId,
      entryNumber: posted.entryNumber,
      total,
    };
  });

  return result;
}
