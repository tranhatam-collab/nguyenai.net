-- Migration: model_policy_checks
-- Phase 3 — Model Gateway and output guard
-- Per MODEL_GATEWAY_IDENTITY_POLICY.md
BEGIN;

CREATE TABLE IF NOT EXISTS model_policy_checks (
  check_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('identity', 'language', 'safety', 'data_classification')),
  passed BOOLEAN NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_policy_checks_user_id ON model_policy_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_model_policy_checks_check_type ON model_policy_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_model_policy_checks_created_at ON model_policy_checks(created_at);

COMMIT;
