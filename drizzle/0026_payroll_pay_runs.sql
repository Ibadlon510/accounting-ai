-- Payroll: pay runs, salary_records, gratuity provisions, WPS employee fields
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "labour_card_number" varchar(40);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "iban" varchar(34);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "bank_routing_code" varchar(20);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "pay_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "run_number" varchar(30) NOT NULL,
  "period_year" integer NOT NULL,
  "period_month" integer NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "entry_date" date NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "pay_from" varchar(20) NOT NULL DEFAULT 'payable',
  "currency" varchar(3) NOT NULL DEFAULT 'AED',
  "employee_count" integer NOT NULL DEFAULT 0,
  "total_basic" numeric(18,2) NOT NULL DEFAULT '0',
  "total_housing" numeric(18,2) NOT NULL DEFAULT '0',
  "total_transport" numeric(18,2) NOT NULL DEFAULT '0',
  "total_gross" numeric(18,2) NOT NULL DEFAULT '0',
  "journal_entry_id" uuid,
  "notes" text,
  "employer_unique_id" varchar(40),
  "wps_generated_at" timestamptz,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "posted_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "posted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "pay_runs_org_number_idx" ON "pay_runs" ("organization_id","run_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pay_runs_org_period_idx" ON "pay_runs" ("organization_id","period_year","period_month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pay_runs_org_status_idx" ON "pay_runs" ("organization_id","status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "salary_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "pay_run_id" uuid REFERENCES "pay_runs"("id") ON DELETE CASCADE,
  "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE RESTRICT,
  "period_year" integer NOT NULL,
  "period_month" integer NOT NULL,
  "period_start" date,
  "period_end" date,
  "basic_salary" numeric(18,2) NOT NULL DEFAULT '0',
  "housing_allowance" numeric(18,2) NOT NULL DEFAULT '0',
  "transport_allowance" numeric(18,2) NOT NULL DEFAULT '0',
  "variable_pay" numeric(18,2) NOT NULL DEFAULT '0',
  "total_gross" numeric(18,2) NOT NULL DEFAULT '0',
  "days_in_period" integer NOT NULL DEFAULT 30,
  "days_unpaid_leave" integer NOT NULL DEFAULT 0,
  "labour_card_number" varchar(40),
  "iban" varchar(34),
  "bank_routing_code" varchar(20),
  "employee_name" varchar(255),
  "journal_entry_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "salary_records_org_period_idx" ON "salary_records" ("organization_id","period_year","period_month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "salary_records_pay_run_idx" ON "salary_records" ("pay_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "salary_records_employee_idx" ON "salary_records" ("employee_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gratuity_provisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "provision_number" varchar(30) NOT NULL,
  "as_of_date" date NOT NULL,
  "entry_date" date NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'posted',
  "currency" varchar(3) NOT NULL DEFAULT 'AED',
  "employee_count" integer NOT NULL DEFAULT 0,
  "total_liability" numeric(18,2) NOT NULL DEFAULT '0',
  "total_increase" numeric(18,2) NOT NULL DEFAULT '0',
  "journal_entry_id" uuid,
  "notes" text,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "posted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "gratuity_provisions_org_number_idx" ON "gratuity_provisions" ("organization_id","provision_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gratuity_provisions_org_date_idx" ON "gratuity_provisions" ("organization_id","as_of_date");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "gratuity_provision_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "provision_id" uuid NOT NULL REFERENCES "gratuity_provisions"("id") ON DELETE CASCADE,
  "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE RESTRICT,
  "employee_name" varchar(255),
  "join_date" date,
  "years_of_service" numeric(10,4) NOT NULL DEFAULT '0',
  "basic_salary" numeric(18,2) NOT NULL DEFAULT '0',
  "daily_wage" numeric(18,4) NOT NULL DEFAULT '0',
  "cumulative_liability" numeric(18,2) NOT NULL DEFAULT '0',
  "previously_provisioned" numeric(18,2) NOT NULL DEFAULT '0',
  "increase_amount" numeric(18,2) NOT NULL DEFAULT '0',
  "calculation_notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "gratuity_provision_lines_provision_idx" ON "gratuity_provision_lines" ("provision_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gratuity_provision_lines_employee_idx" ON "gratuity_provision_lines" ("employee_id");
