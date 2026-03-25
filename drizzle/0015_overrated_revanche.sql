ALTER TABLE "organizations" ADD COLUMN "pdf_default_page_size" varchar(10) DEFAULT 'A4';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_default_orientation" varchar(10) DEFAULT 'portrait';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_margin_top" varchar(10) DEFAULT '15mm';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_margin_right" varchar(10) DEFAULT '15mm';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_margin_bottom" varchar(10) DEFAULT '20mm';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_margin_left" varchar(10) DEFAULT '15mm';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_default_terms" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_default_notes" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_payment_info" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_accent_color" varchar(7) DEFAULT '#1a1a2e';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_font_family" varchar(100) DEFAULT 'Plus Jakarta Sans';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pdf_show_sections" jsonb;