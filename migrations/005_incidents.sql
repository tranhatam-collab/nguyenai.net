-- Migration: incidents
-- Phase 1 — Incident and notification
-- Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md
BEGIN;

CREATE TABLE IF NOT EXISTS incidents (
  incident_id TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('S1', 'S2', 'S3', 'S4', 'S5')),
  status TEXT NOT NULL CHECK (status IN ('detected', 'diagnosing', 'containing', 'resolving', 'resolved', 'reviewing', 'closed')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  component TEXT NOT NULL,
  affected_users INTEGER NOT NULL DEFAULT 0,
  detected_at TEXT NOT NULL,
  diagnosed_at TEXT,
  contained_at TEXT,
  resolved_at TEXT,
  closed_at TEXT,
  root_cause TEXT,
  resolution TEXT,
  created_by TEXT NOT NULL,
  assigned_to TEXT
);

CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_component ON incidents(component);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at);

COMMIT;
