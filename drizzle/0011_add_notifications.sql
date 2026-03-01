-- Migration: Add notifications table for in-app notification center

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category varchar(20) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  icon varchar(30),
  action_url varchar(512),
  action_label varchar(50),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_unread ON notifications(organization_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
