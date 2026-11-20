-- Fixed Assets module: register, depreciation runs/schedules, disposals
CREATE TABLE IF NOT EXISTS "fixed_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "asset_number" varchar(30) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "category" varchar(50) NOT NULL DEFAULT 'equipment',
  "asset_account_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id"),
  "accum_dep_account_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id"),
  "dep_expense_account_id" uuid NOT NULL REFERENCES "chart_of_accounts"("id"),
  "acquisition_date" date NOT NULL,
  "cost" numeric(18,2) NOT NULL,
  "salvage_value" numeric(18,2) NOT NULL DEFAULT '0',
  "useful_life_months" integer NOT NULL,
  "depreciation_method" varchar(30) NOT NULL DEFAULT 'straight_line',
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "accumulated_depreciation" numeric(18,2) NOT NULL DEFAULT '0',
  "capitalization_journal_entry_id" uuid,
  "disposal_date" date,
  "disposal_proceeds" numeric(18,2),
  "disposal_journal_entry_id" uuid,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "fixed_assets_org_number_idx" ON "fixed_assets" ("organization_id","asset_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fixed_assets_org_status_idx" ON "fixed_assets" ("organization_id","status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "depreciation_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "period_year" integer NOT NULL,
  "period_month" integer NOT NULL,
  "run_date" date NOT NULL,
  "total_amount" numeric(18,2) NOT NULL DEFAULT '0',
  "asset_count" integer NOT NULL DEFAULT 0,
  "journal_entry_id" uuid,
  "status" varchar(15) NOT NULL DEFAULT 'posted',
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_runs_org_period_idx" ON "depreciation_runs" ("organization_id","period_year","period_month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_runs_org_idx" ON "depreciation_runs" ("organization_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "depreciation_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "depreciation_run_id" uuid NOT NULL REFERENCES "depreciation_runs"("id") ON DELETE CASCADE,
  "fixed_asset_id" uuid NOT NULL REFERENCES "fixed_assets"("id") ON DELETE CASCADE,
  "period_year" integer NOT NULL,
  "period_month" integer NOT NULL,
  "amount" numeric(18,2) NOT NULL,
  "accumulated_after" numeric(18,2) NOT NULL,
  "book_value_after" numeric(18,2) NOT NULL,
  "journal_entry_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "depreciation_schedules_asset_period_idx" ON "depreciation_schedules" ("organization_id","fixed_asset_id","period_year","period_month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "depreciation_schedules_run_idx" ON "depreciation_schedules" ("depreciation_run_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "asset_disposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "fixed_asset_id" uuid NOT NULL REFERENCES "fixed_assets"("id") ON DELETE CASCADE,
  "disposal_date" date NOT NULL,
  "proceeds" numeric(18,2) NOT NULL DEFAULT '0',
  "cost_at_disposal" numeric(18,2) NOT NULL,
  "accum_dep_at_disposal" numeric(18,2) NOT NULL,
  "book_value_at_disposal" numeric(18,2) NOT NULL,
  "gain_or_loss" numeric(18,2) NOT NULL DEFAULT '0',
  "proceeds_account_id" uuid REFERENCES "chart_of_accounts"("id"),
  "journal_entry_id" uuid,
  "notes" text,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "asset_disposals_asset_idx" ON "asset_disposals" ("organization_id","fixed_asset_id");
