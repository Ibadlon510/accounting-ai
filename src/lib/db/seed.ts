/**
 * Database seed script: populates an organization with full 2025 data
 * (customers, suppliers, items, bank accounts, invoices, bills, payments,
 * journal entries, VAT returns, inventory movements). This is the only source of demo data.
 *
 * Usage: DATABASE_URL=... npx tsx src/lib/db/seed.ts
 * Optional: SEED_ORG_ID=uuid to seed a specific org; otherwise uses first org or creates "Demo 2025".
 * Optional: SEED_MODULES=sales,purchases,banking,inventory,accounting,vat to limit modules.
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
  bankStatements,
  bankStatementLines,
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
  documents,
} from "./schema";
import { seedChartOfAccounts } from "./seed-chart-of-accounts";
import { ACCOUNT_TYPES } from "../accounting/uae-chart-of-accounts";
import { eq, and, inArray, like, isNull, sql } from "drizzle-orm";

const YEAR = 2025;

export const SEED_MODULE_IDS = [
  "inventory",
  "sales",
  "purchases",
  "banking",
  "accounting",
  "vat",
] as const;

export type SeedModuleId = (typeof SEED_MODULE_IDS)[number];

export type SeedOptions = {
  modules?: SeedModuleId[];
};

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

type SeedContext = {
  organizationId: string;
  accountByCode: Map<string, string>;
  periodIdsByMonth: Map<number, string>;
  acc: (code: string) => string;
};

async function ensureBankAccounts(ctx: SeedContext): Promise<{ mainBankId: string; usdBankId: string; creditCardId: string }> {
  const { organizationId, acc } = ctx;
  const existingBanks = await db.select().from(bankAccounts).where(eq(bankAccounts.organizationId, organizationId)).limit(1);
  if (existingBanks.length > 0) {
    const all = await db.select().from(bankAccounts).where(eq(bankAccounts.organizationId, organizationId));
    const cc = all.find((a) => a.accountType === "credit_card");
    const banks = all.filter((a) => (a.accountType ?? "bank") === "bank");
    return {
      mainBankId: banks[0]?.id ?? all[0]!.id,
      usdBankId: banks[1]?.id ?? banks[0]?.id ?? all[0]!.id,
      creditCardId: cc?.id ?? all[0]!.id,
    };
  }
  const ledgerCash = acc("1110");
  const ledgerUsd = acc("1120");
  const [main, usd, cc] = await db
    .insert(bankAccounts)
    .values([
      { organizationId, accountType: "bank", accountName: "Main Operating Account", bankName: "Emirates NBD", accountNumber: "1017-XXXXXX-01", iban: "AE12026000101700000001", currency: "AED", ledgerAccountId: ledgerCash, currentBalance: "0", isActive: true, isDemo: true },
      { organizationId, accountType: "bank", accountName: "USD Account", bankName: "Emirates NBD", accountNumber: "1017-XXXXXX-02", iban: "AE12026000101700000002", currency: "USD", ledgerAccountId: ledgerUsd, currentBalance: "0", isActive: true, isDemo: true },
      { organizationId, accountType: "credit_card", accountName: "Corporate Credit Card", bankName: "Emirates NBD", accountNumber: "XXXX-XXXX-XXXX-4532", currency: "AED", currentBalance: "0", isActive: true, isDemo: true },
    ])
    .returning({ id: bankAccounts.id });
  return {
    mainBankId: main!.id,
    usdBankId: usd?.id ?? main!.id,
    creditCardId: cc?.id ?? main!.id,
  };
}

async function seedFoundation(organizationId: string): Promise<SeedContext> {
  await ensureAccountTypes();
  await seedChartOfAccounts(organizationId);
  const accountByCode = await getAccountMap(organizationId);
  const { periodIdsByMonth } = await seedFiscalYearAndPeriods(organizationId);

  const existingTax = await db.select({ id: taxCodes.id }).from(taxCodes).where(eq(taxCodes.organizationId, organizationId)).limit(1);
  if (existingTax.length === 0) {
    await db.insert(taxCodes).values([
      { organizationId, code: "VAT5", name: "VAT 5%", rate: "5", type: "output" },
      { organizationId, code: "VAT5", name: "VAT 5% Input", rate: "5", type: "input" },
      { organizationId, code: "EXEMPT", name: "Exempt", rate: "0", type: "exempt" },
    ]);
  }

  const acc = (code: string) => accountByCode.get(code)!;
  return {
    organizationId,
    accountByCode,
    periodIdsByMonth,
    acc,
  };
}

async function seedSales(ctx: SeedContext): Promise<void> {
  const { organizationId, acc } = ctx;
  const existingCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .limit(1);
  let customerIds: string[];
  if (existingCustomers.length > 0) {
    const ids = (await db.select({ id: customers.id }).from(customers).where(eq(customers.organizationId, organizationId))).map((c) => c.id);
    if (ids.length < 5) {
      // Need at least 5 customers for invoice seed; add placeholder customers if needed
      const toAdd = 5 - ids.length;
      const placeholders = Array.from({ length: toAdd }, (_, i) => ({
        organizationId,
        name: `Demo Customer ${ids.length + i + 1}`,
        email: `demo${ids.length + i + 1}@example.com`,
        currency: "AED",
        paymentTermsDays: 30,
        isDemo: true,
      }));
      const newRows = await db.insert(customers).values(placeholders).returning({ id: customers.id });
      customerIds = [...ids, ...newRows.map((r) => r.id)];
    } else {
      customerIds = ids;
    }
  } else {
    const customerRows = await db
      .insert(customers)
      .values([
        { organizationId, name: "Al Futtaim Group", email: "accounts@alfuttaim.ae", phone: "+971 4 209 8888", taxNumber: "100123456789003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "500000", paymentTermsDays: 30, isDemo: true },
        { organizationId, name: "Emaar Properties", email: "finance@emaar.ae", phone: "+971 4 367 3333", taxNumber: "100234567890003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "1000000", paymentTermsDays: 45, isDemo: true },
        { organizationId, name: "ADNOC Distribution", email: "ap@adnoc.ae", phone: "+971 2 602 0000", taxNumber: "100345678901003", city: "Abu Dhabi", country: "UAE", currency: "AED", creditLimit: "750000", paymentTermsDays: 30, isDemo: true },
        { organizationId, name: "Majid Al Futtaim", email: "accounts@maf.ae", phone: "+971 4 294 9200", taxNumber: "100456789012003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "300000", paymentTermsDays: 30, isDemo: true },
        { organizationId, name: "Dubai Holding", email: "finance@dubaiholding.com", phone: "+971 4 362 1111", taxNumber: "100567890123003", city: "Dubai", country: "UAE", currency: "AED", creditLimit: "2000000", paymentTermsDays: 60, isDemo: true },
        { organizationId, name: "Etisalat Business", email: "b2b@etisalat.ae", phone: "+971 800 101", taxNumber: "100678901234003", city: "Abu Dhabi", country: "UAE", currency: "AED", creditLimit: "200000", paymentTermsDays: 15, isActive: false, isDemo: true },
      ])
      .returning({ id: customers.id });
    customerIds = customerRows.map((r) => r.id);
  }
  console.log("Customers:", customerIds.length);

  const existingInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.organizationId, organizationId)).limit(1);
  if (existingInvoices.length === 0) {
    const invData: Array<{ month: number; customerIndex: number; subtotal: number; hasReceipt: boolean; lines: Array<{ desc: string; qty: number; unitPrice: number }> }> = [
      { month: 1, customerIndex: 0, subtotal: 50000, hasReceipt: true, lines: [{ desc: "IT Consulting - System Audit", qty: 1, unitPrice: 30000 }, { desc: "Network Infrastructure Review", qty: 1, unitPrice: 20000 }] },
      { month: 2, customerIndex: 1, subtotal: 150000, hasReceipt: true, lines: [{ desc: "ERP Implementation Phase 1", qty: 1, unitPrice: 100000 }, { desc: "Data Migration Services", qty: 50, unitPrice: 1000 }] },
      { month: 3, customerIndex: 3, subtotal: 30000, hasReceipt: true, lines: [{ desc: "Monthly IT Support", qty: 1, unitPrice: 30000 }] },
      { month: 4, customerIndex: 4, subtotal: 200000, hasReceipt: true, lines: [{ desc: "Custom Software Development", qty: 200, unitPrice: 800 }, { desc: "Project Management", qty: 40, unitPrice: 1000 }] },
      { month: 5, customerIndex: 2, subtotal: 75000, hasReceipt: true, lines: [{ desc: "Cloud Infrastructure Setup", qty: 1, unitPrice: 75000 }] },
      { month: 6, customerIndex: 0, subtotal: 42000, hasReceipt: true, lines: [{ desc: "Support Retainer June", qty: 1, unitPrice: 42000 }] },
      { month: 7, customerIndex: 1, subtotal: 85000, hasReceipt: false, lines: [{ desc: "Phase 2 Consulting", qty: 170, unitPrice: 500 }] },
      { month: 8, customerIndex: 3, subtotal: 28000, hasReceipt: true, lines: [{ desc: "IT Support August", qty: 1, unitPrice: 28000 }] },
      { month: 9, customerIndex: 4, subtotal: 120000, hasReceipt: true, lines: [{ desc: "Integration Services", qty: 120, unitPrice: 1000 }] },
      { month: 10, customerIndex: 2, subtotal: 95000, hasReceipt: true, lines: [{ desc: "Security Audit", qty: 1, unitPrice: 95000 }] },
      { month: 11, customerIndex: 0, subtotal: 38000, hasReceipt: false, lines: [{ desc: "Year-end Support", qty: 1, unitPrice: 38000 }] },
      { month: 12, customerIndex: 1, subtotal: 110000, hasReceipt: false, lines: [{ desc: "Go-live Support", qty: 1, unitPrice: 110000 }] },
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
      const invNum = i + 1;

      let documentId: string | null = null;
      if (d.hasReceipt && amountPaid > 0) {
        const [doc] = await db
          .insert(documents)
          .values({
            organizationId,
            s3Key: `demo/receipts/org-${organizationId}/rec-INV-${YEAR}-${String(invNum).padStart(3, "0")}.pdf`,
            documentType: "receipt",
            status: "ARCHIVED",
          })
          .returning({ id: documents.id });
        if (doc) documentId = doc.id;
      }

      const [inv] = await db
        .insert(invoices)
        .values({
          organizationId,
          customerId: customerIds[d.customerIndex % customerIds.length]!,
          invoiceNumber: `INV-${YEAR}-${String(invNum).padStart(3, "0")}`,
          issueDate,
          dueDate,
          status,
          currency: "AED",
          subtotal: String(d.subtotal),
          taxAmount: String(taxAmount),
          total: String(total),
          amountPaid: String(amountPaid),
          amountDue: String(amountDue),
          documentId,
          isDemo: true,
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

  // ── Add 15 more invoices linked to products; some with receipts ─────────────
  const itemRows = await db.select({ id: items.id, name: items.name, salesPrice: items.salesPrice, type: items.type }).from(items).where(eq(items.organizationId, organizationId));
  const invCount = (await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.organizationId, organizationId))).length;

  if (itemRows.length >= 3 && invCount < 30) {
    type ProductLine = { itemIndex: number; qty: number };
    const extraInvData: Array<{
      month: number;
      day: number;
      customerIndex: number;
      lines: ProductLine[];
      hasReceipt: boolean;
    }> = [
      { month: 1, day: 8, customerIndex: 0, lines: [{ itemIndex: 0, qty: 2 }, { itemIndex: 1, qty: 3 }], hasReceipt: true },
      { month: 2, day: 12, customerIndex: 1, lines: [{ itemIndex: 3, qty: 1 }, { itemIndex: 4, qty: 20 }], hasReceipt: true },
      { month: 2, day: 20, customerIndex: 3, lines: [{ itemIndex: 5, qty: 40 }, { itemIndex: 6, qty: 1 }], hasReceipt: false },
      { month: 3, day: 5, customerIndex: 4, lines: [{ itemIndex: 2, qty: 5 }, { itemIndex: 7, qty: 10 }], hasReceipt: true },
      { month: 3, day: 18, customerIndex: 2, lines: [{ itemIndex: 0, qty: 4 }], hasReceipt: false },
      { month: 4, day: 10, customerIndex: 0, lines: [{ itemIndex: 1, qty: 5 }, { itemIndex: 7, qty: 8 }], hasReceipt: true },
      { month: 5, day: 14, customerIndex: 1, lines: [{ itemIndex: 3, qty: 2 }], hasReceipt: false },
      { month: 5, day: 22, customerIndex: 3, lines: [{ itemIndex: 4, qty: 50 }, { itemIndex: 2, qty: 2 }], hasReceipt: true },
      { month: 6, day: 7, customerIndex: 4, lines: [{ itemIndex: 5, qty: 80 }], hasReceipt: false },
      { month: 7, day: 11, customerIndex: 2, lines: [{ itemIndex: 0, qty: 3 }, { itemIndex: 1, qty: 6 }], hasReceipt: true },
      { month: 8, day: 16, customerIndex: 0, lines: [{ itemIndex: 6, qty: 1 }], hasReceipt: false },
      { month: 9, day: 9, customerIndex: 1, lines: [{ itemIndex: 3, qty: 1 }, { itemIndex: 7, qty: 15 }], hasReceipt: true },
      { month: 10, day: 24, customerIndex: 3, lines: [{ itemIndex: 2, qty: 8 }, { itemIndex: 4, qty: 30 }], hasReceipt: false },
      { month: 11, day: 6, customerIndex: 4, lines: [{ itemIndex: 5, qty: 60 }], hasReceipt: true },
      { month: 12, day: 12, customerIndex: 2, lines: [{ itemIndex: 0, qty: 5 }], hasReceipt: false },
    ];

    for (let i = 0; i < extraInvData.length; i++) {
      const d = extraInvData[i]!;
      const startNum = invCount + 1;
      const invNum = startNum + i;
      const issueDate = date(YEAR, d.month, d.day);
      const dueDate = addDays(issueDate, 30);

      let subtotal = 0;
      const lineRows: Array<{ itemId: string; desc: string; qty: number; unitPrice: number; amount: number }> = [];
      for (const line of d.lines) {
        const item = itemRows[line.itemIndex % itemRows.length];
        if (!item) continue;
        const unitPrice = parseFloat(item.salesPrice ?? "0");
        const amt = line.qty * unitPrice;
        subtotal += amt;
        lineRows.push({ itemId: item.id, desc: item.name, qty: line.qty, unitPrice, amount: amt });
      }
      if (lineRows.length === 0) continue;

      const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const total = subtotal + taxAmount;
      const status = d.month <= 9 ? "paid" : d.month <= 11 ? "partial" : "sent";
      const amountPaid = status === "paid" ? total : status === "partial" ? total * 0.5 : 0;
      const amountDue = total - amountPaid;

      let documentId: string | null = null;
      if (d.hasReceipt) {
        const [doc] = await db
          .insert(documents)
          .values({
            organizationId,
            s3Key: `demo/receipts/org-${organizationId}/rec-INV-${YEAR}-${String(invNum).padStart(3, "0")}.pdf`,
            documentType: "receipt",
            status: "ARCHIVED",
          })
          .returning({ id: documents.id });
        if (doc) documentId = doc.id;
      }

      const [inv] = await db
        .insert(invoices)
        .values({
          organizationId,
          customerId: customerIds[d.customerIndex % customerIds.length]!,
          invoiceNumber: `INV-${YEAR}-${String(invNum).padStart(3, "0")}`,
          issueDate,
          dueDate,
          status,
          currency: "AED",
          subtotal: String(subtotal),
          taxAmount: String(taxAmount),
          total: String(total),
          amountPaid: String(amountPaid),
          amountDue: String(amountDue),
          documentId,
          isDemo: true,
        })
        .returning({ id: invoices.id });

      if (!inv) continue;
      let order = 0;
      for (const line of lineRows) {
        const lineTax = Math.round(line.amount * 0.05 * 100) / 100;
        await db.insert(invoiceLines).values({
          invoiceId: inv.id,
          itemId: line.itemId,
          description: line.desc,
          quantity: String(line.qty),
          unitPrice: String(line.unitPrice),
          amount: String(line.amount),
          taxCode: "VAT5",
          taxRate: "5",
          taxAmount: String(lineTax),
          lineOrder: order++,
        });
      }
    }
    console.log("Invoices: +15 product-linked (some with receipts)");
  }

  const existingPayments = await db.select({ id: payments.id }).from(payments).where(eq(payments.organizationId, organizationId)).limit(1);
  if (existingPayments.length === 0) {
    const { mainBankId } = await ensureBankAccounts(ctx);
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
          isDemo: true,
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

  // ── Backfill receipt documents for paid demo invoices missing documentId ───
  const paidWithoutReceipt = await db
    .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.isDemo, true),
        isNull(invoices.documentId),
        sql`(${invoices.amountPaid}::numeric) > 0`
      )
    );

  if (paidWithoutReceipt.length > 0) {
    for (const inv of paidWithoutReceipt) {
      const [doc] = await db
        .insert(documents)
        .values({
          organizationId,
          s3Key: `demo/receipts/org-${organizationId}/rec-${inv.invoiceNumber}.pdf`,
          documentType: "receipt",
          status: "ARCHIVED",
        })
        .returning({ id: documents.id });
      if (doc) {
        await db.update(invoices).set({ documentId: doc.id }).where(eq(invoices.id, inv.id));
      }
    }
    console.log("Receipts: backfilled for", paidWithoutReceipt.length, "paid invoices");
  }
}

async function seedPurchases(ctx: SeedContext): Promise<void> {
  const { organizationId } = ctx;
  const existingSuppliers = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.organizationId, organizationId)).limit(1);
  let supplierIds: string[];
  if (existingSuppliers.length > 0) {
    const ids = (await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.organizationId, organizationId))).map((s) => s.id);
    if (ids.length < 5) {
      const toAdd = 5 - ids.length;
      const placeholders = Array.from({ length: toAdd }, (_, i) => ({
        organizationId,
        name: `Demo Supplier ${ids.length + i + 1}`,
        email: `demo-supplier${ids.length + i + 1}@example.com`,
        currency: "AED",
        paymentTermsDays: 30,
        isDemo: true,
      }));
      const newRows = await db.insert(suppliers).values(placeholders).returning({ id: suppliers.id });
      supplierIds = [...ids, ...newRows.map((r) => r.id)];
    } else {
      supplierIds = ids;
    }
  } else {
    const supplierRows = await db
      .insert(suppliers)
      .values([
        { organizationId, name: "Du Telecom", email: "billing@du.ae", phone: "+971 4 390 5555", taxNumber: "300123456789003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 15, isDemo: true },
        { organizationId, name: "DEWA", email: "corporate@dewa.gov.ae", phone: "+971 4 601 9999", taxNumber: "300234567890003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 15, isDemo: true },
        { organizationId, name: "Emirates Office Supplies", email: "orders@eos.ae", phone: "+971 4 222 3333", taxNumber: "300345678901003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 30, isDemo: true },
        { organizationId, name: "Gulf IT Solutions", email: "sales@gulfitsolutions.ae", phone: "+971 4 444 5555", taxNumber: "300456789012003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 30, isDemo: true },
        { organizationId, name: "National Properties LLC", email: "leasing@natprop.ae", phone: "+971 4 333 4444", taxNumber: "300567890123003", city: "Dubai", country: "UAE", currency: "AED", paymentTermsDays: 0, isDemo: true },
      ])
      .returning({ id: suppliers.id });
    supplierIds = supplierRows.map((r) => r.id);
  }
  console.log("Suppliers:", supplierIds.length);

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
      const billNum = i + 1;

      let documentId: string | null = null;
      if (paid) {
        const [doc] = await db
          .insert(documents)
          .values({
            organizationId,
            s3Key: `demo/receipts/org-${organizationId}/rec-BILL-${YEAR}-${String(billNum).padStart(3, "0")}.pdf`,
            documentType: "receipt",
            status: "ARCHIVED",
          })
          .returning({ id: documents.id });
        if (doc) documentId = doc.id;
      }

      const [bill] = await db
        .insert(bills)
        .values({
          organizationId,
          supplierId: supplierIds[d.supplierIndex % supplierIds.length]!,
          billNumber: `BILL-${YEAR}-${String(billNum).padStart(3, "0")}`,
          issueDate,
          dueDate,
          status: paid ? "paid" : "received",
          currency: "AED",
          subtotal: String(d.subtotal),
          taxAmount: String(d.tax),
          total: String(total),
          amountPaid: paid ? String(total) : "0",
          amountDue: paid ? "0" : String(total),
          documentId,
          isDemo: true,
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

  // ── Backfill receipt documents for paid demo bills missing documentId ───
  const paidBillsWithoutReceipt = await db
    .select({ id: bills.id, billNumber: bills.billNumber })
    .from(bills)
    .where(
      and(
        eq(bills.organizationId, organizationId),
        eq(bills.isDemo, true),
        isNull(bills.documentId),
        sql`(${bills.amountPaid}::numeric) > 0`
      )
    );

  if (paidBillsWithoutReceipt.length > 0) {
    for (const bill of paidBillsWithoutReceipt) {
      const [doc] = await db
        .insert(documents)
        .values({
          organizationId,
          s3Key: `demo/receipts/org-${organizationId}/rec-${bill.billNumber}.pdf`,
          documentType: "receipt",
          status: "ARCHIVED",
        })
        .returning({ id: documents.id });
      if (doc) {
        await db.update(bills).set({ documentId: doc.id }).where(eq(bills.id, bill.id));
      }
    }
    console.log("Receipts: backfilled for", paidBillsWithoutReceipt.length, "paid bills");
  }
}

async function seedBanking(ctx: SeedContext): Promise<void> {
  const { organizationId } = ctx;
  const { mainBankId, creditCardId } = await ensureBankAccounts(ctx);
  console.log("Bank accounts ready (bank + credit card)");

  const existingTx = await db.select({ id: bankTransactions.id }).from(bankTransactions).where(eq(bankTransactions.organizationId, organizationId)).limit(1);
  if (existingTx.length === 0) {
    // ── Main bank transactions ────────────────────────────────
    const bankTxData: Array<{ month: number; day: number; desc: string; amount: number; type: "debit" | "credit"; category: string; reconciled: boolean; transferRef?: string }> = [];
    for (let m = 1; m <= 12; m++) {
      bankTxData.push({ month: m, day: 1, desc: "SALARY TRANSFER", amount: 45000, type: "debit", category: "Payroll", reconciled: true });
      bankTxData.push({ month: m, day: 5, desc: "RENT PAYMENT", amount: 15000, type: "debit", category: "Rent", reconciled: true });
      bankTxData.push({ month: m, day: 10, desc: "CUSTOMER PAYMENT RECEIVED", amount: 50000 + m * 1000, type: "credit", category: "Customer Payment", reconciled: m <= 10 });
      if (m % 2 === 0) bankTxData.push({ month: m, day: 15, desc: "DEWA UTILITY", amount: 4200, type: "debit", category: "Utilities", reconciled: m <= 10 });
      if (m % 2 === 1) bankTxData.push({ month: m, day: 16, desc: "DU TELECOM", amount: 3150, type: "debit", category: "Telecom", reconciled: m <= 10 });
      bankTxData.push({ month: m, day: 28, desc: "BANK CHARGES", amount: 150, type: "debit", category: "Bank Charges", reconciled: m <= 10 });
      // Credit card payment from bank account (every month)
      bankTxData.push({ month: m, day: 25, desc: "CC PAYMENT - EMIRATES NBD", amount: 3500 + m * 200, type: "debit", category: "Credit Card Payment", reconciled: m <= 10, transferRef: `CC-PAY-${YEAR}-${String(m).padStart(2, "0")}` });
    }
    let bankBalance = 0;
    for (const t of bankTxData) {
      bankBalance += t.type === "credit" ? t.amount : -t.amount;
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
        transferReference: t.transferRef ?? null,
        isDemo: true,
      });
    }

    // ── Credit card transactions ──────────────────────────────
    const ccTxData: Array<{ month: number; day: number; desc: string; amount: number; type: "debit" | "credit"; category: string; reconciled: boolean }> = [];
    for (let m = 1; m <= 12; m++) {
      ccTxData.push({ month: m, day: 3, desc: "AMAZON.AE", amount: 450 + m * 30, type: "debit", category: "Office Supplies", reconciled: m <= 10 });
      ccTxData.push({ month: m, day: 8, desc: "STARBUCKS DIFC", amount: 85, type: "debit", category: "Entertainment", reconciled: m <= 10 });
      ccTxData.push({ month: m, day: 12, desc: "UBER TRIPS", amount: 320 + m * 15, type: "debit", category: "Transportation", reconciled: m <= 10 });
      ccTxData.push({ month: m, day: 18, desc: "NOON.COM", amount: 180 + m * 10, type: "debit", category: "Office Supplies", reconciled: m <= 10 });
      if (m % 3 === 0) ccTxData.push({ month: m, day: 20, desc: "EMIRATES AIRLINES", amount: 2800, type: "debit", category: "Travel", reconciled: m <= 10 });
      // Monthly payment received from bank
      ccTxData.push({ month: m, day: 25, desc: "PAYMENT RECEIVED - THANK YOU", amount: 3500 + m * 200, type: "credit", category: "Payment", reconciled: m <= 10 });
    }
    let ccBalance = 0;
    for (const t of ccTxData) {
      ccBalance += t.type === "credit" ? t.amount : -t.amount;
      await db.insert(bankTransactions).values({
        organizationId,
        bankAccountId: creditCardId,
        transactionDate: date(YEAR, t.month, t.day),
        description: `${t.desc} - ${YEAR}`,
        amount: String(t.amount),
        type: t.type,
        reference: `CC-${YEAR}-${t.month}-${t.day}`,
        category: t.category,
        isReconciled: t.reconciled,
        isDemo: true,
      });
    }

    // Update running balances on bank accounts
    await db.update(bankAccounts).set({ currentBalance: String(bankBalance) }).where(eq(bankAccounts.id, mainBankId));
    await db.update(bankAccounts).set({ currentBalance: String(ccBalance) }).where(eq(bankAccounts.id, creditCardId));

    console.log("Bank transactions:", bankTxData.length, "| Credit card transactions:", ccTxData.length);
  }
}

async function seedInventory(ctx: SeedContext): Promise<void> {
  const { organizationId, acc } = ctx;
  const salesAccountId = acc("4020");
  const purchaseAccountId = acc("5010");
  const inventoryAccountId = acc("1310");
  const existingItems = await db.select({ id: items.id }).from(items).where(eq(items.organizationId, organizationId)).limit(1);
  let itemIds: string[];
  if (existingItems.length > 0) {
    itemIds = (await db.select({ id: items.id }).from(items).where(eq(items.organizationId, organizationId))).map((i) => i.id);
  } else {
    const itemRows = await db
      .insert(items)
      .values([
        { organizationId, name: "Dell Monitor 27\" 4K", sku: "MON-D27-4K", type: "product", unitOfMeasure: "pcs", salesPrice: "1800", purchasePrice: "1200", costPrice: "1200", quantityOnHand: "15", reorderLevel: "5", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true, isDemo: true },
        { organizationId, name: "Logitech MX Keys Keyboard", sku: "KB-LG-MXK", type: "product", unitOfMeasure: "pcs", salesPrice: "550", purchasePrice: "350", costPrice: "350", quantityOnHand: "25", reorderLevel: "10", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true, isDemo: true },
        { organizationId, name: "Cat6 Network Cable (305m)", sku: "CBL-CAT6-305", type: "product", unitOfMeasure: "box", salesPrice: "450", purchasePrice: "280", costPrice: "280", quantityOnHand: "8", reorderLevel: "3", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true, isDemo: true },
        { organizationId, name: "HP LaserJet Pro Printer", sku: "PRN-HP-LJ", type: "product", unitOfMeasure: "pcs", salesPrice: "2200", purchasePrice: "1500", costPrice: "1500", quantityOnHand: "3", reorderLevel: "2", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true, isDemo: true },
        { organizationId, name: "A4 Copy Paper (Ream)", sku: "PPR-A4-500", type: "product", unitOfMeasure: "ream", salesPrice: "30", purchasePrice: "22", costPrice: "22", quantityOnHand: "200", reorderLevel: "50", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true, isDemo: true },
        { organizationId, name: "IT Consulting (Hourly)", sku: "SVC-IT-HR", type: "service", unitOfMeasure: "hour", salesPrice: "500", costPrice: "0", taxCode: "VAT5", salesAccountId, purchaseAccountId, trackInventory: false, isDemo: true },
        { organizationId, name: "System Audit Package", sku: "SVC-AUDIT", type: "service", unitOfMeasure: "unit", salesPrice: "15000", costPrice: "0", taxCode: "VAT5", salesAccountId, purchaseAccountId, trackInventory: false, isDemo: true },
        { organizationId, name: "Wireless Mouse", sku: "MSE-WL-01", type: "product", unitOfMeasure: "pcs", salesPrice: "180", purchasePrice: "95", costPrice: "95", quantityOnHand: "2", reorderLevel: "10", taxCode: "VAT5", salesAccountId, purchaseAccountId, inventoryAccountId, trackInventory: true, isDemo: true },
      ])
      .returning({ id: items.id });
    itemIds = itemRows.map((r) => r.id);
  }
  console.log("Items:", itemIds.length);

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
        isDemo: true,
      });
    }
    console.log("Inventory movements: ", movements.length);
  }
}

async function seedAccounting(ctx: SeedContext): Promise<void> {
  const { organizationId, periodIdsByMonth, acc } = ctx;
  const existingJE = await db.select({ id: journalEntries.id }).from(journalEntries).where(eq(journalEntries.organizationId, organizationId)).limit(1);
  if (existingJE.length === 0) {
    let jeSeq = 1;
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
        isDemo: true,
      })
      .returning({ id: journalEntries.id });
    if (je1) {
      await db.insert(journalLines).values([
        { journalEntryId: je1.id, organizationId, accountId: acc("1110"), debit: "500000", credit: "0", baseCurrencyDebit: "500000", baseCurrencyCredit: "0", lineOrder: 1 },
        { journalEntryId: je1.id, organizationId, accountId: acc("3010"), debit: "0", credit: "500000", baseCurrencyDebit: "0", baseCurrencyCredit: "500000", lineOrder: 2 },
      ]);
    }
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
          isDemo: true,
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
          isDemo: true,
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
}

async function seedVat(ctx: SeedContext): Promise<void> {
  const { organizationId } = ctx;
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
        isDemo: true,
      });
    }
    console.log("VAT returns: Q1–Q4 2025");
  }
}

function parseModulesFromEnv(): Set<SeedModuleId> | null {
  const raw = process.env.SEED_MODULES;
  if (!raw || typeof raw !== "string") return null;
  const parsed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is SeedModuleId => SEED_MODULE_IDS.includes(s as SeedModuleId));
  if (parsed.length === 0) return null;
  return new Set(parsed);
}

/**
 * Seed full 2025 demo data for a given organization.
 * Can be called from API routes or CLI.
 * When options.modules is undefined or empty, seeds all modules (backward compatible).
 */
export async function seedDemoData(organizationId: string, options?: SeedOptions): Promise<void> {
  const selectedModules =
    options?.modules && options.modules.length > 0
      ? new Set(options.modules.filter((m): m is SeedModuleId => SEED_MODULE_IDS.includes(m)))
      : new Set(SEED_MODULE_IDS);

  const ctx = await seedFoundation(organizationId);

  const moduleHandlers: Record<SeedModuleId, (ctx: SeedContext) => Promise<void>> = {
    sales: seedSales,
    purchases: seedPurchases,
    banking: seedBanking,
    inventory: seedInventory,
    accounting: seedAccounting,
    vat: seedVat,
  };

  for (const mod of SEED_MODULE_IDS) {
    if (selectedModules.has(mod)) {
      await moduleHandlers[mod](ctx);
    }
  }

  console.log("Seed completed. Organization ID:", organizationId);
}

/**
 * Remove only demo (seeded) data for an organization.
 * Preserves user-created data. Deletes in FK-safe order.
 */
export async function removeDemoDataOnly(organizationId: string): Promise<void> {
  // Delete in FK-safe order, only where is_demo = true
  await db.delete(inventoryMovements).where(and(eq(inventoryMovements.organizationId, organizationId), eq(inventoryMovements.isDemo, true)));
  await db.delete(vatReturns).where(and(eq(vatReturns.organizationId, organizationId), eq(vatReturns.isDemo, true)));
  const demoJeIds = (await db.select({ id: journalEntries.id }).from(journalEntries).where(and(eq(journalEntries.organizationId, organizationId), eq(journalEntries.isDemo, true)))).map((r) => r.id);
  if (demoJeIds.length > 0) {
    await db.delete(journalLines).where(inArray(journalLines.journalEntryId, demoJeIds));
  }
  await db.delete(journalEntries).where(and(eq(journalEntries.organizationId, organizationId), eq(journalEntries.isDemo, true)));
  await db.delete(payments).where(and(eq(payments.organizationId, organizationId), eq(payments.isDemo, true)));
  // Delete invoices/bills BEFORE documents (invoices/bills FK → documents with onDelete: set null)
  await db.delete(invoices).where(and(eq(invoices.organizationId, organizationId), eq(invoices.isDemo, true)));
  await db.delete(bills).where(and(eq(bills.organizationId, organizationId), eq(bills.isDemo, true)));
  await db.delete(documents).where(and(eq(documents.organizationId, organizationId), like(documents.s3Key, "demo/%")));
  await db.delete(bankStatements).where(and(eq(bankStatements.organizationId, organizationId), eq(bankStatements.isDemo, true)));
  await db.delete(bankTransactions).where(and(eq(bankTransactions.organizationId, organizationId), eq(bankTransactions.isDemo, true)));
  await db.delete(bankAccounts).where(and(eq(bankAccounts.organizationId, organizationId), eq(bankAccounts.isDemo, true)));
  await db.delete(items).where(and(eq(items.organizationId, organizationId), eq(items.isDemo, true)));
  await db.delete(customers).where(and(eq(customers.organizationId, organizationId), eq(customers.isDemo, true)));
  await db.delete(suppliers).where(and(eq(suppliers.organizationId, organizationId), eq(suppliers.isDemo, true)));
  console.log("Removed demo data only for org:", organizationId);
}

/**
 * Remove all demo / transactional data for an organization.
 * Deletes in FK-safe order. Does NOT delete the org itself or user roles.
 */
export async function removeDemoData(organizationId: string): Promise<void> {
  await db.delete(inventoryMovements).where(eq(inventoryMovements.organizationId, organizationId));
  await db.delete(vatReturns).where(eq(vatReturns.organizationId, organizationId));
  await db.delete(journalLines).where(eq(journalLines.organizationId, organizationId));
  await db.delete(journalEntries).where(eq(journalEntries.organizationId, organizationId));
  await db.delete(payments).where(eq(payments.organizationId, organizationId));
  await db.delete(invoices).where(eq(invoices.organizationId, organizationId));
  await db.delete(bills).where(eq(bills.organizationId, organizationId));
  await db.delete(documents).where(and(eq(documents.organizationId, organizationId), like(documents.s3Key, "demo/%")));
  // bankStatementLines cascade from bankStatements, but delete explicitly for safety
  await db.delete(bankStatements).where(eq(bankStatements.organizationId, organizationId));
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
  const modules = parseModulesFromEnv();
  await seedDemoData(organizationId, modules ? { modules: [...modules] } : undefined);
}

if (typeof process !== "undefined" && process.argv[1]?.includes("seed")) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
