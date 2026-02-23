export type BankAccount = {
  id: string;
  accountName: string;
  bankName?: string;
  currency: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  isActive?: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  email?: string;
  isActive?: boolean;
};

export type Allocation = {
  id: string;
  documentId: string;
  amount: number;
};

export type InvoiceOption = {
  id: string;
  customerId: string;
  invoiceNumber: string;
  total: number;
  amountDue: number;
};

export type BillOption = {
  id: string;
  supplierId: string;
  billNumber: string;
  total: number;
  amountDue: number;
  amountPaid?: number;
};

export type BankingReceipt = {
  id: string;
  bankAccountId: string;
  accountName: string;
  currency: string;
  transactionDate: string;
  description: string;
  amount: number;
  type: string;
  reference: string | null;
  category: string | null;
  isReconciled: boolean;
  isInterAccountTransfer: boolean;
  entityName?: string;
};

export type BankingPayment = {
  id: string;
  bankAccountId: string;
  accountName: string;
  currency: string;
  transactionDate: string;
  description: string;
  amount: number;
  type: string;
  reference: string | null;
  category: string | null;
  isReconciled: boolean;
  isInterAccountTransfer: boolean;
  entityName?: string;
};

export type BankingTransfer = {
  id: string;
  date: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  reference: string | null;
};
