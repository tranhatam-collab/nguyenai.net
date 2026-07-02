/**
 * @nai/audit — Append-only audit log for Nguyen AI ecosystem.
 *
 * Per IDENTITY_AND_TENANCY_RFC.md §8:
 * - Every identity event must be written to an immutable audit store
 * - Audit logs are append-only (no UPDATE or DELETE)
 * - Retained per DATA_CLASSIFICATION_AND_RETENTION.md
 *
 * Storage: Postgres (queryable index) + R2 (immutable archive).
 * The Postgres table has triggers that prevent UPDATE/DELETE (see migrations/001).
 */

// ============================================================
// Types — per RFC §8
// ============================================================

export type AuditEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_revoked'
  | 'passkey_registered'
  | 'mfa_enrolled'
  | 'role_changed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'org_member_added'
  | 'org_member_removed'
  | 'account_deletion_requested'
  | 'access_denied'
  | 'entitlement_granted'
  | 'entitlement_revoked'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied'
  | 'sensitive_action_executed';

export type AuditResult = 'success' | 'failure' | 'denied';

export interface AuditEvent {
  event_id?: string;
  timestamp?: string;
  user_id: string | null;
  session_id: string | null;
  event_type: AuditEventType;
  actor_ip: string | null;
  user_agent: string | null;
  target: string | null;
  result: AuditResult;
  metadata: Record<string, unknown>;
}

export interface AuditQuery {
  user_id?: string;
  event_type?: AuditEventType;
  result?: AuditResult;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

// ============================================================
// Storage interface — allows Postgres, D1, or mock implementations
// ============================================================

export interface AuditStore {
  log(event: AuditEvent): Promise<string>;
  query(q: AuditQuery): Promise<AuditEvent[]>;
  count(q: AuditQuery): Promise<number>;
}

// ============================================================
// In-memory store — for testing and local dev
// ============================================================

export class InMemoryAuditStore implements AuditStore {
  private events: AuditEvent[] = [];

  async log(event: AuditEvent): Promise<string> {
    const event_id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const stored: AuditEvent = { ...event, event_id, timestamp };
    this.events.push(stored);
    return event_id;
  }

  async query(q: AuditQuery): Promise<AuditEvent[]> {
    let results = [...this.events];
    if (q.user_id) results = results.filter((e) => e.user_id === q.user_id);
    if (q.event_type) results = results.filter((e) => e.event_type === q.event_type);
    if (q.result) results = results.filter((e) => e.result === q.result);
    if (q.start_time) results = results.filter((e) => (e.timestamp ?? '') >= q.start_time!);
    if (q.end_time) results = results.filter((e) => (e.timestamp ?? '') <= q.end_time!);
    results.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));
    const offset = q.offset ?? 0;
    const limit = q.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  async count(q: AuditQuery): Promise<number> {
    const results = await this.query(q);
    return results.length;
  }

  /** Test helper — verify append-only by checking no entries were modified */
  getRawEvents(): readonly AuditEvent[] {
    return this.events;
  }
}

// ============================================================
// Postgres store — see ./postgres.ts (Node.js only, not for Workers)
// ============================================================

// ============================================================
// Convenience functions — work with any store
// ============================================================

let defaultStore: AuditStore = new InMemoryAuditStore();

export function setAuditStore(store: AuditStore) {
  defaultStore = store;
}

export function getAuditStore(): AuditStore {
  return defaultStore;
}

export async function logAuditEvent(event: AuditEvent): Promise<string> {
  return defaultStore.log(event);
}

export async function queryAuditLog(q: AuditQuery): Promise<AuditEvent[]> {
  return defaultStore.query(q);
}

export async function countAuditEvents(q: AuditQuery): Promise<number> {
  return defaultStore.count(q);
}

// ============================================================
// Convenience helpers for common events
// ============================================================

export async function logLoginSuccess(userId: string, sessionId: string, ip: string | null, userAgent: string | null): Promise<string> {
  return logAuditEvent({
    user_id: userId,
    session_id: sessionId,
    event_type: 'login_success',
    actor_ip: ip,
    user_agent: userAgent,
    target: null,
    result: 'success',
    metadata: {},
  });
}

export async function logLoginFailure(email: string, ip: string | null, userAgent: string | null): Promise<string> {
  return logAuditEvent({
    user_id: null,
    session_id: null,
    event_type: 'login_failure',
    actor_ip: ip,
    user_agent: userAgent,
    target: email,
    result: 'failure',
    metadata: {},
  });
}

export async function logLogout(userId: string, sessionId: string): Promise<string> {
  return logAuditEvent({
    user_id: userId,
    session_id: sessionId,
    event_type: 'logout',
    actor_ip: null,
    user_agent: null,
    target: null,
    result: 'success',
    metadata: {},
  });
}

export async function logAccessDenied(userId: string | null, sessionId: string | null, target: string, reason: string): Promise<string> {
  return logAuditEvent({
    user_id: userId,
    session_id: sessionId,
    event_type: 'access_denied',
    actor_ip: null,
    user_agent: null,
    target,
    result: 'denied',
    metadata: { reason },
  });
}

export async function logSessionRevoked(userId: string, sessionId: string, revokedBy: string): Promise<string> {
  return logAuditEvent({
    user_id: userId,
    session_id: sessionId,
    event_type: 'session_revoked',
    actor_ip: null,
    user_agent: null,
    target: sessionId,
    result: 'success',
    metadata: { revoked_by: revokedBy },
  });
}
