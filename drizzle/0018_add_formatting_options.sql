ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "number_format" varchar(20) NOT NULL DEFAULT '1,234.56';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "date_format" varchar(20) NOT NULL DEFAULT 'DD/MM/YYYY';
