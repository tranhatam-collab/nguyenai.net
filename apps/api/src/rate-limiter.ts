/**
 * Simple in-memory rate limiter for scholarship API.
 *
 * For production: replace with Cloudflare KV or Durable Objects
 * for distributed rate limiting across worker instances.
 *
 * Limits:
 * - Default: 60 req/min per IP
 * - Form submit: 5 req/min per user (stricter)
 * - Auth-sensitive: 10 req/min per IP
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn?: (c: { req: { header: (n: string) => string | undefined } }) => string;
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max, keyFn } = opts;

  return async (c: any, next: any) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const key = keyFn ? keyFn(c) : `ip:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          error: 'Rate limit exceeded',
          retry_after: retryAfter,
          limit: max,
          window_ms: windowMs,
        },
        429,
      );
    }

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    await next();
  };
}

// Pre-configured limiters
export const defaultRateLimit = rateLimit({ windowMs: 60_000, max: 60 });
export const formSubmitRateLimit = rateLimit({ windowMs: 60_000, max: 5 });
export const authRateLimit = rateLimit({ windowMs: 60_000, max: 10 });

// Cleanup old buckets periodically (every 5 minutes)
let lastCleanup = Date.now();
export function cleanupBuckets(): void {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}
