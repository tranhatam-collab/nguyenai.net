/**
 * idempotency.ts — Idempotency middleware for write endpoints.
 *
 * Per ENTITLEMENT_API_RFC §5 (BINDING):
 * - All write endpoints accept idempotency_key (UUID v4 or deterministic hash)
 * - Server stores (idempotency_key, response) for 24 hours
 * - Duplicate request with same key returns cached response
 * - Without idempotency_key, write endpoints return 400
 *
 * Excluded from idempotency requirement:
 * - GET endpoints (read-only)
 * - /health, /v1/session, /v1/logout (no side effects or single-use by design)
 * - /v1/auth/* (auth flows have their own token-based idempotency)
 * - /v1/payment/webhook/* (webhook has signature-based idempotency)
 * - /v1/gen1/* (proxied to Gen1, idempotency handled there)
 *
 * Storage: in-memory Map (dev/test) — production should use KV with 24h TTL.
 */

import type { Context } from 'hono';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedResponse {
  body: unknown;
  status: number;
  headers: Record<string, string>;
  expires_at: number;
}

// In-memory cache — keyed by `${method}:${userId}:${idempotencyKey}`
const cache = new Map<string, CachedResponse>();

// Routes exempt from idempotency requirement
const EXEMPT_PATTERNS = [
  /^GET$/i,
  /^HEAD$/i,
  /^OPTIONS$/i,
  /\/health$/,
  /\/v1\/session$/,
  /\/v1\/logout$/,
  /\/v1\/auth\//, // auth flows use token-based idempotency
  /\/v1\/payment\/webhook\//, // webhooks use signature-based idempotency
  /\/v1\/payment\/vnpay\/return$/, // VNPay return is GET-like redirect
  /\/v1\/gen1\//, // proxied to Gen1
  /\/v1\/audit(\/|$)/, // audit reads + audit writes are append-only (idempotent by nature)
  /\/v1\/investor-interest$/, // public form — rate limited instead
];

function isExempt(method: string, path: string): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return true;
  return EXEMPT_PATTERNS.some((p) => p.test(path));
}

function buildCacheKey(c: Context, idempotencyKey: string): string {
  const session = c.get('session') as { user_id?: string; session_id?: string } | null;
  const userId = session?.user_id ?? 'anonymous';
  const serviceKey = c.req.header('X-Service-Key') ?? '';
  const actor = userId || serviceKey || 'anonymous';
  return `${c.req.method}:${actor}:${idempotencyKey}`;
}

/**
 * Extract idempotency_key from request — checks body, then header.
 */
function extractIdempotencyKey(c: Context, body: unknown): string | null {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (typeof obj.idempotency_key === 'string' && obj.idempotency_key.length > 0) {
      return obj.idempotency_key;
    }
  }
  const header = c.req.header('Idempotency-Key') ?? c.req.header('X-Idempotency-Key');
  return header ?? null;
}

/**
 * Idempotency middleware — apply to all write routes.
 * Returns 400 if idempotency_key missing (per RFC §5).
 * Returns cached response on duplicate key.
 */
export async function idempotencyMiddleware(c: Context, next: () => Promise<void>): Promise<Response | void> {
  const method = c.req.method;
  const path = c.req.path;

  // Skip exempt routes
  if (isExempt(method, path)) {
    await next();
    return;
  }

  // Parse body once — store on context for downstream handlers to reuse
  let body: unknown = null;
  try {
    const cloned = c.req.raw.clone();
    const text = await cloned.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    // Not JSON — that's fine, idempotency_key may be in header
  }

  const idempotencyKey = extractIdempotencyKey(c, body);

  if (!idempotencyKey) {
    return c.json(
      {
        error: 'idempotency_key required for write endpoints (per ENTITLEMENT_API_RFC §5)',
        hint: 'Send idempotency_key in request body or Idempotency-Key header. Use UUID v4 or deterministic hash.',
      },
      400 as any
    );
  }

  // Check cache for duplicate
  const cacheKey = buildCacheKey(c, idempotencyKey);
  const cached = cache.get(cacheKey);
  if (cached && cached.expires_at > Date.now()) {
    // Return cached response
    const headers = new Headers();
    for (const [k, v] of Object.entries(cached.headers)) {
      headers.set(k, v);
    }
    headers.set('X-Idempotent-Replay', 'true');
    return new Response(JSON.stringify(cached.body), {
      status: cached.status,
      headers,
    });
  }
  if (cached) cache.delete(cacheKey); // expired

  // Stash body + key on context for downstream handlers
  (c as any).parsedBody = body;
  (c as any).idempotencyKey = idempotencyKey;

  await next();

  // Cache the response (only successful 2xx + 409 conflicts — don't cache 4xx errors except 409)
  const status = c.res.status;
  if ((status >= 200 && status < 300) || status === 409) {
    // Capture response body for caching
    try {
      const cloned = c.res.clone();
      const respBody = await cloned.json();
      const headers: Record<string, string> = {};
      c.res.headers.forEach((v, k) => {
        headers[k] = v;
      });
      cache.set(cacheKey, {
        body: respBody,
        status,
        headers,
        expires_at: Date.now() + IDEMPOTENCY_TTL_MS,
      });
    } catch {
      // Non-JSON response — skip caching
    }
  }
}

/**
 * Helper for handlers to read the pre-parsed body (avoid double-read).
 */
export function getParsedBody<T = unknown>(c: Context): T | null {
  return ((c as any).parsedBody as T) ?? null;
}

/**
 * Helper for handlers to read the idempotency key.
 */
export function getIdempotencyKey(c: Context): string | null {
  return (c as any).idempotencyKey as string | null;
}

/**
 * Clear cache (for testing).
 */
export function clearIdempotencyCache(): void {
  cache.clear();
}
