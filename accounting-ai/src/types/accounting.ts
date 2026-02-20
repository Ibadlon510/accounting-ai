// ─── Account Types ──────────────────────────────────────────
export type AccountCategory = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";
export type PeriodStatus = "open" | "closed" | "locked";
export type JournalStatus = "draft" | "posted" | "reversed";
export type SourceType = "manual" | "invoice" | "bill" | "payment" | "transfer" | "adjustment";

export interface AccountType {
  id: string;
  name: string;
  category: AccountCategory;
  normalBalance: NormalBalance;
  displayOrder: number;
}

export interface Account {
  id: string;
  organizationId: string;
  accountTypeId: string;
  accountType?: AccountType;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  isSystem: boolean;
  taxCode?: string;
  currency?: string;
  balance?: number; // computed field
  children?: Account[];
}

export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description?: string;
  debit: number;
  credit: number;
  currency?: string;
  exchangeRate?: number;
  taxCode?: string;
  taxAmount?: number;
  lineOrder: number;
}

export interface JournalEntry {
  id?: string;
  organizationId: string;
  periodId: string;
  entryNumber?: string;
  entryDate: string;
  description: string;
  reference?: string;
  sourceType: SourceType;
  sourceId?: string;
  status: JournalStatus;
  currency: string;
  exchangeRate: number;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
  postedAt?: string;
  postedBy?: string;
  createdAt?: string;
}

export interface AccountingPeriod {
  id: string;
  organizationId: string;
  fiscalYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  closedAt?: string;
  closedBy?: string;
}

export interface FiscalYear {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  periods?: AccountingPeriod[];
}

// ─── Ledger & Reports ───────────────────────────────────────

export interface LedgerEntry {
  date: string;
  entryNumber: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountCategory: AccountCategory;
  debit: number;
  credit: number;
}

export interface TrialBalanceTotals {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}
