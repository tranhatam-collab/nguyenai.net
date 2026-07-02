-- Nguyen AI — Identity & Access schema (Phase 2 / P0-B)
-- Per IDENTITY_AND_TENANCY_RFC.md + ENTITLEMENT_MODEL.md
-- Target: Neon Postgres (primary), D1 (edge cache mirror)
-- Append-only audit, soft-delete users, tenant isolation via tenant_id

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- 1. users — per RFC §5.1
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE NOT NULL,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash   TEXT,
  name            TEXT,
  locale          TEXT NOT NULL DEFAULT 'vi' CHECK (locale IN ('vi', 'en')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_deletion', 'deleted')),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status);

-- ============================================================
-- 2. organizations — per RFC §5.1
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  org_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  plan_id         TEXT NOT NULL DEFAULT 'nguyen-start',
  tenant_id       UUID NOT NULL DEFAULT gen_random_uuid(),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_slug ON organizations(slug);
CREATE INDEX idx_org_plan ON organizations(plan_id);

-- ============================================================
-- 3. memberships — per RFC §5.1 (user ↔ org with role)
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
  membership_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN (
    'USER', 'MEMBER', 'STUDENT', 'FOUNDER', 'BUSINESS_MEMBER',
    'CHAPTER_MEMBER', 'INVESTOR_APPLICANT', 'QUALIFIED_INVESTOR',
    'DATA_ROOM_MEMBER', 'REVIEWER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'
  )),
  permissions     JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX idx_membership_user ON memberships(user_id);
CREATE INDEX idx_membership_org ON memberships(org_id);
CREATE INDEX idx_membership_role ON memberships(role);

-- ============================================================
-- 4. sessions — per RFC §2.3 (server-side, opaque, revocable)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  session_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL,
  audience        TEXT NOT NULL,
  issuer          TEXT NOT NULL DEFAULT 'auth.nguyenai.net',
  roles           JSONB NOT NULL DEFAULT '[]',
  permissions     JSONB NOT NULL DEFAULT '[]',
  device          JSONB,
  ip_address      INET,
  user_agent      TEXT,
  csrf_token      TEXT NOT NULL,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  rotated_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_user ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_session_expires ON sessions(expires_at) WHERE revoked_at IS NULL;

-- ============================================================
-- 5. entitlements — per ENTITLEMENT_MODEL.md §8.1
-- ============================================================
CREATE TABLE IF NOT EXISTS entitlements (
  entitlement_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL,
  key             TEXT NOT NULL,
  value           JSONB NOT NULL,
  source          TEXT NOT NULL,
  granted_by      TEXT NOT NULL DEFAULT 'system',
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_ent_user ON entitlements(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_ent_key ON entitlements(key) WHERE revoked_at IS NULL;
CREATE INDEX idx_ent_tenant ON entitlements(tenant_id) WHERE revoked_at IS NULL;

-- ============================================================
-- 6. audit_log — per RFC §8 (append-only, no update/delete)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
  session_id      UUID,
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
  actor_ip        INET,
  user_agent      TEXT,
  target          TEXT,
  result          TEXT NOT NULL CHECK (result IN ('success', 'failure', 'denied')),
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_event ON audit_log(event_type);
CREATE INDEX idx_audit_time ON audit_log(timestamp DESC);

-- Prevent update/delete on audit_log (append-only)
CREATE OR REPLACE FUNCTION prevent_audit_modify() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only — no UPDATE or DELETE allowed';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS no_update_audit ON audit_log;
DROP TRIGGER IF EXISTS no_delete_audit ON audit_log;
CREATE TRIGGER no_update_audit BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modify();
CREATE TRIGGER no_delete_audit BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modify();

-- ============================================================
-- 7. oauth_accounts — per RFC §2.2 (Google, GitHub, Apple)
-- ============================================================
CREATE TABLE IF NOT EXISTS oauth_accounts (
  oauth_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('google', 'github', 'apple')),
  provider_user_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_user_id);

-- ============================================================
-- 8. mfa_factors — per RFC §2.2 (TOTP, backup codes)
-- ============================================================
CREATE TABLE IF NOT EXISTS mfa_factors (
  mfa_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('totp', 'backup_codes', 'passkey')),
  secret          TEXT,
  backup_codes    JSONB,
  name            TEXT,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at     TIMESTAMPTZ
);

CREATE INDEX idx_mfa_user ON mfa_factors(user_id) WHERE disabled_at IS NULL;

-- ============================================================
-- 9. api_keys — per RFC §2.2 (API key auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  key_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,
  key_prefix      TEXT NOT NULL,
  name            TEXT NOT NULL,
  scopes          JSONB NOT NULL DEFAULT '[]',
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apikey_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_apikey_user ON api_keys(user_id) WHERE revoked_at IS NULL;

-- ============================================================
-- 10. approvals — sensitive action approval workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS approvals (
  approval_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL,
  action          TEXT NOT NULL,
  resource        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'executed')),
  requested_by    UUID NOT NULL REFERENCES users(user_id),
  approved_by     UUID REFERENCES users(user_id),
  reason          TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  executed_at     TIMESTAMPTZ
);

CREATE INDEX idx_approval_user ON approvals(user_id);
CREATE INDEX idx_approval_status ON approvals(status);
CREATE INDEX idx_approval_tenant ON approvals(tenant_id);

-- ============================================================
-- 11. usage_events — quota tracking (commands, tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_events (
  usage_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('command', 'tokens', 'lesson', 'cert_attempt')),
  amount          INTEGER NOT NULL DEFAULT 1,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_user_day ON usage_events(user_id, event_type, created_at DESC);
CREATE INDEX idx_usage_tenant ON usage_events(tenant_id);

-- ============================================================
-- 12. updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_org_updated ON organizations;
CREATE TRIGGER trg_org_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_membership_updated ON memberships;
CREATE TRIGGER trg_membership_updated BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
