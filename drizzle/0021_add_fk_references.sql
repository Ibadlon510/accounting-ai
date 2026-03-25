DO $$ BEGIN
ALTER TABLE "credit_note_lines" ADD CONSTRAINT "credit_note_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "document_transaction_lines" ADD CONSTRAINT "document_transaction_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "expense_lines" ADD CONSTRAINT "expense_lines_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_default_tax_code_id_tax_codes_id_fk" FOREIGN KEY ("default_tax_code_id") REFERENCES "public"."tax_codes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
