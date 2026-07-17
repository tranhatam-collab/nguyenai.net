/**
 * webhook-replay.ts — Replay protection for payment webhooks.
 *
 * Per JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md:
 * - Webhooks must be idempotent: same event processed only once
 * - Track event_id (or gateway_payment_id fallback) for 72 hours
 * - Duplicate events return cached result, don't re-process
 *
 * Storage: in-memory Map (dev/test) — production should use KV with 72h TTL.
 */

const REPLAY_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

interface ProcessedEvent {
  event_key: string;
  result: 'processed' | 'ignored';
  processed_at: number;
  expires_at: number;
  response_body: unknown;
}

// In-memory cache — keyed by `${gateway}:${event_id}`
const processedEvents = new Map<string, ProcessedEvent>();

/**
 * Check if an event has already been processed.
 * Returns the cached response if found, or null if new.
 */
export function checkReplay(
  gateway: string,
  eventId: string,
): ProcessedEvent | null {
  const key = buildKey(gateway, eventId);
  const cached = processedEvents.get(key);
  if (!cached) return null;
  if (cached.expires_at <= Date.now()) {
    processedEvents.delete(key);
    return null;
  }
  return cached;
}

/**
 * Record a processed event for replay protection.
 */
export function recordProcessed(
  gateway: string,
  eventId: string,
  result: 'processed' | 'ignored',
  response_body: unknown,
): void {
  const key = buildKey(gateway, eventId);
  const now = Date.now();
  processedEvents.set(key, {
    event_key: key,
    result,
    processed_at: now,
    expires_at: now + REPLAY_TTL_MS,
    response_body,
  });
}

/**
 * Build a deterministic cache key.
 */
function buildKey(gateway: string, eventId: string): string {
  return `${gateway}:${eventId}`;
}

/**
 * Clear cache (for testing).
 */
export function clearReplayCache(): void {
  processedEvents.clear();
}

/**
 * Get cache size (for monitoring/testing).
 */
export function getReplayCacheSize(): number {
  return processedEvents.size;
}
