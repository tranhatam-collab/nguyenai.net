-- Nguyen AI — Identity & Access schema (D1 / SQLite version)
-- Per IDENTITY_AND_TENANCY_RFC.md + ENTITLEMENT_MODEL.md
-- Target: Cloudflare D1 (edge, temp) — will migrate to Neon Postgres for production
--
-- SQLite differences from Postgres version:
-- - No CITEXT → TEXT + COLLATE NOCASE (case-insensitive via app-level lower())
-- - No gen_random_uuid() → app generates UUID via crypto.randomUUID()
-- - No INET → TEXT
-- - No JSONB → TEXT (store JSON strings)
-- - No TIMESTAMPTZ → TEXT (ISO 8601)
-- - No BOOLEAN → INTEGER (0/1)
-- - No plpgsql triggers → SQLite triggers (prevent UPDATE/DELETE on audit_log)

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id         TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  password_hash   TEXT,
  name            TEXT,
  locale          TEXT NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi', 'en')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_deletion', 'deleted')),
  deleted_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================
-- 2. organizations
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  org_id          TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  plan_id         TEXT NOT NULL DEFAULT 'nguyen-start',
  tenant_id       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_plan ON organizations(plan_id);

-- ============================================================
-- 3. memberships
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
  membership_id   TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  org_id          TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN (
    'USER', 'MEMBER', 'STUDENT', 'FOUNDER', 'BUSINESS_MEMBER',
    'CHAPTER_MEMBER', 'INVESTOR_APPLICANT', 'QUALIFIED_INVESTOR',
    'DATA_ROOM_MEMBER', 'REVIEWER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'
  )),
  permissions     TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, org_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_membership_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_org ON memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_membership_role ON memberships(role);

-- ============================================================
-- 4. sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  session_id      TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  audience        TEXT NOT NULL,
  issuer          TEXT NOT NULL DEFAULT 'auth.nguyenai.net',
  roles           TEXT NOT NULL DEFAULT '[]',
  permissions     TEXT NOT NULL DEFAULT '[]',
  device          TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  csrf_token      TEXT NOT NULL,
  issued_at       TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at      TEXT NOT NULL,
  rotated_at      TEXT,
  revoked_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_user ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_expires ON sessions(expires_at) WHERE revoked_at IS NULL;

-- ============================================================
-- 5. entitlements
-- ============================================================
CREATE TABLE IF NOT EXISTS entitlements (
  entitlement_id  TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  key             TEXT NOT NULL,
  value           TEXT NOT NULL,
  source          TEXT NOT NULL,
  granted_by      TEXT NOT NULL DEFAULT 'system',
  granted_at      TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at      TEXT,
  revoked_at      TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ent_user ON entitlements(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ent_key ON entitlements(key) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ent_tenant ON entitlements(tenant_id) WHERE revoked_at IS NULL;

-- ============================================================
-- 6. audit_log — append-only (enforced via SQLite triggers)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  event_id        TEXT PRIMARY KEY,
  timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
  user_id         TEXT,
  session_id      TEXT,
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'login_success', 'login_failure', 'logout', 'session_revoked',
    'passkey_registered', 'mfa_enrolled', 'role_changed',
    'permission_granted', 'permission_revoked',
    'org_member_added', 'org_member_removed',
    'account_deletion_requested', 'access_denied',
    'entitlement_granted', 'entitlement_revoked',
    'approval_requested', 'approval_granted', 'approval_denied',
    'sensitive_action_executed'
  )),
  actor_ip        TEXT,
  user_agent      TEXT,
  target          TEXT,
  result          TEXT NOT NULL CHECK (result IN ('success', 'failure', 'denied')),
  metadata        TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(timestamp DESC);

-- Prevent UPDATE on audit_log (append-only)
CREATE TRIGGER IF NOT EXISTS no_update_audit
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only — no UPDATE allowed');
  END;

-- Prevent DELETE on audit_log (append-only)
CREATE TRIGGER IF NOT EXISTS no_delete_audit
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only — no DELETE allowed');
  END;

-- ============================================================
-- 7. oauth_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS oauth_accounts (
  oauth_id        TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  provider        TEXT NOT NULL CHECK (provider IN ('google', 'github', 'apple')),
  provider_user_id TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider, provider_user_id);

-- ============================================================
-- 8. mfa_factors
-- ============================================================
CREATE TABLE IF NOT EXISTS mfa_factors (
  mfa_id          TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('totp', 'backup_codes', 'passkey')),
  secret          TEXT,
  backup_codes    TEXT,
  name            TEXT,
  verified        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  disabled_at     TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mfa_user ON mfa_factors(user_id) WHERE disabled_at IS NULL;

-- ============================================================
-- 9. api_keys
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  key_id          TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,
  key_prefix      TEXT NOT NULL,
  name            TEXT NOT NULL,
  scopes          TEXT NOT NULL DEFAULT '[]',
  last_used_at    TEXT,
  expires_at      TEXT,
  revoked_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_apikey_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_apikey_user ON api_keys(user_id) WHERE revoked_at IS NULL;

-- ============================================================
-- 10. approvals
-- ============================================================
CREATE TABLE IF NOT EXISTS approvals (
  approval_id     TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  action          TEXT NOT NULL,
  resource        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'executed')),
  requested_by    TEXT NOT NULL,
  approved_by     TEXT,
  reason          TEXT,
  metadata        TEXT NOT NULL DEFAULT '{}',
  requested_at    TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at      TEXT,
  expires_at      TEXT,
  executed_at     TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_user ON approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approval_tenant ON approvals(tenant_id);

-- ============================================================
-- 11. usage_events — quota tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_events (
  usage_id        TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('command', 'tokens', 'lesson', 'cert_attempt')),
  amount          INTEGER NOT NULL DEFAULT 1,
  metadata        TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usage_user_day ON usage_events(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tenant ON usage_events(tenant_id);

-- ============================================================
-- 12. updated_at triggers (SQLite)
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_users_updated
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE user_id = OLD.user_id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_org_updated
  AFTER UPDATE ON organizations
  FOR EACH ROW
  BEGIN
    UPDATE organizations SET updated_at = datetime('now') WHERE org_id = OLD.org_id;
  END;

CREATE TRIGGER IF NOT EXISTS trg_membership_updated
  AFTER UPDATE ON memberships
  FOR EACH ROW
  BEGIN
    UPDATE memberships SET updated_at = datetime('now') WHERE membership_id = OLD.membership_id;
  END;
