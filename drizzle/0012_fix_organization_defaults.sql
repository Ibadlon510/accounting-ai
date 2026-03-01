-- Fix organizations column defaults to match current schema
-- 0000_init created subscription_plan DEFAULT 'FREELANCER' and token_balance DEFAULT 50
-- 0010_add_billing migrated existing data but did not update the column defaults
-- Schema now expects subscription_plan DEFAULT 'FREE' and token_balance DEFAULT 0

ALTER TABLE "organizations" ALTER COLUMN "subscription_plan" SET DEFAULT 'FREE';
--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "token_balance" SET DEFAULT 0;
