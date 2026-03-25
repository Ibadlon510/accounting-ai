import { db } from "@/lib/db";
import {
  organizations, pdfTemplates, invoices, invoiceLines, customers,
  bills, billLines, suppliers, chartOfAccounts, journalLines, journalEntries,
  accountTypes, items, documentTypePdfSettings,
} from "@/lib/db/schema";
import { eq, and, sql, lte, gte } from "drizzle-orm";
import type { PdfOrganization, PdfDocumentType, CustomSlots, PdfRenderSettings } from "./types";
import { interpolate, getSampleData } from "./placeholders";
import { sanitizeHtml, sanitizeCss } from "./sanitize";
import { buildInvoiceHtml } from "./templates/invoice";
import { buildBillHtml } from "./templates/bill";
import { buildCreditNoteHtml } from "./templates/credit-note";
import { buildStatementHtml } from "./templates/customer-statement";
import { buildPnlHtml } from "./templates/profit-and-loss";
import { buildBalanceSheetHtml } from "./templates/balance-sheet";
import { buildVatAuditHtml } from "./templates/vat-audit";
import { buildInventoryHtml } from "./templates/inventory-valuation";

export interface CompileTemplateOptions {
  orgId: string;
  documentType: PdfDocumentType;
  templateId?: string;
  data?: Record<string, unknown>;
  useSampleData?: boolean;
  customSlots?: CustomSlots;
  customHtmlBody?: string;
}

async function loadOrg(orgId: string): Promise<PdfOrganization> {
  const [org] = await db
    .select({
      name: organizations.name,
      address: organizations.address,
      phone: organizations.phone,
      email: organizations.email,
      logoUrl: organizations.logoUrl,
      taxRegistrationNumber: organizations.taxRegistrationNumber,
      currency: organizations.currency,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) throw new Error("Organization not found");
  return org as PdfOrganization;
}

async function loadDocTypePdfSettings(orgId: string, documentType: PdfDocumentType): Promise<Partial<PdfRenderSettings>> {
  try {
    const [row] = await db
      .select()
      .from(documentTypePdfSettings)
      .where(and(eq(documentTypePdfSettings.organizationId, orgId), eq(documentTypePdfSettings.documentType, documentType)))
      .limit(1);

    if (!row) return {};
    return {
      pageSize: row.pageSize ?? undefined,
      orientation: row.orientation ?? undefined,
      marginTop: row.marginTop ?? undefined,
      marginRight: row.marginRight ?? undefined,
      marginBottom: row.marginBottom ?? undefined,
      marginLeft: row.marginLeft ?? undefined,
      accentColor: row.accentColor ?? undefined,
      fontFamily: row.fontFamily ?? undefined,
      showSections: (row.showSections as PdfRenderSettings["showSections"]) ?? undefined,
    };
  } catch {
    return {};
  }
}

function templateRowToSettings(tpl: { pageSize: string | null; orientation: string | null; marginTop: string | null; marginRight: string | null; marginBottom: string | null; marginLeft: string | null; accentColor: string | null; fontFamily: string | null; showSections: unknown }): Partial<PdfRenderSettings> {
  return {
    pageSize: tpl.pageSize ?? undefined,
    orientation: tpl.orientation ?? undefined,
    marginTop: tpl.marginTop ?? undefined,
    marginRight: tpl.marginRight ?? undefined,
    marginBottom: tpl.marginBottom ?? undefined,
    marginLeft: tpl.marginLeft ?? undefined,
    accentColor: tpl.accentColor ?? undefined,
    fontFamily: tpl.fontFamily ?? undefined,
    showSections: (tpl.showSections as PdfRenderSettings["showSections"]) ?? undefined,
  };
}

async function resolveReportData(
  orgId: string,
  documentType: PdfDocumentType,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const params = data.params as Record<string, string> | undefined;

  if (documentType === "profit_and_loss" && !data.pnl) {
    const from = params?.from;
    const to = params?.to;
    const conditions = [eq(journalLines.organizationId, orgId)];
    if (from) conditions.push(gte(journalEntries.entryDate, from));
    if (to) conditions.push(lte(journalEntries.entryDate, to));

    const rows = await db
      .select({
        accountCode: chartOfAccounts.code,
        accountName: chartOfAccounts.name,
        category: accountTypes.category,
        normalBalance: accountTypes.normalBalance,
        totalDebit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyDebit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyCredit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, and(eq(journalLines.journalEntryId, journalEntries.id), eq(journalEntries.status, "posted")))
      .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
      .innerJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
      .where(and(...conditions))
      .groupBy(chartOfAccounts.id, chartOfAccounts.code, chartOfAccounts.name, accountTypes.category, accountTypes.name, accountTypes.normalBalance, accountTypes.displayOrder)
      .orderBy(accountTypes.displayOrder, chartOfAccounts.code);

    const revenue: { code: string; name: string; amount: number }[] = [];
    const expenses: { code: string; name: string; amount: number }[] = [];
    for (const r of rows) {
      const balance = r.normalBalance === "debit" ? parseFloat(r.totalDebit) - parseFloat(r.totalCredit) : parseFloat(r.totalCredit) - parseFloat(r.totalDebit);
      if (Math.abs(balance) < 0.005) continue;
      if (r.category === "revenue") revenue.push({ code: r.accountCode, name: r.accountName, amount: balance });
      if (r.category === "expense") expenses.push({ code: r.accountCode, name: r.accountName, amount: balance });
    }
    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);

    data.report = { title: "Profit & Loss Statement", periodFrom: from ?? "", periodTo: to ?? "", generatedAt: new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) };
    data.pnl = { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
  }

  if (documentType === "balance_sheet" && !data.bs) {
    const asOf = params?.asOf ?? new Date().toISOString().split("T")[0];
    const conditions = [eq(journalLines.organizationId, orgId), lte(journalEntries.entryDate, asOf)];
    const rows = await db
      .select({
        accountCode: chartOfAccounts.code,
        accountName: chartOfAccounts.name,
        category: accountTypes.category,
        normalBalance: accountTypes.normalBalance,
        totalDebit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyDebit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${journalLines.baseCurrencyCredit}), 0)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, and(eq(journalLines.journalEntryId, journalEntries.id), eq(journalEntries.status, "posted")))
      .innerJoin(chartOfAccounts, eq(journalLines.accountId, chartOfAccounts.id))
      .innerJoin(accountTypes, eq(chartOfAccounts.accountTypeId, accountTypes.id))
      .where(and(...conditions))
      .groupBy(chartOfAccounts.id, chartOfAccounts.code, chartOfAccounts.name, accountTypes.category, accountTypes.name, accountTypes.normalBalance, accountTypes.displayOrder)
      .orderBy(accountTypes.displayOrder, chartOfAccounts.code);

    const assets: { code: string; name: string; amount: number }[] = [];
    const liabilities: { code: string; name: string; amount: number }[] = [];
    const equity: { code: string; name: string; amount: number }[] = [];
    let totalRevenueForRE = 0;
    let totalExpensesForRE = 0;
    for (const r of rows) {
      const balance = r.normalBalance === "debit" ? parseFloat(r.totalDebit) - parseFloat(r.totalCredit) : parseFloat(r.totalCredit) - parseFloat(r.totalDebit);
      if (r.category === "revenue") { totalRevenueForRE += balance; continue; }
      if (r.category === "expense") { totalExpensesForRE += balance; continue; }
      if (Math.abs(balance) < 0.005) continue;
      if (r.category === "asset") assets.push({ code: r.accountCode, name: r.accountName, amount: balance });
      if (r.category === "liability") liabilities.push({ code: r.accountCode, name: r.accountName, amount: balance });
      if (r.category === "equity") equity.push({ code: r.accountCode, name: r.accountName, amount: balance });
    }
    const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
    const totalLiabilities = liabilities.reduce((s, r) => s + r.amount, 0);
    const totalEquity = equity.reduce((s, r) => s + r.amount, 0);
    const retainedEarnings = totalRevenueForRE - totalExpensesForRE;

    data.report = { title: "Balance Sheet", asOfDate: asOf, generatedAt: new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) };
    data.bs = { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, retainedEarnings, isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + retainedEarnings)) < 0.01 };
  }

  if (documentType === "invoice" && !data.invoice && data.documentId) {
    const [inv] = await db.select().from(invoices).where(and(eq(invoices.id, data.documentId as string), eq(invoices.organizationId, orgId))).limit(1);
    if (inv) {
      const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id));
      const [cust] = await db.select({ name: customers.name, email: customers.email }).from(customers).where(eq(customers.id, inv.customerId)).limit(1);
      data.invoice = {
        number: inv.invoiceNumber, issueDate: inv.issueDate, dueDate: inv.dueDate, status: inv.status,
        customerName: cust?.name ?? "", subtotal: parseFloat(inv.subtotal ?? "0"), taxAmount: parseFloat(inv.taxAmount ?? "0"),
        total: parseFloat(inv.total ?? "0"), amountPaid: parseFloat(inv.amountPaid ?? "0"), amountDue: parseFloat(inv.amountDue ?? "0"),
        lines: lines.map((l) => ({ description: l.description ?? "", quantity: parseFloat(String(l.quantity ?? "0")), unitPrice: parseFloat(l.unitPrice ?? "0"), taxRate: parseFloat(l.taxRate ?? "0"), taxAmount: parseFloat(l.taxAmount ?? "0"), amount: parseFloat(l.amount ?? "0") })),
      };
      data.customer = { name: cust?.name ?? "", email: cust?.email ?? "" };
    }
  }

  if (documentType === "bill" && !data.bill && data.documentId) {
    const [b] = await db.select().from(bills).where(and(eq(bills.id, data.documentId as string), eq(bills.organizationId, orgId))).limit(1);
    if (b) {
      const lines = await db.select().from(billLines).where(eq(billLines.billId, b.id));
      const [supp] = await db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.id, b.supplierId)).limit(1);
      data.bill = {
        number: b.billNumber, issueDate: b.issueDate, dueDate: b.dueDate, status: b.status,
        supplierName: supp?.name ?? "", subtotal: parseFloat(b.subtotal ?? "0"), taxAmount: parseFloat(b.taxAmount ?? "0"),
        total: parseFloat(b.total ?? "0"), amountPaid: parseFloat(b.amountPaid ?? "0"), amountDue: parseFloat(b.amountDue ?? "0"),
        lines: lines.map((l) => ({ description: l.description ?? "", quantity: parseFloat(String(l.quantity ?? "0")), unitPrice: parseFloat(l.unitPrice ?? "0"), taxRate: parseFloat(l.taxRate ?? "0"), taxAmount: parseFloat(l.taxAmount ?? "0"), amount: parseFloat(l.amount ?? "0") })),
      };
    }
  }

  if (documentType === "vat_audit" && !data.vat) {
    data.report = { title: "VAT Audit Report", periodFrom: params?.from ?? "", periodTo: params?.to ?? "", generatedAt: new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) };
    data.vat = { outputVAT: 0, inputVAT: 0, netPayable: 0, outputCount: 0, inputCount: 0, transactions: [] };
  }

  if (documentType === "inventory_valuation" && !data.inventory) {
    const invItems = await db
      .select({ sku: items.sku, name: items.name, quantityOnHand: items.quantityOnHand, unitOfMeasure: items.unitOfMeasure, costPrice: items.costPrice })
      .from(items)
      .where(and(eq(items.organizationId, orgId), eq(items.isActive, true)));
    const mapped = invItems.map((i) => ({ ...i, costPrice: parseFloat(String(i.costPrice ?? "0")), quantityOnHand: parseFloat(String(i.quantityOnHand ?? "0")), totalValue: parseFloat(String(i.costPrice ?? "0")) * parseFloat(String(i.quantityOnHand ?? "0")) }));
    data.report = { title: "Inventory Valuation", asOfDate: new Date().toISOString().split("T")[0], generatedAt: new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) };
    data.inventory = { items: mapped, totalValue: mapped.reduce((s, i) => s + i.totalValue, 0), totalUnits: mapped.reduce((s, i) => s + i.quantityOnHand, 0), productCount: mapped.length };
  }

  return data;
}

// Backward-compat: map legacy template IDs to new ones
const LEGACY_ID_MAP: Record<string, string> = {
  "invoice-modern": "invoice-prestige",
  "invoice-classic": "invoice-executive",
  "invoice-minimal": "invoice-executive",
  "bill-modern": "bill-prestige",
  "bill-classic": "bill-executive",
  "bill-minimal": "bill-executive",
  "credit-note": "credit-note-prestige",
  "statement": "statement-prestige",
  "profit-and-loss": "profit-and-loss-prestige",
  "balance-sheet": "balance-sheet-prestige",
  "vat-audit": "vat-audit-prestige",
  "inventory-valuation": "inventory-valuation-prestige",
};

const BUILT_IN_IDS: Record<string, PdfDocumentType> = {
  "invoice-prestige": "invoice",
  "invoice-executive": "invoice",
  "bill-prestige": "bill",
  "bill-executive": "bill",
  "credit-note-prestige": "credit_note",
  "credit-note-executive": "credit_note",
  "statement-prestige": "statement",
  "statement-executive": "statement",
  "profit-and-loss-prestige": "profit_and_loss",
  "profit-and-loss-executive": "profit_and_loss",
  "balance-sheet-prestige": "balance_sheet",
  "balance-sheet-executive": "balance_sheet",
  "vat-audit-prestige": "vat_audit",
  "vat-audit-executive": "vat_audit",
  "inventory-valuation-prestige": "inventory_valuation",
  "inventory-valuation-executive": "inventory_valuation",
  // Legacy IDs for backward compatibility
  "invoice-modern": "invoice",
  "invoice-classic": "invoice",
  "invoice-minimal": "invoice",
  "bill-modern": "bill",
  "bill-classic": "bill",
  "bill-minimal": "bill",
  "credit-note": "credit_note",
  "statement": "statement",
  "profit-and-loss": "profit_and_loss",
  "balance-sheet": "balance_sheet",
  "vat-audit": "vat_audit",
  "inventory-valuation": "inventory_valuation",
};

function resolveTemplateId(id: string): string {
  return LEGACY_ID_MAP[id] ?? id;
}

function isBuiltInId(id: string): boolean {
  return id in BUILT_IN_IDS || id in LEGACY_ID_MAP;
}

function getVariant(templateId: string): string {
  const resolved = resolveTemplateId(templateId);
  const parts = resolved.split("-");
  return parts[parts.length - 1] ?? "prestige";
}

function buildFromBuiltIn(
  templateId: string,
  org: PdfOrganization,
  data: Record<string, unknown>,
  slots?: CustomSlots,
  pdfSettings?: Partial<PdfRenderSettings>
): string {
  const resolved = resolveTemplateId(templateId);
  const docType = BUILT_IN_IDS[resolved] ?? BUILT_IN_IDS[templateId];
  const variant = getVariant(resolved);

  switch (docType) {
    case "invoice":
      return buildInvoiceHtml(
        { org, invoice: data.invoice as Parameters<typeof buildInvoiceHtml>[0]["invoice"], pdfSettings },
        variant as "prestige" | "executive",
        slots
      );
    case "bill":
      return buildBillHtml(
        { org, bill: data.bill as Parameters<typeof buildBillHtml>[0]["bill"], pdfSettings },
        variant as "prestige" | "executive",
        slots
      );
    case "credit_note":
      return buildCreditNoteHtml(
        { org, creditNote: data.creditNote as Parameters<typeof buildCreditNoteHtml>[0]["creditNote"], pdfSettings },
        variant as "prestige" | "executive",
        slots
      );
    case "statement":
      return buildStatementHtml(
        { org, statement: data.statement as Parameters<typeof buildStatementHtml>[0]["statement"], pdfSettings },
        variant as "prestige" | "executive",
        slots
      );
    case "profit_and_loss":
      return buildPnlHtml(
        { org, report: data.report as Parameters<typeof buildPnlHtml>[0]["report"], pnl: data.pnl as Parameters<typeof buildPnlHtml>[0]["pnl"] },
        variant as "prestige" | "executive",
        slots
      );
    case "balance_sheet":
      return buildBalanceSheetHtml(
        { org, report: data.report as Parameters<typeof buildBalanceSheetHtml>[0]["report"], bs: data.bs as Parameters<typeof buildBalanceSheetHtml>[0]["bs"] },
        variant as "prestige" | "executive",
        slots
      );
    case "vat_audit":
      return buildVatAuditHtml(
        { org, report: data.report as Parameters<typeof buildVatAuditHtml>[0]["report"], vat: data.vat as Parameters<typeof buildVatAuditHtml>[0]["vat"] },
        variant as "prestige" | "executive",
        slots
      );
    case "inventory_valuation":
      return buildInventoryHtml(
        { org, report: data.report as Parameters<typeof buildInventoryHtml>[0]["report"], inventory: data.inventory as Parameters<typeof buildInventoryHtml>[0]["inventory"] },
        variant as "prestige" | "executive",
        slots
      );
    default:
      throw new Error(`Unknown built-in template: ${templateId}`);
  }
}

function defaultBuiltInId(docType: PdfDocumentType): string {
  switch (docType) {
    case "invoice": return "invoice-prestige";
    case "bill": return "bill-prestige";
    case "credit_note": return "credit-note-prestige";
    case "statement": return "statement-prestige";
    case "profit_and_loss": return "profit-and-loss-prestige";
    case "balance_sheet": return "balance-sheet-prestige";
    case "vat_audit": return "vat-audit-prestige";
    case "inventory_valuation": return "inventory-valuation-prestige";
  }
}

export async function compileTemplate(options: CompileTemplateOptions): Promise<string> {
  const { orgId, documentType, templateId, customSlots, customHtmlBody, useSampleData } = options;

  const org = await loadOrg(orgId);
  let data: Record<string, unknown> = useSampleData
    ? getSampleData(documentType)
    : { company: org, ...options.data };

  if (!data.company) {
    data.company = org;
  }

  if (documentType === "invoice" && data.invoice) {
    const inv = data.invoice as Record<string, unknown>;
    if (!inv.number && inv.invoiceNumber) inv.number = inv.invoiceNumber;
    if (!inv.customerName && inv.customerName === undefined) inv.customerName = "";
    if (inv.customerId && !inv.customerAddress) {
      try {
        const [cust] = await db.select({
          address: customers.address,
          city: customers.city,
          country: customers.country,
          email: customers.email,
          taxNumber: customers.taxNumber,
        }).from(customers).where(eq(customers.id, inv.customerId as string)).limit(1);
        if (cust) {
          const parts = [cust.address, cust.city, cust.country].filter(Boolean);
          if (parts.length > 0) inv.customerAddress = parts.join(", ");
          if (!inv.customerEmail && cust.email) inv.customerEmail = cust.email;
          if (!inv.customerTaxNumber && cust.taxNumber) inv.customerTaxNumber = cust.taxNumber;
        }
      } catch { /* non-critical */ }
    }
  }
  if (documentType === "bill" && data.bill) {
    const bill = data.bill as Record<string, unknown>;
    if (!bill.number && bill.billNumber) bill.number = bill.billNumber;
    if (!bill.supplierName && bill.supplierName === undefined) bill.supplierName = "";
    if (bill.supplierId && !bill.supplierAddress) {
      try {
        const [supp] = await db.select({
          address: suppliers.address,
          city: suppliers.city,
          country: suppliers.country,
          email: suppliers.email,
          taxNumber: suppliers.taxNumber,
        }).from(suppliers).where(eq(suppliers.id, bill.supplierId as string)).limit(1);
        if (supp) {
          const parts = [supp.address, supp.city, supp.country].filter(Boolean);
          if (parts.length > 0) bill.supplierAddress = parts.join(", ");
          if (!bill.supplierEmail && supp.email) bill.supplierEmail = supp.email;
          if (!bill.supplierTaxNumber && supp.taxNumber) bill.supplierTaxNumber = supp.taxNumber;
        }
      } catch { /* non-critical */ }
    }
  }
  if (documentType === "statement" && data.statement) {
    const stmt = data.statement as Record<string, unknown>;
    // Flatten nested customer object into top-level fields
    if (!stmt.customerName && stmt.customer) {
      const cust = stmt.customer as Record<string, unknown>;
      stmt.customerName = cust.name ?? "";
      if (!stmt.customerCity) stmt.customerCity = cust.city ?? "";
      if (!stmt.customerCountry) stmt.customerCountry = cust.country ?? "";
      if (!stmt.customerAddress) stmt.customerAddress = cust.address ?? null;
    }
    // Build entries array from separate arrays if not already present
    if (!stmt.entries) {
      type Entry = { date: string; type: string; ref: string; debit: number; credit: number };
      const entries: Entry[] = [];
      const invArr = stmt.invoices as Array<Record<string, unknown>> | undefined;
      const cnArr = stmt.creditNotes as Array<Record<string, unknown>> | undefined;
      const payArr = stmt.payments as Array<Record<string, unknown>> | undefined;
      const refArr = stmt.refunds as Array<Record<string, unknown>> | undefined;
      if (invArr) for (const inv of invArr) entries.push({ date: String(inv.issueDate ?? ""), type: "Invoice", ref: String(inv.invoiceNumber ?? ""), debit: Number(inv.total ?? 0), credit: 0 });
      if (cnArr) for (const cn of cnArr) entries.push({ date: String(cn.issueDate ?? ""), type: "Credit Note", ref: String(cn.creditNoteNumber ?? ""), debit: 0, credit: Number(cn.total ?? 0) });
      if (payArr) for (const p of payArr) entries.push({ date: String(p.paymentDate ?? ""), type: "Receipt", ref: String(p.paymentNumber ?? ""), debit: 0, credit: Number(p.amount ?? 0) });
      if (refArr) for (const r of refArr) entries.push({ date: String(r.paymentDate ?? ""), type: "Refund", ref: String(r.paymentNumber ?? ""), debit: Number(r.amount ?? 0), credit: 0 });
      entries.sort((a, b) => a.date.localeCompare(b.date));
      stmt.entries = entries;
    }
  }
  if (documentType === "credit_note" && data.creditNote) {
    const cn = data.creditNote as Record<string, unknown>;
    if (!cn.number && cn.creditNoteNumber) cn.number = cn.creditNoteNumber;
    if (!cn.date && cn.issueDate) cn.date = cn.issueDate;
    if (!cn.entityName && cn.customerName) cn.entityName = cn.customerName;
    if (!cn.entityName && cn.supplierName) cn.entityName = cn.supplierName;
    if (!cn.entityAddress && cn.customerAddress) cn.entityAddress = cn.customerAddress;
    if (!cn.entityAddress && cn.supplierAddress) cn.entityAddress = cn.supplierAddress;
    if (!cn.entityEmail && cn.customerEmail) cn.entityEmail = cn.customerEmail;
    if (!cn.entityEmail && cn.supplierEmail) cn.entityEmail = cn.supplierEmail;
    if (!cn.type && cn.creditNoteType) cn.type = cn.creditNoteType;
    if (cn.type !== "sales" && cn.type !== "purchase") cn.type = "sales";
  }

  if (!useSampleData) {
    data = await resolveReportData(orgId, documentType, data);
  }

  if (customHtmlBody) {
    const { wrapInBaseLayout } = await import("./templates/base-layout");
    const sanitized = sanitizeHtml(customHtmlBody);
    const orgFmt = { numberFormat: org.numberFormat, dateFormat: org.dateFormat };
    const interpolated = interpolate(sanitized, data, org.currency, orgFmt);
    return wrapInBaseLayout({
      org,
      bodyHtml: interpolated,
      title: documentType,
      slots: customSlots
        ? {
            ...customSlots,
            headerHtml: customSlots.headerHtml ? sanitizeHtml(customSlots.headerHtml) : undefined,
            footerHtml: customSlots.footerHtml ? sanitizeHtml(customSlots.footerHtml) : undefined,
            customCss: customSlots.customCss ? sanitizeCss(customSlots.customCss) : undefined,
          }
        : undefined,
    });
  }

  if (templateId && !isBuiltInId(templateId)) {
    const [tpl] = await db
      .select()
      .from(pdfTemplates)
      .where(and(eq(pdfTemplates.id, templateId), eq(pdfTemplates.organizationId, orgId)))
      .limit(1);

    if (tpl) {
      const { wrapInBaseLayout } = await import("./templates/base-layout");
      const tplSettings = templateRowToSettings(tpl);
      const orgFmt = { numberFormat: org.numberFormat, dateFormat: org.dateFormat };
      const interpolated = interpolate(sanitizeHtml(tpl.htmlBody), data, org.currency, orgFmt);
      return wrapInBaseLayout({
        org,
        bodyHtml: interpolated,
        title: tpl.name,
        pdfSettings: tplSettings,
        slots: {
          headerHtml: tpl.headerHtml ? sanitizeHtml(tpl.headerHtml) : customSlots?.headerHtml,
          footerHtml: tpl.footerHtml ? sanitizeHtml(tpl.footerHtml) : customSlots?.footerHtml,
          customCss: tpl.customCss ? sanitizeCss(tpl.customCss) : customSlots?.customCss,
          watermark: tpl.watermark ?? customSlots?.watermark,
        },
      });
    }
  }

  const builtInId = templateId && isBuiltInId(templateId) ? resolveTemplateId(templateId) : defaultBuiltInId(documentType);
  const docTypeSettings = await loadDocTypePdfSettings(orgId, documentType);
  return buildFromBuiltIn(builtInId, org, data, customSlots, docTypeSettings);
}

export function getBuiltInTemplates() {
  return [
    { id: "invoice-prestige", name: "Prestige Invoice", documentType: "invoice" as const, isBuiltIn: true },
    { id: "invoice-executive", name: "Executive Invoice", documentType: "invoice" as const, isBuiltIn: true },
    { id: "bill-prestige", name: "Prestige Bill", documentType: "bill" as const, isBuiltIn: true },
    { id: "bill-executive", name: "Executive Bill", documentType: "bill" as const, isBuiltIn: true },
    { id: "credit-note-prestige", name: "Prestige Credit Note", documentType: "credit_note" as const, isBuiltIn: true },
    { id: "credit-note-executive", name: "Executive Credit Note", documentType: "credit_note" as const, isBuiltIn: true },
    { id: "statement-prestige", name: "Prestige Statement", documentType: "statement" as const, isBuiltIn: true },
    { id: "statement-executive", name: "Executive Statement", documentType: "statement" as const, isBuiltIn: true },
    { id: "profit-and-loss-prestige", name: "Prestige Profit & Loss", documentType: "profit_and_loss" as const, isBuiltIn: true },
    { id: "profit-and-loss-executive", name: "Executive Profit & Loss", documentType: "profit_and_loss" as const, isBuiltIn: true },
    { id: "balance-sheet-prestige", name: "Prestige Balance Sheet", documentType: "balance_sheet" as const, isBuiltIn: true },
    { id: "balance-sheet-executive", name: "Executive Balance Sheet", documentType: "balance_sheet" as const, isBuiltIn: true },
    { id: "vat-audit-prestige", name: "Prestige VAT Audit", documentType: "vat_audit" as const, isBuiltIn: true },
    { id: "vat-audit-executive", name: "Executive VAT Audit", documentType: "vat_audit" as const, isBuiltIn: true },
    { id: "inventory-valuation-prestige", name: "Prestige Inventory Valuation", documentType: "inventory_valuation" as const, isBuiltIn: true },
    { id: "inventory-valuation-executive", name: "Executive Inventory Valuation", documentType: "inventory_valuation" as const, isBuiltIn: true },
  ];
}
