/**
 * Astro middleware for @nai/auth — resolves session from cookie.
 *
 * Per RFC §11 integration checklist:
 * - Accept nguyenai_session cookie only as input to server-side session check
 * - Call GET /v1/session server-side on every protected request
 * - Enforce audience match
 * - Enforce role + permission checks server-side
 * - Never store session token in localStorage
 * - Log all access-denied events to audit store
 */

import type { APIContext } from 'astro';
import { SESSION_COOKIE_NAME, type Session, type Role, type Permission } from '../src/index';

export interface AuthResult {
  session: Session | null;
  redirect: Response | null;
}

/**
 * Resolve session from cookie by calling the API.
 * Returns null session if no cookie or invalid session.
 */
export async function resolveSession(ctx: APIContext): Promise<Session | null> {
  const cookie = ctx.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const apiBase = import.meta.env.API_BASE ?? 'http://localhost:8787';
  try {
    const res = await fetch(`${apiBase}/v1/session`, {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${cookie}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as Session;
  } catch {
    return null;
  }
}

/**
 * Require a valid session — redirect to auth.nguyenai.net if not authenticated.
 */
export async function requireSession(ctx: APIContext): Promise<Session> {
  const session = await resolveSession(ctx);
  if (!session || session.revoked_at) {
    const redirectUrl = `https://auth.nguyenai.net/auth?redirect=${encodeURIComponent(ctx.url.href)}`;
    throw ctx.redirect(redirectUrl, 302);
  }
  return session;
}

/**
 * Require a specific role — 403 if session lacks it.
 */
export async function requireRole(ctx: APIContext, role: Role): Promise<Session> {
  const session = await requireSession(ctx);
  if (!session.roles.includes(role)) {
    throw new Response('Forbidden: missing role ' + role, { status: 403 });
  }
  return session;
}

/**
 * Require a specific permission — 403 if session lacks it.
 */
export async function requirePermission(ctx: APIContext, permission: Permission): Promise<Session> {
  const session = await requireSession(ctx);
  if (!session.permissions.includes(permission)) {
    throw new Response('Forbidden: missing permission ' + permission, { status: 403 });
  }
  return session;
}

/**
 * Require audience match — reject sessions issued for a different app.
 */
export async function requireAudience(ctx: APIContext, audience: string): Promise<Session> {
  const session = await requireSession(ctx);
  if (session.audience !== audience) {
    throw new Response('Forbidden: audience mismatch', { status: 403 });
  }
  return session;
}
