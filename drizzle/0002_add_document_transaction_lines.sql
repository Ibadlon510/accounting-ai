CREATE TABLE "document_transaction_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_transaction_id" uuid NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"quantity" numeric(18, 4) DEFAULT '1' NOT NULL,
	"unit_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '5',
	"tax_amount" numeric(18, 2) DEFAULT '0',
	"gl_account_id" uuid NOT NULL,
	"line_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_transactions" ALTER COLUMN "gl_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_transaction_lines" ADD CONSTRAINT "document_transaction_lines_document_transaction_id_document_transactions_id_fk" FOREIGN KEY ("document_transaction_id") REFERENCES "public"."document_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_transaction_lines" ADD CONSTRAINT "document_transaction_lines_gl_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;