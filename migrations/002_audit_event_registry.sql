-- 002_audit_event_registry.sql
-- Replace hardcoded CHECK constraint with versioned event registry.
-- Per AUDIT_EVENT_REGISTRY.md (registry version 2026-07-03.1, 63 event types)
--
-- This migration:
-- 1. Creates audit_event_registry table
-- 2. Inserts all 38 event types
-- 3. Adds FK constraint on audit_log.event_type → registry
-- 4. Drops old CHECK constraint if exists

BEGIN;

-- ============================================================
-- 1. Registry table
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_event_registry (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL UNIQUE,
  registry_version TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Insert all 63 event types (registry version 2026-07-02.1)
-- ============================================================

INSERT INTO audit_event_registry (event_type, registry_version, description) VALUES
  -- Identity events (12)
  ('login_success', '2026-07-02.1', 'User logged in successfully'),
  ('login_failure', '2026-07-02.1', 'Login attempt failed'),
  ('logout', '2026-07-02.1', 'User logged out'),
  ('session_revoked', '2026-07-02.1', 'Session revoked by admin or user'),
  ('session_expired', '2026-07-02.1', 'Session expired naturally'),
  ('passkey_registered', '2026-07-02.1', 'Passkey/WebAuthn credential registered'),
  ('passkey_removed', '2026-07-02.1', 'Passkey credential removed'),
  ('mfa_enrolled', '2026-07-02.1', 'MFA TOTP enrolled'),
  ('mfa_removed', '2026-07-02.1', 'MFA removed'),
  ('api_key_created', '2026-07-02.1', 'API key created'),
  ('api_key_revoked', '2026-07-02.1', 'API key revoked'),
  ('email_verified', '2026-07-02.1', 'Email address verified'),
  ('account_deletion_requested', '2026-07-02.1', 'User requested account deletion'),
  -- Authorization events (6)
  ('role_changed', '2026-07-02.1', 'User role changed'),
  ('permission_granted', '2026-07-02.1', 'Permission granted to user'),
  ('permission_revoked', '2026-07-02.1', 'Permission revoked from user'),
  ('org_member_added', '2026-07-02.1', 'Member added to org/tenant'),
  ('org_member_removed', '2026-07-02.1', 'Member removed from org/tenant'),
  ('access_denied', '2026-07-02.1', 'Access denied to resource'),
  -- Entitlement events (5)
  ('entitlement_granted', '2026-07-02.1', 'Entitlement granted to user'),
  ('entitlement_updated', '2026-07-02.1', 'Entitlement updated'),
  ('entitlement_revoked', '2026-07-02.1', 'Entitlement revoked'),
  ('entitlement_expired', '2026-07-02.1', 'Entitlement expired naturally'),
  ('entitlement_recalculated', '2026-07-02.1', 'Entitlement recalculated by system'),
  -- Approval events (4)
  ('approval_requested', '2026-07-02.1', 'Sensitive action approval requested'),
  ('approval_granted', '2026-07-02.1', 'Approval granted'),
  ('approval_denied', '2026-07-02.1', 'Approval denied'),
  ('sensitive_action_executed', '2026-07-02.1', 'Sensitive action executed after approval'),
  -- Command & runtime events (5)
  ('command_executed', '2026-07-02.1', 'Command executed by runtime'),
  ('command_failed', '2026-07-02.1', 'Command execution failed'),
  ('command_cancelled', '2026-07-02.1', 'Command cancelled by user or system'),
  ('tool_called', '2026-07-02.1', 'Tool invoked by agent'),
  ('workflow_completed', '2026-07-02.1', 'Workflow completed'),
  -- Academy & certification events (4)
  ('academy_lesson_completed', '2026-07-02.1', 'User completed a lesson'),
  ('proof_submitted', '2026-07-02.1', 'Proof/certification attempt submitted'),
  ('certificate_issued', '2026-07-02.1', 'Certificate issued after review'),
  ('certificate_revoked', '2026-07-02.1', 'Certificate revoked'),
  -- Billing & investor events (2)
  ('payment_received', '2026-07-02.1', 'Payment received for plan/Product'),
  ('investor_room_accessed', '2026-07-02.1', 'Investor private room accessed'),
  -- Scholarship events (24) — registry version 2026-07-03.1
  ('scholarship_application_created', '2026-07-03.1', 'Scholarship application created'),
  ('scholarship_application_updated', '2026-07-03.1', 'Application fields updated'),
  ('identity_verification_started', '2026-07-03.1', 'Email/phone/identity verification started'),
  ('identity_verification_completed', '2026-07-03.1', 'Verification completed'),
  ('investor_access_granted', '2026-07-03.1', 'Investor granted access to applications'),
  ('investor_access_revoked', '2026-07-03.1', 'Investor access revoked'),
  ('scholarship_profile_viewed', '2026-07-03.1', 'Investor viewed applicant profile'),
  ('wish_shared_with_investors', '2026-07-03.1', 'Wish visibility set to investors_only'),
  ('wish_publication_requested', '2026-07-03.1', 'Applicant requested public publication'),
  ('wish_publication_approved', '2026-07-03.1', 'Admin approved wish publication'),
  ('wish_publication_rejected', '2026-07-03.1', 'Admin rejected wish publication'),
  ('scholarship_review_submitted', '2026-07-03.1', 'Investor submitted review'),
  ('scholarship_vote_submitted', '2026-07-03.1', 'Council member voted'),
  ('conflict_of_interest_declared', '2026-07-03.1', 'Reviewer declared conflict'),
  ('scholarship_awarded', '2026-07-03.1', 'Scholarship awarded to applicant'),
  ('scholarship_declined', '2026-07-03.1', 'Scholarship offer declined'),
  ('sponsorship_committed', '2026-07-03.1', 'Sponsor committed funds'),
  ('sponsorship_paid', '2026-07-03.1', 'Sponsorship payment completed'),
  ('scholarship_enrollment_activated', '2026-07-03.1', 'Enrolled in program'),
  ('forum_post_submitted', '2026-07-03.1', 'Forum post submitted for moderation'),
  ('forum_post_approved', '2026-07-03.1', 'Moderator approved post'),
  ('forum_post_rejected', '2026-07-03.1', 'Moderator rejected post'),
  ('complaint_submitted', '2026-07-03.1', 'User submitted complaint'),
  ('appeal_submitted', '2026-07-03.1', 'Applicant submitted appeal')
ON CONFLICT (event_type) DO NOTHING;

-- ============================================================
-- 3. Add registry_version column to audit_log
-- ============================================================

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS registry_version TEXT NOT NULL DEFAULT '2026-07-02.1';

-- ============================================================
-- 4. Drop old CHECK constraint (if exists) and add FK
-- ============================================================

-- Drop old CHECK if it exists (name may vary)
ALTER TABLE audit_log
  DROP CONSTRAINT IF EXISTS audit_log_event_type_check;

-- Add FK: event_type must exist in registry
ALTER TABLE audit_log
  ADD CONSTRAINT fk_audit_event_type
  FOREIGN KEY (event_type) REFERENCES audit_event_registry(event_type);

-- ============================================================
-- 5. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_audit_log_registry_version
  ON audit_log (registry_version);

CREATE INDEX IF NOT EXISTS idx_audit_event_registry_version
  ON audit_event_registry (registry_version);

-- ============================================================
-- 6. Verify
-- ============================================================

-- Should return 63
SELECT count(*) AS event_type_count FROM audit_event_registry
  WHERE registry_version IN ('2026-07-02.1', '2026-07-03.1');
COMMIT;
