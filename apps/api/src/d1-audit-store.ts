/**
 * D1-backed audit store for API Worker.
 * Implements @nai/audit AuditStore interface using Cloudflare D1.
 * Self-contained — does not depend on auth Worker's db.ts.
 */

import type { AuditEvent, AuditQuery, AuditStore } from '@nai/audit';

export class D1AuditStore implements AuditStore {
  constructor(private db: D1Database) {}

  async log(event: AuditEvent): Promise<string> {
    const event_id = event.event_id ?? crypto.randomUUID();
    const timestamp = event.timestamp ?? new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO audit_log (event_id, timestamp, user_id, session_id, event_type, actor_ip, user_agent, target, result, metadata)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    ).bind(
      event_id,
      timestamp,
      event.user_id,
      event.session_id,
      event.event_type,
      event.actor_ip,
      event.user_agent,
      event.target,
      event.result,
      JSON.stringify(event.metadata ?? {}),
    ).run();
    return event_id;
  }

  async query(q: AuditQuery): Promise<AuditEvent[]> {
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params: unknown[] = [];
    if (q.user_id) { sql += ` AND user_id = ?${params.length + 1}`; params.push(q.user_id); }
    if (q.event_type) { sql += ` AND event_type = ?${params.length + 1}`; params.push(q.event_type); }
    if (q.result) { sql += ` AND result = ?${params.length + 1}`; params.push(q.result); }
    sql += ' ORDER BY timestamp DESC';
    const limit = q.limit ?? 100;
    sql += ` LIMIT ?${params.length + 1}`;
    params.push(limit);
    const stmt = this.db.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await bound.all();
    return (result.results ?? []).map((r) => ({
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
