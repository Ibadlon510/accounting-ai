export interface PdfShowSections {
  terms: boolean;
  notes: boolean;
  payment: boolean;
  signature: boolean;
  qrCode: boolean;
}

export interface PdfOrganization {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  taxRegistrationNumber: string | null;
  currency: string;
  /** @deprecated Use PdfRenderSettings from document_type_pdf_settings or pdfTemplates instead */
  pdfAccentColor?: string | null;
  /** @deprecated Use PdfRenderSettings */
  pdfFontFamily?: string | null;
  /** @deprecated Use PdfRenderSettings */
  pdfMarginTop?: string | null;
  /** @deprecated Use PdfRenderSettings */
  pdfMarginRight?: string | null;
  /** @deprecated Use PdfRenderSettings */
  pdfMarginBottom?: string | null;
  /** @deprecated Use PdfRenderSettings */
  pdfMarginLeft?: string | null;
  /** @deprecated Use PdfRenderSettings */
  pdfShowSections?: PdfShowSections | null;
  numberFormat?: string;
  dateFormat?: string;
  pdfPaymentInfo?: string | null;
  pdfDefaultTerms?: string | null;
  pdfDefaultNotes?: string | null;
}

export interface PdfRenderSettings {
  pageSize: string;
  orientation: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  accentColor: string;
  fontFamily: string;
  showSections: PdfShowSections;
}

export interface PdfInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface PdfInvoiceData {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress?: string | null;
  customerEmail?: string | null;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string | null;
  terms?: string | null;
  paymentInfo?: string | null;
  lines: PdfInvoiceLine[];
}

export interface PdfBillLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface PdfBillData {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierAddress?: string | null;
  supplierEmail?: string | null;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string | null;
  terms?: string | null;
  paymentInfo?: string | null;
  lines: PdfBillLine[];
}

export interface PdfCreditNoteData {
  id: string;
  creditNoteNumber: string;
  creditNoteType: "sales" | "purchase";
  date: string;
  entityName: string;
  entityAddress?: string | null;
  reason?: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  lines: { description: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number }[];
}

export interface PdfStatementEntry {
  date: string;
  type: "Invoice" | "Credit Note" | "Receipt" | "Refund";
  ref: string;
  debit: number;
  credit: number;
}

export interface PdfStatementData {
  customer: { id: string; name: string; city: string; country: string; address?: string | null };
  invoices: { id: string; issueDate: string; invoiceNumber: string; total: number }[];
  creditNotes: { id: string; issueDate: string; creditNoteNumber: string; total: number }[];
  payments: { id: string; paymentDate: string; paymentNumber: string; amount: number }[];
  refunds: { id: string; paymentDate: string; paymentNumber: string; amount: number }[];
  totalInvoiced: number;
  totalCreditNotes: number;
  totalPaid: number;
  totalRefunded: number;
  balance: number;
}

export interface PdfAccountLine {
  code: string;
  name: string;
  amount: number;
}

export interface PdfProfitAndLossData {
  revenue: PdfAccountLine[];
  expense: PdfAccountLine[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  periodFrom: string;
  periodTo: string;
}

export interface PdfBalanceSheetData {
  asset: PdfAccountLine[];
  liability: PdfAccountLine[];
  equity: PdfAccountLine[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
  isBalanced: boolean;
  asOfDate: string;
}

export interface PdfVatTransaction {
  date: string;
  type: "output" | "input";
  ref: string;
  entity: string;
  taxable: number;
  vat: number;
}

export interface PdfVatAuditData {
  outputVAT: number;
  inputVAT: number;
  netPayable: number;
  outputCount: number;
  inputCount: number;
  transactions: PdfVatTransaction[];
  periodLabel: string;
}

export interface PdfInventoryItem {
  id: string;
  sku: string;
  name: string;
  quantityOnHand: number;
  unitOfMeasure: string;
  costPrice: number;
  totalValue: number;
}

export interface PdfInventoryData {
  items: PdfInventoryItem[];
  totalValue: number;
  totalUnits: number;
  productCount: number;
  asOfDate: string;
}

export interface PlaceholderDefinition {
  key: string;
  label: string;
  category: string;
  description: string;
  sampleValue: string;
  type: "string" | "number" | "date" | "array" | "boolean";
}

export interface PlaceholderCategory {
  id: string;
  label: string;
  placeholders: PlaceholderDefinition[];
}

export interface PlaceholderHelper {
  syntax: string;
  description: string;
}

export interface PlaceholderRegistry {
  categories: PlaceholderCategory[];
  helpers: PlaceholderHelper[];
}

export interface CustomSlots {
  headerHtml?: string;
  footerHtml?: string;
  customCss?: string;
  watermark?: string;
}

export interface PdfGenerateOptions {
  pageSize?: "A4" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  margins?: { top: string; right: string; bottom: string; left: string };
  displayHeaderFooter?: boolean;
}

export type PdfDocumentType =
  | "invoice" | "bill" | "credit_note" | "statement"
  | "profit_and_loss" | "balance_sheet" | "vat_audit" | "inventory_valuation";

export type EmailDocumentType =
  | "invoice" | "bill" | "statement" | "payment_receipt" | "payment_reminder" | "overdue_notice";
