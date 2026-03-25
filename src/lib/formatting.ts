// ─── Org formatting store (client-side singleton) ────────────

let _numberFormat = "1,234.56";
let _dateFormat = "DD/MM/YYYY";

export function setOrgFormatting(numberFormat: string, dateFormat: string) {
  _numberFormat = numberFormat || "1,234.56";
  _dateFormat = dateFormat || "DD/MM/YYYY";
}

export function getOrgFormatting() {
  return { numberFormat: _numberFormat, dateFormat: _dateFormat };
}

// ─── Number Formatting ───────────────────────────────────────

type SeparatorPair = { thousands: string; decimal: string };

const FORMAT_SEPARATORS: Record<string, SeparatorPair> = {
  "1,234.56": { thousands: ",", decimal: "." },
  "1.234,56": { thousands: ".", decimal: "," },
  "1 234.56": { thousands: "\u00A0", decimal: "." },
  "1 234,56": { thousands: "\u00A0", decimal: "," },
};

function applyNumberFormat(amount: number, format: string): string {
  const sep = FORMAT_SEPARATORS[format] ?? FORMAT_SEPARATORS["1,234.56"];
  const abs = Math.abs(amount);
  const fixed = abs.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep.thousands);
  const result = `${withThousands}${sep.decimal}${decPart}`;
  return amount < 0 ? `-${result}` : result;
}

export function formatNumber(amount: number, format?: string): string {
  return applyNumberFormat(amount, format ?? _numberFormat);
}

export function formatAmount(amount: number, currency = "AED", format?: string): string {
  return `${currency} ${applyNumberFormat(amount, format ?? _numberFormat)}`;
}

// ─── Date Formatting ─────────────────────────────────────────

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function applyDateFormat(dateStr: string, format: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return dateStr;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  const mmm = MONTHS_SHORT[d.getMonth()];

  switch (format) {
    case "MM/DD/YYYY":  return `${mm}/${dd}/${yyyy}`;
    case "YYYY-MM-DD":  return `${yyyy}-${mm}-${dd}`;
    case "DD MMM YYYY": return `${dd} ${mmm} ${yyyy}`;
    case "MMM DD, YYYY": return `${mmm} ${dd}, ${yyyy}`;
    case "DD.MM.YYYY":  return `${dd}.${mm}.${yyyy}`;
    case "DD/MM/YYYY":
    default:            return `${dd}/${mm}/${yyyy}`;
  }
}

export function formatDate(dateStr: string, format?: string): string {
  return applyDateFormat(dateStr, format ?? _dateFormat);
}
