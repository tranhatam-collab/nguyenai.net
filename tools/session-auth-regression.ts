import assert from 'node:assert/strict';
import {
  sessionHasAnyRole,
  sessionHasScholarshipRole,
  sessionIsAdmin,
  type ApiSession,
} from '../apps/api/src/session-auth.ts';

function session(roles: ApiSession['roles']): ApiSession {
  return {
    session_id: 'sess-1',
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    plan_id: 'nguyen-start',
    audience: 'user',
    issuer: 'auth.nguyenai.net',
    roles,
    permissions: [],
    device: null,
    ip_address: null,
    user_agent: null,
    csrf_token: 'csrf',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    rotated_at: null,
    revoked_at: null,
  };
}

assert.equal(sessionIsAdmin(session(['USER'])), false);
assert.equal(sessionIsAdmin(session(['ADMIN'])), true);
assert.equal(sessionHasAnyRole(session(['SUPER_ADMIN']), ['SUPER_ADMIN']), true);
assert.equal(
  sessionHasScholarshipRole(session(['QUALIFIED_INVESTOR']), ['investor']),
  true,
);
assert.equal(
  sessionHasScholarshipRole(session(['ADMIN']), ['admin', 'super_admin']),
  true,
);
assert.equal(
  sessionHasScholarshipRole(session(['USER']), ['admin', 'super_admin']),
  false,
);

console.log('session-auth regression checks passed');
