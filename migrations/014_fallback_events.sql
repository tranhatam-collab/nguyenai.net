-- Migration: fallback_events
-- Phase 4 — Gen 1/Gen2 fallback
-- Per FALLBACK_TO_GEN1_GEN2_POLICY.md

CREATE TABLE IF NOT EXISTS fallback_events (
  request_id TEXT PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('F1', 'F2', 'F3', 'F4', 'F5')),
  target TEXT NOT NULL CHECK (target IN ('gen1', 'gen2')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'executed', 'failed')),
  reason TEXT NOT NULL,
  component TEXT NOT NULL,
  data_classification TEXT NOT NULL,
  purpose TEXT NOT NULL,
  retention_period TEXT,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  executed_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fallback_events_severity ON fallback_events(severity);
CREATE INDEX IF NOT EXISTS idx_fallback_events_target ON fallback_events(target);
CREATE INDEX IF NOT EXISTS idx_fallback_events_status ON fallback_events(status);
CREATE INDEX IF NOT EXISTS idx_fallback_events_created_at ON fallback_events(created_at);
