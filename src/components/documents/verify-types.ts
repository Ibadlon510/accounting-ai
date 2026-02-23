export type Account = { id: string; code: string; name: string };
export type Customer = { id: string; name: string; email?: string; phone?: string; isActive?: boolean };
export type Supplier = { id: string; name: string; email?: string; phone?: string; isActive?: boolean };

export type InvoiceLine = {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
};

export type BillLine = InvoiceLine & { glAccountId?: string };

export type ExpenseLine = InvoiceLine & { glAccountId: string };

export type ExtractedData = {
  document_type?: string;
  merchant?: { name?: string; trn?: string; address?: string };
  invoice?: {
    date?: string;
    invoice_number?: string;
    total_amount?: number;
    tax_amount?: number;
    net_amount?: number;
    currency?: string;
  };
  gl_prediction?: { code?: string; confidence?: number };
  validation?: { math_check_passed?: boolean; issues?: string[] };
};
