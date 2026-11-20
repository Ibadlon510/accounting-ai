-- Expense Claims: staff submit → manager approve/reject → reimbursement JE (immutable)
CREATE TABLE IF NOT EXISTS "expense_claims" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "claim_number" varchar(30) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "claim_date" date NOT NULL,
  "employee_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
  "claimant_name" varchar(255) NOT NULL,
  "submitted_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "status" varchar(20) NOT NULL DEFAULT 'submitted',
  "currency" varchar(3) NOT NULL DEFAULT 'AED',
  "subtotal" numeric(18,2) NOT NULL DEFAULT '0',
  "tax_amount" numeric(18,2) NOT NULL DEFAULT '0',
  "total" numeric(18,2) NOT NULL DEFAULT '0',
  "approved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at" timestamptz,
  "rejected_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "rejected_at" timestamptz,
  "rejection_reason" text,
  "reimbursement_method" varchar(20),
  "credit_account_id" uuid REFERENCES "chart_of_accounts"("id"),
  "reimbursed_at" timestamptz,
  "reimbursed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "journal_entry_id" uuid,
  "notes" text,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "expense_claims_org_number_idx" ON "expense_claims" ("organization_id","claim_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expense_claims_org_status_idx" ON "expense_claims" ("organization_id","status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "expense_claim_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "expense_claim_id" uuid NOT NULL REFERENCES "expense_claims"("id") ON DELETE CASCADE,
  "expense_date" date,
  "description" text NOT NULL DEFAULT '',
  "category" varchar(50) NOT NULL DEFAULT 'travel',
  "expense_account_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id"),
  "amount" numeric(18,2) NOT NULL DEFAULT '0',
  "tax_amount" numeric(18,2) NOT NULL DEFAULT '0',
  "line_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "expense_claim_lines_claim_idx" ON "expense_claim_lines" ("expense_claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expense_claim_lines_org_idx" ON "expense_claim_lines" ("organization_id");
