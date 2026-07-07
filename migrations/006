-- Migration: incident_events
-- Phase 1 — Incident and notification
-- Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md

CREATE TABLE IF NOT EXISTS incident_events (
  event_id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('detected', 'diagnosed', 'contained', 'resolved', 'closed', 'note')),
  message TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON incident_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_events_created_at ON incident_events(created_at);
