-- 0012: Model gateway invocation + receipt store (D1-backed)
-- Per INDEPENDENT_AUDIT_VERIFICATION_2026-07-17 AI Provider finding #3

CREATE TABLE IF NOT EXISTS model_invocations (
  invocation_id   TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  session_id      TEXT,
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  prompt_tokens   INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens    INTEGER NOT NULL DEFAULT 0,
  cost_usd        REAL NOT NULL DEFAULT 0,
  data_classification TEXT,
  policy_version  TEXT NOT NULL DEFAULT '1.0.0',
  identity_check_passed INTEGER NOT NULL DEFAULT 0,
  language_check_passed INTEGER NOT NULL DEFAULT 0,
  safety_check_passed INTEGER NOT NULL DEFAULT 0,
  receipt_id      TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  error_message   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_model_invocations_user ON model_invocations(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_invocations_provider ON model_invocations(provider);

CREATE TABLE IF NOT EXISTS model_receipts (
  receipt_id      TEXT PRIMARY KEY,
  invocation_id   TEXT NOT NULL,
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  prompt_tokens   INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens    INTEGER NOT NULL DEFAULT 0,
  cost_usd        REAL NOT NULL DEFAULT 0,
  policy_version  TEXT NOT NULL,
  signature       TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (invocation_id) REFERENCES model_invocations(invocation_id)
);

CREATE INDEX IF NOT EXISTS idx_model_receipts_invocation ON model_receipts(invocation_id);
