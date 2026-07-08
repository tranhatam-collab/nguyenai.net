-- Migration: admin_approvals
-- Phase 2 — Admin approval and self-healing
-- Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md
BEGIN;

CREATE TABLE IF NOT EXISTS admin_approvals (
  request_id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('self_heal', 'secret_rotation', 'data_mutation', 'deployment', 'other')),
  stage TEXT NOT NULL CHECK (stage IN ('preview', 'production')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requester TEXT NOT NULL,
  approver TEXT,
  requested_at TEXT NOT NULL,
  approved_at TEXT,
  denied_at TEXT,
  expires_at TEXT,
  metadata TEXT -- JSON
);

CREATE INDEX IF NOT EXISTS idx_admin_approvals_category ON admin_approvals(category);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_status ON admin_approvals(status);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_stage ON admin_approvals(stage);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_requester ON admin_approvals(requester);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_requested_at ON admin_approvals(requested_at);

COMMIT;
