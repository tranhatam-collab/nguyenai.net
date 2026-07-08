-- Migration: output_receipts
-- Phase 3 — Model Gateway and output guard
-- Per MODEL_GATEWAY_IDENTITY_POLICY.md
BEGIN;

CREATE TABLE IF NOT EXISTS output_receipts (
  receipt_id TEXT PRIMARY KEY,
  invocation_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  policy_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  signature TEXT NOT NULL,
  FOREIGN KEY (invocation_id) REFERENCES model_invocations(invocation_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_output_receipts_invocation_id ON output_receipts(invocation_id);
CREATE INDEX IF NOT EXISTS idx_output_receipts_created_at ON output_receipts(created_at);

COMMIT;
