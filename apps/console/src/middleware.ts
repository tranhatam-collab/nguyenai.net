/**
 * middleware.ts — Auth check placeholder
 *
 * If the route is not /login and no session token is present,
 * redirect to /login. Uses Astro middleware pattern.
 *
 * TODO: Replace placeholder session check with real auth logic
 * (e.g. verify JWT from cookie, check Cloudflare Access token, etc.)
 */

import { defineMiddleware } from 'astro:middleware';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

export const onRequest = defineMiddleware((context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return next();
  }

  // Placeholder: check for session token in cookies
  // In production, this should verify a real JWT or session token
  const sessionToken = context.cookies.get('nguyenai_session')?.value;

  if (!sessionToken) {
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect', pathname);
    return redirect(loginUrl.pathname + loginUrl.search, 302);
  }

  // TODO: Validate the session token here
  // For now, just proceed to the next middleware/handler
  return next();
});
