export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxNumber: string;
  city: string;
  country: string;
  currency: string;
  creditLimit: number;
  paymentTermsDays: number;
  isActive: boolean;
  outstandingBalance: number;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  lines: InvoiceLine[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  entityName: string;
  amount: number;
  method: string;
  reference: string;
  invoiceNumber?: string;
}

export const mockCustomers: Customer[] = [
  { id: "cust-001", name: "Al Futtaim Group", email: "accounts@alfuttaim.ae", phone: "+971 4 209 8888", taxNumber: "100123456789003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: 500000, paymentTermsDays: 30, isActive: true, outstandingBalance: 52500 },
  { id: "cust-002", name: "Emaar Properties", email: "finance@emaar.ae", phone: "+971 4 367 3333", taxNumber: "100234567890003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: 1000000, paymentTermsDays: 45, isActive: true, outstandingBalance: 157500 },
  { id: "cust-003", name: "ADNOC Distribution", email: "ap@adnoc.ae", phone: "+971 2 602 0000", taxNumber: "100345678901003", city: "Abu Dhabi", country: "UAE", currency: "AED", creditLimit: 750000, paymentTermsDays: 30, isActive: true, outstandingBalance: 0 },
  { id: "cust-004", name: "Majid Al Futtaim", email: "accounts@maf.ae", phone: "+971 4 294 9200", taxNumber: "100456789012003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: 300000, paymentTermsDays: 30, isActive: true, outstandingBalance: 31500 },
  { id: "cust-005", name: "Dubai Holding", email: "finance@dubaiholding.com", phone: "+971 4 362 1111", taxNumber: "100567890123003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: 2000000, paymentTermsDays: 60, isActive: true, outstandingBalance: 210000 },
  { id: "cust-006", name: "Etisalat Business", email: "b2b@etisalat.ae", phone: "+971 800 101", taxNumber: "100678901234003", city: "Abu Dhabi", country: "UAE", currency: "AED", creditLimit: 200000, paymentTermsDays: 15, isActive: false, outstandingBalance: 0 },
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv-001", customerId: "cust-001", customerName: "Al Futtaim Group", invoiceNumber: "INV-2026-001",
    issueDate: "2026-01-15", dueDate: "2026-02-14", status: "paid",
    subtotal: 50000, taxAmount: 2500, total: 52500, amountPaid: 52500, amountDue: 0,
    lines: [
      { id: "il-1", description: "IT Consulting - System Audit", quantity: 1, unitPrice: 30000, amount: 30000, taxRate: 5, taxAmount: 1500 },
      { id: "il-2", description: "Network Infrastructure Review", quantity: 1, unitPrice: 20000, amount: 20000, taxRate: 5, taxAmount: 1000 },
    ],
  },
  {
    id: "inv-002", customerId: "cust-002", customerName: "Emaar Properties", invoiceNumber: "INV-2026-002",
    issueDate: "2026-01-20", dueDate: "2026-03-06", status: "sent",
    subtotal: 150000, taxAmount: 7500, total: 157500, amountPaid: 0, amountDue: 157500,
    lines: [
      { id: "il-3", description: "ERP Implementation Phase 1", quantity: 1, unitPrice: 100000, amount: 100000, taxRate: 5, taxAmount: 5000 },
      { id: "il-4", description: "Data Migration Services", quantity: 50, unitPrice: 1000, amount: 50000, taxRate: 5, taxAmount: 2500 },
    ],
  },
  {
    id: "inv-003", customerId: "cust-004", customerName: "Majid Al Futtaim", invoiceNumber: "INV-2026-003",
    issueDate: "2026-02-01", dueDate: "2026-03-03", status: "partial",
    subtotal: 30000, taxAmount: 1500, total: 31500, amountPaid: 15000, amountDue: 16500,
    lines: [
      { id: "il-5", description: "Monthly IT Support", quantity: 1, unitPrice: 30000, amount: 30000, taxRate: 5, taxAmount: 1500 },
    ],
  },
  {
    id: "inv-004", customerId: "cust-005", customerName: "Dubai Holding", invoiceNumber: "INV-2026-004",
    issueDate: "2026-02-05", dueDate: "2026-04-06", status: "sent",
    subtotal: 200000, taxAmount: 10000, total: 210000, amountPaid: 0, amountDue: 210000,
    lines: [
      { id: "il-6", description: "Custom Software Development", quantity: 200, unitPrice: 800, amount: 160000, taxRate: 5, taxAmount: 8000 },
      { id: "il-7", description: "Project Management", quantity: 40, unitPrice: 1000, amount: 40000, taxRate: 5, taxAmount: 2000 },
    ],
  },
  {
    id: "inv-005", customerId: "cust-003", customerName: "ADNOC Distribution", invoiceNumber: "INV-2026-005",
    issueDate: "2026-01-10", dueDate: "2026-02-09", status: "overdue",
    subtotal: 75000, taxAmount: 3750, total: 78750, amountPaid: 0, amountDue: 78750,
    lines: [
      { id: "il-8", description: "Cloud Infrastructure Setup", quantity: 1, unitPrice: 75000, amount: 75000, taxRate: 5, taxAmount: 3750 },
    ],
  },
];

export const mockPaymentsReceived: Payment[] = [
  { id: "pay-001", paymentNumber: "PAY-R-001", paymentDate: "2026-01-28", entityName: "Al Futtaim Group", amount: 52500, method: "Bank Transfer", reference: "TRF-28012026", invoiceNumber: "INV-2026-001" },
  { id: "pay-002", paymentNumber: "PAY-R-002", paymentDate: "2026-02-10", entityName: "Majid Al Futtaim", amount: 15000, method: "Bank Transfer", reference: "TRF-10022026", invoiceNumber: "INV-2026-003" },
];

export function getSalesStats() {
  const totalRevenue = mockInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = mockInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalOutstanding = mockInvoices.reduce((s, i) => s + i.amountDue, 0);
  const overdueAmount = mockInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amountDue, 0);
  return { totalRevenue, totalPaid, totalOutstanding, overdueAmount, invoiceCount: mockInvoices.length, customerCount: mockCustomers.filter(c => c.isActive).length };
}
