import type { journalLines } from "@/lib/db/schema";

type JournalLineInsert = typeof journalLines.$inferInsert;

/**
 * UAE reverse-charge purchase treatment (MVP):
 *   Dr Expense / purchase account   (net)
 *   Dr VAT Input 1450               (VAT)   — reclaimable
 *   Cr VAT Output 2200              (VAT)   — due under RC
 *   Cr AP / Cash                    (net)   — supplier not paid VAT
 *
 * Net VAT effect is typically zero when fully recoverable; both sides
 * still appear on VAT 201 (boxes 10a–10c).
 */
export function buildReverseChargeVatLines(params: {
  journalEntryId: string;
  organizationId: string;
  vatInputAccountId: string;
  vatOutputAccountId: string;
  taxAmount: number;
  taxCode: string;
  description: string;
  currency: string;
  startLineOrder: number;
}): JournalLineInsert[] {
  const tax = Math.round((Number(params.taxAmount) || 0) * 100) / 100;
  if (tax <= 0) return [];

  const {
    journalEntryId,
    organizationId,
    vatInputAccountId,
    vatOutputAccountId,
    taxCode,
    description,
    currency,
    startLineOrder,
  } = params;

  return [
    {
      journalEntryId,
      organizationId,
      accountId: vatInputAccountId,
      description: `VAT input (reverse charge) — ${description}`,
      debit: String(tax),
      credit: "0",
      currency,
      baseCurrencyDebit: String(tax),
      baseCurrencyCredit: "0",
      taxCode,
      taxAmount: String(tax),
      lineOrder: startLineOrder,
    },
    {
      journalEntryId,
      organizationId,
      accountId: vatOutputAccountId,
      description: `VAT output (reverse charge) — ${description}`,
      debit: "0",
      credit: String(tax),
      currency,
      baseCurrencyDebit: "0",
      baseCurrencyCredit: String(tax),
      taxCode,
      taxAmount: String(tax),
      lineOrder: startLineOrder + 1,
    },
  ];
}

/**
 * Sales-side reverse charge: supplier does not charge VAT.
 * No VAT journal lines — the supply value is reported in Box 3.
 */
export function salesReverseChargePostsVat(): boolean {
  return false;
}
