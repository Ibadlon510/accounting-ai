import { db } from "@/lib/db";
import { taxCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TaxCodeType, VatAmountLine, VatLineClassification } from "./types";

export type ResolvedTaxCode = {
  id: string;
  code: string;
  name: string;
  rate: number;
  type: TaxCodeType;
};

const VALID_TYPES = new Set<TaxCodeType>([
  "output",
  "input",
  "exempt",
  "zero",
  "reverse_charge",
]);

/** Normalize a raw tax_codes.type string. */
export function normalizeTaxCodeType(
  type: string | null | undefined
): TaxCodeType | null {
  if (!type) return null;
  const t = type.trim().toLowerCase() as TaxCodeType;
  return VALID_TYPES.has(t) ? t : null;
}

/**
 * Infer tax type from a free-text tax code when the org row is missing.
 * Used as a fallback for legacy lines that only store `taxCode` strings.
 */
export function inferTaxTypeFromCode(
  code: string | null | undefined
): TaxCodeType | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  if (!c) return null;
  if (c === "EXEMPT" || c.startsWith("EX")) return "exempt";
  if (c === "ZERO" || c === "ZR" || c === "Z" || c.includes("ZERO")) return "zero";
  if (
    c === "RC" ||
    c === "RCM" ||
    c.startsWith("RC_") ||
    c.includes("REVERSE")
  ) {
    return "reverse_charge";
  }
  if (c.includes("INPUT") || c === "VAT_INPUT") return "input";
  return "output";
}

/** Map tax code type → VAT return classification bucket. */
export function classifyTaxType(
  type: TaxCodeType | string | null | undefined
): VatLineClassification {
  const t = normalizeTaxCodeType(typeof type === "string" ? type : null);
  if (t === "exempt") return "exempt";
  if (t === "zero") return "zero";
  if (t === "reverse_charge") return "reverse_charge";
  return "standard";
}

export function isReverseCharge(
  type: TaxCodeType | string | null | undefined
): boolean {
  return classifyTaxType(type) === "reverse_charge";
}

/** Load all active tax codes for an org, keyed by id and by uppercased code. */
export async function loadOrgTaxCodeMaps(organizationId: string): Promise<{
  byId: Map<string, ResolvedTaxCode>;
  byCode: Map<string, ResolvedTaxCode>;
}> {
  const rows = await db
    .select({
      id: taxCodes.id,
      code: taxCodes.code,
      name: taxCodes.name,
      rate: taxCodes.rate,
      type: taxCodes.type,
    })
    .from(taxCodes)
    .where(eq(taxCodes.organizationId, organizationId));

  const byId = new Map<string, ResolvedTaxCode>();
  const byCode = new Map<string, ResolvedTaxCode>();
  for (const r of rows) {
    const resolved: ResolvedTaxCode = {
      id: r.id,
      code: r.code,
      name: r.name,
      rate: Number(r.rate ?? 0),
      type: normalizeTaxCodeType(r.type) ?? inferTaxTypeFromCode(r.code) ?? "output",
    };
    byId.set(r.id, resolved);
    byCode.set(r.code.trim().toUpperCase(), resolved);
  }
  return { byId, byCode };
}

/** Resolve the effective tax type for a document/journal line. */
export function resolveLineTaxType(
  line: VatAmountLine,
  maps?: { byId: Map<string, ResolvedTaxCode>; byCode: Map<string, ResolvedTaxCode> }
): TaxCodeType {
  const explicit = normalizeTaxCodeType(line.taxType ?? null);
  if (explicit) return explicit;

  if (line.taxCodeId && maps?.byId.has(line.taxCodeId)) {
    return maps.byId.get(line.taxCodeId)!.type;
  }
  if (line.taxCode && maps?.byCode.has(line.taxCode.trim().toUpperCase())) {
    return maps.byCode.get(line.taxCode.trim().toUpperCase())!.type;
  }
  return inferTaxTypeFromCode(line.taxCode) ?? "output";
}

/**
 * Amount the customer/supplier is actually owed/due.
 * Reverse-charge VAT is accounted for by the recipient and is not added to payable.
 */
export function payableAmountForLine(
  amount: number,
  taxAmount: number,
  taxType: TaxCodeType | string | null | undefined
): number {
  const net = Number(amount) || 0;
  const tax = Number(taxAmount) || 0;
  if (isReverseCharge(taxType)) return Math.round(net * 100) / 100;
  return Math.round((net + tax) * 100) / 100;
}

export function documentPayableTotal(
  lines: Array<{ amount: number; taxAmount: number; taxType?: TaxCodeType | string | null }>
): number {
  const total = lines.reduce(
    (s, l) => s + payableAmountForLine(l.amount, l.taxAmount, l.taxType),
    0
  );
  return Math.round(total * 100) / 100;
}
