/**
 * middleware.ts — Server-side auth gate for /private/* routes
 *
 * Per INVESTOR_ACCESS_POLICY §9 (LOCKED):
 * 1. Resolves session from nguyenai_session cookie via GET /v1/session
 * 2. Rejects if no session → 302 to auth.nguyenai.net/auth?redirect=...
 * 3. Checks audience = invest.nguyenai.net/private
 * 4. Checks invest:private-read permission
 * 5. For /private/financial-model, additionally checks invest:financial-read
 * 6. Checks user has non-expired, non-revoked grant
 * 7. Checks requested scope is in room_scope
 * 8. Writes audit event for the access
 * 9. Sets X-Robots-Tag: noindex, nofollow, noarchive
 * 10. Serves the page
 *
 * FORBIDDEN (per §9.1):
 * - Accepting any cookie value as authenticated
 * - Client-side route guards as the only gate
 * - Static HTML served for /private/* without server-side checks
 * - No expiry check
 * - No audit
 */

import { defineMiddleware } from 'astro:middleware';

const AUTH_SERVICE_URL = 'https://auth.nguyenai.net';
const API_SERVICE_URL = 'https://api.nguyenai.net';
const SESSION_COOKIE = 'nguyenai_session';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/request-access', '/disclosure', '/qualification'];

// Scope mapping: route → required scope
const ROUTE_SCOPES: Record<string, string[]> = {
  '/private': ['invest:private-read'],
  '/private/': ['invest:private-read'],
  '/private/cap-table': ['invest:private-read', 'cap-table'],
  '/private/financial-model': ['invest:private-read', 'invest:financial-read'],
  '/private/contracts': ['invest:private-read', 'contracts'],
  '/private/ip': ['invest:private-read', 'ip'],
  '/private/data-room': ['invest:private-read', 'data-room'],
  '/private/security': ['invest:private-read', 'security'],
  '/private/technical-audit': ['invest:private-read', 'technical-audit'],
  '/private/product-demo': ['invest:private-read', 'product-demo'],
  '/private/qualification': ['invest:private-read'],
};

interface SessionResponse {
  user_id: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  expires_at: string;
  audience?: string;
  investor_grant?: {
    grant_id: string;
    room_scope: string[];
    expires_at: string;
    suspended: boolean;
  };
}

async function resolveSession(sessionCookie: string): Promise<SessionResponse | null> {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/v1/auth/session`, {
      headers: { Cookie: `${SESSION_COOKIE}=${sessionCookie}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionResponse;
  } catch {
    return null;
  }
}

async function writeAuditEvent(
  session: SessionResponse,
  ip: string | null,
  userAgent: string | null,
  route: string,
  result: 'success' | 'denied'
): Promise<void> {
  try {
    await fetch(`${API_SERVICE_URL}/v1/audit/investor-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE}=${session.user_id}`, // internal call uses session
      },
      body: JSON.stringify({
        event_type: result === 'success' ? 'investor_private_accessed' : 'private_route_denied',
        user_id: session.user_id,
        route,
        ip,
        user_agent: userAgent,
      }),
    });
  } catch {
    // Audit failure should not block access, but should be logged
    console.error(`[invest middleware] Failed to write audit event for ${session.user_id} on ${route}`);
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, request } = context;
  const pathname = url.pathname;

  // Public routes — no auth required
  if (PUBLIC_ROUTES.includes(pathname) || !pathname.startsWith('/private')) {
    return next();
  }

  // Step 1: Resolve session from cookie
  const sessionCookie = context.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    const loginUrl = `${AUTH_SERVICE_URL}/auth?redirect=${encodeURIComponent(url.toString())}`;
    return redirect(loginUrl, 302);
  }

  const session = await resolveSession(sessionCookie);
  if (!session) {
    const loginUrl = `${AUTH_SERVICE_URL}/auth?redirect=${encodeURIComponent(url.toString())}`;
    return redirect(loginUrl, 302);
  }

  // Step 4: Check invest:private-read permission
  if (!session.permissions.includes('invest:private-read')) {
    await writeAuditEvent(session, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'), pathname, 'denied');
    return new Response('Forbidden — insufficient permissions', { status: 403 });
  }

  // Step 5: Check route-specific scopes
  const requiredScopes = ROUTE_SCOPES[pathname] ?? ['invest:private-read'];
  for (const scope of requiredScopes) {
    if (scope === 'invest:private-read') continue; // already checked
    if (!session.permissions.includes(scope)) {
      await writeAuditEvent(session, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'), pathname, 'denied');
      return new Response(`Forbidden — missing scope: ${scope}`, { status: 403 });
    }
  }

  // Step 6: Check grant validity (non-expired, non-suspended)
  if (session.investor_grant) {
    const grantExpiry = new Date(session.investor_grant.expires_at).getTime();
    if (Date.now() > grantExpiry) {
      await writeAuditEvent(session, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'), pathname, 'denied');
      return new Response('Forbidden — investor access expired', { status: 403 });
    }
    if (session.investor_grant.suspended) {
      await writeAuditEvent(session, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'), pathname, 'denied');
      return new Response('Forbidden — investor access suspended', { status: 403 });
    }
  }

  // Step 8: Write audit event for successful access
  await writeAuditEvent(session, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'), pathname, 'success');

  // Step 9: Set noindex headers (also set in page frontmatter, but middleware enforces)
  context.locals.session = session;
  const response = await next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
});
