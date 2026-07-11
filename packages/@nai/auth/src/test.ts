/**
 * @nai/auth — unit tests for crypto helpers (no DB needed).
 * Run via `pnpm --filter @nai/auth test`.
 */

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
  signSessionCookieValue,
  parseSessionCookieValue,
  getPermissionsForRoles,
  hasPermission,
  hasRole,
  SESSION_COOKIE_NAME,
  type Role,
  type Permission,
} from './index.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

async function testPasswordHashing() {
  console.log('Test: password hashing');
  const hash = await hashPassword('testPassword123');
  assert(hash.startsWith('pbkdf2:100000:'), 'hash format correct with 100K iterations (Workers cap)');
  const valid = await verifyPassword('testPassword123', hash);
  assert(valid === true, 'correct password verifies');
  const invalid = await verifyPassword('wrongPassword', hash);
  assert(invalid === false, 'wrong password fails');
  // Different passwords produce different hashes
  const hash2 = await hashPassword('testPassword123');
  assert(hash !== hash2, 'same password produces different hashes (salt)');
}

function testTokenGeneration() {
  console.log('Test: token generation');
  const sessionId = generateSessionId();
  assert(sessionId.length > 30, 'session id is sufficiently long');
  const csrf = generateCsrfToken();
  assert(csrf.length > 40, 'csrf token is sufficiently long');
  const apiKey = generateApiKeyValue();
  assert(apiKey.startsWith('nai_'), 'api key has nai_ prefix');
  assert(apiKey.length > 40, 'api key is sufficiently long');
  const totpSecret = generateTotpSecret();
  assert(totpSecret.length >= 32, 'totp secret is sufficiently long');
  const uri = buildTotpUri(totpSecret, 'test@nguyenai.net');
  assert(uri.startsWith('otpauth://totp/'), 'totp uri format correct');
  assert(uri.includes('Nguyen%20AI'), 'totp uri includes issuer');
}

async function testApiKeyHashing() {
  console.log('Test: api key hashing');
  const key = generateApiKeyValue();
  const hash = await hashApiKey(key);
  assert(hash.length > 40, 'api key hash is sufficiently long');
  const hash2 = await hashApiKey(key);
  assert(hash === hash2, 'same key produces same hash (deterministic)');
}

function testCookieBuilding() {
  console.log('Test: cookie building');
  const cookie = buildCookieHeader(SESSION_COOKIE_NAME, 'test-session-id');
  assert(cookie.includes('nguyenai_session=test-session-id'), 'cookie has correct name and value');
  assert(cookie.includes('HttpOnly'), 'cookie is HttpOnly');
  assert(cookie.includes('Secure'), 'cookie is Secure');
  assert(cookie.includes('SameSite=Lax'), 'cookie is SameSite=Lax');
  assert(cookie.includes('Domain=.nguyenai.net'), 'cookie has correct domain');
  assert(cookie.includes('Max-Age=3600'), 'cookie has correct max age');

  const adminCookie = buildCookieHeader(SESSION_COOKIE_NAME, 'test', { sameSite: 'Strict' });
  assert(adminCookie.includes('SameSite=Strict'), 'admin cookie is SameSite=Strict');

  const clearCookie = buildClearCookieHeader(SESSION_COOKIE_NAME);
  assert(clearCookie.includes('Max-Age=0'), 'clear cookie has Max-Age=0');
}

async function testSessionCookieSigning() {
  console.log('Test: session cookie signing (AUTH_SECRET)');
  const secret = 'test-auth-secret-not-for-production-use-32b';
  const sid = generateSessionId();
  const signed = await signSessionCookieValue(sid, secret);
  assert(signed.startsWith(`${sid}.`), 'signed value starts with session id');
  const parsed = await parseSessionCookieValue(signed, secret);
  assert(parsed === sid, 'parse recovers session id');
  const bad = await parseSessionCookieValue(`${sid}.deadbeef`, secret);
  assert(bad === null, 'tampered signature rejected');
  const legacy = await parseSessionCookieValue(sid, secret);
  assert(legacy === sid, 'legacy unsigned UUID accepted during migration');
}

function testRolePermissions() {
  console.log('Test: role → permission mapping');
  const userPerms = getPermissionsForRoles(['USER']);
  assert(userPerms.includes('machine:read'), 'USER has machine:read');
  assert(userPerms.includes('memory:read'), 'USER has memory:read');

  const adminPerms = getPermissionsForRoles(['ADMIN']);
  assert(adminPerms.includes('admin:user-manage'), 'ADMIN has admin:user-manage');
  assert(!adminPerms.includes('admin:access-revoke'), 'ADMIN does not have admin:access-revoke');

  const superAdminPerms = getPermissionsForRoles(['SUPER_ADMIN']);
  assert(superAdminPerms.includes('admin:access-revoke'), 'SUPER_ADMIN has admin:access-revoke');
  assert(superAdminPerms.includes('cert:revoke'), 'SUPER_ADMIN has cert:revoke');

  const studentPerms = getPermissionsForRoles(['STUDENT']);
  assert(studentPerms.includes('academy:learn'), 'STUDENT has academy:learn');
  assert(studentPerms.includes('academy:submit'), 'STUDENT has academy:submit');

  const combined = getPermissionsForRoles(['USER', 'STUDENT']);
  assert(combined.includes('machine:read'), 'combined USER+STUDENT has machine:read');
  assert(combined.includes('academy:learn'), 'combined USER+STUDENT has academy:learn');
}

function testSessionChecks() {
  console.log('Test: session permission/role checks');
  const session = {
    session_id: 'test',
    user_id: 'test',
    tenant_id: 'test',
    plan_id: 'nguyen-start',
    audience: 'app.nguyenai.net',
    issuer: 'auth.nguyenai.net',
    roles: ['ADMIN' as Role],
    permissions: ['admin:user-manage' as Permission, 'admin:audit-read' as Permission],
    device: null,
    ip_address: null,
    user_agent: null,
    csrf_token: 'test',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    rotated_at: null,
    revoked_at: null,
  };

  assert(hasRole(session, 'ADMIN') === true, 'session has ADMIN role');
  assert(hasRole(session, 'SUPER_ADMIN') === false, 'session does not have SUPER_ADMIN role');
  assert(hasPermission(session, 'admin:user-manage') === true, 'session has admin:user-manage');
  assert(hasPermission(session, 'admin:access-revoke') === false, 'session does not have admin:access-revoke');
}

async function main() {
  console.log('=== @nai/auth unit tests ===\n');
  await testPasswordHashing();
  testTokenGeneration();
  await testApiKeyHashing();
  testCookieBuilding();
  await testSessionCookieSigning();
  testRolePermissions();
  testSessionChecks();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
