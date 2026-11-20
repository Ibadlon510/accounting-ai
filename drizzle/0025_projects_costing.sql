-- Projects & Costing: projects/cost centres + project_id tags on activity
CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "code" varchar(30),
  "name" varchar(255) NOT NULL,
  "kind" varchar(20) NOT NULL DEFAULT 'project',
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "start_date" date,
  "end_date" date,
  "description" text,
  "notes" text,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "projects_org_status_idx" ON "projects" ("organization_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_org_kind_idx" ON "projects" ("organization_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "projects_org_code_idx" ON "projects" ("organization_id","code") WHERE "code" IS NOT NULL;--> statement-breakpoint

ALTER TABLE "journal_lines" ADD COLUMN IF NOT EXISTS "project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journal_lines_org_project_idx" ON "journal_lines" ("organization_id","project_id");--> statement-breakpoint

ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_org_project_idx" ON "invoices" ("organization_id","project_id");--> statement-breakpoint

ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bills_org_project_idx" ON "bills" ("organization_id","project_id");
