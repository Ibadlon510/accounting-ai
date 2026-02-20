import type { JournalEntry, JournalEntryLine } from "@/types/accounting";

// ─── Validation ─────────────────────────────────────────────

export class AccountingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountingError";
  }
}

/**
 * Validates that a journal entry follows double-entry rules:
 * 1. Must have at least 2 lines
 * 2. Total debits must equal total credits
 * 3. Each line must have either debit OR credit (not both, not neither)
 * 4. All amounts must be positive
 */
export function validateJournalEntry(entry: {
  lines: JournalEntryLine[];
  description: string;
  entryDate: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!entry.description?.trim()) {
    errors.push("Description is required");
  }

  if (!entry.entryDate) {
    errors.push("Entry date is required");
  }

  if (!entry.lines || entry.lines.length < 2) {
    errors.push("Journal entry must have at least 2 lines");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = 0; i < (entry.lines?.length ?? 0); i++) {
    const line = entry.lines[i];

    if (!line.accountId) {
      errors.push(`Line ${i + 1}: Account is required`);
    }

    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    if (debit < 0 || credit < 0) {
      errors.push(`Line ${i + 1}: Amounts must be positive`);
    }

    if (debit > 0 && credit > 0) {
      errors.push(`Line ${i + 1}: A line cannot have both debit and credit`);
    }

    if (debit === 0 && credit === 0) {
      errors.push(`Line ${i + 1}: A line must have either debit or credit`);
    }

    totalDebit += debit;
    totalCredit += credit;
  }

  // Check balance with 2 decimal precision
  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;

  if (roundedDebit !== roundedCredit) {
    errors.push(
      `Entry is not balanced: Debits (${roundedDebit.toFixed(2)}) ≠ Credits (${roundedCredit.toFixed(2)})`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculates totals for a set of journal lines
 */
export function calculateLineTotals(lines: JournalEntryLine[]): {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
} {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    totalDebit += Number(line.debit) || 0;
    totalCredit += Number(line.credit) || 0;
  }

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  return {
    totalDebit,
    totalCredit,
    isBalanced: totalDebit === totalCredit,
  };
}

/**
 * Generates the next entry number for a given org
 * Format: JE-YYYYMM-XXXX
 */
export function generateEntryNumber(
  date: string,
  sequenceNumber: number
): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String(sequenceNumber).padStart(4, "0");
  return `JE-${year}${month}-${seq}`;
}

/**
 * Determines which accounting period a date falls into
 */
export function findPeriodForDate(
  date: string,
  periods: { id: string; startDate: string; endDate: string; status: string }[]
): { id: string; startDate: string; endDate: string; status: string } | null {
  const targetDate = new Date(date);

  for (const period of periods) {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    if (targetDate >= start && targetDate <= end) {
      return period;
    }
  }

  return null;
}

/**
 * Computes account balance from journal lines
 * For debit-normal accounts (assets, expenses): balance = sum(debits) - sum(credits)
 * For credit-normal accounts (liabilities, equity, revenue): balance = sum(credits) - sum(debits)
 */
export function computeAccountBalance(
  totalDebit: number,
  totalCredit: number,
  normalBalance: "debit" | "credit"
): number {
  if (normalBalance === "debit") {
    return Math.round((totalDebit - totalCredit) * 100) / 100;
  }
  return Math.round((totalCredit - totalDebit) * 100) / 100;
}

/**
 * Format currency amount
 */
export function formatAmount(
  amount: number,
  currency: string = "AED",
  locale: string = "en-AE"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number without currency symbol
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
