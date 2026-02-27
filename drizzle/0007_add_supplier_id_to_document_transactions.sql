ALTER TABLE "document_transactions" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "document_transactions" ADD CONSTRAINT "document_transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
