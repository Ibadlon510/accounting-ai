CREATE INDEX "bank_txn_org_account_date_idx" ON "bank_transactions" USING btree ("organization_id","bank_account_id","transaction_date");--> statement-breakpoint
CREATE INDEX "bills_org_status_idx" ON "bills" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "bills_org_supplier_idx" ON "bills" USING btree ("organization_id","supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chart_of_accounts_org_code_idx" ON "chart_of_accounts" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "contact_credits_org_type_contact_idx" ON "contact_credits" USING btree ("organization_id","contact_type","contact_id");--> statement-breakpoint
CREATE INDEX "invoices_org_status_idx" ON "invoices" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "invoices_org_customer_idx" ON "invoices" USING btree ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX "journal_entries_org_date_idx" ON "journal_entries" USING btree ("organization_id","entry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_entries_org_number_idx" ON "journal_entries" USING btree ("organization_id","entry_number");--> statement-breakpoint
CREATE INDEX "journal_lines_entry_idx" ON "journal_lines" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "journal_lines_org_account_idx" ON "journal_lines" USING btree ("organization_id","account_id");