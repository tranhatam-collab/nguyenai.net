/**
 * @nai/fallback — Gen 1 / Gen 2 fallback management.
 *
 * Per FALLBACK_TO_GEN1_GEN2_POLICY.md:
 * - Fallback is off by default
 * - Gen 1 and Gen 2 are not called in normal operation
 * - F3/F4 fallback requires Admin approval
 * - Sensitive data fallback requires data classification, purpose, retention, audit and approval
 * - Fallback event cannot bypass model/output policy
 */

import { logAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

export type FallbackSeverity = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
export type FallbackTarget = 'gen1' | 'gen2';
export type FallbackStatus = 'pending' | 'approved' | 'denied' | 'executed' | 'failed';

export interface FallbackRequest {
  request_id: string;
  severity: FallbackSeverity;
  target: FallbackTarget;
  status: FallbackStatus;
  reason: string;
  component: string;
  data_classification: string;
  purpose: string;
  retention_period: string | null;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  error: string | null;
  created_at: string;
}

export interface FallbackStore {
  createRequest(request: Omit<FallbackRequest, 'request_id' | 'status' | 'created_at' | 'approved_at' | 'executed_at' | 'error'>): Promise<string>;
  getRequest(requestId: string): Promise<FallbackRequest | null>;
  updateRequest(requestId: string, updates: Partial<FallbackRequest>): Promise<void>;
  listRequests(filters?: { severity?: FallbackSeverity; target?: FallbackTarget; status?: FallbackStatus }): Promise<FallbackRequest[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryFallbackStore implements FallbackStore {
  private requests = new Map<string, FallbackRequest>();

  async createRequest(request: Omit<FallbackRequest, 'request_id' | 'status' | 'created_at' | 'approved_at' | 'executed_at' | 'error'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: FallbackRequest = {
      ...request,
      request_id: id,
      status: 'pending',
      created_at: now,
      approved_at: null,
      executed_at: null,
      error: null,
    };
    this.requests.set(id, full);
    return id;
  }

  async getRequest(requestId: string): Promise<FallbackRequest | null> {
    return this.requests.get(requestId) ?? null;
  }

  async updateRequest(requestId: string, updates: Partial<FallbackRequest>): Promise<void> {
    const existing = this.requests.get(requestId);
    if (existing) {
      this.requests.set(requestId, { ...existing, ...updates });
    }
  }

  async listRequests(filters?: { severity?: FallbackSeverity; target?: FallbackTarget; status?: FallbackStatus }): Promise<FallbackRequest[]> {
    let results = [...this.requests.values()];
    if (filters?.severity) results = results.filter((r) => r.severity === filters.severity);
    if (filters?.target) results = results.filter((r) => r.target === filters.target);
    if (filters?.status) results = results.filter((r) => r.status === filters.status);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: FallbackStore = new InMemoryFallbackStore();
let fallbackEnabled = false;

export function setFallbackStore(store: FallbackStore) {
  defaultStore = store;
}

export function getFallbackStore(): FallbackStore {
  return defaultStore;
}

export function setFallbackEnabled(enabled: boolean) {
  fallbackEnabled = enabled;
}

export function isFallbackEnabled(): boolean {
  return fallbackEnabled;
}

// ============================================================
// Fallback workflow
// ============================================================

export async function requestFallback(
  severity: FallbackSeverity,
  target: FallbackTarget,
  reason: string,
  component: string,
  dataClassification: string,
  purpose: string,
  retentionPeriod: string | null,
  requestedBy: string
): Promise<string> {
  // Check if fallback is enabled
  if (!fallbackEnabled) {
    throw new Error('Fallback is not enabled');
  }

  // F3/F4 requires approval
  if (severity === 'F3' || severity === 'F4') {
    // Will remain in pending status until approved
  }

  const requestId = await defaultStore.createRequest({
    severity,
    target,
    reason,
    component,
    data_classification: dataClassification,
    purpose,
    retention_period: retentionPeriod,
    requested_by: requestedBy,
    approved_by: null,
  });

  await logAuditEvent({
    category: 'fallback',
    action: 'fallback_requested',
    target: requestId,
    details: { severity, target, reason, component, data_classification: dataClassification },
    user_id: requestedBy,
    tenant_id: 'system',
  });

  return requestId;
}

export async function approveFallback(
  requestId: string,
  approvedBy: string
): Promise<void> {
  const request = await defaultStore.getRequest(requestId);
  if (!request) {
    throw new Error('Fallback request not found');
  }
  if (request.status !== 'pending') {
    throw new Error(`Request is not pending (current status: ${request.status})`);
  }

  await defaultStore.updateRequest(requestId, {
    status: 'approved',
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
  });

  await logAuditEvent({
    category: 'fallback',
    action: 'fallback_approved',
    target: requestId,
    details: { severity: request.severity, target: request.target },
    user_id: approvedBy,
    tenant_id: 'system',
  });
}

export async function denyFallback(
  requestId: string,
  approvedBy: string
): Promise<void> {
  const request = await defaultStore.getRequest(requestId);
  if (!request) {
    throw new Error('Fallback request not found');
  }

  await defaultStore.updateRequest(requestId, {
    status: 'denied',
    approved_by: approvedBy,
  });

  await logAuditEvent({
    category: 'fallback',
    action: 'fallback_denied',
    target: requestId,
    details: { severity: request.severity, target: request.target },
    user_id: approvedBy,
    tenant_id: 'system',
  });
}

export async function executeFallback(
  requestId: string
): Promise<void> {
  const request = await defaultStore.getRequest(requestId);
  if (!request) {
    throw new Error('Fallback request not found');
  }
  if (request.status !== 'approved') {
    throw new Error(`Request is not approved (current status: ${request.status})`);
  }

  await defaultStore.updateRequest(requestId, {
    status: 'executed',
    executed_at: new Date().toISOString(),
  });

  await logAuditEvent({
    category: 'fallback',
    action: 'fallback_executed',
    target: requestId,
    details: { target: request.target, component: request.component },
    user_id: 'system',
    tenant_id: 'system',
  });
}

export async function failFallback(
  requestId: string,
  error: string
): Promise<void> {
  await defaultStore.updateRequest(requestId, {
    status: 'failed',
    error,
    executed_at: new Date().toISOString(),
  });
}

export async function listPendingFallbacks(): Promise<FallbackRequest[]> {
  return defaultStore.listRequests({ status: 'pending' });
}

// ============================================================
// Sensitive data check
// ============================================================

export function isSensitiveData(dataClassification: string): boolean {
  return ['confidential', 'restricted', 'secret'].includes(dataClassification);
}

export function requiresFallbackApproval(severity: FallbackSeverity): boolean {
  return severity === 'F3' || severity === 'F4';
}
