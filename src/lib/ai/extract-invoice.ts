import { GoogleGenerativeAI } from "@google/generative-ai";
import { InvoiceExtractionSchema, mathCheckPassed } from "./schemas";

const UAE_INVOICE_PROMPT = `
You are an expert Tax Accountant and Auditor specialized in UAE VAT Law. Your job is to extract data from the provided document image with 100% precision for tax filing purposes.

### COMPLIANCE RULES (UAE):
1.  **TRN (Tax Registration Number):** Look for a 15-digit number, often starting with "100". It might be labeled as "VAT No", "Tax ID", or "TRN".
2.  **VAT Logic:** The standard VAT rate in UAE is 5%.
    - If the invoice shows a 5% tax, verify the math: (Net Amount * 0.05) should roughly equal VAT Amount (allow for 0.05 rounding).
    - If the math is wrong, flag it in the 'validation_issues' field.
3.  **Currency:** Default to "AED" if not specified. Convert symbols like "Dhs" or "DH" to "AED".

### CATEGORIZATION (GL CODES):
Based on the line items, predict the single most accurate General Ledger (GL) Category from this list:
- "6400 - Travel & Entertainment" (Restaurants, Cafes, Meals, Taxis, Uber, Flights, Hotels)
- "6300 - Office Supplies" (Stationery, Electronics, Ink)
- "6500 - Professional Fees" (Legal, Consulting, Freelancers, Audit)
- "6200 - Utilities" (DEWA, Empower, SEWA, FEWA, Internet)
- "6100 - Rent Expense" (Office Rent, Warehouse Rent)
- "6900 - Marketing & Advertising" (Google Ads, Meta, Prints)
- "6600 - Insurance Expense" (Insurance policies, coverage)
- "6800 - Government Fees & Licenses" (Trade License, Visa, Labour)
- "5000 - Cost of Goods Sold" (Raw materials, Inventory)

### OUTPUT FORMAT:
Return ONLY valid JSON.
Structure:
{
  "merchant": {
    "name": "string (Cleaned, e.g., 'STARBUCKS' instead of 'STARBUCKS COFFEE L.L.C')",
    "trn": "string (digits only) or null",
    "address": "string or null"
  },
  "invoice": {
    "date": "YYYY-MM-DD (ISO 8601)",
    "invoice_number": "string or null",
    "currency": "AED",
    "total_amount": number (float),
    "tax_amount": number (float),
    "net_amount": number (float)
  },
  "gl_prediction": {
    "code": "string (e.g., '6340 - Meals & Entertainment')",
    "confidence": number (0.0 to 1.0)
  },
  "validation": {
    "is_tax_invoice": boolean (True if 'Tax Invoice' is written),
    "math_check_passed": boolean (True if Net + Tax ~= Total),
    "issues": ["string array of any warnings"]
  }
}
`;

export type ExtractResult =
  | { ok: true; data: import("./schemas").InvoiceExtraction; confidence: number }
  | { ok: false; error: string };

export async function extractInvoiceFromImage(
  imageBytes: Uint8Array,
  mimeType: string
): Promise<ExtractResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GOOGLE_GEMINI_API_KEY not set" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const part = mimeType.startsWith("image/")
    ? { inlineData: { data: Buffer.from(imageBytes).toString("base64"), mimeType } }
    : { inlineData: { data: Buffer.from(imageBytes).toString("base64"), mimeType: "application/pdf" } };

  const result = await model.generateContent([
    { text: UAE_INVOICE_PROMPT },
    part,
  ]);

  const response = result.response;
  const text = response.text();
  if (!text) {
    return { ok: false, error: "Empty response from model" };
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: "Invalid JSON in model response" };
  }

  const parsedResult = InvoiceExtractionSchema.safeParse(parsed);
  if (!parsedResult.success) {
    return { ok: false, error: parsedResult.error.message };
  }

  const data = parsedResult.data;
  const mathOk = mathCheckPassed(
    data.invoice.net_amount,
    data.invoice.tax_amount,
    data.invoice.total_amount
  );
  if (!mathOk) {
    data.validation.issues = [...(data.validation.issues || []), "Net + VAT does not equal Total"];
    data.validation.math_check_passed = false;
  }

  const confidence = data.gl_prediction.confidence;
  return { ok: true, data, confidence };
}
