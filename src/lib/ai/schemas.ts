import { z } from "zod";

/** Document types for routing verification workflow */
export const DOCUMENT_TYPES = [
  "purchase_invoice",
  "sales_invoice",
  "receipt",
  "credit_note",
  "bank_statement",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const InvoiceExtractionSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPES).default("purchase_invoice"),
  merchant: z.object({
    name: z.string(),
    trn: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
  }),
  invoice: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    invoice_number: z.string().nullable().optional(),
    currency: z.string().default("AED"),
    total_amount: z.number(),
    tax_amount: z.number(),
    net_amount: z.number(),
  }),
  gl_prediction: z.object({
    code: z.string(),
    confidence: z.number().min(0).max(1),
  }),
  validation: z.object({
    is_tax_invoice: z.boolean().optional(),
    math_check_passed: z.boolean(),
    issues: z.array(z.string()).default([]),
  }),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

/** Math guard: net + vat ≈ total (tolerance 0.05) */
export function mathCheckPassed(net: number, vat: number, total: number, tolerance = 0.05): boolean {
  const sum = net + vat;
  return Math.abs(sum - total) <= tolerance;
}
