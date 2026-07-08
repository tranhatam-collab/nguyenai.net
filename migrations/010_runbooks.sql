-- Migration: runbooks
-- Phase 2 — Admin approval and self-healing
-- Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md
BEGIN;

CREATE TABLE IF NOT EXISTS runbooks (
  runbook_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  component TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  diagnostic_steps TEXT NOT NULL, -- JSON array
  remediation_steps TEXT NOT NULL, -- JSON array
  approval_required BOOLEAN NOT NULL DEFAULT true,
  estimated_duration_minutes INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_runbooks_component ON runbooks(component);
CREATE INDEX IF NOT EXISTS idx_runbooks_incident_type ON runbooks(incident_type);
CREATE INDEX IF NOT EXISTS idx_runbooks_risk_level ON runbooks(risk_level);

COMMIT;
