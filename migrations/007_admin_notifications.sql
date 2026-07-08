-- Migration: admin_notifications
-- Phase 1 — Incident and notification
-- Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md
BEGIN;

CREATE TABLE IF NOT EXISTS admin_notifications (
  notification_id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'telegram', 'zalo', 'slack', 'discord', 'whatsapp')),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata TEXT, -- JSON
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_channel ON admin_notifications(channel);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient ON admin_notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

COMMIT;
