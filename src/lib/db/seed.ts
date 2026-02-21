/**
 * Database seed script: populates an organization with full 2025 data
 * (customers, suppliers, items, bank accounts, invoices, bills, payments,
 * journal entries, VAT returns, inventory movements) to replace mock data usage.
 *
 * Usage: DATABASE_URL=... npx tsx src/lib/db/seed.ts
 * Optional: SEED_ORG_ID=uuid to seed a specific org; otherwise uses first org or creates "Demo 2025".
 */

import "dotenv/config";
import { db } from "./index";
import {
  organizations,
  accountTypes,
  chartOfAccounts,
  fiscalYears,
  accountingPeriods,
  customers,
  suppliers,
  items,
  bankAccounts,
  bankTransactions,
  taxCodes,
  invoices,
  invoiceLines,
  bills,
  billLines,
  payments,
  paymentAllocations,
  journalEntries,
  journalLines,
  vatReturns,
  inventoryMovements,
} from "./schema";
import { seedChartOfAccounts } from "./seed-chart-of-accounts";
import { ACCOUNT_TYPES } from "../accounting/uae-chart-of-accounts";
import { eq } from "drizzle-orm";

const YEAR = 2025;

function date(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDays(d: string, days: number): string {
  const x = new Date(d + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + days);
  return x.toISOString().slice(0, 10);
}

async function ensureAccountTypes(): Promise<Map<string, string>> {
  const existing = await db.select().from(accountTypes);
  if (existing.length >= ACCOUNT_TYPES.length) {
    return new Map(existing.map((t) => [t.name, t.id]));
  }
  const existingNames = new Set(existing.map((t) => t.name));
  const toInsert = ACCOUNT_TYPES.filter((t) => !existingNames.has(t.name));
  if (toInsert.length > 0) {
    await db.insert(accountTypes).values(
      toInsert.map((t) => ({
        name: t.name,
        category: t.category,
        normalBalance: t.normalBalance,
        displayOrder: t.displayOrder,
      }))
    );
  }
  const all = await db.select().from(accountTypes);
  return new Map(all.map((t) => [t.name, t.id]));
}

async function getOrCreateOrg(): Promise<string> {
  const orgId = process.env.SEED_ORG_ID;
  if (orgId) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (org) return org.id;
    throw new Error(`Organization ${orgId} not found.`);
  }
  const existing = await db.select().from(organizations).limit(1);
  if (existing.length > 0) return existing[0].id;

  const [inserted] = await db
    .insert(organizations)
    .values({
      name: "Demo 2025",
      currency: "AED",
      fiscalYearStart: 1,
      taxRegistrationNumber: "100123456789003",
      subscriptionPlan: "BUSINESS",
      tokenBalance: 100,
    })
    .returning({ id: organizations.id });
  if (!inserted) throw new Error("Failed to create organization");
  return inserted.id;
}

async function getAccountMap(organizationId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ code: chartOfAccounts.code, id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.organizationId, organizationId));
  return new Map(rows.map((r) => [r.code, r.id]));
}

async function seedFiscalYearAndPeriods(organizationId: string): Promise<{
  fiscalYearId: string;
  periodIdsByMonth: Map<number, string>;
}> {
  const existing = await db
    .select()
    .from(fiscalYears)
    .where(eq(fiscalYears.organizationId, organizationId));
  const fy2025 = existing.find((f) => f.startDate === date(YEAR, 1, 1));
  if (fy2025) {
    const periods = await db
      .select({ id: accountingPeriods.id, startDate: accountingPeriods.startDate })
      .from(accountingPeriods)
      .where(eq(accountingPeriods.fiscalYearId, fy2025.id));
    const byMonth = new Map<number, string>();
    for (const p of periods) {
      const m = parseInt(p.startDate.slice(5, 7), 10);
      byMonth.set(m, p.id);
    }
    return { fiscalYearId: fy2025.id, periodIdsByMonth: byMonth };
  }

  const [fy] = await db
    .insert(fiscalYears)
    .values({
      organizationId,
      name: `FY ${YEAR}`,
      startDate: date(YEAR, 1, 1),
      endDate: date(YEAR, 12, 31),
      isClosed: false,
    })
    .returning({ id: fiscalYears.id });
  if (!fy) throw new Error("Failed to create fiscal year");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const periodIdsByMonth = new Map<number, string>();

  for (let m = 1; m <= 12; m++) {
    const start = date(YEAR, m, 1);
    const end = date(YEAR, m, daysInMonth[m - 1]!);
    const [period] = await db
      .insert(accountingPeriods)
      .values({
        organizationId,
        fiscalYearId: fy.id,
        name: `${monthNames[m - 1]} ${YEAR}`,
        startDate: start,
        endDate: end,
        status: m < 12 ? "open" : "open",
      })
      .returning({ id: accountingPeriods.id });
    if (period) periodIdsByMonth.set(m, period.id);
  }
  return { fiscalYearId: fy.id, periodIdsByMonth };
}

/**
 * Seed full 2025 demo data for a given organization.
 * Can be called from API routes or CLI.
 */
export async function seedDemoData(organizationId: string): Promise<void> {
  await ensureAccountTypes();
  await seedChartOfAccounts(organizationId);
  const accountByCode = await getAccountMap(organizationId);
  const { fiscalYearId, periodIdsByMonth } = await seedFiscalYearAndPeriods(organizationId);

  const acc = (code: string) => accountByCode.get(code)!;

  // ─── Customers ─────────────────────────────────────────────
  const existingCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .limit(1);
  let customerIds: string[];
  if (existingCustomers.length > 0) {
    customerIds = (await db.select({ id: customers.id }).from(customers).where(eq(customers.organizationId, organizationId))).map((c) => c.id);
  } else {
    const customerRows = await db
      .insert(customers)
      .values([
        { organizationId, name: "Al Futtaim Group", email: "accounts@alfuttaim.ae", phone: "+971 4 209 8888", taxNumber: "100123456789003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "500000", paymentTermsDays: 30 },
        { organizationId, name: "Emaar Properties", email: "finance@emaar.ae", phone: "+971 4 367 3333", taxNumber: "100234567890003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "1000000", paymentTermsDays: 45 },
        { organizationId, name: "ADNOC Distribution", email: "ap@adnoc.ae", phone: "+971 2 602 0000", taxNumber: "100345678901003", city: "Abu Dhabi", country: "UAE", currency: "AED", creditLimit: "750000", paymentTermsDays: 30 },
        { organizationId, name: "Majid Al Futtaim", email: "accounts@maf.ae", phone: "+971 4 294 9200", taxNumber: "100456789012003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "300000", paymentTermsDays: 30 },
        { organizationId, name: "Dubai Holding", email: "finance@dubaiholding.com", phone: "+971 4 362 1111", taxNumber: "100567890123003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "2000000", paymentTermsDays: 60 },
        { organizationId, name: "Etisalat Business", email: "b2b@etisalat.ae", phone: "+971 800 101", taxNumber: "100678901234003", city: "Abu Dhabi", country: "UAE", currency: "AED", creditLimit: "200000", paymentTermsDays: 15, isActive: false },
      ])
      .returning({ id: customers.id });
    customerIds = customerRows.map((r) => r.id);
  }
  console.log("Customers:", customerIds.length);

  // ─── Suppliers ─────────────────────────────────────────────
  let supplierIds: string[];
  const existingSuppliers = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.organizationId, organizationId)).limit(1);
  if (existingSuppliers.length > 0) {
    supplierIds = (await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.organizationId, organizationId))).map((s) => s.id);
  } else {
    const supplierRows = await db
      .insert(suppliers)
      .values([
        { organizationId, name: "Du Telecom", email: "billing@du.ae", phone: "+971 4 390 5555", taxNumber: "300123456789003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 15 },
        { organizationId, name: "DEWA", email: "corporate@dewa.gov.ae", phone: "+971 4 601 9999", taxNumber: "300234567890003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 15 },
        { organizationId, name: "Emirates Office Supplies", email: "orders@eos.ae", phone: "+971 4 222 3333", taxNumber: "300345678901003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 30 },
        { organizationId, name: "Gulf IT Solutions", email: "sales@gulfitsolutions.ae", phone: "+971 4 444 5555", taxNumber: "300456789012003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 30 },
        { organizationId, name: "National Properties LLC", email: "leasing@natprop.ae", phone: "+971 4 333 4444", taxNumber: "300567890123003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 0 },
      ])
      .returning({ id: suppliers.id });
    supplierIds = supplierRows.map((r) => r.id);
  }
  console.log("Suppliers:", supplierIds.length);

  // ─── Tax codes ─────────────────────────────────────────────
  const existingTax = await db.select({ id: taxCodes.id }).from(taxCodes).where(eq(taxCodes.organizationId, organizationId)).limit(1);
  if (existingTax.length === 0) {
    await db.insert(taxCodes).values([
      { organizationId, code: "VAT5", name: "VAT 5%", rate: "5", type: "output" },
      { organizationId, code: "VAT5", name: "VAT 5% Input", rate: "5", type: "input" },
      { organizationId, code: "EXEMPT", name: "Exempt", rate: "0", type: "exempt" },
    ]);
  }

  // ─── Items ──────────────────────────────────────────────────
  let itemIds: string[];
  const salesAccountId = acc("4020");
  const purchaseAccountId = acc("5010");
  const inventoryAccountId = acc("1310");
  const existingItems = await db.select({ id: items.id }).from(items).where(eq(items.organizationId, organizationId)).limit(1);
  if (existingItems.length > 0) {
    itemIds = (await db.select({ id: items.id }).from(items).where(eq(items.organizationId, organizationId))).map((i) => i.id);
  } else {
    const itemRows = await db
      .insert(items)
      .values([
        { organizationId, name: "Dell Monitor 27\" 4K", sku: "MON-D27-4K", type: "product", unitOfMeasure: "pcs", salesPrice: "1800", purchasePrice: "1200", costPrice: "1200", quantityOnHand: "15", reorderLevel: "5", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true },
        { organizationId, name: "Logitech MX Keys Keyboard", sku: "KB-LG-MXK", type: "product", unitOfMeasure: "pcs", salesPrice: "550", purchasePrice: "350", costPrice: "350", quantityOnHand: "25", reorderLevel: "10", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true },
        { organizationId, name: "Cat6 Network Cable (305m)", sku: "CBL-CAT6-305", type: "product", unitOfMeasure: "box", salesPrice: "450", purchasePrice: "280", costPrice: "280", quantityOnHand: "8", reorderLevel: "3", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true },
        { organizationId, name: "HP LaserJet Pro Printer", sku: "PRN-HP-LJ", type: "product", unitOfMeasure: "pcs", salesPrice: "2200", purchasePrice: "1500", costPrice: "1500", quantityOnHand: "3", reorderLevel: "2", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true },
        { organizationId, name: "A4 Copy Paper (Ream)", sku: "PPR-A4-500", type: "product", unitOfMeasure: "ream", salesPrice: "30", purchasePrice: "22", costPrice: "22", quantityOnHand: "200", reorderLevel: "50", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true },
        { organizationId, name: "IT Consulting (Hourly)", sku: "SVC-IT-HR", type: "service", unitOfMeasure: "hour", salesPrice: "500", costPrice: "0", taxCode: "VAT5", salesAccountId, purchaseAccountId, trackInventory: false },
        { organizationId, name: "System Audit Package", sku: "SVC-AUDIT", type: "service", unitOfMeasure: "unit", salesPrice: "15000", costPrice: "0", taxCode: "VAT5", salesAccountId, purchaseAccountId, trackInventory: false },
        { organizationId, name: "Wireless Mouse", sku: "MSE-WL-01", type: "product", unitOfMeasure: "pcs", salesPrice: "180", purchasePrice: "95", costPrice: "95", quantityOnHand: "2", reorderLevel: "10", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true },
      ])
      .returning({ id: items.id });
    itemIds = itemRows.map((r) => r.id);
  }
  console.log("Items:", itemIds.length);

  // ─── Bank accounts ─────────────────────────────────────────
  let mainBankId: string;
  let usdBankId: string;
  const existingBanks = await db.select().from(bankAccounts).where(eq(bankAccounts.organizationId, organizationId)).limit(1);
  if (existingBanks.length > 0) {
    const all = await db.select().from(bankAccounts).where(eq(bankAccounts.organizationId, organizationId));
    mainBankId = all[0]!.id;
    usdBankId = all[1]?.id ?? mainBankId;
  } else {
    const ledgerCash = acc("1110");
    const ledgerUsd = acc("1120");
    const [main, usd] = await db
      .insert(bankAccounts)
      .values([
        { organizationId, accountName: "Main Operating Account", bankName: "Emirates NBD", accountNumber: "1017-XXXXXX-01", iban: "AE12026000101700000001", currency: "AED", ledgerAccountId: ledgerCash, currentBalance: "0", isActive: true },
        { organizationId, accountName: "USD Account", bankName: "Emirates NBD", accountNumber: "1017-XXXXXX-02", iban: "AE12026000101700000002", currency: "USD", ledgerAccountId: ledgerUsd, currentBalance: "0", isActive: true },
      ])
      .returning({ id: bankAccounts.id });
    mainBankId = main!.id;
    usdBankId = usd!.id;
  }
  console.log("Bank accounts created");

  // ─── Invoices spread across 2025 ───────────────────────────
  const existingInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.organizationId, organizationId)).limit(1);
  if (existingInvoices.length === 0) {
    const invData: Array<{ month: number; customerIndex: number; subtotal: number; lines: Array<{ desc: string; qty: number; unitPrice: number }> }> = [
      { month: 1, customerIndex: 0, subtotal: 50000, lines: [{ desc: "IT Consulting - System Audit", qty: 1, unitPrice: 30000 }, { desc: "Network Infrastructure Review", qty: 1, unitPrice: 20000 }] },
      { month: 2, customerIndex: 1, subtotal: 150000, lines: [{ desc: "ERP Implementation Phase 1", qty: 1, unitPrice: 100000 }, { desc: "Data Migration Services", qty: 50, unitPrice: 1000 }] },
      { month: 3, customerIndex: 3, subtotal: 30000, lines: [{ desc: "Monthly IT Support", qty: 1, unitPrice: 30000 }] },
      { month: 4, customerIndex: 4, subtotal: 200000, lines: [{ desc: "Custom Software Development", qty: 200, unitPrice: 800 }, { desc: "Project Management", qty: 40, unitPrice: 1000 }] },
      { month: 5, customerIndex: 2, subtotal: 75000, lines: [{ desc: "Cloud Infrastructure Setup", qty: 1, unitPrice: 75000 }] },
      { month: 6, customerIndex: 0, subtotal: 42000, lines: [{ desc: "Support Retainer June", qty: 1, unitPrice: 42000 }] },
      { month: 7, customerIndex: 1, subtotal: 85000, lines: [{ desc: "Phase 2 Consulting", qty: 170, unitPrice: 500 }] },
      { month: 8, customerIndex: 3, subtotal: 28000, lines: [{ desc: "IT Support August", qty: 1, unitPrice: 28000 }] },
      { month: 9, customerIndex: 4, subtotal: 120000, lines: [{ desc: "Integration Services", qty: 120, unitPrice: 1000 }] },
      { month: 10, customerIndex: 2, subtotal: 95000, lines: [{ desc: "Security Audit", qty: 1, unitPrice: 95000 }] },
      { month: 11, customerIndex: 0, subtotal: 38000, lines: [{ desc: "Year-end Support", qty: 1, unitPrice: 38000 }] },
      { month: 12, customerIndex: 1, subtotal: 110000, lines: [{ desc: "Go-live Support", qty: 1, unitPrice: 110000 }] },
    ];
    for (let i = 0; i < invData.length; i++) {
      const d = invData[i]!;
      const issueDate = date(YEAR, d.month, Math.min(15 + i, 28));
      const dueDate = addDays(issueDate, 30);
      const taxAmount = Math.round(d.subtotal * 0.05 * 100) / 100;
      const total = d.subtotal + taxAmount;
      const status = d.month <= 10 ? "paid" : d.month === 11 ? "partial" : "sent";
      const amountPaid = status === "paid" ? total : status === "partial" ? total * 0.5 : 0;
      const amountDue = total - amountPaid;
      const [inv] = await db
        .insert(invoices)
        .values({
          organizationId,
          customerId: customerIds[d.customerIndex]!,
          invoiceNumber: `INV-${YEAR}-${String(i + 1).padStart(3, "0")}`,
          issueDate,
          dueDate,
          status,
          currency: "AED",
          subtotal: String(d.subtotal),
          taxAmount: String(taxAmount),
          total: String(total),
          amountPaid: String(amountPaid),
          amountDue: String(amountDue),
        })
        .returning({ id: invoices.id });
      if (!inv) continue;
      let order = 0;
      for (const line of d.lines) {
        const amt = line.qty * line.unitPrice;
        const lineTax = Math.round(amt * 0.05 * 100) / 100;
        await db.insert(invoiceLines).values({
          invoiceId: inv.id,
          description: line.desc,
          quantity: String(line.qty),
          unitPrice: String(line.unitPrice),
          amount: String(amt),
          taxCode: "VAT5",
          taxRate: "5",
          taxAmount: String(lineTax),
          lineOrder: order++,
        });
      }
    }
    console.log("Invoices: 12 (full 2025)");
  }

  // ─── Bills spread across 2025 ──────────────────────────────
  const existingBills = await db.select({ id: bills.id }).from(bills).where(eq(bills.organizationId, organizationId)).limit(1);
  if (existingBills.length === 0) {
    const billData: Array<{ month: number; supplierIndex: number; subtotal: number; tax: number; desc: string }> = [
      { month: 1, supplierIndex: 1, subtotal: 4000, tax: 200, desc: "Electricity & Water January" },
      { month: 1, supplierIndex: 0, subtotal: 3000, tax: 150, desc: "Business Internet & Mobile" },
      { month: 2, supplierIndex: 3, subtotal: 15000, tax: 750, desc: "Dell Monitors & Peripherals" },
      { month: 2, supplierIndex: 4, subtotal: 15000, tax: 0, desc: "Office Rent February" },
      { month: 3, supplierIndex: 2, subtotal: 2800, tax: 140, desc: "Office Supplies" },
      { month: 4, supplierIndex: 1, subtotal: 4200, tax: 210, desc: "Utilities April" },
      { month: 5, supplierIndex: 0, subtotal: 3150, tax: 157.5, desc: "Telecom May" },
      { month: 6, supplierIndex: 3, subtotal: 8500, tax: 425, desc: "Equipment" },
      { month: 7, supplierIndex: 4, subtotal: 15000, tax: 0, desc: "Office Rent July" },
      { month: 8, supplierIndex: 1, subtotal: 4500, tax: 225, desc: "Utilities August" },
      { month: 9, supplierIndex: 2, subtotal: 1200, tax: 60, desc: "Stationery" },
      { month: 10, supplierIndex: 0, subtotal: 3000, tax: 150, desc: "Telecom October" },
      { month: 11, supplierIndex: 1, subtotal: 3800, tax: 190, desc: "Utilities November" },
      { month: 12, supplierIndex: 4, subtotal: 15000, tax: 0, desc: "Office Rent December" },
    ];
    for (let i = 0; i < billData.length; i++) {
      const d = billData[i]!;
      const issueDate = date(YEAR, d.month, 1);
      const dueDate = addDays(issueDate, 14);
      const total = d.subtotal + d.tax;
      const paid = d.month <= 10;
      const [bill] = await db
        .insert(bills)
        .values({
          organizationId,
          supplierId: supplierIds[d.supplierIndex]!,
          billNumber: `BILL-${YEAR}-${String(i + 1).padStart(3, "0")}`,
          issueDate,
          dueDate,
          status: paid ? "paid" : "received",
          currency: "AED",
          subtotal: String(d.subtotal),
          taxAmount: String(d.tax),
          total: String(total),
          amountPaid: paid ? String(total) : "0",
          amountDue: paid ? "0" : String(total),
        })
        .returning({ id: bills.id });
      if (bill) {
        await db.insert(billLines).values({
          billId: bill.id,
          description: d.desc,
          quantity: "1",
          unitPrice: String(d.subtotal),
          amount: String(d.subtotal),
          taxCode: d.tax > 0 ? "VAT5" : null,
          taxRate: d.tax > 0 ? "5" : null,
          taxAmount: String(d.tax),
          lineOrder: 0,
        });
      }
    }
    console.log("Bills: 14 (full 2025)");
  }

  // ─── Payments (received) spread across 2025 ─────────────────
  const existingPayments = await db.select({ id: payments.id }).from(payments).where(eq(payments.organizationId, organizationId)).limit(1);
  if (existingPayments.length === 0) {
    const invList = await db.select({ id: invoices.id, total: invoices.total, invoiceNumber: invoices.invoiceNumber, customerId: invoices.customerId }).from(invoices).where(eq(invoices.organizationId, organizationId));
    let payNum = 1;
    for (const inv of invList) {
      const totalNum = parseFloat(inv.total);
      if (totalNum <= 0) continue;
      const payDate = date(YEAR, 1 + (payNum % 12), Math.min(10 + payNum, 28));
      const [payment] = await db
        .insert(payments)
        .values({
          organizationId,
          paymentNumber: `PAY-R-${YEAR}-${String(payNum).padStart(3, "0")}`,
          paymentDate: payDate,
          paymentType: "received",
          entityType: "customer",
          entityId: inv.customerId,
          bankAccountId: mainBankId,
          amount: inv.total,
          currency: "AED",
          method: "bank_transfer",
          reference: `TRF-${payDate.replace(/-/g, "")}`,
        })
        .returning({ id: payments.id });
      if (payment) {
        await db.insert(paymentAllocations).values({
          paymentId: payment.id,
          documentType: "invoice",
          documentId: inv.id,
          amount: inv.total,
        });
      }
      payNum++;
    }
    console.log("Payments: created for invoices");
  }

  // ─── Bank transactions (full 2025) ───────────────────────────
  const existingTx = await db.select({ id: bankTransactions.id }).from(bankTransactions).where(eq(bankTransactions.organizationId, organizationId)).limit(1);
  if (existingTx.length === 0) {
    const txData: Array<{ month: number; day: number; desc: string; amount: number; type: "debit" | "credit"; category: string; reconciled: boolean }> = [];
    for (let m = 1; m <= 12; m++) {
      txData.push({ month: m, day: 1, desc: "SALARY TRANSFER", amount: 45000, type: "debit", category: "Payroll", reconciled: true });
      txData.push({ month: m, day: 5, desc: "RENT PAYMENT", amount: 15000, type: "debit", category: "Rent", reconciled: true });
      txData.push({ month: m, day: 10, desc: "CUSTOMER PAYMENT RECEIVED", amount: 50000 + m * 1000, type: "credit", category: "Customer Payment", reconciled: m <= 10 });
      if (m % 2 === 0) txData.push({ month: m, day: 15, desc: "DEWA UTILITY", amount: 4200, type: "debit", category: "Utilities", reconciled: m <= 10 });
      if (m % 2 === 1) txData.push({ month: m, day: 16, desc: "DU TELECOM", amount: 3150, type: "debit", category: "Telecom", reconciled: m <= 10 });
      txData.push({ month: m, day: 28, desc: "BANK CHARGES", amount: 150, type: "debit", category: "Bank Charges", reconciled: m <= 10 });
    }
    for (const t of txData) {
      await db.insert(bankTransactions).values({
        organizationId,
        bankAccountId: mainBankId,
        transactionDate: date(YEAR, t.month, t.day),
        description: `${t.desc} - ${YEAR}`,
        amount: String(t.amount),
        type: t.type,
        reference: `REF-${YEAR}-${t.month}-${t.day}`,
        category: t.category,
        isReconciled: t.reconciled,
      });
    }
    console.log("Bank transactions: ", txData.length);
  }

  // ─── Journal entries (full 2025) ─────────────────────────────
  const existingJE = await db.select({ id: journalEntries.id }).from(journalEntries).where(eq(journalEntries.organizationId, organizationId)).limit(1);
  if (existingJE.length === 0) {
    let jeSeq = 1;
    // Opening capital - Jan
    const periodJan = periodIdsByMonth.get(1)!;
    const [je1] = await db
      .insert(journalEntries)
      .values({
        organizationId,
        periodId: periodJan,
        entryNumber: `JE-${YEAR}01-${String(jeSeq++).padStart(4, "0")}`,
        entryDate: date(YEAR, 1, 5),
        description: "Initial capital investment",
        sourceType: "manual",
        status: "posted",
        currency: "AED",
        totalDebit: "500000",
        totalCredit: "500000",
      })
      .returning({ id: journalEntries.id });
    if (je1) {
      await db.insert(journalLines).values([
        { journalEntryId: je1.id, organizationId, accountId: acc("1110"), debit: "500000", credit: "0", baseCurrencyDebit: "500000", baseCurrencyCredit: "0", lineOrder: 1 },
        { journalEntryId: je1.id, organizationId, accountId: acc("3010"), debit: "0", credit: "500000", baseCurrencyDebit: "0", baseCurrencyCredit: "500000", lineOrder: 2 },
      ]);
    }
    // Monthly rent and salary entries
    for (let m = 1; m <= 12; m++) {
      const periodId = periodIdsByMonth.get(m)!;
      const [jeRent] = await db
        .insert(journalEntries)
        .values({
          organizationId,
          periodId,
          entryNumber: `JE-${YEAR}${String(m).padStart(2, "0")}-${String(jeSeq++).padStart(4, "0")}`,
          entryDate: date(YEAR, m, 10),
          description: `Office rent - ${m}/${YEAR}`,
          sourceType: "manual",
          status: "posted",
          currency: "AED",
          totalDebit: "15000",
          totalCredit: "15000",
        })
        .returning({ id: journalEntries.id });
      if (jeRent) {
        await db.insert(journalLines).values([
          { journalEntryId: jeRent.id, organizationId, accountId: acc("6110"), debit: "15000", credit: "0", baseCurrencyDebit: "15000", baseCurrencyCredit: "0", lineOrder: 1 },
          { journalEntryId: jeRent.id, organizationId, accountId: acc("1110"), debit: "0", credit: "15000", baseCurrencyDebit: "0", baseCurrencyCredit: "15000", lineOrder: 2 },
        ]);
      }
      const [jeSal] = await db
        .insert(journalEntries)
        .values({
          organizationId,
          periodId,
          entryNumber: `JE-${YEAR}${String(m).padStart(2, "0")}-${String(jeSeq++).padStart(4, "0")}`,
          entryDate: date(YEAR, m, 25),
          description: `Salary payment - ${m}/${YEAR}`,
          sourceType: "manual",
          status: "posted",
          currency: "AED",
          totalDebit: "45000",
          totalCredit: "45000",
        })
        .returning({ id: journalEntries.id });
      if (jeSal) {
        await db.insert(journalLines).values([
          { journalEntryId: jeSal.id, organizationId, accountId: acc("6010"), debit: "35000", credit: "0", baseCurrencyDebit: "35000", baseCurrencyCredit: "0", lineOrder: 1 },
          { journalEntryId: jeSal.id, organizationId, accountId: acc("6020"), debit: "7000", credit: "0", baseCurrencyDebit: "7000", baseCurrencyCredit: "0", lineOrder: 2 },
          { journalEntryId: jeSal.id, organizationId, accountId: acc("6030"), debit: "3000", credit: "0", baseCurrencyDebit: "3000", baseCurrencyCredit: "0", lineOrder: 3 },
          { journalEntryId: jeSal.id, organizationId, accountId: acc("1110"), debit: "0", credit: "45000", baseCurrencyDebit: "0", baseCurrencyCredit: "45000", lineOrder: 4 },
        ]);
      }
    }
    console.log("Journal entries: created for 2025");
  }

  // ─── VAT returns (Q1–Q4 2025) ───────────────────────────────
  const existingVat = await db.select({ id: vatReturns.id }).from(vatReturns).where(eq(vatReturns.organizationId, organizationId)).limit(1);
  if (existingVat.length === 0) {
    const quarters = [
      { start: date(YEAR, 1, 1), end: date(YEAR, 3, 31), taxableSales: 275000, outputVat: 13750, taxablePurchases: 24800, inputVat: 1240, filed: true },
      { start: date(YEAR, 4, 1), end: date(YEAR, 6, 30), taxableSales: 307000, outputVat: 15350, taxablePurchases: 26200, inputVat: 1310, filed: true },
      { start: date(YEAR, 7, 1), end: date(YEAR, 9, 30), taxableSales: 293000, outputVat: 14650, taxablePurchases: 19700, inputVat: 985, filed: true },
      { start: date(YEAR, 10, 1), end: date(YEAR, 12, 31), taxableSales: 243000, outputVat: 12150, taxablePurchases: 18800, inputVat: 940, filed: false },
    ];
    for (const q of quarters) {
      const netVat = q.outputVat - q.inputVat;
      await db.insert(vatReturns).values({
        organizationId,
        periodStart: q.start,
        periodEnd: q.end,
        status: q.filed ? "filed" : "draft",
        outputVat: String(q.outputVat),
        inputVat: String(q.inputVat),
        netVat: String(netVat),
        taxableSales: String(q.taxableSales),
        exemptSales: "0",
        zeroRatedSales: "0",
        taxablePurchases: String(q.taxablePurchases),
        filedAt: q.filed ? new Date() : null,
      });
    }
    console.log("VAT returns: Q1–Q4 2025");
  }

  // ─── Inventory movements (2025) ─────────────────────────────
  const existingMov = await db.select({ id: inventoryMovements.id }).from(inventoryMovements).where(eq(inventoryMovements.organizationId, organizationId)).limit(1);
  if (existingMov.length === 0 && itemIds.length >= 5) {
    const movements: Array<{ month: number; itemIndex: number; type: "purchase" | "sale" | "adjustment"; qty: number; unitCost: number }> = [
      { month: 1, itemIndex: 0, type: "purchase", qty: 20, unitCost: 1200 },
      { month: 2, itemIndex: 0, type: "sale", qty: -5, unitCost: 1200 },
      { month: 2, itemIndex: 1, type: "purchase", qty: 30, unitCost: 350 },
      { month: 3, itemIndex: 1, type: "sale", qty: -5, unitCost: 350 },
      { month: 3, itemIndex: 4, type: "purchase", qty: 250, unitCost: 22 },
      { month: 4, itemIndex: 4, type: "adjustment", qty: -50, unitCost: 22 },
      { month: 5, itemIndex: 7, type: "purchase", qty: 12, unitCost: 95 },
      { month: 6, itemIndex: 7, type: "sale", qty: -10, unitCost: 95 },
      { month: 7, itemIndex: 0, type: "purchase", qty: 10, unitCost: 1200 },
      { month: 9, itemIndex: 2, type: "purchase", qty: 15, unitCost: 280 },
      { month: 11, itemIndex: 3, type: "purchase", qty: 2, unitCost: 1500 },
    ];
    for (const mov of movements) {
      const totalCost = Math.abs(mov.qty) * mov.unitCost;
      await db.insert(inventoryMovements).values({
        organizationId,
        itemId: itemIds[mov.itemIndex]!,
        movementType: mov.type,
        quantity: String(mov.qty),
        unitCost: String(mov.unitCost),
        totalCost: String(totalCost),
        referenceType: mov.type === "purchase" ? "bill" : mov.type === "sale" ? "invoice" : null,
      });
    }
    console.log("Inventory movements: ", movements.length);
  }

  console.log("Seed completed. Organization ID:", organizationId);
}

/**
 * Remove all demo / transactional data for an organization.
 * Deletes in FK-safe order. Does NOT delete the org itself or user roles.
 */
export async function removeDemoData(organizationId: string): Promise<void> {
  // Delete in reverse-dependency order
  await db.delete(inventoryMovements).where(eq(inventoryMovements.organizationId, organizationId));
  await db.delete(vatReturns).where(eq(vatReturns.organizationId, organizationId));
  await db.delete(journalLines).where(eq(journalLines.organizationId, organizationId));
  await db.delete(journalEntries).where(eq(journalEntries.organizationId, organizationId));
  // payment allocations cascade from payments
  await db.delete(payments).where(eq(payments.organizationId, organizationId));
  // invoice lines cascade from invoices
  await db.delete(invoices).where(eq(invoices.organizationId, organizationId));
  // bill lines cascade from bills
  await db.delete(bills).where(eq(bills.organizationId, organizationId));
  await db.delete(bankTransactions).where(eq(bankTransactions.organizationId, organizationId));
  await db.delete(bankAccounts).where(eq(bankAccounts.organizationId, organizationId));
  await db.delete(items).where(eq(items.organizationId, organizationId));
  await db.delete(customers).where(eq(customers.organizationId, organizationId));
  await db.delete(suppliers).where(eq(suppliers.organizationId, organizationId));
  await db.delete(taxCodes).where(eq(taxCodes.organizationId, organizationId));
  await db.delete(accountingPeriods).where(eq(accountingPeriods.organizationId, organizationId));
  await db.delete(fiscalYears).where(eq(fiscalYears.organizationId, organizationId));
  await db.delete(chartOfAccounts).where(eq(chartOfAccounts.organizationId, organizationId));
  console.log("Removed all demo data for org:", organizationId);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Set DATABASE_URL to run the seed.");
    process.exit(1);
  }
  console.log("Seeding database with full 2025 data...");
  const organizationId = await getOrCreateOrg();
  console.log("Organization ID:", organizationId);
  await seedDemoData(organizationId);
}

// Only run main() when executed directly as a script
if (typeof process !== "undefined" && process.argv[1]?.includes("seed")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
