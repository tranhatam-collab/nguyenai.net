/**
 * D1-backed audit store — implements @nai/audit AuditStore interface
 * using Cloudflare D1 (SQLite) as storage.
 */

import type { AuditEvent, AuditQuery, AuditStore } from '@nai/audit';
import { insertAuditLog, queryAuditLogD1 } from './db';

export class D1AuditStore implements AuditStore {
  constructor(private db: D1Database) {}

  async log(event: AuditEvent): Promise<string> {
    const event_id = event.event_id ?? crypto.randomUUID();
    await insertAuditLog(this.db, {
      event_id,
      user_id: event.user_id,
      session_id: event.session_id,
      event_type: event.event_type,
      actor_ip: event.actor_ip,
      user_agent: event.user_agent,
      target: event.target,
      result: event.result,
      metadata: JSON.stringify(event.metadata ?? {}),
    });
    return event_id;
  }

  async query(q: AuditQuery): Promise<AuditEvent[]> {
    const rows = await queryAuditLogD1(this.db, {
      user_id: q.user_id,
      event_type: q.event_type,
      result: q.result,
      limit: q.limit,
    });
    return rows.map((r) => ({
      event_id: r.event_id as string,
      timestamp: r.timestamp as string,
      user_id: (r.user_id as string) ?? null,
      session_id: (r.session_id as string) ?? null,
      event_type: r.event_type as AuditEvent['event_type'],
      actor_ip: (r.actor_ip as string) ?? null,
      user_agent: (r.user_agent as string) ?? null,
      target: (r.target as string) ?? null,
      result: r.result as AuditEvent['result'],
      metadata: JSON.parse((r.metadata as string) ?? '{}'),
    }));
  }

  async count(q: AuditQuery): Promise<number> {
    const events = await this.query(q);
    return events.length;
  }
}
