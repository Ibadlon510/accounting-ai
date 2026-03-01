-- Migration: Add billing columns to organizations + team_invites table
-- Replaces old 4-tier plan with FREE/PRO/ARCHIVE

-- Add billing columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS free_ai_docs_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_ai_statements_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_users integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stripe_customer_id varchar(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id varchar(255),
  ADD COLUMN IF NOT EXISTS stripe_price_id varchar(255),
  ADD COLUMN IF NOT EXISTS subscription_status varchar(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS extra_seats integer NOT NULL DEFAULT 0;

-- Migrate existing subscription_plan values to new scheme
-- FREELANCER → FREE, BUSINESS/ENTERPRISE → PRO, ARCHIVE stays ARCHIVE
UPDATE organizations SET subscription_plan = 'FREE' WHERE subscription_plan = 'FREELANCER';
UPDATE organizations SET subscription_plan = 'PRO' WHERE subscription_plan IN ('BUSINESS', 'ENTERPRISE');

-- Set token_balance to 0 for FREE plans (AI tracked via free_ai_docs_used counters)
UPDATE organizations SET token_balance = 0 WHERE subscription_plan = 'FREE';

-- Set max_users for PRO plans
UPDATE organizations SET max_users = 2 WHERE subscription_plan = 'PRO';

-- Create team_invites table
CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'accountant',
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token varchar(255) NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_org ON team_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
