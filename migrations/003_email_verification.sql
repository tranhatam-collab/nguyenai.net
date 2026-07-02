-- ============================================================
-- Migration 003: Email verification
-- Adds verification_token + verification_expires_at to users table
-- Per IDENTITY_AND_TENANCY_RFC.md §3.2 — email must be verified before login
-- ============================================================

BEGIN;

-- Add verification columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Index for token lookup (used by verify-email endpoint)
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

COMMIT;
