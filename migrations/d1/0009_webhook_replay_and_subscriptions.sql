-- 0009: Webhook replay protection + subscription store
-- Per FULL_SCOPE_FAST_OPERATION_EXECUTION_PLAN_2026-07-17 P0-C

-- Webhook replay tracking (replaces in-memory Map)
CREATE TABLE IF NOT EXISTS webhook_replay (
  event_key TEXT PRIMARY KEY,
  gateway TEXT NOT NULL,
  event_id TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'processed',
  response_body TEXT,
  processed_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_replay_expires ON webhook_replay(expires_at);

-- Subscription store (replaces in-memory InMemorySubscriptionStore)
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  gateway TEXT NOT NULL,
  gateway_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_id ON subscriptions(gateway_subscription_id);
