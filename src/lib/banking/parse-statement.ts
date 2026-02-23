import * as XLSX from "xlsx";

export type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  reference?: string;
  balance?: number;
};

type ParseResult =
  | { ok: true; transactions: ParsedTransaction[] }
  | { ok: false; error: string };

/**
 * Parse bank statement from CSV or Excel.
 * Auto-detects common column layouts (date, description, debit, credit, balance, reference).
 */
export function parseBankStatement(
  buffer: Buffer,
): ParseResult {
  try {
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: false,
      raw: true,
    });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) {
      return { ok: false, error: "No worksheet found" };
    }

    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      header: 1,
      defval: "",
    }) as unknown as unknown[][];

    if (!data || data.length < 2) {
      return { ok: false, error: "File has no data rows" };
    }

    const headers = (data[0] as unknown[]).map((h) => String(h ?? "").toLowerCase().trim());
    const rows = data.slice(1) as unknown[][];

    const dateCol = findColumn(headers, ["date", "transaction date", "value date", "posting date", "booking date"]);
    const descCol = findColumn(headers, ["description", "details", "narrative", "particulars", "memo", "remarks"]);
    const debitCol = findColumn(headers, ["debit", "withdrawals", "out", "amount (dr)"]);
    const creditCol = findColumn(headers, ["credit", "deposits", "in", "amount (cr)"]);
    const amountCol = findColumn(headers, ["amount", "transaction amount", "value"]);
    const refCol = findColumn(headers, ["reference", "ref", "cheque no", "chq no"]);
    const balanceCol = findColumn(headers, ["balance", "running balance", "closing balance"]);

    if (dateCol < 0 && amountCol < 0) {
      return { ok: false, error: "Could not find date or amount columns. Expected: date, description, debit/credit or amount." };
    }

    const transactions: ParsedTransaction[] = [];

    for (const row of rows) {
      const dateVal = dateCol >= 0 ? row[dateCol] : null;
      const descVal = descCol >= 0 ? row[descCol] : "";
      const debitVal = debitCol >= 0 ? parseNum(row[debitCol]) : 0;
      const creditVal = creditCol >= 0 ? parseNum(row[creditCol]) : 0;
      const amountVal = amountCol >= 0 ? parseNum(row[amountCol]) : 0;
      const refVal = refCol >= 0 ? String(row[refCol] ?? "").trim() : undefined;
      const balanceVal = balanceCol >= 0 ? parseNum(row[balanceCol]) : undefined;

      let amount = 0;
      let type: "debit" | "credit" = "debit";

      if (debitCol >= 0 || creditCol >= 0) {
        if (debitVal > 0) {
          amount = debitVal;
          type = "debit";
        } else if (creditVal > 0) {
          amount = creditVal;
          type = "credit";
        } else {
          continue;
        }
      } else if (amountVal !== 0) {
        amount = Math.abs(amountVal);
        type = amountVal < 0 ? "debit" : "credit";
      } else {
        continue;
      }

      const dateStr = formatDate(dateVal);
      if (!dateStr) continue;

      transactions.push({
        date: dateStr,
        description: String(descVal ?? "").trim() || "Imported transaction",
        amount,
        type,
        reference: refVal || undefined,
        balance: balanceVal,
      });
    }

    if (transactions.length === 0) {
      return { ok: false, error: "No valid transactions found in file" };
    }

    return { ok: true, transactions };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Parse error: ${msg}` };
  }
}

/**
 * Extract bank statement transactions from PDF or image using Gemini vision.
 */
export async function extractBankStatementFromImage(
  imageBytes: Uint8Array,
  mimeType: string
): Promise<ParseResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GOOGLE_GEMINI_API_KEY not set" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert bank statement parser. Extract ALL transactions from this bank statement document.

### RULES:
1. Extract every transaction row visible in the statement
2. For each transaction determine: date, description, amount, type (debit or credit), reference number (if present), balance (if shown)
3. Dates must be in YYYY-MM-DD format
4. Amounts must be positive numbers (no currency symbols)
5. Type must be "debit" (money out/withdrawals) or "credit" (money in/deposits)
6. Skip header rows, totals, and summary lines — only actual transactions

### OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "transactions": [
    {
      "date": "2025-01-15",
      "description": "SALARY TRANSFER",
      "amount": 15000.00,
      "type": "credit",
      "reference": "REF123",
      "balance": 25000.00
    }
  ]
}`;

  const part = mimeType.startsWith("image/")
    ? { inlineData: { data: Buffer.from(imageBytes).toString("base64"), mimeType } }
    : { inlineData: { data: Buffer.from(imageBytes).toString("base64"), mimeType: "application/pdf" } };

  let text: string;
  try {
    const result = await model.generateContent([{ text: prompt }, part]);
    text = result.response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Gemini API error: ${msg}` };
  }

  if (!text) {
    return { ok: false, error: "Empty response from model" };
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

  let parsed: { transactions?: Array<{ date?: string; description?: string; amount?: number; type?: string; reference?: string; balance?: number }> };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: "Invalid JSON in model response" };
  }

  if (!parsed.transactions || !Array.isArray(parsed.transactions) || parsed.transactions.length === 0) {
    return { ok: false, error: "No transactions found in document" };
  }

  const transactions: ParsedTransaction[] = parsed.transactions
    .filter((t) => t.date && typeof t.amount === "number" && t.amount > 0)
    .map((t) => ({
      date: t.date!,
      description: t.description || "Imported transaction",
      amount: t.amount!,
      type: (t.type === "credit" ? "credit" : "debit") as "debit" | "credit",
      reference: t.reference || undefined,
      balance: typeof t.balance === "number" ? t.balance : undefined,
    }));

  if (transactions.length === 0) {
    return { ok: false, error: "No valid transactions extracted from document" };
  }

  return { ok: true, transactions };
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c) || c.includes(h));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const s = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function formatDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") {
    const m = val.match(/(\d{4})-(\d{2})-(\d{2})/) || val.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
      if (m[1].length === 4) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      const y = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }
  }
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "number" && val > 0) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}
