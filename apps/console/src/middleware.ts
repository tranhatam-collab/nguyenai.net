/**
 * middleware.ts — Server-side auth gate for app.nguyenai.net (Console)
 *
 * Per IDENTITY_AND_TENANCY_RFC §2.4 (BINDING):
 * - "Cookie existence alone treated as authenticated — FORBIDDEN"
 * - Must validate session server-side via auth service
 *
 * Flow:
 * 1. Read nguyenai_session cookie
 * 2. Validate via GET /v1/session on auth.nguyenai.net
 * 3. If invalid → redirect to login
 * 4. If valid → attach session to locals, proceed
 *
 * Replaces previous placeholder that only checked cookie existence.
 */

import { defineMiddleware } from 'astro:middleware';

const AUTH_SERVICE_URL = 'https://auth.nguyenai.net';
const SESSION_COOKIE = 'nguyenai_session';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback'];

interface SessionResponse {
  user_id: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  expires_at: string;
  email?: string;
  name?: string;
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

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return next();
  }

  // Allow static assets
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/assets/') || pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/)) {
    return next();
  }

  // Read session cookie
  const sessionCookie = context.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect', pathname);
    return redirect(loginUrl.pathname + loginUrl.search, 302);
  }

  // Validate session server-side (NOT just cookie existence — per RFC §2.4)
  const session = await resolveSession(sessionCookie);
  if (!session) {
    // Clear invalid cookie + redirect to login
    context.cookies.delete(SESSION_COOKIE, { path: '/' });
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect', pathname);
    return redirect(loginUrl.pathname + loginUrl.search, 302);
  }

  // Attach validated session to locals for downstream handlers
  context.locals.session = session;
  return next();
});
