/**
 * UAE-style end-of-service (gratuity) provision calculator.
 *
 * Assumptions (documented for ACC-14 / PR):
 * - Based on Federal Decree-Law No. 33 of 2021 style rates commonly used in
 *   UAE private-sector bookkeeping (unlimited-contract style schedule):
 *   - 21 days of *basic* wage for each of the first five years of service
 *   - 30 days of *basic* wage for each additional year
 * - Daily wage = basic monthly salary / 30
 * - Years of service = exact years from join date to as-of date (day fraction / 365.25)
 * - Employees with < 1 full year of service accrue proportionally on the 21-day rate
 * - Total liability is capped at 2 years of basic wage (24 × monthly basic)
 * - Housing / transport allowances are excluded (basic only)
 * - Provision JE posts the *increase* vs previously posted provision lines
 *   (Dr 6040 End of Service Provision / Cr 2600 EOS Long-term)
 * - This is an accounting estimate, not legal advice; actual settlement may differ
 *   by contract type, resignation vs termination, and MOL practice.
 */

export type GratuityInput = {
  basicSalary: number;
  joinDate: string; // YYYY-MM-DD
  asOfDate: string; // YYYY-MM-DD
};

export type GratuityResult = {
  yearsOfService: number;
  dailyWage: number;
  daysEntitled: number;
  uncappedLiability: number;
  cumulativeLiability: number;
  capped: boolean;
  calculationNotes: string;
};

function parseDateUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Days of basic wage entitled for `years` of continuous service. */
export function entitledDaysForYears(years: number): number {
  if (years <= 0) return 0;
  if (years <= 5) return years * 21;
  return 5 * 21 + (years - 5) * 30;
}

export function calculateUaeGratuity(input: GratuityInput): GratuityResult {
  const basic = Number.isFinite(input.basicSalary) ? Math.max(0, input.basicSalary) : 0;
  const join = parseDateUTC(input.joinDate);
  const asOf = parseDateUTC(input.asOfDate);

  if (Number.isNaN(join.getTime()) || Number.isNaN(asOf.getTime()) || asOf < join || basic <= 0) {
    return {
      yearsOfService: 0,
      dailyWage: 0,
      daysEntitled: 0,
      uncappedLiability: 0,
      cumulativeLiability: 0,
      capped: false,
      calculationNotes: "No liability (missing join date, as-of before join, or zero basic).",
    };
  }

  const ms = asOf.getTime() - join.getTime();
  const years = round4(ms / (365.25 * 24 * 60 * 60 * 1000));
  const dailyWage = round4(basic / 30);
  const daysEntitled = round4(entitledDaysForYears(years));
  const uncapped = round2(dailyWage * daysEntitled);
  const cap = round2(basic * 24); // 2 years' basic wage
  const capped = uncapped > cap;
  const cumulativeLiability = Math.min(uncapped, cap);

  const calculationNotes = [
    `YoS ${years.toFixed(4)} yrs; daily = basic/30 = ${dailyWage.toFixed(4)};`,
    `days entitled = ${daysEntitled.toFixed(4)} (21/yr ≤5y, 30/yr after);`,
    capped
      ? `uncapped ${uncapped.toFixed(2)} capped at 2y basic ${cap.toFixed(2)}.`
      : `liability ${cumulativeLiability.toFixed(2)} (under 2y cap ${cap.toFixed(2)}).`,
  ].join(" ");

  return {
    yearsOfService: years,
    dailyWage,
    daysEntitled,
    uncappedLiability: uncapped,
    cumulativeLiability,
    capped,
    calculationNotes,
  };
}
