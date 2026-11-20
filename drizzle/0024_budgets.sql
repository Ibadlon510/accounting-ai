-- Budgets: header + per-account lines with optional period links; variance vs journal actuals
CREATE TABLE IF NOT EXISTS "budgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "fiscal_year_id" uuid REFERENCES "fiscal_years"("id") ON DELETE SET NULL,
  "period_id" uuid REFERENCES "accounting_periods"("id") ON DELETE SET NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "currency" varchar(3) NOT NULL DEFAULT 'AED',
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "budgets_org_status_idx" ON "budgets" ("organization_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budgets_org_dates_idx" ON "budgets" ("organization_id","start_date","end_date");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "budget_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "budget_id" uuid NOT NULL REFERENCES "budgets"("id") ON DELETE CASCADE,
  "account_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id"),
  "period_id" uuid REFERENCES "accounting_periods"("id") ON DELETE SET NULL,
  "amount" numeric(18,2) NOT NULL DEFAULT '0',
  "notes" text,
  "line_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "budget_lines_budget_idx" ON "budget_lines" ("budget_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_lines_org_account_idx" ON "budget_lines" ("organization_id","account_id");
