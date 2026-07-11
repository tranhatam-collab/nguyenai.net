/**
 * D1-backed entitlement store for API Worker.
 * Tables: entitlements, usage_events (migrations/d1/0001_identity_access.sql)
 */

import type { EntitlementRecord, EntitlementStore, UsageState } from '@nai/entitlement';

export class D1EntitlementStore implements EntitlementStore {
  constructor(private db: D1Database) {}

  async getEntitlements(userId: string, tenantId: string): Promise<EntitlementRecord[]> {
    const result = await this.db.prepare(
      `SELECT * FROM entitlements
       WHERE user_id = ?1 AND tenant_id = ?2 AND revoked_at IS NULL
       ORDER BY granted_at DESC`,
    ).bind(userId, tenantId).all();

    return (result.results ?? []).map((r) => ({
      entitlement_id: r.entitlement_id as string,
      user_id: r.user_id as string,
      tenant_id: r.tenant_id as string,
      key: r.key as string,
      value: JSON.parse((r.value as string) ?? 'null'),
      source: r.source as string,
      granted_by: r.granted_by as string,
      granted_at: r.granted_at as string,
      expires_at: (r.expires_at as string) ?? null,
      revoked_at: (r.revoked_at as string) ?? null,
    }));
  }

  async grant(record: Omit<EntitlementRecord, 'entitlement_id' | 'granted_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const grantedAt = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO entitlements
       (entitlement_id, user_id, tenant_id, key, value, source, granted_by, granted_at, expires_at, revoked_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL)`,
    ).bind(
      id,
      record.user_id,
      record.tenant_id,
      record.key,
      JSON.stringify(record.value),
      record.source,
      record.granted_by,
      grantedAt,
      record.expires_at,
    ).run();
    return id;
  }

  async revoke(entitlementId: string, _revokedBy: string): Promise<void> {
    await this.db.prepare(
      `UPDATE entitlements SET revoked_at = ?1 WHERE entitlement_id = ?2 AND revoked_at IS NULL`,
    ).bind(new Date().toISOString(), entitlementId).run();
  }

  async getUsage(userId: string, tenantId: string): Promise<UsageState> {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1));

    const [commands, tokens, lessons, certs] = await Promise.all([
      this.sumUsage(userId, tenantId, 'command', dayStart.toISOString()),
      this.sumUsage(userId, tenantId, 'tokens', monthStart.toISOString()),
      this.sumUsage(userId, tenantId, 'lesson', monthStart.toISOString()),
      this.sumUsage(userId, tenantId, 'cert_attempt', monthStart.toISOString()),
    ]);

    return {
      commands_used_today: commands,
      tokens_used_this_month: tokens,
      lessons_completed_this_month: lessons,
      cert_attempts_this_month: certs,
    };
  }

  async recordUsage(
    userId: string,
    tenantId: string,
    type: 'command' | 'tokens' | 'lesson' | 'cert_attempt',
    amount: number,
  ): Promise<void> {
    await this.db.prepare(
      `INSERT INTO usage_events (usage_id, user_id, tenant_id, event_type, amount, metadata, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, '{}', ?6)`,
    ).bind(
      crypto.randomUUID(),
      userId,
      tenantId,
      type,
      amount,
      new Date().toISOString(),
    ).run();
  }

  private async sumUsage(
    userId: string,
    tenantId: string,
    eventType: string,
    sinceIso: string,
  ): Promise<number> {
    const row = await this.db.prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM usage_events
       WHERE user_id = ?1 AND tenant_id = ?2 AND event_type = ?3 AND created_at >= ?4`,
    ).bind(userId, tenantId, eventType, sinceIso).first<{ total: number }>();
    return Number(row?.total ?? 0);
  }
}
