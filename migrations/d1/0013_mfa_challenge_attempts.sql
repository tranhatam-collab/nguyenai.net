-- 0013: MFA challenge attempt counting and lockout
-- Per INDEPENDENT_AUDIT_VERIFICATION_2026-07-22 P1 finding:
-- MFA challenge allows unlimited TOTP attempts without lockout.
-- This migration adds attempt_count and locked_at columns.

ALTER TABLE mfa_challenges ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mfa_challenges ADD COLUMN locked_at TEXT;

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_locked ON mfa_challenges(locked_at);
