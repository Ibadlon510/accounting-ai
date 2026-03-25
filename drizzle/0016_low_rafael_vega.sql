CREATE TABLE "document_type_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_type" varchar(30) NOT NULL,
	"default_terms" text,
	"default_notes" text,
	"default_payment_info" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_type_pdf_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_type" varchar(30) NOT NULL,
	"page_size" varchar(10) DEFAULT 'A4',
	"orientation" varchar(10) DEFAULT 'portrait',
	"margin_top" varchar(10) DEFAULT '15mm',
	"margin_right" varchar(10) DEFAULT '15mm',
	"margin_bottom" varchar(10) DEFAULT '20mm',
	"margin_left" varchar(10) DEFAULT '15mm',
	"accent_color" varchar(7) DEFAULT '#1a1a2e',
	"font_family" varchar(100) DEFAULT 'Plus Jakarta Sans',
	"show_sections" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "terms" text;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "payment_info" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "terms" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_info" text;--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD COLUMN "margin_top" varchar(10) DEFAULT '15mm';--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD COLUMN "margin_right" varchar(10) DEFAULT '15mm';--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD COLUMN "margin_bottom" varchar(10) DEFAULT '20mm';--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD COLUMN "margin_left" varchar(10) DEFAULT '15mm';--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD COLUMN "accent_color" varchar(7) DEFAULT '#1a1a2e';--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD COLUMN "font_family" varchar(100) DEFAULT 'Plus Jakarta Sans';--> statement-breakpoint
ALTER TABLE "pdf_templates" ADD COLUMN "show_sections" jsonb;--> statement-breakpoint
ALTER TABLE "document_type_defaults" ADD CONSTRAINT "document_type_defaults_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_type_pdf_settings" ADD CONSTRAINT "document_type_pdf_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;