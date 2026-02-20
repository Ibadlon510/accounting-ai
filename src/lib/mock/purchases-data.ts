export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxNumber: string;
  city: string;
  country: string;
  currency: string;
  paymentTermsDays: number;
  isActive: boolean;
  outstandingBalance: number;
}

export interface BillLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface Bill {
  id: string;
  supplierId: string;
  supplierName: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "received" | "paid" | "partial" | "overdue" | "cancelled";
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  lines: BillLine[];
}

export const mockSuppliers: Supplier[] = [
  { id: "sup-001", name: "Du Telecom", email: "billing@du.ae", phone: "+971 4 390 5555", taxNumber: "300123456789003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 15, isActive: true, outstandingBalance: 3150 },
  { id: "sup-002", name: "DEWA", email: "corporate@dewa.gov.ae", phone: "+971 4 601 9999", taxNumber: "300234567890003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 15, isActive: true, outstandingBalance: 4200 },
  { id: "sup-003", name: "Emirates Office Supplies", email: "orders@eos.ae", phone: "+971 4 222 3333", taxNumber: "300345678901003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 30, isActive: true, outstandingBalance: 0 },
  { id: "sup-004", name: "Gulf IT Solutions", email: "sales@gulfitsolutions.ae", phone: "+971 4 444 5555", taxNumber: "300456789012003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 30, isActive: true, outstandingBalance: 15750 },
  { id: "sup-005", name: "National Properties LLC", email: "leasing@natprop.ae", phone: "+971 4 333 4444", taxNumber: "300567890123003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 0, isActive: true, outstandingBalance: 0 },
];

export const mockBills: Bill[] = [
  {
    id: "bill-001", supplierId: "sup-002", supplierName: "DEWA", billNumber: "DEWA-JAN-2026",
    issueDate: "2026-01-31", dueDate: "2026-02-15", status: "received",
    subtotal: 4000, taxAmount: 200, total: 4200, amountPaid: 0, amountDue: 4200,
    lines: [
      { id: "bl-1", description: "Electricity - January 2026", quantity: 1, unitPrice: 3200, amount: 3200, taxRate: 5, taxAmount: 160 },
      { id: "bl-2", description: "Water - January 2026", quantity: 1, unitPrice: 800, amount: 800, taxRate: 5, taxAmount: 40 },
    ],
  },
  {
    id: "bill-002", supplierId: "sup-001", supplierName: "Du Telecom", billNumber: "DU-JAN-2026",
    issueDate: "2026-02-01", dueDate: "2026-02-16", status: "received",
    subtotal: 3000, taxAmount: 150, total: 3150, amountPaid: 0, amountDue: 3150,
    lines: [
      { id: "bl-3", description: "Business Internet 500Mbps", quantity: 1, unitPrice: 2000, amount: 2000, taxRate: 5, taxAmount: 100 },
      { id: "bl-4", description: "Business Mobile Plans x5", quantity: 5, unitPrice: 200, amount: 1000, taxRate: 5, taxAmount: 50 },
    ],
  },
  {
    id: "bill-003", supplierId: "sup-004", supplierName: "Gulf IT Solutions", billNumber: "GIT-2026-045",
    issueDate: "2026-01-18", dueDate: "2026-02-17", status: "received",
    subtotal: 15000, taxAmount: 750, total: 15750, amountPaid: 0, amountDue: 15750,
    lines: [
      { id: "bl-5", description: "Dell Monitors x10", quantity: 10, unitPrice: 1200, amount: 12000, taxRate: 5, taxAmount: 600 },
      { id: "bl-6", description: "Keyboard & Mouse Combo x10", quantity: 10, unitPrice: 300, amount: 3000, taxRate: 5, taxAmount: 150 },
    ],
  },
  {
    id: "bill-004", supplierId: "sup-005", supplierName: "National Properties LLC", billNumber: "NP-FEB-2026",
    issueDate: "2026-02-01", dueDate: "2026-02-01", status: "paid",
    subtotal: 15000, taxAmount: 0, total: 15000, amountPaid: 15000, amountDue: 0,
    lines: [
      { id: "bl-7", description: "Office Rent - February 2026", quantity: 1, unitPrice: 15000, amount: 15000, taxRate: 0, taxAmount: 0 },
    ],
  },
  {
    id: "bill-005", supplierId: "sup-003", supplierName: "Emirates Office Supplies", billNumber: "EOS-2026-112",
    issueDate: "2026-01-22", dueDate: "2026-02-21", status: "paid",
    subtotal: 2800, taxAmount: 140, total: 2940, amountPaid: 2940, amountDue: 0,
    lines: [
      { id: "bl-8", description: "A4 Paper (50 reams)", quantity: 50, unitPrice: 25, amount: 1250, taxRate: 5, taxAmount: 62.5 },
      { id: "bl-9", description: "Printer Toner Cartridges", quantity: 5, unitPrice: 310, amount: 1550, taxRate: 5, taxAmount: 77.5 },
    ],
  },
];

export function getPurchaseStats() {
  const totalExpenses = mockBills.reduce((s, b) => s + b.total, 0);
  const totalPaid = mockBills.reduce((s, b) => s + b.amountPaid, 0);
  const totalOutstanding = mockBills.reduce((s, b) => s + b.amountDue, 0);
  return { totalExpenses, totalPaid, totalOutstanding, billCount: mockBills.length, supplierCount: mockSuppliers.filter(s => s.isActive).length };
}
