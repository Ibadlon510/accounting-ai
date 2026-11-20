-- Client Portal: magic-token share links for customer statement + invoice viewing
CREATE TABLE IF NOT EXISTS "customer_portal_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL,
  "token_prefix" varchar(8) NOT NULL,
  "label" varchar(120),
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "last_accessed_at" timestamptz,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "customer_portal_tokens_hash_uidx" ON "customer_portal_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_portal_tokens_org_customer_idx" ON "customer_portal_tokens" ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_portal_tokens_org_idx" ON "customer_portal_tokens" ("organization_id");
