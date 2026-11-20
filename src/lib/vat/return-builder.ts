import { db } from "@/lib/db";
import {
  invoiceLines,
  invoices,
  billLines,
  bills,
  expenseLines,
  expenses,
  documentTransactions,
  documentTransactionLines,
  taxCodes,
} from "@/lib/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import {
  classifyTaxType,
  inferTaxTypeFromCode,
  loadOrgTaxCodeMaps,
  normalizeTaxCodeType,
  resolveLineTaxType,
} from "./tax-codes";
import type { TaxCodeType, Vat201Boxes } from "./types";

export const VAT201_QUARTER_MAP: Record<string, { start: string; end: string }> = {
  "Q1-2025": { start: "2025-01-01", end: "2025-03-31" },
  "Q2-2025": { start: "2025-04-01", end: "2025-06-30" },
  "Q3-2025": { start: "2025-07-01", end: "2025-09-30" },
  "Q4-2025": { start: "2025-10-01", end: "2025-12-31" },
  "Q1-2026": { start: "2026-01-01", end: "2026-03-31" },
  "Q2-2026": { start: "2026-04-01", end: "2026-06-30" },
  "Q3-2026": { start: "2026-07-01", end: "2026-09-30" },
  "Q4-2026": { start: "2026-10-01", end: "2026-12-31" },
  "Q1-2027": { start: "2027-01-01", end: "2027-03-31" },
  "Q2-2027": { start: "2027-04-01", end: "2027-06-30" },
  "Q3-2027": { start: "2027-07-01", end: "2027-09-30" },
  "Q4-2027": { start: "2027-10-01", end: "2027-12-31" },
};

type Bucket = {
  standardBase: number;
  standardVat: number;
  zeroBase: number;
  exemptBase: number;
  reverseChargeBase: number;
  reverseChargeVat: number;
};

function emptyBucket(): Bucket {
  return {
    standardBase: 0,
    standardVat: 0,
    zeroBase: 0,
    exemptBase: 0,
    reverseChargeBase: 0,
    reverseChargeVat: 0,
  };
}

function addLine(bucket: Bucket, classification: ReturnType<typeof classifyTaxType>, base: number, vat: number) {
  const b = Math.round((Number(base) || 0) * 100) / 100;
  const v = Math.round((Number(vat) || 0) * 100) / 100;
  switch (classification) {
    case "zero":
      bucket.zeroBase += b;
      break;
    case "exempt":
      bucket.exemptBase += b;
      break;
    case "reverse_charge":
      bucket.reverseChargeBase += b;
      bucket.reverseChargeVat += v;
      break;
    default:
      bucket.standardBase += b;
      bucket.standardVat += v;
      break;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build FTA-aligned VAT 201 boxes for a quarter from invoices, bills,
 * expenses, and document transactions — classified by tax code type.
 */
export async function buildVat201Report(
  organizationId: string,
  quarter: string
): Promise<Vat201Boxes | { error: string; status: number }> {
  const range = VAT201_QUARTER_MAP[quarter];
  if (!range) {
    return { error: "Invalid quarter. Use e.g. Q1-2026", status: 400 };
  }

  const { start: startDate, end: endDate } = range;
  const maps = await loadOrgTaxCodeMaps(organizationId);

  const sales = emptyBucket();
  const purchases = emptyBucket();

  // ── Sales: invoice lines in period (exclude cancelled) ──
  const invRows = await db
    .select({
      amount: invoiceLines.amount,
      taxAmount: invoiceLines.taxAmount,
      taxCode: invoiceLines.taxCode,
      taxCodeId: invoiceLines.taxCodeId,
      status: invoices.status,
    })
    .from(invoiceLines)
    .innerJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate)
      )
    );

  for (const row of invRows) {
    if (row.status === "cancelled" || row.status === "draft") continue;
    const type = resolveLineTaxType(
      {
        amount: Number(row.amount ?? 0),
        taxAmount: Number(row.taxAmount ?? 0),
        taxCode: row.taxCode,
        taxCodeId: row.taxCodeId,
      },
      maps
    );
    // Sales reverse-charge: report base only (buyer accounts for VAT)
    const vat =
      classifyTaxType(type) === "reverse_charge"
        ? 0
        : Number(row.taxAmount ?? 0);
    addLine(sales, classifyTaxType(type), Number(row.amount ?? 0), vat);
  }

  // ── Purchases: bill lines ──
  const billRows = await db
    .select({
      amount: billLines.amount,
      taxAmount: billLines.taxAmount,
      taxCode: billLines.taxCode,
      taxCodeId: billLines.taxCodeId,
      status: bills.status,
    })
    .from(billLines)
    .innerJoin(bills, eq(billLines.billId, bills.id))
    .where(
      and(
        eq(bills.organizationId, organizationId),
        gte(bills.issueDate, startDate),
        lte(bills.issueDate, endDate)
      )
    );

  for (const row of billRows) {
    if (row.status === "cancelled" || row.status === "draft") continue;
    const type = resolveLineTaxType(
      {
        amount: Number(row.amount ?? 0),
        taxAmount: Number(row.taxAmount ?? 0),
        taxCode: row.taxCode,
        taxCodeId: row.taxCodeId,
      },
      maps
    );
    // Purchases: treat "output" codes on bills as standard input
    const classification =
      type === "output" ? "standard" : classifyTaxType(type);
    addLine(
      purchases,
      classification,
      Number(row.amount ?? 0),
      Number(row.taxAmount ?? 0)
    );
  }

  // ── Expenses (direct payments) ──
  const expRows = await db
    .select({
      amount: expenseLines.amount,
      taxAmount: expenseLines.taxAmount,
      taxCodeId: expenseLines.taxCodeId,
      taxRate: expenseLines.taxRate,
    })
    .from(expenseLines)
    .innerJoin(expenses, eq(expenseLines.expenseId, expenses.id))
    .where(
      and(
        eq(expenses.organizationId, organizationId),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      )
    );

  for (const row of expRows) {
    let type: TaxCodeType = "input";
    if (row.taxCodeId && maps.byId.has(row.taxCodeId)) {
      type = maps.byId.get(row.taxCodeId)!.type;
    } else if (Number(row.taxAmount ?? 0) === 0 && Number(row.taxRate ?? 0) === 0) {
      type = "exempt";
    }
    const classification =
      type === "output" ? "standard" : classifyTaxType(type);
    addLine(
      purchases,
      classification,
      Number(row.amount ?? 0),
      Number(row.taxAmount ?? 0)
    );
  }

  // ── Document transactions (AI verify expense/receipt path only) ──
  // Bill/invoice verify writes bills/invoices instead, so no double-count.
  const docLineRows = await db
    .select({
      amount: documentTransactionLines.amount,
      taxAmount: documentTransactionLines.taxAmount,
      taxCodeId: documentTransactionLines.taxCodeId,
      taxRate: documentTransactionLines.taxRate,
      parentNet: documentTransactions.netAmount,
      parentVat: documentTransactions.vatAmount,
      parentId: documentTransactions.id,
      lineId: documentTransactionLines.id,
    })
    .from(documentTransactions)
    .leftJoin(
      documentTransactionLines,
      eq(documentTransactionLines.documentTransactionId, documentTransactions.id)
    )
    .where(
      and(
        eq(documentTransactions.organizationId, organizationId),
        gte(documentTransactions.date, startDate),
        lte(documentTransactions.date, endDate)
      )
    );

  const seenParentWithoutLines = new Set<string>();
  for (const row of docLineRows) {
    if (row.lineId) {
      let type: TaxCodeType = "input";
      if (row.taxCodeId && maps.byId.has(row.taxCodeId)) {
        type = maps.byId.get(row.taxCodeId)!.type;
      } else if (
        Number(row.taxAmount ?? 0) === 0 &&
        Number(row.taxRate ?? 0) === 0
      ) {
        type = "exempt";
      }
      const classification =
        type === "output" ? "standard" : classifyTaxType(type);
      addLine(
        purchases,
        classification,
        Number(row.amount ?? 0),
        Number(row.taxAmount ?? 0)
      );
      continue;
    }

    // Header-only document transaction (no line rows)
    if (seenParentWithoutLines.has(row.parentId)) continue;
    seenParentWithoutLines.add(row.parentId);
    const net = Number(row.parentNet ?? 0);
    const vat = Number(row.parentVat ?? 0);
    if (vat > 0) {
      addLine(purchases, "standard", net, vat);
    } else if (net > 0) {
      addLine(purchases, "exempt", net, 0);
    }
  }

  const outputVat = round2(sales.standardVat + purchases.reverseChargeVat);
  const inputVat = round2(purchases.standardVat + purchases.reverseChargeVat);
  const netVat = round2(outputVat - inputVat);

  const taxableSales = round2(sales.standardBase);
  const taxablePurchases = round2(purchases.standardBase);
  const zeroRatedSales = round2(sales.zeroBase);
  const exemptSales = round2(sales.exemptBase);
  const reverseChargeSales = round2(sales.reverseChargeBase);
  const reverseChargePurchases = round2(purchases.reverseChargeBase);
  const reverseChargeOutputVat = round2(purchases.reverseChargeVat);
  const reverseChargeInputVat = round2(purchases.reverseChargeVat);

  return {
    quarter,
    periodStart: startDate,
    periodEnd: endDate,
    box1a_taxable_sales: taxableSales,
    box1b_output_vat: round2(sales.standardVat),
    box3_reverse_charge_supplies: reverseChargeSales,
    box4_zero_rated_supplies: zeroRatedSales,
    box5_exempt_supplies: exemptSales,
    box8_taxable_purchases: taxablePurchases,
    box9_input_vat: round2(purchases.standardVat),
    box10a_reverse_charge_purchases: reverseChargePurchases,
    box10b_reverse_charge_output_vat: reverseChargeOutputVat,
    box10c_reverse_charge_input_vat: reverseChargeInputVat,
    box15_net_vat_payable: netVat,
    taxableSales,
    outputVat,
    taxablePurchases,
    inputVat,
    netVat,
    zeroRatedSales,
    exemptSales,
    reverseChargeSales,
    reverseChargePurchases,
    reverseChargeOutputVat,
    reverseChargeInputVat,
  };
}

/** Resolve tax type for a code/id pair (used by JE posters). */
export async function resolveTaxTypeForOrg(
  organizationId: string,
  opts: { taxCodeId?: string | null; taxCode?: string | null }
): Promise<TaxCodeType> {
  if (opts.taxCodeId) {
    const [row] = await db
      .select({ type: taxCodes.type, code: taxCodes.code })
      .from(taxCodes)
      .where(
        and(eq(taxCodes.id, opts.taxCodeId), eq(taxCodes.organizationId, organizationId))
      )
      .limit(1);
    if (row) {
      return normalizeTaxCodeType(row.type) ?? inferTaxTypeFromCode(row.code) ?? "output";
    }
  }
  if (opts.taxCode) {
    const [row] = await db
      .select({ type: taxCodes.type, code: taxCodes.code })
      .from(taxCodes)
      .where(
        and(
          eq(taxCodes.organizationId, organizationId),
          eq(taxCodes.code, opts.taxCode)
        )
      )
      .limit(1);
    if (row) {
      return normalizeTaxCodeType(row.type) ?? inferTaxTypeFromCode(row.code) ?? "output";
    }
    return inferTaxTypeFromCode(opts.taxCode) ?? "output";
  }
  return "output";
}

export async function resolveTaxTypesByIds(
  organizationId: string,
  ids: string[]
): Promise<Map<string, TaxCodeType>> {
  const map = new Map<string, TaxCodeType>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return map;
  const rows = await db
    .select({ id: taxCodes.id, type: taxCodes.type, code: taxCodes.code })
    .from(taxCodes)
    .where(
      and(eq(taxCodes.organizationId, organizationId), inArray(taxCodes.id, unique))
    );
  for (const r of rows) {
    map.set(
      r.id,
      normalizeTaxCodeType(r.type) ?? inferTaxTypeFromCode(r.code) ?? "output"
    );
  }
  return map;
}
