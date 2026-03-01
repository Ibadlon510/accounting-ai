-- Standalone Credit Notes (Sales & Purchase)
CREATE TABLE IF NOT EXISTS "credit_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "credit_note_number" varchar(30) NOT NULL,
  "credit_note_type" varchar(10) NOT NULL,
  "date" date NOT NULL,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
  "supplier_id" uuid REFERENCES "suppliers"("id") ON DELETE SET NULL,
  "invoice_id" uuid REFERENCES "invoices"("id") ON DELETE SET NULL,
  "bill_id" uuid REFERENCES "bills"("id") ON DELETE SET NULL,
  "reason" text,
  "subtotal" numeric(18,2) NOT NULL DEFAULT '0',
  "tax_amount" numeric(18,2) NOT NULL DEFAULT '0',
  "total" numeric(18,2) NOT NULL DEFAULT '0',
  "currency" varchar(3) NOT NULL DEFAULT 'AED',
  "status" varchar(15) NOT NULL DEFAULT 'draft',
  "journal_entry_id" uuid,
  "document_id" uuid REFERENCES "documents"("id") ON DELETE SET NULL,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "credit_note_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "credit_note_id" uuid NOT NULL REFERENCES "credit_notes"("id") ON DELETE CASCADE,
  "description" text NOT NULL DEFAULT '',
  "account_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id"),
  "quantity" numeric(18,4) NOT NULL DEFAULT '1',
  "unit_price" numeric(18,2) NOT NULL DEFAULT '0',
  "amount" numeric(18,2) NOT NULL DEFAULT '0',
  "tax_rate" numeric(5,2) DEFAULT '5',
  "tax_amount" numeric(18,2) DEFAULT '0',
  "line_order" integer NOT NULL DEFAULT 0
);
