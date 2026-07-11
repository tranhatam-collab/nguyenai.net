-- ============================================================
-- Migration 003: Email verification (D1/SQLite version)
-- Adds verification_token + verification_expires_at to users table
-- Per IDENTITY_AND_TENANCY_RFC.md §3.2 — email must be verified before login
-- ============================================================

-- D1/SQLite doesn't support IF NOT EXISTS on ALTER TABLE ADD COLUMN
-- Use PRAGMA to check if column exists before adding

-- Add verification_token column
ALTER TABLE users ADD COLUMN verification_token TEXT;

-- Add verification_expires_at column
ALTER TABLE users ADD COLUMN verification_expires_at TEXT;

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
