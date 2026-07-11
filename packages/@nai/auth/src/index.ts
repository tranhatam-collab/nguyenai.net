/**
 * @nai/auth — Identity & Access for Nguyen AI ecosystem.
 *
 * Implements the contract from IDENTITY_AND_TENANCY_RFC.md:
 * - Server-side opaque sessions (not JWT-only)
 * - Email/password with PBKDF2 hashing (Web Crypto API)
 * - API key generation and verification
 * - MFA TOTP enrollment and verification
 * - Session rotation and revocation
 *
 * Cookie name: nguyenai_session (HttpOnly, Secure, SameSite=Lax, Domain=.nguyenai.net)
 */

// ============================================================
// Types — per RFC §2.3, §3, §4
// ============================================================

export type Role =
  | 'PUBLIC'
  | 'USER'
  | 'MEMBER'
  | 'STUDENT'
  | 'FOUNDER'
  | 'BUSINESS_MEMBER'
  | 'CHAPTER_MEMBER'
  | 'INVESTOR_APPLICANT'
  | 'QUALIFIED_INVESTOR'
  | 'DATA_ROOM_MEMBER'
  | 'REVIEWER'
  | 'OPERATOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type Permission =
  | 'machine:read'
  | 'machine:operate'
  | 'memory:read'
  | 'memory:write'
  | 'vault:upload'
  | 'vault:download'
  | 'academy:learn'
  | 'academy:submit'
  | 'academy:review'
  | 'cert:request'
  | 'cert:issue'
  | 'cert:revoke'
  | 'invest:request'
  | 'invest:private-read'
  | 'invest:financial-read'
  | 'invest:download'
  | 'admin:user-manage'
  | 'admin:access-revoke'
  | 'admin:billing-manage'
  | 'admin:audit-read';

export interface User {
  user_id: string;
  email: string;
  email_verified: boolean;
  name: string | null;
  locale: 'vi' | 'en';
  status: 'active' | 'suspended' | 'pending_deletion' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  tenant_id: string;
  plan_id: string;
  audience: string;
  issuer: string;
  roles: Role[];
  permissions: Permission[];
  device: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  csrf_token: string;
  issued_at: string;
  expires_at: string;
  rotated_at: string | null;
  revoked_at: string | null;
}

export interface ApiKey {
  key_id: string;
  user_id: string;
  tenant_id: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

// ============================================================
// Password hashing — PBKDF2 via Web Crypto API (Workers-compatible)
// ============================================================

// Cloudflare Workers WebCrypto hard-caps PBKDF2 at 100_000 iterations.
// OWASP 2026 prefers ≥600K for PBKDF2-SHA256 — not attainable on Workers today.
// Format is self-describing (`pbkdf2:iters:salt:hash`) so verifyPassword still
// accepts legacy hashes if the platform limit is raised later.
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function getCrypto(): Crypto {
  if (typeof globalThis.crypto !== 'undefined') return globalThis.crypto;
  throw new Error('Web Crypto API not available');
}

export async function hashPassword(password: string): Promise<string> {
  const crypto = getCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const hash = new Uint8Array(derived);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1]!, 10);
  const salt = fromBase64(parts[2]!);
  const expectedHash = fromBase64(parts[3]!);

  const crypto = getCrypto();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const actualHash = new Uint8Array(derived);

  return constantTimeEqual(actualHash, expectedHash);
}

// ============================================================
// Session token generation — opaque, ≥128 bits
// ============================================================

export function generateSessionId(): string {
  return getCrypto().randomUUID();
}

export function generateCsrfToken(): string {
  const bytes = getCrypto().getRandomValues(new Uint8Array(32));
  return toBase64(bytes);
}

export function generateApiKeyValue(): string {
  const bytes = getCrypto().getRandomValues(new Uint8Array(32));
  return `nai_${toBase64Url(bytes)}`;
}

export async function hashApiKey(key: string): Promise<string> {
  const crypto = getCrypto();
  const data = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toBase64(new Uint8Array(hash));
}

// ============================================================
// Cookie spec — per RFC §7.1
// ============================================================

export interface CookieOptions {
  domain?: string;
  maxAge?: number;
  sameSite?: 'Lax' | 'Strict';
  path?: string;
}

export const SESSION_COOKIE_NAME = 'nguyenai_session';
export const DEFAULT_COOKIE_OPTIONS: Required<CookieOptions> = {
  domain: '.nguyenai.net',
  maxAge: 3600,
  sameSite: 'Lax',
  path: '/',
};

export function buildCookieHeader(
  name: string,
  value: string,
  opts: Partial<CookieOptions> = {}
): string {
  const merged = { ...DEFAULT_COOKIE_OPTIONS, ...opts };
  const parts = [
    `${name}=${value}`,
    'HttpOnly',
    'Secure',
    `SameSite=${merged.sameSite}`,
    `Path=${merged.path}`,
    `Domain=${merged.domain}`,
    `Max-Age=${merged.maxAge}`,
  ];
  return parts.join('; ');
}

export function buildClearCookieHeader(name: string, opts: Partial<CookieOptions> = {}): string {
  const merged = { ...DEFAULT_COOKIE_OPTIONS, ...opts };
  const parts = [
    `${name}=`,
    'HttpOnly',
    'Secure',
    `SameSite=${merged.sameSite}`,
    `Path=${merged.path}`,
    `Domain=${merged.domain}`,
    'Max-Age=0',
  ];
  return parts.join('; ');
}

// ============================================================
// Session cookie signing — AUTH_SECRET (HMAC-SHA256)
// Cookie value: <session_id>.<base64url(hmac)>
// Legacy unsigned UUID still accepted when secret is set (migration).
// ============================================================

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await getCrypto().subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await getCrypto().subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

/** Sign opaque session_id for Set-Cookie. Requires AUTH_SECRET. */
export async function signSessionCookieValue(sessionId: string, secret: string): Promise<string> {
  if (!secret) throw new Error('AUTH_SECRET is required to sign session cookies');
  const sig = await hmacSha256(secret, sessionId);
  return `${sessionId}.${toBase64Url(sig)}`;
}

/**
 * Extract session_id from cookie value.
 * - Signed: verifies HMAC with AUTH_SECRET
 * - Legacy unsigned UUID: accepted (migration window)
 */
export async function parseSessionCookieValue(
  value: string,
  secret: string | undefined,
): Promise<string | null> {
  if (!value) return null;
  const dot = value.indexOf('.');
  if (dot === -1) {
    // Legacy opaque session id (UUID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return value;
    }
    return null;
  }
  if (!secret) return null;
  const sessionId = value.slice(0, dot);
  const provided = value.slice(dot + 1);
  if (!sessionId || !provided) return null;
  const expected = toBase64Url(await hmacSha256(secret, sessionId));
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (!constantTimeEqual(a, b)) return null;
  return sessionId;
}

// ============================================================
// MFA TOTP — per RFC §2.2
// ============================================================

export function generateTotpSecret(): string {
  const bytes = getCrypto().getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

export function buildTotpUri(secret: string, email: string): string {
  const issuer = 'Nguyen AI';
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ============================================================
// Role → Permission mapping — per RFC §4.2
// ============================================================

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  PUBLIC: [],
  USER: ['machine:read', 'memory:read', 'memory:write', 'vault:upload', 'vault:download'],
  MEMBER: ['machine:read', 'memory:read', 'memory:write', 'vault:upload', 'vault:download'],
  STUDENT: ['academy:learn', 'academy:submit', 'cert:request'],
  FOUNDER: ['machine:read', 'machine:operate', 'memory:read', 'memory:write', 'vault:upload', 'vault:download'],
  BUSINESS_MEMBER: ['machine:read', 'machine:operate', 'memory:read', 'memory:write', 'vault:upload', 'vault:download'],
  CHAPTER_MEMBER: ['machine:read', 'memory:read', 'vault:download'],
  INVESTOR_APPLICANT: ['invest:request'],
  QUALIFIED_INVESTOR: ['invest:private-read', 'invest:download'],
  DATA_ROOM_MEMBER: ['invest:private-read', 'invest:financial-read', 'invest:download'],
  REVIEWER: ['academy:review', 'machine:read'],
  OPERATOR: ['machine:read', 'machine:operate', 'memory:read', 'memory:write', 'vault:upload', 'vault:download'],
  ADMIN: ['admin:user-manage', 'admin:billing-manage', 'admin:audit-read', 'machine:read'],
  SUPER_ADMIN: [
    'admin:user-manage', 'admin:access-revoke', 'admin:billing-manage', 'admin:audit-read',
    'cert:revoke', 'machine:read', 'machine:operate',
  ],
};

export function getPermissionsForRoles(roles: Role[]): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      set.add(perm);
    }
  }
  return [...set];
}

export function hasPermission(session: Session, permission: Permission): boolean {
  return session.permissions.includes(permission);
}

export function hasRole(session: Session, role: Role): boolean {
  return session.roles.includes(role);
}

// ============================================================
// Helpers — encoding
// ============================================================

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  return result === 0;
}
