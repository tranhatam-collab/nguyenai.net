-- 0010: MFA challenge table for login MFA enforcement
-- Per INDEPENDENT_AUDIT_VERIFICATION_2026-07-17 Authz finding #6

CREATE TABLE IF NOT EXISTS mfa_challenges (
  challenge_id    TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  org_id          TEXT NOT NULL,
  audience        TEXT,
  expires_at      TEXT NOT NULL,
  used_at         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user ON mfa_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires ON mfa_challenges(expires_at);
