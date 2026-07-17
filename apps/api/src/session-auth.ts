/**
 * Shared session authorization helpers for API route modules.
 * Session shape uses `roles: Role[]` from @nai/auth — not a singular `role` field.
 */

import type { Context } from 'hono';
import type { Role, Session } from '@nai/auth';

export type ApiSession = Session;

export function getApiSession(c: Context): ApiSession | null {
  return (c.get('session') as ApiSession | undefined) ?? null;
}

export function sessionHasAnyRole(session: ApiSession, roles: readonly string[]): boolean {
  const wanted = new Set(roles.map((role) => role.toUpperCase()));
  return session.roles.some((role) => wanted.has(role.toUpperCase()));
}

export function sessionIsAdmin(session: ApiSession): boolean {
  return sessionHasAnyRole(session, ['ADMIN', 'SUPER_ADMIN']);
}

export function requireAuthSession(
  c: Context,
): ApiSession | Response {
  const session = getApiSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return session;
}

export function requireAdminSession(
  c: Context,
): ApiSession | Response {
  const session = requireAuthSession(c);
  if (session instanceof Response) return session;
  if (!sessionIsAdmin(session)) {
    return c.json({ error: 'Forbidden: admin only' }, 403);
  }
  return session;
}

/**
 * P0-AUTHZ: Require admin role AND that the session's tenant matches the requested tenant.
 * Prevents cross-tenant admin access — admin of tenant A cannot access tenant B's data.
 */
export function requireAdminForTenant(
  c: Context,
  tenantId: string,
): ApiSession | Response {
  const session = requireAdminSession(c);
  if (session instanceof Response) return session;
  if (session.tenant_id !== tenantId) {
    return c.json({ error: 'Forbidden: admin role does not apply to this tenant' }, 403);
  }
  return session;
}

/**
 * P0-AUTHZ: Require that the session's tenant matches the requested tenant.
 * Used for non-admin tenant-scoped resources.
 */
export function requireTenantMatch(
  c: Context,
  tenantId: string,
): ApiSession | Response {
  const session = requireAuthSession(c);
  if (session instanceof Response) return session;
  if (session.tenant_id !== tenantId) {
    return c.json({ error: 'Forbidden: cross-tenant access denied' }, 403);
  }
  return session;
}

/** Scholarship/investor modules use legacy lowercase role aliases in route guards. */
const SCHOLARSHIP_ROLE_ALIASES: Record<string, readonly Role[]> = {
  investor: ['QUALIFIED_INVESTOR', 'DATA_ROOM_MEMBER', 'INVESTOR_APPLICANT'],
  council_member: ['REVIEWER', 'ADMIN', 'SUPER_ADMIN'],
  council_observer: ['REVIEWER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'],
  auditor: ['REVIEWER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'],
  founder_liaison: ['FOUNDER', 'ADMIN', 'SUPER_ADMIN'],
  admin: ['ADMIN', 'SUPER_ADMIN'],
  super_admin: ['SUPER_ADMIN'],
};

export function sessionHasScholarshipRole(
  session: ApiSession,
  allowedRoles: readonly string[],
): boolean {
  for (const allowed of allowedRoles) {
    const aliases = SCHOLARSHIP_ROLE_ALIASES[allowed.toLowerCase()];
    if (aliases && sessionHasAnyRole(session, aliases)) {
      return true;
    }
    if (sessionHasAnyRole(session, [allowed])) {
      return true;
    }
  }
  return false;
}
