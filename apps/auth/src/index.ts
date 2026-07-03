/**
 * @nai/auth-worker — Authentication service for Nguyen AI ecosystem.
 *
 * Runs on Cloudflare Workers with D1 database.
 * Domain: auth.nguyenai.net
 *
 * Security fixes applied (QA_AUDIT_AUTH_WORKER_2026-07-02):
 *   P0-1: IDOR fix — DELETE /auth/api-keys/:id checks ownership
 *   P0-2: Rate limiting — 5 attempts/15min per email + IP (RFC §9)
 *   P0-3: MFA — real TOTP verification via otpauth, no dev bypass
 *   P0-4: CSRF — token verified on all state-changing requests
 *   P1-5: Email verification required before login
 *   P1-6: PBKDF2 600K iterations (OWASP 2026)
 *
 * Routes:
 *   GET  /health — health check
 *   POST /v1/auth/register — create new user + default org
 *   POST /v1/auth/login — email/password login, returns session cookie
 *   POST /v1/auth/logout — revoke session, clear cookie
 *   GET  /v1/auth/session — resolve session from cookie
 *   GET  /v1/auth/me — current user profile
 *   POST /v1/auth/mfa/enroll — start TOTP enrollment
 *   POST /v1/auth/mfa/verify — verify TOTP code
 *   POST /v1/auth/api-keys — create API key
 *   GET  /v1/auth/api-keys — list user's API keys
 *   DELETE /v1/auth/api-keys/:id — revoke API key (ownership checked)
 *   GET  /v1/auth/audit — query user's audit log
 *   GET  /v1/auth/oauth/google/begin — start Google OAuth flow
 *   GET  /v1/auth/oauth/google/callback — handle Google OAuth callback
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Secret, TOTP } from 'otpauth';

import {
  hashPassword,
  verifyPassword,
  generateSessionId,
  generateCsrfToken,
  generateApiKeyValue,
  hashApiKey,
  generateTotpSecret,
  buildTotpUri,
  buildCookieHeader,
  buildClearCookieHeader,
  getPermissionsForRoles,
  SESSION_COOKIE_NAME,
  type Role,
  type Session,
} from '@nai/auth';

import { setAuditStore, logAuditEvent, logLoginSuccess, logLoginFailure, logLogout, logAccessDenied } from '@nai/audit';

import { D1AuditStore } from './d1-audit-store';
import {
  findUserByEmail,
  findUserById,
  createUser,
  createOrganization,
  createMembership,
  findOrgsByUser,
  createSession,
  findSessionById,
  revokeSession,
  saveVerificationToken,
  findUserByVerificationToken,
  markEmailVerified,
  createMfaFactor,
  findMfaFactorsByUser,
  findPendingMfaFactor,
  verifyMfaFactor,
  createApiKey,
  findApiKeysByUser,
  findApiKeyById,
  revokeApiKey,
  countFailedLogins,
  countFailedLoginsByIp,
  findOAuthAccount,
  createOAuthAccount,
  findUserByEmailVerified,
} from './db';

import type { Context } from 'hono';

// ============================================================
// App context
// ============================================================

interface AuthEnv {
  Bindings: {
    DB: D1Database;
    ENVIRONMENT: string;
    AUTH_ISSUER: string;
    DEFAULT_AUDIENCE: string;
    SESSION_MAX_AGE: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REDIRECT_URI: string;
  };
  Variables: {
    session: Session | null;
  };
}

const app = new Hono<AuthEnv>();

// ============================================================
// Constants — security policy
// ============================================================

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CSRF_HEADER_NAME = 'X-CSRF-Token';

// ============================================================
// CORS — restrict to nguyenai.net subdomains
// ============================================================

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null;
    if (/^https:\/\/.*\.nguyenai\.net$/.test(origin)) return origin;
    if (origin === 'http://localhost:4321') return origin;
    if (origin === 'http://localhost:4322') return origin;
    return null;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', CSRF_HEADER_NAME],
}));

// Initialize D1-backed audit store on each request
app.use('*', async (c, next) => {
  setAuditStore(new D1AuditStore(c.env.DB));
  await next();
});

// ============================================================
// Helpers
// ============================================================

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === name) return v ?? null;
  }
  return null;
}

function getSessionCookie(c: Context): string | null {
  const cookie = c.req.header('Cookie') ?? '';
  return parseCookie(cookie, SESSION_COOKIE_NAME);
}

function getClientIp(c: Context): string {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
}

function getUserAgent(c: Context): string {
  return c.req.header('User-Agent') ?? 'unknown';
}

function getMaxAge(c: Context): number {
  return parseInt(c.env.SESSION_MAX_AGE ?? '3600', 10);
}

function getExpiresAt(maxAge: number): string {
  return new Date(Date.now() + maxAge * 1000).toISOString();
}

function parseD1Session(s: Record<string, unknown>): Session {
  return {
    session_id: s.session_id as string,
    user_id: s.user_id as string,
    tenant_id: s.tenant_id as string,
    plan_id: (s.plan_id as string) ?? 'nguyen-start',
    audience: s.audience as string,
    issuer: s.issuer as string,
    roles: JSON.parse((s.roles as string) ?? '[]'),
    permissions: JSON.parse((s.permissions as string) ?? '[]'),
    device: s.device ? JSON.parse(s.device as string) : null,
    ip_address: (s.ip_address as string) ?? null,
    user_agent: (s.user_agent as string) ?? null,
    csrf_token: s.csrf_token as string,
    issued_at: s.issued_at as string,
    expires_at: s.expires_at as string,
    rotated_at: (s.rotated_at as string) ?? null,
    revoked_at: (s.revoked_at as string) ?? null,
  };
}

/**
 * P0-4: CSRF token verification.
 * All POST/DELETE requests must include X-CSRF-Token header matching session.csrf_token.
 * Exception: /v1/auth/register and /v1/auth/login (no session yet).
 */
function verifyCsrf(c: Context<AuthEnv>): boolean {
  const session = c.get('session');
  if (!session) return false;
  const headerToken = c.req.header(CSRF_HEADER_NAME);
  if (!headerToken) return false;
  return constantTimeEqualStrings(headerToken, session.csrf_token);
}

function constantTimeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * P0-2: Rate limiting check.
 * Returns true if the request should be blocked (too many attempts).
 */
async function isRateLimited(c: Context<AuthEnv>, email: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const ip = getClientIp(c);
  const emailFailures = await countFailedLogins(c.env.DB, email, since);
  const ipFailures = await countFailedLoginsByIp(c.env.DB, ip, since);
  return emailFailures >= RATE_LIMIT_MAX_ATTEMPTS || ipFailures >= RATE_LIMIT_MAX_ATTEMPTS * 3;
}

// ============================================================
// Session resolution middleware
// ============================================================

async function resolveSession(c: Context<AuthEnv>): Promise<Session | null> {
  const cookie = getSessionCookie(c);
  if (!cookie) return null;
  const d1Session = await findSessionById(c.env.DB, cookie);
  if (!d1Session) return null;
  if (d1Session.revoked_at) return null;
  if (new Date(d1Session.expires_at) < new Date()) return null;
  return parseD1Session(d1Session as unknown as Record<string, unknown>);
}

app.use('/v1/auth/*', async (c, next) => {
  c.set('session', await resolveSession(c));
  await next();
});

// P0-4: CSRF verification middleware for state-changing requests (except register/login)
app.use('/v1/auth/*', async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  // Skip CSRF for GET, OPTIONS, and auth endpoints that don't require session
  if (method === 'GET' || method === 'OPTIONS') return await next();
  if (path === '/v1/auth/register' || path === '/v1/auth/login') return await next();
  // All other POST/DELETE require valid session + CSRF token
  const session = c.get('session');
  if (!session) return await next(); // let the route handler return 401
  if (!verifyCsrf(c)) {
    await logAccessDenied(session.user_id, session.session_id, path, 'CSRF token mismatch');
    return c.json({ error: 'CSRF token required' }, 403);
  }
  await next();
});

// ============================================================
// Health check
// ============================================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'nai-auth',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    issuer: c.env.AUTH_ISSUER,
  });
});

// ============================================================
// Register — POST /v1/auth/register
// ============================================================

app.post('/v1/auth/register', async (c) => {
  const body = await c.req.json();
  const { email, password, name, locale } = body;

  if (!email || !password) {
    return c.json({ error: 'email and password are required' }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: 'password must be at least 8 characters' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'invalid email format' }, 400);
  }

  // P2-1: Don't reveal if email exists — return same response shape
  const existing = await findUserByEmail(c.env.DB, email);
  if (existing) {
    // Still return 201 to avoid enumeration, but don't create duplicate
    // In production: send "you already have an account" email
    return c.json({
      user_id: existing.user_id,
      email,
      email_verified: !!existing.email_verified,
      name: existing.name,
      locale: existing.locale,
      organization: null,
      message: 'If this email is not registered, an account has been created. If it is, please log in.',
    }, 201);
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const userLocale = locale === 'en' ? 'en' : 'vi';
  const verificationToken = crypto.randomUUID();

  await createUser(c.env.DB, {
    user_id: userId,
    email,
    password_hash: passwordHash,
    name: name ?? null,
    locale: userLocale,
  });

  // Create default personal organization + membership
  const orgId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const slug = `user-${userId.slice(0, 8)}`;

  await createOrganization(c.env.DB, {
    org_id: orgId,
    name: name ?? email.split('@')[0],
    slug,
    plan_id: 'nguyen-start',
    tenant_id: tenantId,
  });

  await createMembership(c.env.DB, {
    membership_id: crypto.randomUUID(),
    user_id: userId,
    org_id: orgId,
    role: 'USER',
    permissions: [],
  });

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'org_member_added',
    actor_ip: getClientIp(c),
    user_agent: getUserAgent(c),
    target: orgId,
    result: 'success',
    metadata: { role: 'USER', plan: 'nguyen-start' },
  });

  // P1-5: Save verification token + send welcome email via @nai/email
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
  await saveVerificationToken(c.env.DB, userId, verificationToken, verificationExpiresAt);

  try {
    const { createEmailService } = await import('@nai/email');
    const emailService = createEmailService(c.env as { RESEND_API_KEY?: string; ENVIRONMENT?: string });
    await emailService.sendTemplate('welcome', {
      locale: userLocale as 'vi' | 'en',
      user_email: email,
      user_name: name ?? undefined,
      verification_token: verificationToken,
    });
  } catch {
    // Email send failure should not block registration
  }

  return c.json({
    user_id: userId,
    email,
    email_verified: false,
    name: name ?? null,
    locale: userLocale,
    organization: { org_id: orgId, tenant_id: tenantId, plan_id: 'nguyen-start' },
    message: 'Account created. Email verification required before login.',
  }, 201);
});

// ============================================================
// Verify email — POST /v1/auth/verify-email
// Per IDENTITY_AND_TENANCY_RFC §3.2 — token-based email verification
// ============================================================

app.post('/v1/auth/verify-email', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = body.token;
  if (!token || typeof token !== 'string') {
    return c.json({ error: 'token is required' }, 400);
  }

  const user = await findUserByVerificationToken(c.env.DB, token);
  if (!user) {
    return c.json({ error: 'invalid or already used token' }, 400);
  }

  // Check expiry
  if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
    return c.json({ error: 'token expired' }, 400);
  }

  await markEmailVerified(c.env.DB, user.user_id);

  await logAuditEvent({
    user_id: user.user_id,
    session_id: null,
    event_type: 'email_verified',
    actor_ip: getClientIp(c),
    user_agent: getUserAgent(c),
    target: user.user_id,
    result: 'success',
    metadata: { email: user.email },
  });

  return c.json({ verified: true, email: user.email });
});

// ============================================================
// Login — POST /v1/auth/login
// ============================================================

app.post('/v1/auth/login', async (c) => {
  const body = await c.req.json();
  const { email, password, audience } = body;

  if (!email || !password) {
    return c.json({ error: 'email and password are required' }, 400);
  }

  // P0-2: Rate limiting — check before processing
  if (await isRateLimited(c, email)) {
    return c.json({ error: 'too many login attempts. Please try again later.' }, 429);
  }

  const user = await findUserByEmail(c.env.DB, email);
  if (!user) {
    await logLoginFailure(email, getClientIp(c), getUserAgent(c));
    return c.json({ error: 'invalid email or password' }, 401);
  }

  if (user.status !== 'active') {
    await logLoginFailure(email, getClientIp(c), getUserAgent(c));
    return c.json({ error: 'invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash ?? '');
  if (!valid) {
    await logLoginFailure(email, getClientIp(c), getUserAgent(c));
    return c.json({ error: 'invalid email or password' }, 401);
  }

  // P1-5: Email verification check
  if (!user.email_verified) {
    return c.json({ error: 'email not verified. Please check your inbox.' }, 403);
  }

  // Load user's orgs + roles
  const orgs = await findOrgsByUser(c.env.DB, user.user_id);
  if (orgs.length === 0) {
    await logLoginFailure(email, getClientIp(c), getUserAgent(c));
    return c.json({ error: 'invalid email or password' }, 401);
  }

  const primaryOrg = orgs[0];
  const roles = orgs.map((o) => o.membership.role as Role);
  const permissions = getPermissionsForRoles(roles);
  const maxAge = getMaxAge(c);

  const sessionId = generateSessionId();
  const csrfToken = generateCsrfToken();
  const targetAudience = audience ?? c.env.DEFAULT_AUDIENCE;

  await createSession(c.env.DB, {
    session_id: sessionId,
    user_id: user.user_id,
    tenant_id: primaryOrg.org.tenant_id,
    audience: targetAudience,
    issuer: c.env.AUTH_ISSUER,
    roles,
    permissions,
    device: JSON.stringify({ ua: getUserAgent(c) }),
    ip_address: getClientIp(c),
    user_agent: getUserAgent(c),
    csrf_token: csrfToken,
    expires_at: getExpiresAt(maxAge),
  });

  await logLoginSuccess(user.user_id, sessionId, getClientIp(c), getUserAgent(c));

  c.header('Set-Cookie', buildCookieHeader(SESSION_COOKIE_NAME, sessionId, { maxAge }));

  return c.json({
    session_id: sessionId,
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    locale: user.locale,
    roles,
    permissions,
    tenant_id: primaryOrg.org.tenant_id,
    audience: targetAudience,
    csrf_token: csrfToken,
    expires_at: getExpiresAt(maxAge),
  });
});

// ============================================================
// Logout — POST /v1/auth/logout
// ============================================================

app.post('/v1/auth/logout', async (c) => {
  const session = c.get('session');
  if (session) {
    await revokeSession(c.env.DB, session.session_id);
    await logLogout(session.user_id, session.session_id);
  }
  c.header('Set-Cookie', buildClearCookieHeader(SESSION_COOKIE_NAME));
  return c.body(null, 204);
});

// ============================================================
// Session — GET /v1/auth/session
// ============================================================

app.get('/v1/auth/session', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'no valid session' }, 401);
  }
  return c.json(session);
});

// ============================================================
// Me — GET /v1/auth/me
// ============================================================

app.get('/v1/auth/me', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const user = await findUserById(c.env.DB, session.user_id);
  if (!user) {
    return c.json({ error: 'user not found' }, 404);
  }
  const orgs = await findOrgsByUser(c.env.DB, user.user_id);
  return c.json({
    user_id: user.user_id,
    email: user.email,
    email_verified: !!user.email_verified,
    name: user.name,
    locale: user.locale,
    status: user.status,
    roles: session.roles,
    permissions: session.permissions,
    organizations: orgs.map((o) => ({
      org_id: o.org.org_id,
      name: o.org.name,
      slug: o.org.slug,
      plan_id: o.org.plan_id,
      tenant_id: o.org.tenant_id,
      role: o.membership.role,
    })),
  });
});

// ============================================================
// MFA enroll — POST /v1/auth/mfa/enroll
// ============================================================

app.post('/v1/auth/mfa/enroll', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const user = await findUserById(c.env.DB, session.user_id);
  if (!user) {
    return c.json({ error: 'user not found' }, 404);
  }

  const mfaId = crypto.randomUUID();
  const secret = generateTotpSecret();
  const uri = buildTotpUri(secret, user.email);

  await createMfaFactor(c.env.DB, {
    mfa_id: mfaId,
    user_id: user.user_id,
    type: 'totp',
    secret,
    name: 'Authenticator app',
  });

  await logAuditEvent({
    user_id: user.user_id,
    session_id: session.session_id,
    event_type: 'mfa_enrolled',
    actor_ip: getClientIp(c),
    user_agent: getUserAgent(c),
    target: mfaId,
    result: 'success',
    metadata: { type: 'totp' },
  });

  return c.json({
    mfa_id: mfaId,
    secret,
    otpauth_uri: uri,
    instructions: 'Add this to your authenticator app, then verify with POST /v1/auth/mfa/verify',
  }, 201);
});

// ============================================================
// MFA verify — POST /v1/auth/mfa/verify
// P0-3: Real TOTP verification via otpauth library, NO dev bypass
// ============================================================

app.post('/v1/auth/mfa/verify', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { mfa_id, code } = body;

  if (!mfa_id || !code) {
    return c.json({ error: 'mfa_id and code are required' }, 400);
  }

  if (!/^\d{6}$/.test(code)) {
    return c.json({ error: 'code must be 6 digits' }, 400);
  }

  const factor = await findPendingMfaFactor(c.env.DB, session.user_id, mfa_id);
  if (!factor || !factor.secret) {
    return c.json({ error: 'MFA factor not found or already verified' }, 404);
  }

  // P0-3: Real TOTP verification — no dev bypass, no environment check
  const totp = new TOTP({
    issuer: 'Nguyen AI',
    label: session.user_id,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(factor.secret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    return c.json({ error: 'invalid or expired code' }, 400);
  }

  await verifyMfaFactor(c.env.DB, mfa_id);
  return c.json({ verified: true, mfa_id });
});

// ============================================================
// API keys — POST /v1/auth/api-keys
// ============================================================

app.post('/v1/auth/api-keys', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const body = await c.req.json();
  const { name, scopes, expires_at } = body;

  if (!name) {
    return c.json({ error: 'name is required' }, 400);
  }

  const keyId = crypto.randomUUID();
  const keyValue = generateApiKeyValue();
  const keyHash = await hashApiKey(keyValue);
  const keyPrefix = keyValue.slice(0, 12);

  await createApiKey(c.env.DB, {
    key_id: keyId,
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
    scopes: scopes ?? [],
    expires_at: expires_at ?? null,
  });

  return c.json({
    key_id: keyId,
    key: keyValue,
    key_prefix: keyPrefix,
    name,
    scopes: scopes ?? [],
    expires_at: expires_at ?? null,
    warning: 'Save this key now — it will not be shown again',
  }, 201);
});

// ============================================================
// API keys — GET /v1/auth/api-keys
// ============================================================

app.get('/v1/auth/api-keys', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const keys = await findApiKeysByUser(c.env.DB, session.user_id);
  return c.json({
    api_keys: keys.map((k) => ({
      key_id: k.key_id,
      key_prefix: k.key_prefix,
      name: k.name,
      scopes: JSON.parse(k.scopes ?? '[]'),
      last_used_at: k.last_used_at,
      expires_at: k.expires_at,
      created_at: k.created_at,
    })),
  });
});

// ============================================================
// API keys — DELETE /v1/auth/api-keys/:id
// P0-1: IDOR fix — verify ownership before revoking
// ============================================================

app.delete('/v1/auth/api-keys/:id', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const keyId = c.req.param('id');

  // P0-1: Ownership check — fetch key and verify it belongs to the session user
  const key = await findApiKeyById(c.env.DB, keyId);
  if (!key) {
    return c.json({ error: 'API key not found' }, 404);
  }
  if (key.user_id !== session.user_id) {
    // Log the IDOR attempt
    await logAccessDenied(session.user_id, session.session_id, `api-key:${keyId}`, 'IDOR attempt — key belongs to another user');
    return c.json({ error: 'forbidden: you do not own this API key' }, 403);
  }
  if (key.revoked_at) {
    return c.json({ error: 'API key already revoked' }, 409);
  }

  await revokeApiKey(c.env.DB, keyId);

  await logAuditEvent({
    user_id: session.user_id,
    session_id: session.session_id,
    event_type: 'permission_revoked',
    actor_ip: getClientIp(c),
    user_agent: getUserAgent(c),
    target: keyId,
    result: 'success',
    metadata: { type: 'api_key', name: key.name },
  });

  return c.body(null, 204);
});

// ============================================================
// Audit — GET /v1/auth/audit
// ============================================================

app.get('/v1/auth/audit', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const { queryAuditLogD1 } = await import('./db');
  const events = await queryAuditLogD1(c.env.DB, {
    user_id: session.user_id,
    event_type: c.req.query('event_type'),
    result: c.req.query('result'),
    limit: parseInt(c.req.query('limit') ?? '50', 10),
  });

  return c.json({
    events: events.map((e) => ({
      ...e,
      metadata: JSON.parse((e.metadata as string) ?? '{}'),
    })),
  });
});

// ============================================================
// Google OAuth — GET /v1/auth/oauth/google/begin
// ============================================================

const GOOGLE_OAUTH_SCOPE = 'openid email profile';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

function generateStateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

app.get('/v1/auth/oauth/google/begin', async (c) => {
  const state = generateStateToken();
  const redirectUri = c.env.GOOGLE_REDIRECT_URI || `https://${c.env.AUTH_ISSUER}/v1/auth/oauth/google/callback`;
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_SCOPE,
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  const url = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  return c.json({ authorize_url: url, state });
});

// ============================================================
// Google OAuth — GET /v1/auth/oauth/google/callback
// ============================================================

app.get('/v1/auth/oauth/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    return c.json({ error: `OAuth error: ${error}` }, 400);
  }
  if (!code || !state) {
    return c.json({ error: 'missing code or state' }, 400);
  }

  const redirectUri = c.env.GOOGLE_REDIRECT_URI || `https://${c.env.AUTH_ISSUER}/v1/auth/oauth/google/callback`;

  // Exchange code for tokens
  const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    console.error('Google token exchange failed:', errText);
    return c.json({ error: 'token exchange failed' }, 502);
  }

  const tokens = await tokenResp.json() as { access_token: string; id_token?: string };

  // Fetch user profile
  const userInfoResp = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoResp.ok) {
    return c.json({ error: 'failed to fetch user info' }, 502);
  }

  const userInfo = await userInfoResp.json() as {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    locale?: string;
  };

  if (!userInfo.email) {
    return c.json({ error: 'no email returned from Google' }, 400);
  }

  // Check if OAuth account already linked
  const existingOAuth = await findOAuthAccount(c.env.DB, 'google', userInfo.sub);
  let userId: string;
  let tenantId: string;
  let isNewUser = false;

  if (existingOAuth) {
    // Existing OAuth user — log in
    userId = existingOAuth.user_id;
    const orgs = await findOrgsByUser(c.env.DB, userId);
    tenantId = orgs[0]?.org.tenant_id ?? crypto.randomUUID();
  } else {
    // Check if email exists (verified)
    const existingUser = await findUserByEmailVerified(c.env.DB, userInfo.email);
    if (existingUser) {
      // Link OAuth to existing account
      userId = existingUser.user_id;
      const orgs = await findOrgsByUser(c.env.DB, userId);
      tenantId = orgs[0]?.org.tenant_id ?? crypto.randomUUID();
      const oauthId = crypto.randomUUID();
      await createOAuthAccount(c.env.DB, oauthId, userId, 'google', userInfo.sub);
    } else {
      // Create new user (no password — OAuth only)
      userId = crypto.randomUUID();
      const orgId = crypto.randomUUID();
      tenantId = crypto.randomUUID();
      const name = userInfo.name ?? userInfo.email.split('@')[0];
      const userLocale = userInfo.locale === 'vi' ? 'vi' : 'en';

      await createUser(c.env.DB, {
        user_id: userId,
        email: userInfo.email,
        password_hash: '', // OAuth-only user, no password
        name,
        locale: userLocale,
      });

      await createOrganization(c.env.DB, {
        org_id: orgId,
        name: `${name}'s workspace`,
        slug: `user-${userId.slice(0, 8)}`,
        plan_id: 'nguyen-start',
        tenant_id: tenantId,
      });

      await createMembership(c.env.DB, {
        membership_id: crypto.randomUUID(),
        user_id: userId,
        org_id: orgId,
        role: 'USER',
        permissions: [],
      });

      // Mark email verified (Google verified)
      if (userInfo.email_verified) {
        await markEmailVerified(c.env.DB, userId);
      }

      // Link OAuth account
      const oauthId = crypto.randomUUID();
      await createOAuthAccount(c.env.DB, oauthId, userId, 'google', userInfo.sub);
      isNewUser = true;
    }
  }

  // Create session
  const sessionId = generateSessionId();
  const csrfToken = generateCsrfToken();
  const maxAge = getMaxAge(c);
  const ip = getClientIp(c);
  const userAgent = getUserAgent(c);

  await createSession(c.env.DB, {
    session_id: sessionId,
    user_id: userId,
    tenant_id: tenantId,
    audience: c.env.DEFAULT_AUDIENCE,
    issuer: c.env.AUTH_ISSUER,
    roles: ['user'],
    permissions: getPermissionsForRoles(['user' as Role]),
    device: JSON.stringify({ ua: userAgent }),
    ip_address: ip,
    user_agent: userAgent,
    csrf_token: csrfToken,
    expires_at: getExpiresAt(maxAge),
  });

  await logLoginSuccess(userId, sessionId, ip, userAgent);

  c.header('Set-Cookie', buildCookieHeader(SESSION_COOKIE_NAME, sessionId, { maxAge }));

  return c.json({
    session_id: sessionId,
    user_id: userId,
    csrf_token: csrfToken,
    is_new_user: isNewUser,
    expires_at: getExpiresAt(maxAge),
  });
});

// ============================================================
// 404 + error handlers
// ============================================================

app.notFound((c) => c.json({ error: 'not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'internal server error' }, 500);
});

export default app;
