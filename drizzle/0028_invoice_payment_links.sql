-- ACC-16: Invoice payment links + settlement matching to ledger
CREATE TABLE IF NOT EXISTS "invoice_payment_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "invoice_id" uuid NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "customers"("id"),
  "bank_account_id" uuid REFERENCES "bank_accounts"("id") ON DELETE SET NULL,
  "amount" numeric(18, 2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'AED',
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "provider" varchar(20) NOT NULL DEFAULT 'stripe',
  "checkout_url" text,
  "stub_token_hash" varchar(64),
  "stub_token_prefix" varchar(8),
  "stripe_checkout_session_id" varchar(255),
  "stripe_payment_intent_id" varchar(255),
  "provider_event_id" varchar(255),
  "payment_id" uuid REFERENCES "payments"("id") ON DELETE SET NULL,
  "journal_entry_id" uuid,
  "expires_at" timestamptz,
  "paid_at" timestamptz,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "invoice_payment_links_stripe_session_uidx"
  ON "invoice_payment_links" ("stripe_checkout_session_id")
  WHERE "stripe_checkout_session_id" IS NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "invoice_payment_links_stripe_pi_uidx"
  ON "invoice_payment_links" ("stripe_payment_intent_id")
  WHERE "stripe_payment_intent_id" IS NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "invoice_payment_links_provider_event_uidx"
  ON "invoice_payment_links" ("provider_event_id")
  WHERE "provider_event_id" IS NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "invoice_payment_links_stub_hash_uidx"
  ON "invoice_payment_links" ("stub_token_hash")
  WHERE "stub_token_hash" IS NOT NULL;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoice_payment_links_org_idx"
  ON "invoice_payment_links" ("organization_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoice_payment_links_org_invoice_idx"
  ON "invoice_payment_links" ("organization_id", "invoice_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "invoice_payment_links_org_status_idx"
  ON "invoice_payment_links" ("organization_id", "status");
