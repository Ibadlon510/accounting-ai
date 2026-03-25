ALTER TABLE "organizations" ADD COLUMN "number_format" varchar(20) NOT NULL DEFAULT '1,234.56';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "date_format" varchar(20) NOT NULL DEFAULT 'DD/MM/YYYY';
