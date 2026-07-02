/**
 * Postgres audit store — Node.js only, NOT for Cloudflare Workers.
 *
 * Import this from Node.js scripts (migrations, CLI tools, server-side admin).
 * Do NOT import from Workers code — use InMemoryAuditStore or a D1/R2 store instead.
 */

import type { AuditEvent, AuditQuery, AuditStore } from './index.ts';

export interface PostgresAuditStoreConfig {
  connectionString: string;
}

export class PostgresAuditStore implements AuditStore {
  constructor(private config: PostgresAuditStoreConfig) {}

  private async getClient() {
    const { Client } = await import('pg');
    return new Client({ connectionString: this.config.connectionString });
  }

  async log(event: AuditEvent): Promise<string> {
    const client = await this.getClient();
    try {
      await client.connect();
      const event_id = crypto.randomUUID();
      await client.query(
        `INSERT INTO audit_log (event_id, user_id, session_id, event_type, actor_ip, user_agent, target, result, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          event_id,
          event.user_id,
          event.session_id,
          event.event_type,
          event.actor_ip,
          event.user_agent,
          event.target,
          event.result,
          JSON.stringify(event.metadata),
        ]
      );
      return event_id;
    } finally {
      await client.end();
    }
  }

  async query(q: AuditQuery): Promise<AuditEvent[]> {
    const client = await this.getClient();
    try {
      await client.connect();
      const conditions: string[] = [];
      const params: unknown[] = [];
      let idx = 1;
      if (q.user_id) { conditions.push(`user_id = $${idx++}`); params.push(q.user_id); }
      if (q.event_type) { conditions.push(`event_type = $${idx++}`); params.push(q.event_type); }
      if (q.result) { conditions.push(`result = $${idx++}`); params.push(q.result); }
      if (q.start_time) { conditions.push(`timestamp >= $${idx++}`); params.push(q.start_time); }
      if (q.end_time) { conditions.push(`timestamp <= $${idx++}`); params.push(q.end_time); }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = q.limit ?? 100;
      const offset = q.offset ?? 0;
      params.push(limit, offset);
      const res = await client.query(
        `SELECT * FROM audit_log ${where} ORDER BY timestamp DESC LIMIT $${idx++} OFFSET $${idx++}`,
        params
      );
      return res.rows as AuditEvent[];
    } finally {
      await client.end();
    }
  }

  async count(q: AuditQuery): Promise<number> {
    const client = await this.getClient();
    try {
      await client.connect();
      const conditions: string[] = [];
      const params: unknown[] = [];
      let idx = 1;
      if (q.user_id) { conditions.push(`user_id = $${idx++}`); params.push(q.user_id); }
      if (q.event_type) { conditions.push(`event_type = $${idx++}`); params.push(q.event_type); }
      if (q.result) { conditions.push(`result = $${idx++}`); params.push(q.result); }
      if (q.start_time) { conditions.push(`timestamp >= $${idx++}`); params.push(q.start_time); }
      if (q.end_time) { conditions.push(`timestamp <= $${idx++}`); params.push(q.end_time); }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await client.query(`SELECT COUNT(*) FROM audit_log ${where}`, params);
      return parseInt(res.rows[0].count, 10);
    } finally {
      await client.end();
    }
  }
}
