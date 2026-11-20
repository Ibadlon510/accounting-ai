import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { exchangeRates, organizations } from "@/lib/db/schema";
import { normalizeCurrency } from "@/lib/accounting/currencies";

export { COMMON_CURRENCIES, normalizeCurrency } from "@/lib/accounting/currencies";

export class MissingExchangeRateError extends Error {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly asOfDate: string;

  constructor(fromCurrency: string, toCurrency: string, asOfDate: string) {
    super(
      `No exchange rate set for ${fromCurrency} → ${toCurrency} on or before ${asOfDate}. ` +
        `Set a rate in Settings → Exchange Rates before creating this document.`
    );
    this.name = "MissingExchangeRateError";
    this.fromCurrency = fromCurrency;
    this.toCurrency = toCurrency;
    this.asOfDate = asOfDate;
  }
}

export function toBaseAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Resolve the org's FX rate for converting `fromCurrency` into the org base currency.
 * Rate meaning: 1 fromCurrency = rate baseCurrency.
 * Returns 1 when currencies match. Throws MissingExchangeRateError when no rate exists.
 */
export async function resolveExchangeRate(params: {
  organizationId: string;
  fromCurrency: string;
  asOfDate: string;
  /** Optional override of org base currency (avoids an extra query when already loaded). */
  baseCurrency?: string;
}): Promise<{ rate: number; baseCurrency: string }> {
  const from = normalizeCurrency(params.fromCurrency);
  let base = params.baseCurrency ? normalizeCurrency(params.baseCurrency) : "";

  if (!base) {
    const [org] = await db
      .select({ currency: organizations.currency })
      .from(organizations)
      .where(eq(organizations.id, params.organizationId))
      .limit(1);
    base = normalizeCurrency(org?.currency);
  }

  if (from === base) {
    return { rate: 1, baseCurrency: base };
  }

  const asOf = params.asOfDate.slice(0, 10);

  const [row] = await db
    .select({ rate: exchangeRates.rate })
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.organizationId, params.organizationId),
        eq(exchangeRates.fromCurrency, from),
        eq(exchangeRates.toCurrency, base),
        lte(exchangeRates.effectiveDate, asOf)
      )
    )
    .orderBy(desc(exchangeRates.effectiveDate))
    .limit(1);

  if (!row) {
    throw new MissingExchangeRateError(from, base, asOf);
  }

  const rate = parseFloat(row.rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new MissingExchangeRateError(from, base, asOf);
  }

  return { rate, baseCurrency: base };
}
