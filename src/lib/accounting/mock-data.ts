import { ACCOUNT_TYPES, UAE_CHART_OF_ACCOUNTS } from "./uae-chart-of-accounts";
import type {
  Account,
  AccountType,
  JournalEntry,
  AccountingPeriod,
  FiscalYear,
  TrialBalanceRow,
  LedgerEntry,
} from "@/types/accounting";

// Generate mock IDs
let idCounter = 1;
function mockId() {
  return `mock-${String(idCounter++).padStart(4, "0")}`;
}

// ─── Account Types ──────────────────────────────────────────
export const mockAccountTypes: AccountType[] = ACCOUNT_TYPES.map((t) => ({
  id: mockId(),
  ...t,
}));

function getTypeByName(name: string): AccountType {
  return mockAccountTypes.find((t) => t.name === name) ?? mockAccountTypes[0];
}

// ─── Chart of Accounts ──────────────────────────────────────
export const mockAccounts: Account[] = UAE_CHART_OF_ACCOUNTS.map((a) => {
  const accountType = getTypeByName(a.typeName);
  return {
    id: mockId(),
    organizationId: "org-001",
    accountTypeId: accountType.id,
    accountType,
    code: a.code,
    name: a.name,
    isActive: true,
    isSystem: a.isSystem,
    taxCode: a.taxCode,
    balance: 0,
  };
});

// ─── Fiscal Years & Periods ─────────────────────────────────
export const mockFiscalYear: FiscalYear = {
  id: "fy-2026",
  organizationId: "org-001",
  name: "FY 2026",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  isClosed: false,
};

export const mockPeriods: AccountingPeriod[] = [
  { id: "period-01", organizationId: "org-001", fiscalYearId: "fy-2026", name: "January 2026", startDate: "2026-01-01", endDate: "2026-01-31", status: "closed" },
  { id: "period-02", organizationId: "org-001", fiscalYearId: "fy-2026", name: "February 2026", startDate: "2026-02-01", endDate: "2026-02-28", status: "open" },
  { id: "period-03", organizationId: "org-001", fiscalYearId: "fy-2026", name: "March 2026", startDate: "2026-03-01", endDate: "2026-03-31", status: "open" },
  { id: "period-04", organizationId: "org-001", fiscalYearId: "fy-2026", name: "April 2026", startDate: "2026-04-01", endDate: "2026-04-30", status: "open" },
  { id: "period-05", organizationId: "org-001", fiscalYearId: "fy-2026", name: "May 2026", startDate: "2026-05-01", endDate: "2026-05-31", status: "open" },
  { id: "period-06", organizationId: "org-001", fiscalYearId: "fy-2026", name: "June 2026", startDate: "2026-06-01", endDate: "2026-06-30", status: "open" },
  { id: "period-07", organizationId: "org-001", fiscalYearId: "fy-2026", name: "July 2026", startDate: "2026-07-01", endDate: "2026-07-31", status: "open" },
  { id: "period-08", organizationId: "org-001", fiscalYearId: "fy-2026", name: "August 2026", startDate: "2026-08-01", endDate: "2026-08-31", status: "open" },
  { id: "period-09", organizationId: "org-001", fiscalYearId: "fy-2026", name: "September 2026", startDate: "2026-09-01", endDate: "2026-09-30", status: "open" },
  { id: "period-10", organizationId: "org-001", fiscalYearId: "fy-2026", name: "October 2026", startDate: "2026-10-01", endDate: "2026-10-31", status: "open" },
  { id: "period-11", organizationId: "org-001", fiscalYearId: "fy-2026", name: "November 2026", startDate: "2026-11-01", endDate: "2026-11-30", status: "open" },
  { id: "period-12", organizationId: "org-001", fiscalYearId: "fy-2026", name: "December 2026", startDate: "2026-12-01", endDate: "2026-12-31", status: "open" },
];

// ─── Sample Journal Entries ─────────────────────────────────
function findAccount(code: string) {
  return mockAccounts.find((a) => a.code === code)!;
}

export const mockJournalEntries: JournalEntry[] = [
  {
    id: "je-001",
    organizationId: "org-001",
    periodId: "period-01",
    entryNumber: "JE-202601-0001",
    entryDate: "2026-01-05",
    description: "Initial capital investment",
    sourceType: "manual",
    status: "posted",
    currency: "AED",
    exchangeRate: 1,
    totalDebit: 500000,
    totalCredit: 500000,
    lines: [
      { accountId: findAccount("1110").id, accountCode: "1110", accountName: "Main Bank Account (AED)", debit: 500000, credit: 0, lineOrder: 1 },
      { accountId: findAccount("3010").id, accountCode: "3010", accountName: "Share Capital", debit: 0, credit: 500000, lineOrder: 2 },
    ],
    postedAt: "2026-01-05T09:00:00Z",
    createdAt: "2026-01-05T09:00:00Z",
  },
  {
    id: "je-002",
    organizationId: "org-001",
    periodId: "period-01",
    entryNumber: "JE-202601-0002",
    entryDate: "2026-01-10",
    description: "Office rent payment - January",
    sourceType: "manual",
    status: "posted",
    currency: "AED",
    exchangeRate: 1,
    totalDebit: 15000,
    totalCredit: 15000,
    lines: [
      { accountId: findAccount("6110").id, accountCode: "6110", accountName: "Office Rent", debit: 15000, credit: 0, lineOrder: 1 },
      { accountId: findAccount("1110").id, accountCode: "1110", accountName: "Main Bank Account (AED)", debit: 0, credit: 15000, lineOrder: 2 },
    ],
    postedAt: "2026-01-10T10:00:00Z",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "je-003",
    organizationId: "org-001",
    periodId: "period-01",
    entryNumber: "JE-202601-0003",
    entryDate: "2026-01-15",
    description: "Sales invoice #INV-001 - IT consulting services",
    reference: "INV-001",
    sourceType: "invoice",
    status: "posted",
    currency: "AED",
    exchangeRate: 1,
    totalDebit: 52500,
    totalCredit: 52500,
    lines: [
      { accountId: findAccount("1210").id, accountCode: "1210", accountName: "Trade Receivables", debit: 52500, credit: 0, lineOrder: 1 },
      { accountId: findAccount("4020").id, accountCode: "4020", accountName: "Service Revenue", debit: 0, credit: 50000, lineOrder: 2 },
      { accountId: findAccount("2210").id, accountCode: "2210", accountName: "VAT Output", debit: 0, credit: 2500, taxCode: "VAT5", taxAmount: 2500, lineOrder: 3 },
    ],
    postedAt: "2026-01-15T11:00:00Z",
    createdAt: "2026-01-15T11:00:00Z",
  },
  {
    id: "je-004",
    organizationId: "org-001",
    periodId: "period-01",
    entryNumber: "JE-202601-0004",
    entryDate: "2026-01-18",
    description: "Purchase of office equipment",
    sourceType: "manual",
    status: "posted",
    currency: "AED",
    exchangeRate: 1,
    totalDebit: 10500,
    totalCredit: 10500,
    lines: [
      { accountId: findAccount("1520").id, accountCode: "1520", accountName: "Office Equipment", debit: 10000, credit: 0, lineOrder: 1 },
      { accountId: findAccount("1450").id, accountCode: "1450", accountName: "VAT Input (Recoverable)", debit: 500, credit: 0, taxCode: "VAT5", taxAmount: 500, lineOrder: 2 },
      { accountId: findAccount("1110").id, accountCode: "1110", accountName: "Main Bank Account (AED)", debit: 0, credit: 10500, lineOrder: 3 },
    ],
    postedAt: "2026-01-18T14:00:00Z",
    createdAt: "2026-01-18T14:00:00Z",
  },
  {
    id: "je-005",
    organizationId: "org-001",
    periodId: "period-01",
    entryNumber: "JE-202601-0005",
    entryDate: "2026-01-25",
    description: "January salary payment",
    sourceType: "manual",
    status: "posted",
    currency: "AED",
    exchangeRate: 1,
    totalDebit: 45000,
    totalCredit: 45000,
    lines: [
      { accountId: findAccount("6010").id, accountCode: "6010", accountName: "Basic Salaries", debit: 35000, credit: 0, lineOrder: 1 },
      { accountId: findAccount("6020").id, accountCode: "6020", accountName: "Housing Allowance", debit: 7000, credit: 0, lineOrder: 2 },
      { accountId: findAccount("6030").id, accountCode: "6030", accountName: "Transport Allowance", debit: 3000, credit: 0, lineOrder: 3 },
      { accountId: findAccount("1110").id, accountCode: "1110", accountName: "Main Bank Account (AED)", debit: 0, credit: 45000, lineOrder: 4 },
    ],
    postedAt: "2026-01-25T16:00:00Z",
    createdAt: "2026-01-25T16:00:00Z",
  },
  {
    id: "je-006",
    organizationId: "org-001",
    periodId: "period-01",
    entryNumber: "JE-202601-0006",
    entryDate: "2026-01-28",
    description: "Customer payment received - INV-001",
    reference: "INV-001",
    sourceType: "payment",
    status: "posted",
    currency: "AED",
    exchangeRate: 1,
    totalDebit: 52500,
    totalCredit: 52500,
    lines: [
      { accountId: findAccount("1110").id, accountCode: "1110", accountName: "Main Bank Account (AED)", debit: 52500, credit: 0, lineOrder: 1 },
      { accountId: findAccount("1210").id, accountCode: "1210", accountName: "Trade Receivables", debit: 0, credit: 52500, lineOrder: 2 },
    ],
    postedAt: "2026-01-28T09:00:00Z",
    createdAt: "2026-01-28T09:00:00Z",
  },
];

// ─── Computed Data for Reports ──────────────────────────────

export function getTrialBalance(): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number } {
  const accountBalances = new Map<string, { debit: number; credit: number }>();

  for (const entry of mockJournalEntries) {
    if (entry.status !== "posted") continue;
    for (const line of entry.lines) {
      const key = line.accountId;
      const current = accountBalances.get(key) ?? { debit: 0, credit: 0 };
      current.debit += Number(line.debit) || 0;
      current.credit += Number(line.credit) || 0;
      accountBalances.set(key, current);
    }
  }

  const rows: TrialBalanceRow[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (const account of mockAccounts) {
    const bal = accountBalances.get(account.id);
    if (!bal) continue;

    const normalBalance = account.accountType?.normalBalance ?? "debit";
    let debit = 0;
    let credit = 0;

    if (normalBalance === "debit") {
      const net = bal.debit - bal.credit;
      if (net >= 0) debit = net;
      else credit = Math.abs(net);
    } else {
      const net = bal.credit - bal.debit;
      if (net >= 0) credit = net;
      else debit = Math.abs(net);
    }

    if (debit !== 0 || credit !== 0) {
      rows.push({
        accountCode: account.code,
        accountName: account.name,
        accountCategory: account.accountType?.category ?? "asset",
        debit: Math.round(debit * 100) / 100,
        credit: Math.round(credit * 100) / 100,
      });
      totalDebit += debit;
      totalCredit += credit;
    }
  }

  rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  return {
    rows,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
  };
}

export function getGeneralLedger(accountId: string): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  let runningBalance = 0;
  const account = mockAccounts.find((a) => a.id === accountId);
  const normalBalance = account?.accountType?.normalBalance ?? "debit";

  for (const je of mockJournalEntries) {
    if (je.status !== "posted") continue;
    for (const line of je.lines) {
      if (line.accountId !== accountId) continue;
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      if (normalBalance === "debit") {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      entries.push({
        date: je.entryDate,
        entryNumber: je.entryNumber ?? "",
        description: je.description,
        reference: je.reference,
        debit,
        credit,
        balance: Math.round(runningBalance * 100) / 100,
      });
    }
  }

  return entries;
}
