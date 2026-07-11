-- 0006_audit_log_relax_event_type.sql
-- Prod audit_log still has a narrow CHECK that rejects 'email_verified'
-- (and other identity events). Rebuild without event_type CHECK.
-- Registry seed is informational; FK optional later.

CREATE TABLE IF NOT EXISTS audit_log_v2 (
  event_id   TEXT PRIMARY KEY,
  timestamp  TEXT NOT NULL DEFAULT (datetime('now')),
  user_id    TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL,
  actor_ip   TEXT,
  user_agent TEXT,
  target     TEXT,
  result     TEXT NOT NULL CHECK (result IN ('success', 'failure', 'denied')),
  metadata   TEXT NOT NULL DEFAULT '{}'
);

INSERT INTO audit_log_v2 (
  event_id, timestamp, user_id, session_id, event_type,
  actor_ip, user_agent, target, result, metadata
)
SELECT
  event_id, timestamp, user_id, session_id, event_type,
  actor_ip, user_agent, target, result, metadata
FROM audit_log;

DROP TABLE audit_log;
ALTER TABLE audit_log_v2 RENAME TO audit_log;

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts ON audit_log(timestamp);

-- Seed registry if empty (table may exist from gap fill without INSERTs)
INSERT OR IGNORE INTO audit_event_registry (event_type, registry_version, description) VALUES
  ('login_success', '2026-07-11.1', 'User logged in successfully'),
  ('login_failure', '2026-07-11.1', 'Login attempt failed'),
  ('logout', '2026-07-11.1', 'User logged out'),
  ('session_revoked', '2026-07-11.1', 'Session revoked'),
  ('email_verified', '2026-07-11.1', 'Email address verified'),
  ('passkey_registered', '2026-07-11.1', 'Passkey registered'),
  ('mfa_enrolled', '2026-07-11.1', 'MFA enrolled'),
  ('org_member_added', '2026-07-11.1', 'Org member added'),
  ('org_member_removed', '2026-07-11.1', 'Org member removed'),
  ('account_deletion_requested', '2026-07-11.1', 'Account deletion requested'),
  ('access_denied', '2026-07-11.1', 'Access denied'),
  ('permission_revoked', '2026-07-11.1', 'Permission revoked');
