/** Common ISO currencies used across settings / document UIs. */
export const COMMON_CURRENCIES = [
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
] as const;

export function normalizeCurrency(code: string | null | undefined): string {
  return (code ?? "AED").trim().toUpperCase().slice(0, 3);
}
