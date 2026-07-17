/**
 * D1 data access layer for auth Worker.
 * Wraps D1 database queries with typed functions.
 */

export interface D1User {
  user_id: string;
  email: string;
  email_verified: number;
  password_hash: string | null;
  name: string | null;
  locale: string;
  status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  verification_token: string | null;
  verification_expires_at: string | null;
}

export interface D1Session {
  session_id: string;
  user_id: string;
  tenant_id: string;
  plan_id: string;
  audience: string;
  issuer: string;
  roles: string;
  permissions: string;
  device: string | null;
  ip_address: string | null;
  user_agent: string | null;
  csrf_token: string;
  issued_at: string;
  expires_at: string;
  rotated_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface D1Membership {
  membership_id: string;
  user_id: string;
  org_id: string;
  role: string;
  permissions: string;
  created_at: string;
  updated_at: string;
}

export interface D1Organization {
  org_id: string;
  name: string;
  slug: string;
  plan_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface D1MfaFactor {
  mfa_id: string;
  user_id: string;
  type: string;
  secret: string | null;
  backup_codes: string | null;
  name: string | null;
  verified: number;
  created_at: string;
  disabled_at: string | null;
}

export interface D1ApiKey {
  key_id: string;
  user_id: string;
  tenant_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  scopes: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

// ============================================================
// User queries
// ============================================================

export async function findUserByEmail(db: D1Database, email: string): Promise<D1User | null> {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?1 AND deleted_at IS NULL');
  const result = await stmt.bind(email).first<D1User>();
  return result ?? null;
}

export async function findUserById(db: D1Database, userId: string): Promise<D1User | null> {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?1');
  const result = await stmt.bind(userId).first<D1User>();
  return result ?? null;
}

export async function createUser(
  db: D1Database,
  user: { user_id: string; email: string; password_hash: string; name: string | null; locale: string }
): Promise<void> {
  await db.prepare(
    `INSERT INTO users (user_id, email, email_verified, password_hash, name, locale, status)
     VALUES (?1, ?2, 0, ?3, ?4, ?5, 'active')`
  ).bind(user.user_id, user.email, user.password_hash, user.name, user.locale).run();
}

// ============================================================
// Organization + Membership queries
// ============================================================

export async function createOrganization(
  db: D1Database,
  org: { org_id: string; name: string; slug: string; plan_id: string; tenant_id: string }
): Promise<void> {
  await db.prepare(
    `INSERT INTO organizations (org_id, name, slug, plan_id, tenant_id, status)
     VALUES (?1, ?2, ?3, ?4, ?5, 'active')`
  ).bind(org.org_id, org.name, org.slug, org.plan_id, org.tenant_id).run();
}

export async function createMembership(
  db: D1Database,
  membership: { membership_id: string; user_id: string; org_id: string; role: string; permissions: string[] }
): Promise<void> {
  await db.prepare(
    `INSERT INTO memberships (membership_id, user_id, org_id, role, permissions)
     VALUES (?1, ?2, ?3, ?4, ?5)`
  ).bind(membership.membership_id, membership.user_id, membership.org_id, membership.role, JSON.stringify(membership.permissions)).run();
}

export async function findMembershipsByUser(db: D1Database, userId: string): Promise<D1Membership[]> {
  const stmt = db.prepare('SELECT * FROM memberships WHERE user_id = ?1');
  const result = await stmt.bind(userId).all<D1Membership>();
  return result.results ?? [];
}

export async function findOrgsByUser(db: D1Database, userId: string): Promise<{ org: D1Organization; membership: D1Membership }[]> {
  const stmt = db.prepare(`
    SELECT o.*, m.role as m_role, m.permissions as m_permissions, m.membership_id as m_membership_id, m.created_at as m_created_at, m.updated_at as m_updated_at
    FROM memberships m
    JOIN organizations o ON m.org_id = o.org_id
    WHERE m.user_id = ?1 AND o.status = 'active'
  `);
  const result = await stmt.bind(userId).all();
  return (result.results ?? []).map((r) => ({
    org: {
      org_id: r.org_id as string,
      name: r.name as string,
      slug: r.slug as string,
      plan_id: r.plan_id as string,
      tenant_id: r.tenant_id as string,
      status: r.status as string,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
    },
    membership: {
      membership_id: r.m_membership_id as string,
      user_id: userId,
      org_id: r.org_id as string,
      role: r.m_role as string,
      permissions: r.m_permissions as string,
      created_at: r.m_created_at as string,
      updated_at: r.m_updated_at as string,
    },
  }));
}

/**
 * Find a specific membership record for a user in an org.
 * Returns null if user is not a member of the org.
 */
export async function findMembership(
  db: D1Database,
  userId: string,
  orgId: string,
): Promise<D1Membership | null> {
  const stmt = db.prepare('SELECT * FROM memberships WHERE user_id = ?1 AND org_id = ?2');
  const result = await stmt.bind(userId, orgId).first<D1Membership>();
  return result ?? null;
}

/**
 * Check if user is an admin or owner of a specific org.
 * Returns the membership record if admin/owner, null otherwise.
 */
export async function findOrgAdminMembership(
  db: D1Database,
  userId: string,
  orgId: string,
): Promise<D1Membership | null> {
  const stmt = db.prepare(
    'SELECT * FROM memberships WHERE user_id = ?1 AND org_id = ?2 AND role IN (?3, ?4)'
  );
  const result = await stmt.bind(userId, orgId, 'admin', 'owner').first<D1Membership>();
  return result ?? null;
}

// ============================================================
// Session queries
// ============================================================

export async function createSession(
  db: D1Database,
  session: {
    session_id: string;
    user_id: string;
    tenant_id: string;
    audience: string;
    issuer: string;
    roles: string[];
    permissions: string[];
    device: string | null;
    ip_address: string | null;
    user_agent: string | null;
    csrf_token: string;
    expires_at: string;
  }
): Promise<void> {
  await db.prepare(
    `INSERT INTO sessions (session_id, user_id, tenant_id, audience, issuer, roles, permissions, device, ip_address, user_agent, csrf_token, expires_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
  ).bind(
    session.session_id,
    session.user_id,
    session.tenant_id,
    session.audience,
    session.issuer,
    JSON.stringify(session.roles),
    JSON.stringify(session.permissions),
    session.device,
    session.ip_address,
    session.user_agent,
    session.csrf_token,
    session.expires_at
  ).run();
}

export async function findSessionById(db: D1Database, sessionId: string): Promise<D1Session | null> {
  const stmt = db.prepare(
    `SELECT s.*, o.plan_id
     FROM sessions s
     JOIN organizations o ON o.tenant_id = s.tenant_id
     WHERE s.session_id = ?1`
  );
  const result = await stmt.bind(sessionId).first<D1Session>();
  return result ?? null;
}

export async function revokeSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('UPDATE sessions SET revoked_at = ?1 WHERE session_id = ?2')
    .bind(new Date().toISOString(), sessionId).run();
}

export async function revokeAllUserSessions(db: D1Database, userId: string): Promise<void> {
  await db.prepare('UPDATE sessions SET revoked_at = ?1 WHERE user_id = ?2 AND revoked_at IS NULL')
    .bind(new Date().toISOString(), userId).run();
}

// ============================================================
// MFA queries
// ============================================================

export async function createMfaFactor(
  db: D1Database,
  factor: { mfa_id: string; user_id: string; type: string; secret: string; name: string | null }
): Promise<void> {
  await db.prepare(
    `INSERT INTO mfa_factors (mfa_id, user_id, type, secret, name, verified)
     VALUES (?1, ?2, ?3, ?4, ?5, 0)`
  ).bind(factor.mfa_id, factor.user_id, factor.type, factor.secret, factor.name).run();
}

export async function findMfaFactorsByUser(db: D1Database, userId: string): Promise<D1MfaFactor[]> {
  const stmt = db.prepare('SELECT * FROM mfa_factors WHERE user_id = ?1 AND disabled_at IS NULL AND verified = 1');
  const result = await stmt.bind(userId).all<D1MfaFactor>();
  return result.results ?? [];
}

export async function findPendingMfaFactor(db: D1Database, userId: string, mfaId: string): Promise<D1MfaFactor | null> {
  const stmt = db.prepare('SELECT * FROM mfa_factors WHERE mfa_id = ?1 AND user_id = ?2 AND verified = 0 AND disabled_at IS NULL');
  const result = await stmt.bind(mfaId, userId).first<D1MfaFactor>();
  return result ?? null;
}

export async function verifyMfaFactor(db: D1Database, mfaId: string): Promise<void> {
  await db.prepare('UPDATE mfa_factors SET verified = 1 WHERE mfa_id = ?1').bind(mfaId).run();
}

// ============================================================
// API key queries
// ============================================================

export async function createApiKey(
  db: D1Database,
  key: { key_id: string; user_id: string; tenant_id: string; key_hash: string; key_prefix: string; name: string; scopes: string[]; expires_at: string | null }
): Promise<void> {
  await db.prepare(
    `INSERT INTO api_keys (key_id, user_id, tenant_id, key_hash, key_prefix, name, scopes, expires_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  ).bind(key.key_id, key.user_id, key.tenant_id, key.key_hash, key.key_prefix, key.name, JSON.stringify(key.scopes), key.expires_at).run();
}

export async function findApiKeysByUser(db: D1Database, userId: string): Promise<D1ApiKey[]> {
  const stmt = db.prepare('SELECT * FROM api_keys WHERE user_id = ?1 AND revoked_at IS NULL');
  const result = await stmt.bind(userId).all<D1ApiKey>();
  return result.results ?? [];
}

export async function findApiKeyByHash(db: D1Database, keyHash: string): Promise<D1ApiKey | null> {
  const stmt = db.prepare('SELECT * FROM api_keys WHERE key_hash = ?1 AND revoked_at IS NULL');
  const result = await stmt.bind(keyHash).first<D1ApiKey>();
  return result ?? null;
}

export async function findApiKeyById(db: D1Database, keyId: string): Promise<D1ApiKey | null> {
  const stmt = db.prepare('SELECT * FROM api_keys WHERE key_id = ?1');
  const result = await stmt.bind(keyId).first<D1ApiKey>();
  return result ?? null;
}

export async function revokeApiKey(db: D1Database, keyId: string): Promise<void> {
  await db.prepare('UPDATE api_keys SET revoked_at = ?1 WHERE key_id = ?2')
    .bind(new Date().toISOString(), keyId).run();
}

export async function updateApiKeyLastUsed(db: D1Database, keyId: string): Promise<void> {
  await db.prepare('UPDATE api_keys SET last_used_at = ?1 WHERE key_id = ?2')
    .bind(new Date().toISOString(), keyId).run();
}

// ============================================================
// Rate limiting — track failed login attempts per email + IP
// ============================================================

export async function recordFailedLogin(db: D1Database, email: string, ip: string): Promise<void> {
  await db.prepare(
    `INSERT INTO usage_events (usage_id, user_id, tenant_id, event_type, amount, metadata)
     VALUES (?1, ?2, ?3, 'command', 1, ?4)`
  ).bind(
    crypto.randomUUID(),
    email,
    'rate-limit',
    JSON.stringify({ type: 'login_failure', ip, timestamp: new Date().toISOString() })
  ).run();
}

export async function countFailedLogins(db: D1Database, email: string, sinceISO: string): Promise<number> {
  // D1 stores timestamps as 'YYYY-MM-DD HH:MM:SS' (SQLite CURRENT_TIMESTAMP).
  // Convert ISO input to SQLite datetime format for comparison.
  const sqliteSince = sinceISO.replace('T', ' ').replace(/\.\d+Z$/, '');
  const stmt = db.prepare(
    `SELECT COUNT(*) as cnt FROM audit_log
     WHERE event_type = 'login_failure' AND target = ?1 AND timestamp >= ?2`
  );
  const result = await stmt.bind(email, sqliteSince).first<{ cnt: number }>();
  return result?.cnt ?? 0;
}

export async function countFailedLoginsByIp(db: D1Database, ip: string, sinceISO: string): Promise<number> {
  const sqliteSince = sinceISO.replace('T', ' ').replace(/\.\d+Z$/, '');
  const stmt = db.prepare(
    `SELECT COUNT(*) as cnt FROM audit_log
     WHERE event_type = 'login_failure' AND actor_ip = ?1 AND timestamp >= ?2`
  );
  const result = await stmt.bind(ip, sqliteSince).first<{ cnt: number }>();
  return result?.cnt ?? 0;
}

/** Count verify-email attempts by IP (uses access_denied + target=verify-email). */
export async function countVerifyAttemptsByIp(db: D1Database, ip: string, sinceISO: string): Promise<number> {
  const sqliteSince = sinceISO.replace('T', ' ').replace(/\.\d+Z$/, '');
  const stmt = db.prepare(
    `SELECT COUNT(*) as cnt FROM audit_log
     WHERE event_type = 'access_denied' AND target = 'verify-email' AND actor_ip = ?1 AND timestamp >= ?2`
  );
  const result = await stmt.bind(ip, sqliteSince).first<{ cnt: number }>();
  return result?.cnt ?? 0;
}

// ============================================================
// Audit log queries — append-only (triggers prevent UPDATE/DELETE)
// ============================================================

export async function insertAuditLog(
  db: D1Database,
  event: {
    event_id: string;
    user_id: string | null;
    session_id: string | null;
    event_type: string;
    actor_ip: string | null;
    user_agent: string | null;
    target: string | null;
    result: string;
    metadata: string;
  }
): Promise<void> {
  await db.prepare(
    `INSERT INTO audit_log (event_id, user_id, session_id, event_type, actor_ip, user_agent, target, result, metadata)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
  ).bind(
    event.event_id,
    event.user_id,
    event.session_id,
    event.event_type,
    event.actor_ip,
    event.user_agent,
    event.target,
    event.result,
    event.metadata
  ).run();
}

export async function queryAuditLogD1(
  db: D1Database,
  filters: { user_id?: string; event_type?: string; result?: string; limit?: number }
): Promise<Record<string, unknown>[]> {
  let sql = 'SELECT * FROM audit_log WHERE 1=1';
  const params: unknown[] = [];
  if (filters.user_id) { sql += ` AND user_id = ?${params.length + 1}`; params.push(filters.user_id); }
  if (filters.event_type) { sql += ` AND event_type = ?${params.length + 1}`; params.push(filters.event_type); }
  if (filters.result) { sql += ` AND result = ?${params.length + 1}`; params.push(filters.result); }
  sql += ' ORDER BY timestamp DESC';
  const limit = filters.limit ?? 100;
  sql += ` LIMIT ?${params.length + 1}`;
  params.push(limit);
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.all();
  return result.results ?? [];
}

// ============================================================
// Email verification queries — per IDENTITY_AND_TENANCY_RFC §3.2
// Tokens in email URLs are ONE-TIME SECRETS (not public verification_ids).
// Store only SHA-256 hex; accept legacy plaintext rows during migration.
// ============================================================

export async function hashVerificationToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function saveVerificationToken(
  db: D1Database,
  userId: string,
  token: string,
  expiresAt: string,
): Promise<void> {
  const tokenHash = await hashVerificationToken(token);
  await db.prepare(
    'UPDATE users SET verification_token = ?1, verification_expires_at = ?2 WHERE user_id = ?3'
  ).bind(tokenHash, expiresAt, userId).run();
}

export async function findUserByVerificationToken(
  db: D1Database,
  token: string,
): Promise<D1User | null> {
  const tokenHash = await hashVerificationToken(token);
  const byHash = await db.prepare(
    'SELECT * FROM users WHERE verification_token = ?1 AND deleted_at IS NULL'
  ).bind(tokenHash).first<D1User>();
  if (byHash) return byHash;
  // Legacy plaintext tokens (pre-hash migration) — one-time accept then cleared on verify
  const byPlain = await db.prepare(
    'SELECT * FROM users WHERE verification_token = ?1 AND deleted_at IS NULL'
  ).bind(token).first<D1User>();
  return byPlain ?? null;
}

export async function markEmailVerified(
  db: D1Database,
  userId: string,
): Promise<void> {
  await db.prepare(
    'UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL WHERE user_id = ?1'
  ).bind(userId).run();
}

// ============================================================
// OAuth account queries — P1-1 (replaces stubs in index.ts)
// oauth_accounts table per migration 001_identity_access §7.
// ============================================================

export async function findOAuthAccount(
  db: D1Database,
  provider: string,
  providerUserId: string,
): Promise<{ oauth_id: string; user_id: string } | null> {
  const result = await db.prepare(
    'SELECT oauth_id, user_id FROM oauth_accounts WHERE provider = ?1 AND provider_user_id = ?2'
  ).bind(provider, providerUserId).first<{ oauth_id: string; user_id: string }>();
  return result ?? null;
}

export async function createOAuthAccount(
  db: D1Database,
  provider: string,
  providerUserId: string,
  userId: string,
): Promise<string> {
  const oauthId = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO oauth_accounts (oauth_id, user_id, provider, provider_user_id) VALUES (?1, ?2, ?3, ?4)'
  ).bind(oauthId, userId, provider, providerUserId).run();
  return oauthId;
}

export async function findUserByEmailVerified(
  db: D1Database,
  email: string,
): Promise<D1User | null> {
  const result = await db.prepare(
    'SELECT * FROM users WHERE email = ?1 AND email_verified = 1 AND deleted_at IS NULL'
  ).bind(email).first<D1User>();
  return result ?? null;
}
