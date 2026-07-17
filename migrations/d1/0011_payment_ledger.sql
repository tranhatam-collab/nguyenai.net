-- 0011: Durable payment/order ledger
-- Per INDEPENDENT_AUDIT_VERIFICATION_2026-07-17 Payment finding: no durable ledger

CREATE TABLE IF NOT EXISTS payment_ledger (
  ledger_id        TEXT PRIMARY KEY,
  payment_id       TEXT NOT NULL UNIQUE,
  user_id          TEXT NOT NULL,
  tenant_id        TEXT NOT NULL,
  gateway          TEXT NOT NULL,
  gateway_payment_id TEXT,
  price_id         TEXT NOT NULL,
  plan_id          TEXT,
  amount           REAL NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'VND',
  status           TEXT NOT NULL DEFAULT 'pending',
  -- pending -> paid -> refunded -> partial
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at          TEXT,
  refunded_at      TEXT,
  refund_id        TEXT,
  refund_amount    REAL,
  metadata         TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_ledger_user ON payment_ledger(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_payment_id ON payment_ledger(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_gateway ON payment_ledger(gateway, gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_status ON payment_ledger(status);
