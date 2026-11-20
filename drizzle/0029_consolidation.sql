-- Multi-company consolidation groups, membership, and elimination-rule stubs
CREATE TABLE IF NOT EXISTS "consolidation_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "consolidation_groups_org_idx"
  ON "consolidation_groups" ("organization_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "consolidation_group_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" uuid NOT NULL REFERENCES "consolidation_groups"("id") ON DELETE CASCADE,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "consolidation_group_members_group_org_idx"
  ON "consolidation_group_members" ("group_id", "organization_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "consolidation_group_members_org_idx"
  ON "consolidation_group_members" ("organization_id");--> statement-breakpoint

-- TODO: Intercompany elimination rules are stubs only in MVP.
CREATE TABLE IF NOT EXISTS "consolidation_elimination_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" uuid NOT NULL REFERENCES "consolidation_groups"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "rule_type" varchar(50) NOT NULL DEFAULT 'intercompany',
  "is_active" boolean NOT NULL DEFAULT false,
  "config" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "consolidation_elimination_rules_group_idx"
  ON "consolidation_elimination_rules" ("group_id");
