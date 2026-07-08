-- Migration: model_invocations
-- Phase 3 — Model Gateway and output guard
-- Per MODEL_GATEWAY_IDENTITY_POLICY.md
BEGIN;

CREATE TABLE IF NOT EXISTS model_invocations (
  invocation_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  session_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  policy_version TEXT NOT NULL,
  identity_check_passed BOOLEAN NOT NULL,
  language_check_passed BOOLEAN NOT NULL,
  safety_check_passed BOOLEAN NOT NULL,
  data_classification TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_invocations_user_id ON model_invocations(user_id);
CREATE INDEX IF NOT EXISTS idx_model_invocations_tenant_id ON model_invocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_invocations_provider ON model_invocations(provider);
CREATE INDEX IF NOT EXISTS idx_model_invocations_created_at ON model_invocations(created_at);

COMMIT;
