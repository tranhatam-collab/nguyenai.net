/**
 * webhook-replay.ts — Replay protection for payment webhooks.
 *
 * Per JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md:
 * - Webhooks must be idempotent: same event processed only once
 * - Track event_id (or gateway_payment_id fallback) for 72 hours
 * - Duplicate events return cached result, don't re-process
 *
 * Storage: D1 (production) with 72h TTL. Falls back to in-memory Map for tests.
 */

const REPLAY_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

interface ProcessedEvent {
  event_key: string;
  result: 'processed' | 'ignored';
  processed_at: number;
  expires_at: number;
  response_body: unknown;
}

// In-memory cache (dev/test fallback) — keyed by `${gateway}:${event_id}`
const processedEvents = new Map<string, ProcessedEvent>();

export interface ReplayStore {
  checkReplay(gateway: string, eventId: string): Promise<ProcessedEvent | null>;
  recordProcessed(gateway: string, eventId: string, result: 'processed' | 'ignored', responseBody: unknown): Promise<void>;
  clearReplayCache(): Promise<void>;
  getReplayCacheSize(): Promise<number>;
}

// ============================================================
// In-memory replay store (dev/test)
// ============================================================

class InMemoryReplayStore implements ReplayStore {
  async checkReplay(gateway: string, eventId: string): Promise<ProcessedEvent | null> {
    const key = buildKey(gateway, eventId);
    const cached = processedEvents.get(key);
    if (!cached) return null;
    if (cached.expires_at <= Date.now()) {
      processedEvents.delete(key);
      return null;
    }
    return cached;
  }

  async recordProcessed(gateway: string, eventId: string, result: 'processed' | 'ignored', responseBody: unknown): Promise<void> {
    const key = buildKey(gateway, eventId);
    const now = Date.now();
    processedEvents.set(key, {
      event_key: key,
      result,
      processed_at: now,
      expires_at: now + REPLAY_TTL_MS,
      response_body: responseBody,
    });
  }

  async clearReplayCache(): Promise<void> {
    processedEvents.clear();
  }

  async getReplayCacheSize(): Promise<number> {
    return processedEvents.size;
  }
}

// ============================================================
// D1-backed replay store (production)
// ============================================================

class D1ReplayStore implements ReplayStore {
  constructor(private db: D1Database) {}

  async checkReplay(gateway: string, eventId: string): Promise<ProcessedEvent | null> {
    const key = buildKey(gateway, eventId);
    const now = Date.now();
    const expiresAt = new Date(now).toISOString();
    const row = await this.db.prepare(
      'SELECT event_key, result, processed_at, expires_at, response_body FROM webhook_replay WHERE event_key = ? AND expires_at > ?'
    ).bind(key, expiresAt).first<{
      event_key: string;
      result: string;
      processed_at: string;
      expires_at: string;
      response_body: string | null;
    }>();
    if (!row) return null;
    let responseBody: unknown = null;
    try { responseBody = row.response_body ? JSON.parse(row.response_body) : null; } catch { /* ignore */ }
    return {
      event_key: row.event_key,
      result: row.result as 'processed' | 'ignored',
      processed_at: new Date(row.processed_at).getTime(),
      expires_at: new Date(row.expires_at).getTime(),
      response_body: responseBody,
    };
  }

  async recordProcessed(gateway: string, eventId: string, result: 'processed' | 'ignored', responseBody: unknown): Promise<void> {
    const key = buildKey(gateway, eventId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + REPLAY_TTL_MS);
    await this.db.prepare(
      'INSERT OR REPLACE INTO webhook_replay (event_key, gateway, event_id, result, response_body, processed_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      key, gateway, eventId, result,
      JSON.stringify(responseBody),
      now.toISOString(), expiresAt.toISOString(),
    ).run();
  }

  async clearReplayCache(): Promise<void> {
    await this.db.prepare('DELETE FROM webhook_replay WHERE expires_at <= ?').bind(new Date().toISOString()).run();
  }

  async getReplayCacheSize(): Promise<number> {
    const row = await this.db.prepare('SELECT COUNT(*) as count FROM webhook_replay WHERE expires_at > ?').bind(new Date().toISOString()).first<{ count: number }>();
    return row?.count ?? 0;
  }
}

// ============================================================
// Store singleton
// ============================================================

let replayStore: ReplayStore = new InMemoryReplayStore();

/** Set the replay store (e.g. D1-backed for production). */
export function setReplayStore(store: ReplayStore): void {
  replayStore = store;
}

/** Create a D1-backed replay store. */
export function createD1ReplayStore(db: D1Database): ReplayStore {
  return new D1ReplayStore(db);
}

/**
 * Check if an event has already been processed.
 * Returns the cached response if found, or null if new.
 */
export async function checkReplay(gateway: string, eventId: string): Promise<ProcessedEvent | null> {
  return replayStore.checkReplay(gateway, eventId);
}

/**
 * Record a processed event for replay protection.
 */
export async function recordProcessed(gateway: string, eventId: string, result: 'processed' | 'ignored', responseBody: unknown): Promise<void> {
  return replayStore.recordProcessed(gateway, eventId, result, responseBody);
}

/**
 * Build a deterministic cache key.
 */
function buildKey(gateway: string, eventId: string): string {
  return `${gateway}:${eventId}`;
}

/**
 * Clear expired entries (for maintenance/testing).
 */
export async function clearReplayCache(): Promise<void> {
  return replayStore.clearReplayCache();
}

/**
 * Get cache size (for monitoring/testing).
 */
export async function getReplayCacheSize(): Promise<number> {
  return replayStore.getReplayCacheSize();
}
