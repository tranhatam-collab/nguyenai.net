-- Migration: self_heal_attempts
-- Phase 2 — Admin approval and self-healing
-- Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md

CREATE TABLE IF NOT EXISTS self_heal_attempts (
  attempt_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('detected', 'diagnosing', 'proposing', 'patching', 'testing', 'awaiting_preview_approval', 'deploying_preview', 'verifying_preview', 'awaiting_production_approval', 'deploying_production', 'verifying_production', 'completed', 'failed', 'denied')),
  incident_id TEXT,
  component TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  diagnosis TEXT,
  proposed_patch TEXT,
  patch_code TEXT,
  test_results TEXT,
  preview_approval_request_id TEXT,
  production_approval_request_id TEXT,
  preview_deployment_id TEXT,
  production_deployment_id TEXT,
  verification_results TEXT,
  error TEXT,
  detected_at TEXT NOT NULL,
  completed_at TEXT,
  requested_by TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_self_heal_attempts_status ON self_heal_attempts(status);
CREATE INDEX IF NOT EXISTS idx_self_heal_attempts_component ON self_heal_attempts(component);
CREATE INDEX IF NOT EXISTS idx_self_heal_attempts_detected_at ON self_heal_attempts(detected_at);
