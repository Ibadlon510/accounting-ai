-- Add is_demo to entity tables so we can remove demo data only, preserving user-created data
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "bank_statements" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "vat_returns" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
