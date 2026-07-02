/**
 * @nai/approval — Sensitive action approval workflow.
 *
 * Per IDENTITY_AND_TENANCY_RFC.md §4 and DEV plan Phase 2 task 2.7:
 * - request → notify → approve/deny → audit
 * - Sensitive actions require human approval before execution
 * - All approval decisions are audited
 */

import { logAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'executed';

export interface ApprovalRequest {
  approval_id?: string;
  user_id: string;
  tenant_id: string;
  action: string;
  resource: string;
  status: ApprovalStatus;
  requested_by: string;
  approved_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  requested_at?: string;
  decided_at: string | null;
  expires_at: string | null;
  executed_at: string | null;
}

export interface ApprovalStore {
  create(req: Omit<ApprovalRequest, 'approval_id' | 'requested_at' | 'decided_at' | 'approved_by' | 'executed_at' | 'status'> & { status?: ApprovalStatus }): Promise<string>;
  get(approvalId: string): Promise<ApprovalRequest | null>;
  listPending(userId: string, tenantId: string): Promise<ApprovalRequest[]>;
  listForUser(userId: string): Promise<ApprovalRequest[]>;
  updateStatus(approvalId: string, status: ApprovalStatus, approvedBy: string, reason?: string): Promise<void>;
  markExecuted(approvalId: string): Promise<void>;
}

// ============================================================
// In-memory store
// ============================================================

export class InMemoryApprovalStore implements ApprovalStore {
  private requests = new Map<string, ApprovalRequest>();

  async create(req: Omit<ApprovalRequest, 'approval_id' | 'requested_at' | 'decided_at' | 'approved_by' | 'executed_at' | 'status'> & { status?: ApprovalStatus }): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.requests.set(id, {
      ...req,
      approval_id: id,
      status: req.status ?? 'pending',
      requested_at: now,
      decided_at: null,
      approved_by: null,
      executed_at: null,
    });
    return id;
  }

  async get(approvalId: string): Promise<ApprovalRequest | null> {
    return this.requests.get(approvalId) ?? null;
  }

  async listPending(userId: string, tenantId: string): Promise<ApprovalRequest[]> {
    return [...this.requests.values()].filter(
      (r) => r.tenant_id === tenantId && r.status === 'pending'
    );
  }

  async listForUser(userId: string): Promise<ApprovalRequest[]> {
    return [...this.requests.values()].filter((r) => r.user_id === userId);
  }

  async updateStatus(approvalId: string, status: ApprovalStatus, approvedBy: string, reason?: string): Promise<void> {
    const req = this.requests.get(approvalId);
    if (!req) throw new Error(`Approval ${approvalId} not found`);
    this.requests.set(approvalId, {
      ...req,
      status,
      approved_by: approvedBy,
      decided_at: new Date().toISOString(),
      reason: reason ?? req.reason,
    });
  }

  async markExecuted(approvalId: string): Promise<void> {
    const req = this.requests.get(approvalId);
    if (!req) throw new Error(`Approval ${approvalId} not found`);
    this.requests.set(approvalId, {
      ...req,
      status: 'executed',
      executed_at: new Date().toISOString(),
    });
  }
}

// ============================================================
// Default store + convenience
// ============================================================

let defaultStore: ApprovalStore = new InMemoryApprovalStore();

export function setApprovalStore(store: ApprovalStore) {
  defaultStore = store;
}

export function getApprovalStore(): ApprovalStore {
  return defaultStore;
}

// ============================================================
// Approval workflow — request → notify → approve/deny → audit
// ============================================================

export interface RequestApprovalParams {
  user_id: string;
  tenant_id: string;
  action: string;
  resource: string;
  requested_by: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string | null;
}

export async function requestApproval(params: RequestApprovalParams): Promise<string> {
  const approvalId = await defaultStore.create({
    user_id: params.user_id,
    tenant_id: params.tenant_id,
    action: params.action,
    resource: params.resource,
    requested_by: params.requested_by,
    reason: params.reason ?? null,
    metadata: params.metadata ?? {},
    expires_at: params.expires_at ?? null,
  });

  await logAuditEvent({
    user_id: params.requested_by,
    session_id: null,
    event_type: 'approval_requested',
    actor_ip: null,
    user_agent: null,
    target: approvalId,
    result: 'success',
    metadata: { action: params.action, resource: params.resource },
  });

  // Notify approvers via email (best-effort, non-blocking)
  try {
    const { createEmailService } = await import('@nai/email');
    const emailService = createEmailService({ ENVIRONMENT: 'development' });
    await emailService.sendTemplate('approval_requested', {
      locale: 'vi',
      user_email: 'approver@nguyenai.net',
      action: params.action,
      requested_by: params.user_id,
      request_id: approvalId,
    });
  } catch {
    // Email failure should not block approval flow
  }
  return approvalId;
}

export async function approveRequest(
  approvalId: string,
  approvedBy: string,
  approverTenantId: string,
  reason?: string,
): Promise<void> {
  const req = await defaultStore.get(approvalId);
  if (!req) throw new Error(`Approval ${approvalId} not found`);
  if (req.status !== 'pending') throw new Error(`Approval ${approvalId} is not pending (status: ${req.status})`);
  // P0 IDOR fix: approver must be in the same tenant as the request
  if (req.tenant_id !== approverTenantId) {
    throw new Error(`Approval ${approvalId} does not belong to your tenant`);
  }

  await defaultStore.updateStatus(approvalId, 'approved', approvedBy, reason);

  await logAuditEvent({
    user_id: approvedBy,
    session_id: null,
    event_type: 'approval_granted',
    actor_ip: null,
    user_agent: null,
    target: approvalId,
    result: 'success',
    metadata: { action: req.action, resource: req.resource, reason },
  });
}

export async function denyRequest(
  approvalId: string,
  deniedBy: string,
  denierTenantId: string,
  reason?: string,
): Promise<void> {
  const req = await defaultStore.get(approvalId);
  if (!req) throw new Error(`Approval ${approvalId} not found`);
  if (req.status !== 'pending') throw new Error(`Approval ${approvalId} is not pending (status: ${req.status})`);
  // P0 IDOR fix: denier must be in the same tenant as the request
  if (req.tenant_id !== denierTenantId) {
    throw new Error(`Approval ${approvalId} does not belong to your tenant`);
  }

  await defaultStore.updateStatus(approvalId, 'denied', deniedBy, reason);

  await logAuditEvent({
    user_id: deniedBy,
    session_id: null,
    event_type: 'approval_denied',
    actor_ip: null,
    user_agent: null,
    target: approvalId,
    result: 'success',
    metadata: { action: req.action, resource: req.resource, reason },
  });
}

export async function markExecuted(approvalId: string): Promise<void> {
  const req = await defaultStore.get(approvalId);
  if (!req) throw new Error(`Approval ${approvalId} not found`);
  if (req.status !== 'approved') throw new Error(`Approval ${approvalId} must be approved before execution (status: ${req.status})`);

  await defaultStore.markExecuted(approvalId);

  await logAuditEvent({
    user_id: req.requested_by,
    session_id: null,
    event_type: 'sensitive_action_executed',
    actor_ip: null,
    user_agent: null,
    target: approvalId,
    result: 'success',
    metadata: { action: req.action, resource: req.resource },
  });
}

export async function checkApprovalStatus(approvalId: string): Promise<ApprovalStatus> {
  const req = await defaultStore.get(approvalId);
  if (!req) throw new Error(`Approval ${approvalId} not found`);
  return req.status;
}

export async function listPendingApprovals(userId: string, tenantId: string): Promise<ApprovalRequest[]> {
  return defaultStore.listPending(userId, tenantId);
}
