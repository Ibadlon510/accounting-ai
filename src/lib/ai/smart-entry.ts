/**
 * Natural language → suggested journal entry (UAE CoA).
 * Uses OpenAI GPT-4o-mini with structured output.
 */

const SMART_ENTRY_SYSTEM = `You are an expert accountant for UAE SMEs. Convert the user's natural language into a double-entry journal entry.

Rules:
- Use only these UAE GL codes and names (use the exact code):
  1000 Cash and Cash Equivalents, 1010 Cash in Hand, 1100 Bank Accounts, 1200 Accounts Receivable, 1210 Trade Receivables,
  2000 Accounts Payable, 2010 Trade Payables, 2200 VAT Payable, 1450 VAT Input,
  4000 Sales Revenue, 4010 Product Sales, 4020 Service Revenue,
  5000 Cost of Goods Sold, 6100 Rent Expense, 6110 Office Rent, 6200 Utilities, 6210 Electricity, 6230 Telephone & Internet,
  6300 Office Supplies, 6400 Travel & Entertainment, 6500 Professional Fees, 6950 Bank Charges, 6000 Salaries & Wages.
- Every entry must balance: total debits = total credits.
- Return valid JSON only, no markdown. Format:
{
  "date": "YYYY-MM-DD",
  "description": "short memo",
  "lines": [
    { "accountCode": "6xxx or 1xxx etc", "accountName": "Name", "debit": number or 0, "credit": number or 0, "description": "line memo" }
  ]
}
- Use 0 for the side that is not used (debit or credit).
- Default currency is AED. If no date given use today.`;

export type SmartEntryLine = {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
};

export type SmartEntryResult = {
  date: string;
  description: string;
  lines: SmartEntryLine[];
};

export async function parseNaturalLanguageToEntry(nl: string): Promise<SmartEntryResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SMART_ENTRY_SYSTEM },
      { role: "user", content: nl.trim() },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) return null;

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : content;
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { lines?: unknown }).lines)) return null;
    const obj = parsed as { date?: string; description?: string; lines: Array<{ accountCode?: string; accountName?: string; debit?: number; credit?: number; description?: string }> };
    const date = typeof obj.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) ? obj.date : new Date().toISOString().slice(0, 10);
    const description = typeof obj.description === "string" ? obj.description : "Journal entry";
    const lines: SmartEntryLine[] = obj.lines
      .filter((l) => l && (typeof l.debit === "number" || typeof l.credit === "number"))
      .map((l) => ({
        accountCode: String(l.accountCode ?? "").trim() || "7000",
        accountName: String(l.accountName ?? "").trim() || "Other Expenses",
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: String(l.description ?? "").trim(),
      }));
    if (lines.length === 0) return null;
    return { date, description, lines };
  } catch {
    return null;
  }
}
