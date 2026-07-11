/**
 * D1-backed approval store for API Worker.
 * Table: approvals (migrations/d1/0001_identity_access.sql)
 */

import type { ApprovalRequest, ApprovalStatus, ApprovalStore } from '@nai/approval';

export class D1ApprovalStore implements ApprovalStore {
  constructor(private db: D1Database) {}

  async create(
    req: Omit<ApprovalRequest, 'approval_id' | 'requested_at' | 'decided_at' | 'approved_by' | 'executed_at' | 'status'> & {
      status?: ApprovalStatus;
    },
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      `INSERT INTO approvals
       (approval_id, user_id, tenant_id, action, resource, status, requested_by, approved_by, reason, metadata, requested_at, decided_at, expires_at, executed_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, ?8, ?9, ?10, NULL, ?11, NULL)`,
    ).bind(
      id,
      req.user_id,
      req.tenant_id,
      req.action,
      req.resource,
      req.status ?? 'pending',
      req.requested_by,
      req.reason ?? null,
      JSON.stringify(req.metadata ?? {}),
      now,
      req.expires_at ?? null,
    ).run();
    return id;
  }

  async get(approvalId: string): Promise<ApprovalRequest | null> {
    const r = await this.db.prepare(
      `SELECT * FROM approvals WHERE approval_id = ?1`,
    ).bind(approvalId).first();
    if (!r) return null;
    return this.mapRow(r);
  }

  async listPending(userId: string, tenantId: string): Promise<ApprovalRequest[]> {
    const result = await this.db.prepare(
      `SELECT * FROM approvals WHERE tenant_id = ?1 AND status = 'pending' ORDER BY requested_at DESC`,
    ).bind(tenantId).all();
    return (result.results ?? []).map((r) => this.mapRow(r));
  }

  async listForUser(userId: string): Promise<ApprovalRequest[]> {
    const result = await this.db.prepare(
      `SELECT * FROM approvals WHERE user_id = ?1 ORDER BY requested_at DESC`,
    ).bind(userId).all();
    return (result.results ?? []).map((r) => this.mapRow(r));
  }

  async updateStatus(
    approvalId: string,
    status: ApprovalStatus,
    approvedBy: string,
    reason?: string,
  ): Promise<void> {
    await this.db.prepare(
      `UPDATE approvals
       SET status = ?1, approved_by = ?2, decided_at = ?3, reason = COALESCE(?4, reason)
       WHERE approval_id = ?5`,
    ).bind(status, approvedBy, new Date().toISOString(), reason ?? null, approvalId).run();
  }

  async markExecuted(approvalId: string): Promise<void> {
    await this.db.prepare(
      `UPDATE approvals SET status = 'executed', executed_at = ?1 WHERE approval_id = ?2`,
    ).bind(new Date().toISOString(), approvalId).run();
  }

  private mapRow(r: Record<string, unknown>): ApprovalRequest {
    return {
      approval_id: r.approval_id as string,
      user_id: r.user_id as string,
      tenant_id: r.tenant_id as string,
      action: r.action as string,
      resource: r.resource as string,
      status: r.status as ApprovalStatus,
      requested_by: r.requested_by as string,
      approved_by: (r.approved_by as string) ?? null,
      reason: (r.reason as string) ?? null,
      metadata: JSON.parse((r.metadata as string) ?? '{}'),
      requested_at: r.requested_at as string,
      decided_at: (r.decided_at as string) ?? null,
      expires_at: (r.expires_at as string) ?? null,
      executed_at: (r.executed_at as string) ?? null,
    };
  }
}
