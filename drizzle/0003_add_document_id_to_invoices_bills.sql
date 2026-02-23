ALTER TABLE "invoices" ADD COLUMN "document_id" uuid;
--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "document_id" uuid;
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE set null ON UPDATE no action;
