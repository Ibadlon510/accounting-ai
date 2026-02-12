export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  transactionDate: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  reference: string;
  category: string;
  isReconciled: boolean;
  suggestedAccount?: string;
  confidence?: number;
}

export const mockBankAccounts: BankAccount[] = [
  { id: "ba-001", accountName: "Main Operating Account", bankName: "Emirates NBD", accountNumber: "1017-XXXXXX-01", iban: "AE12 0260 0010 1700 0000 01", currency: "AED", currentBalance: 482000, isActive: true },
  { id: "ba-002", accountName: "USD Account", bankName: "Emirates NBD", accountNumber: "1017-XXXXXX-02", iban: "AE12 0260 0010 1700 0000 02", currency: "USD", currentBalance: 45000, isActive: true },
  { id: "ba-003", accountName: "Savings Account", bankName: "ADCB", accountNumber: "3045-XXXXXX-01", iban: "AE34 0030 3045 0000 0000 01", currency: "AED", currentBalance: 250000, isActive: true },
];

export const mockBankTransactions: BankTransaction[] = [
  { id: "bt-001", bankAccountId: "ba-001", transactionDate: "2026-02-10", description: "TRF FROM AL FUTTAIM GROUP", amount: 52500, type: "credit", reference: "TRF-28012026", category: "Customer Payment", isReconciled: true, suggestedAccount: "Accounts Receivable", confidence: 0.95 },
  { id: "bt-002", bankAccountId: "ba-001", transactionDate: "2026-02-10", description: "TRF FROM MAJID AL FUTTAIM", amount: 15000, type: "credit", reference: "TRF-10022026", category: "Customer Payment", isReconciled: true, suggestedAccount: "Accounts Receivable", confidence: 0.92 },
  { id: "bt-003", bankAccountId: "ba-001", transactionDate: "2026-02-01", description: "SALARY TRANSFER - JANUARY", amount: 45000, type: "debit", reference: "SAL-JAN-2026", category: "Payroll", isReconciled: true, suggestedAccount: "Salaries & Wages", confidence: 0.98 },
  { id: "bt-004", bankAccountId: "ba-001", transactionDate: "2026-02-01", description: "NATIONAL PROPERTIES - RENT", amount: 15000, type: "debit", reference: "RENT-FEB-2026", category: "Rent", isReconciled: true, suggestedAccount: "Office Rent", confidence: 0.99 },
  { id: "bt-005", bankAccountId: "ba-001", transactionDate: "2026-02-05", description: "GULF IT SOLUTIONS - EQUIPMENT", amount: 15750, type: "debit", reference: "PO-2026-003", category: "Equipment", isReconciled: false, suggestedAccount: "Office Equipment", confidence: 0.85 },
  { id: "bt-006", bankAccountId: "ba-001", transactionDate: "2026-02-08", description: "DEWA - UTILITY BILL", amount: 4200, type: "debit", reference: "DEWA-JAN", category: "Utilities", isReconciled: false, suggestedAccount: "Electricity (DEWA)", confidence: 0.97 },
  { id: "bt-007", bankAccountId: "ba-001", transactionDate: "2026-02-08", description: "DU - TELECOM SERVICES", amount: 3150, type: "debit", reference: "DU-JAN", category: "Telecom", isReconciled: false, suggestedAccount: "Telephone & Internet", confidence: 0.96 },
  { id: "bt-008", bankAccountId: "ba-001", transactionDate: "2026-02-12", description: "PETROL STATION - ENOC", amount: 350, type: "debit", reference: "POS-120226-01", category: "", isReconciled: false, suggestedAccount: "Travel & Entertainment", confidence: 0.62 },
  { id: "bt-009", bankAccountId: "ba-001", transactionDate: "2026-02-12", description: "AMAZON.AE - OFFICE SUPPLIES", amount: 890, type: "debit", reference: "AMZ-120226", category: "", isReconciled: false, suggestedAccount: "Office Supplies", confidence: 0.78 },
  { id: "bt-010", bankAccountId: "ba-001", transactionDate: "2026-02-14", description: "BANK CHARGES - MONTHLY", amount: 150, type: "debit", reference: "FEE-FEB-2026", category: "Bank Charges", isReconciled: false, suggestedAccount: "Bank Charges", confidence: 0.99 },
];

export function getBankingStats() {
  const totalBalance = mockBankAccounts.reduce((s, a) => s + (a.currency === "AED" ? a.currentBalance : a.currentBalance * 3.67), 0);
  const unreconciled = mockBankTransactions.filter(t => !t.isReconciled).length;
  const reconciled = mockBankTransactions.filter(t => t.isReconciled).length;
  return { totalBalance, unreconciled, reconciled, totalTransactions: mockBankTransactions.length };
}
