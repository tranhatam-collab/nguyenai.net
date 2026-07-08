/**
 * @nai/admin-approval — Admin approval workflow for sensitive operations.
 *
 * Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md:
 * - Approval requests require admin review
 * - Two-stage approval: preview → production
 * - Protected data mutations require explicit approval
 * - Audit trail for all approvals
 */

import { logAuditEvent, logGovernanceAuditEvent } from '@nai/audit';
import type { Role } from '@nai/auth';

// ============================================================
// Types
// ============================================================

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type ApprovalStage = 'preview' | 'production';
export type ApprovalCategory = 'self_heal' | 'secret_rotation' | 'data_mutation' | 'deployment' | 'other';

export interface ApprovalRequest {
  request_id: string;
  category: ApprovalCategory;
  stage: ApprovalStage;
  status: ApprovalStatus;
  title: string;
  description: string;
  requester: string;
  approver: string | null;
  requested_at: string;
  approved_at: string | null;
  denied_at: string | null;
  expires_at: string | null;
  reason: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  metadata: Record<string, unknown>;
}

export interface ApprovalStore {
  createRequest(request: Omit<ApprovalRequest, 'request_id' | 'status' | 'requested_at' | 'approved_at' | 'denied_at' | 'revoked_by' | 'revoked_at' | 'revocation_reason' | 'approver' | 'reason'>): Promise<string>;
  getRequest(requestId: string): Promise<ApprovalRequest | null>;
  updateRequest(requestId: string, updates: Partial<ApprovalRequest>): Promise<void>;
  listRequests(filters?: { category?: ApprovalCategory; status?: ApprovalStatus; stage?: ApprovalStage; requester?: string }): Promise<ApprovalRequest[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryApprovalStore implements ApprovalStore {
  private requests = new Map<string, ApprovalRequest>();

  async createRequest(request: Omit<ApprovalRequest, 'request_id' | 'status' | 'requested_at' | 'approved_at' | 'denied_at' | 'revoked_by' | 'revoked_at' | 'revocation_reason' | 'approver' | 'reason'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: ApprovalRequest = {
      ...request,
      request_id: id,
      status: 'pending',
      requested_at: now,
      approver: null,
      approved_at: null,
      denied_at: null,
      reason: null,
      revoked_by: null,
      revoked_at: null,
      revocation_reason: null,
    };
    this.requests.set(id, full);
    return id;
  }

  async getRequest(requestId: string): Promise<ApprovalRequest | null> {
    return this.requests.get(requestId) ?? null;
  }

  async updateRequest(requestId: string, updates: Partial<ApprovalRequest>): Promise<void> {
    const existing = this.requests.get(requestId);
    if (existing) {
      this.requests.set(requestId, { ...existing, ...updates });
    }
  }

  async listRequests(filters?: { category?: ApprovalCategory; status?: ApprovalStatus; stage?: ApprovalStage; requester?: string }): Promise<ApprovalRequest[]> {
    let results = Array.from(this.requests.values());
    if (filters?.category) results = results.filter((r) => r.category === filters.category);
    if (filters?.status) results = results.filter((r) => r.status === filters.status);
    if (filters?.stage) results = results.filter((r) => r.stage === filters.stage);
    if (filters?.requester) results = results.filter((r) => r.requester === filters.requester);
    return results.sort((a, b) => b.requested_at.localeCompare(a.requested_at));
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: ApprovalStore = new InMemoryApprovalStore();

export function setApprovalStore(store: ApprovalStore) {
  defaultStore = store;
}

export function getApprovalStore(): ApprovalStore {
  return defaultStore;
}

// ============================================================
// Approval workflow
// ============================================================

export async function requestApproval(
  category: ApprovalCategory,
  stage: ApprovalStage,
  title: string,
  description: string,
  requester: string,
  metadata: Record<string, unknown> = {},
  expiresAt?: string
): Promise<string> {
  const requestId = await defaultStore.createRequest({
    category,
    stage,
    title,
    description,
    requester,
    expires_at: expiresAt ?? null,
    metadata,
  });

  await logGovernanceAuditEvent({
    category: 'approval',
    action: 'approval_requested',
    target: requestId,
    details: { category, stage, title },
    user_id: requester,
    tenant_id: 'system',
  });

  return requestId;
}

export async function approveRequest(
  requestId: string,
  approver: string,
  reason: string,
  approverRoles?: Role[]
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Approval reason is required');
  }

  // Validate approver has required role
  if (approverRoles) {
    const validation = validateApprover(approverRoles);
    if (!validation.isValid) {
      throw new Error(`Approver validation failed: ${validation.reason}`);
    }
  }

  const request = await defaultStore.getRequest(requestId);
  if (!request) {
    throw new Error('Approval request not found');
  }
  if (request.status !== 'pending') {
    throw new Error(`Request is not pending (current status: ${request.status})`);
  }
  if (request.expires_at && new Date(request.expires_at) < new Date()) {
    throw new Error('Request has expired');
  }

  await defaultStore.updateRequest(requestId, {
    status: 'approved',
    approver,
    approved_at: new Date().toISOString(),
    reason,
  });

  await logGovernanceAuditEvent({
    category: 'approval',
    action: 'approval_granted',
    target: requestId,
    details: { category: request.category, stage: request.stage, reason, approver_roles: approverRoles },
    user_id: approver,
    tenant_id: 'system',
  });
}

export async function denyRequest(
  requestId: string,
  approver: string,
  reason: string,
  approverRoles?: Role[]
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Denial reason is required');
  }

  // Validate approver has required role
  if (approverRoles) {
    const validation = validateApprover(approverRoles);
    if (!validation.isValid) {
      throw new Error(`Approver validation failed: ${validation.reason}`);
    }
  }

  const request = await defaultStore.getRequest(requestId);
  if (!request) {
    throw new Error('Approval request not found');
  }
  if (request.status !== 'pending') {
    throw new Error(`Request is not pending (current status: ${request.status})`);
  }

  await defaultStore.updateRequest(requestId, {
    status: 'denied',
    approver,
    denied_at: new Date().toISOString(),
    reason,
  });

  await logGovernanceAuditEvent({
    category: 'approval',
    action: 'approval_denied',
    target: requestId,
    details: { category: request.category, stage: request.stage, reason, approver_roles: approverRoles },
    user_id: approver,
    tenant_id: 'system',
  });
}

export async function checkApprovalStatus(requestId: string): Promise<ApprovalStatus> {
  const request = await defaultStore.getRequest(requestId);
  if (!request) {
    throw new Error('Approval request not found');
  }
  return request.status;
}

export async function listPendingApprovals(category?: ApprovalCategory, stage?: ApprovalStage): Promise<ApprovalRequest[]> {
  return defaultStore.listRequests({ status: 'pending', category, stage });
}

// ============================================================
// Protected data check
// ============================================================

export interface ProtectedDataCheck {
  isProtected: boolean;
  reason?: string;
}

export function checkProtectedData(metadata: Record<string, unknown>): ProtectedDataCheck {
  const { operation, target_type } = metadata;

  // Per policy: user data, investor access, scholarship decisions, certificates, secrets are protected
  if (operation === 'delete' || operation === 'mutation') {
    if (target_type === 'user_data' || target_type === 'investor_access' || target_type === 'scholarship_decision' || target_type === 'certificate' || target_type === 'secret') {
      return {
        isProtected: true,
        reason: `Protected data type: ${target_type}`,
      };
    }
  }

  return { isProtected: false };
}

// ============================================================
// Approval revocation
// ============================================================

export async function revokeApproval(
  requestId: string,
  revokedBy: string,
  reason: string
): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Revocation reason is required');
  }

  const request = await defaultStore.getRequest(requestId);
  if (!request) {
    throw new Error('Approval request not found');
  }

  if (request.status === 'pending') {
    throw new Error('Cannot revoke pending request (use deny instead)');
  }

  // Revert to pending status
  await defaultStore.updateRequest(requestId, {
    status: 'pending',
    approver: null,
    approved_at: null,
    denied_at: null,
    reason: `Revoked: ${reason}`,
    revoked_by: revokedBy,
    revoked_at: new Date().toISOString(),
    revocation_reason: reason,
  });

  await logGovernanceAuditEvent({
    category: 'approval',
    action: 'approval_revoked',
    target: requestId,
    details: { previous_status: request.status, reason },
    user_id: revokedBy,
    tenant_id: 'system',
  });
}

// ============================================================
// Approver role validation
// ============================================================

export interface ApproverValidation {
  isValid: boolean;
  reason?: string;
}

let approverRoles: Role[] = ['ADMIN', 'SUPER_ADMIN'];

export function setApproverRoles(roles: Role[]): void {
  approverRoles = roles;
}

export function getApproverRoles(): Role[] {
  return approverRoles;
}

export function validateApprover(userRoles: Role[]): ApproverValidation {
  if (!userRoles || userRoles.length === 0) {
    return { isValid: false, reason: 'User has no roles' };
  }

  const hasApproverRole = userRoles.some(role => approverRoles.includes(role));
  if (!hasApproverRole) {
    return { isValid: false, reason: `User does not have approver role. Required: ${approverRoles.join(', ')}, Has: ${userRoles.join(', ')}` };
  }

  return { isValid: true };
}
