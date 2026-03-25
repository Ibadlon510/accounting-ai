CREATE TABLE "contact_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contact_type" varchar(10) NOT NULL,
	"contact_id" uuid NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"source_id" uuid NOT NULL,
	"original_amount" numeric(15, 2) NOT NULL,
	"remaining_amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"description" varchar(255),
	"credit_date" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"credit_id" uuid NOT NULL,
	"document_type" varchar(10) NOT NULL,
	"document_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"journal_entry_id" uuid,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_by" uuid
);
--> statement-breakpoint
ALTER TABLE "bill_lines" ALTER COLUMN "tax_rate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "credit_note_lines" ALTER COLUMN "tax_rate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "document_transaction_lines" ALTER COLUMN "tax_rate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "expense_lines" ALTER COLUMN "tax_rate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoice_lines" ALTER COLUMN "tax_rate" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "tax_code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "bill_lines" ADD COLUMN "tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "credit_applied" numeric(18, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_note_lines" ADD COLUMN "tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "document_transaction_lines" ADD COLUMN "tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "expense_lines" ADD COLUMN "tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD COLUMN "tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "credit_applied" numeric(18, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "default_tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "is_vat_registered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tax_label" varchar(30) DEFAULT 'VAT' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "default_tax_code_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "number_format" varchar(20) DEFAULT '1,234.56' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "date_format" varchar(20) DEFAULT 'DD/MM/YYYY' NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_codes" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_credits" ADD CONSTRAINT "contact_credits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_credit_id_contact_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."contact_credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_applied_by_users_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_default_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("default_tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_codes_org_code_idx" ON "tax_codes" USING btree ("organization_id","code");