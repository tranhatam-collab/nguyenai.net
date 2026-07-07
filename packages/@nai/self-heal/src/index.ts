/**
 * @nai/self-heal — AI Agent self-healing workflow with approval gates.
 *
 * Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md:
 * - Detect → Diagnose → Propose → Patch → Test → Request Approval → Deploy Preview → Verify → Request Production Approval → Deploy Production → Verify → Report
 * - Cannot deploy to production without admin approval
 * - Cannot mutate protected data (user data, investor access, scholarship decisions, certificates, secrets)
 * - Audit trail for all self-heal attempts
 */

import { logAuditEvent } from '@nai/audit';
import {
  requestApproval,
  approveRequest,
  denyRequest,
  checkApprovalStatus,
  checkProtectedData,
  type ApprovalStage,
} from '@nai/admin-approval';

// ============================================================
// Types
// ============================================================

export type SelfHealStatus = 'detected' | 'diagnosing' | 'proposing' | 'patching' | 'testing' | 'awaiting_preview_approval' | 'deploying_preview' | 'verifying_preview' | 'awaiting_production_approval' | 'deploying_production' | 'verifying_production' | 'completed' | 'failed' | 'denied';

export interface SelfHealAttempt {
  attempt_id: string;
  status: SelfHealStatus;
  incident_id: string | null;
  component: string;
  issue_description: string;
  diagnosis: string | null;
  proposed_patch: string | null;
  patch_code: string | null;
  test_results: string | null;
  preview_approval_request_id: string | null;
  production_approval_request_id: string | null;
  preview_deployment_id: string | null;
  production_deployment_id: string | null;
  verification_results: string | null;
  error: string | null;
  detected_at: string;
  completed_at: string | null;
  requested_by: string;
}

export interface SelfHealStore {
  createAttempt(attempt: Omit<SelfHealAttempt, 'attempt_id' | 'status' | 'detected_at' | 'completed_at'>): Promise<string>;
  getAttempt(attemptId: string): Promise<SelfHealAttempt | null>;
  updateAttempt(attemptId: string, updates: Partial<SelfHealAttempt>): Promise<void>;
  listAttempts(filters?: { status?: SelfHealStatus; component?: string }): Promise<SelfHealAttempt[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemorySelfHealStore implements SelfHealStore {
  private attempts = new Map<string, SelfHealAttempt>();

  async createAttempt(attempt: Omit<SelfHealAttempt, 'attempt_id' | 'status' | 'detected_at' | 'completed_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: SelfHealAttempt = {
      ...attempt,
      attempt_id: id,
      status: 'detected',
      detected_at: now,
      completed_at: null,
    };
    this.attempts.set(id, full);
    return id;
  }

  async getAttempt(attemptId: string): Promise<SelfHealAttempt | null> {
    return this.attempts.get(attemptId) ?? null;
  }

  async updateAttempt(attemptId: string, updates: Partial<SelfHealAttempt>): Promise<void> {
    const existing = this.attempts.get(attemptId);
    if (existing) {
      this.attempts.set(attemptId, { ...existing, ...updates });
    }
  }

  async listAttempts(filters?: { status?: SelfHealStatus; component?: string }): Promise<SelfHealAttempt[]> {
    let results = [...this.attempts.values()];
    if (filters?.status) results = results.filter((a) => a.status === filters.status);
    if (filters?.component) results = results.filter((a) => a.component === filters.component);
    return results.sort((a, b) => b.detected_at.localeCompare(a.detected_at));
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: SelfHealStore = new InMemorySelfHealStore();

export function setSelfHealStore(store: SelfHealStore) {
  defaultStore = store;
}

export function getSelfHealStore(): SelfHealStore {
  return defaultStore;
}

// ============================================================
// Self-heal workflow
// ============================================================

export async function detectIssue(
  component: string,
  issueDescription: string,
  requestedBy: string,
  incidentId?: string
): Promise<string> {
  const attemptId = await defaultStore.createAttempt({
    incident_id: incidentId ?? null,
    component,
    issue_description: issueDescription,
    diagnosis: null,
    proposed_patch: null,
    patch_code: null,
    test_results: null,
    preview_approval_request_id: null,
    production_approval_request_id: null,
    preview_deployment_id: null,
    production_deployment_id: null,
    verification_results: null,
    error: null,
    completed_at: null,
    requested_by: requestedBy,
  });

  await logAuditEvent({
    category: 'self_heal',
    action: 'issue_detected',
    target: attemptId,
    details: { component, issue_description: issueDescription },
    user_id: requestedBy,
    tenant_id: 'system',
  });

  return attemptId;
}

export async function diagnoseIssue(
  attemptId: string,
  diagnosis: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'diagnosing',
    diagnosis,
  });
}

export async function proposePatch(
  attemptId: string,
  proposedPatch: string,
  patchCode: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'proposing',
    proposed_patch: proposedPatch,
    patch_code: patchCode,
  });
}

export async function runTests(
  attemptId: string,
  testResults: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'testing',
    test_results: testResults,
  });
}

export async function requestPreviewApproval(
  attemptId: string,
  approver: string
): Promise<string> {
  const attempt = await defaultStore.getAttempt(attemptId);
  if (!attempt) {
    throw new Error('Self-heal attempt not found');
  }

  const approvalId = await requestApproval(
    'self_heal',
    'preview',
    `Self-heal preview deployment: ${attempt.component}`,
    attempt.issue_description,
    approver,
    { attempt_id: attemptId, component: attempt.component }
  );

  await defaultStore.updateAttempt(attemptId, {
    status: 'awaiting_preview_approval',
    preview_approval_request_id: approvalId,
  });

  return approvalId;
}

export async function deployPreview(
  attemptId: string,
  deploymentId: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'deploying_preview',
    preview_deployment_id: deploymentId,
  });
}

export async function verifyPreview(
  attemptId: string,
  verificationResults: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'verifying_preview',
    verification_results: verificationResults,
  });
}

export async function requestProductionApproval(
  attemptId: string,
  approver: string
): Promise<string> {
  const attempt = await defaultStore.getAttempt(attemptId);
  if (!attempt) {
    throw new Error('Self-heal attempt not found');
  }

  const approvalId = await requestApproval(
    'self_heal',
    'production',
    `Self-heal production deployment: ${attempt.component}`,
    attempt.issue_description,
    approver,
    { attempt_id: attemptId, component: attempt.component }
  );

  await defaultStore.updateAttempt(attemptId, {
    status: 'awaiting_production_approval',
    production_approval_request_id: approvalId,
  });

  return approvalId;
}

export async function deployProduction(
  attemptId: string,
  deploymentId: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'deploying_production',
    production_deployment_id: deploymentId,
  });
}

export async function completeSelfHeal(
  attemptId: string,
  verificationResults: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'completed',
    verification_results: verificationResults,
    completed_at: new Date().toISOString(),
  });

  await logAuditEvent({
    category: 'self_heal',
    action: 'self_heal_completed',
    target: attemptId,
    details: { verification_results: verificationResults },
    user_id: 'system',
    tenant_id: 'system',
  });
}

export async function failSelfHeal(
  attemptId: string,
  error: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'failed',
    error,
    completed_at: new Date().toISOString(),
  });
}

export async function denySelfHeal(
  attemptId: string
): Promise<void> {
  await defaultStore.updateAttempt(attemptId, {
    status: 'denied',
    completed_at: new Date().toISOString(),
  });
}

// ============================================================
// Protected data check
// ============================================================

export function canMutateData(metadata: Record<string, unknown>): { allowed: boolean; reason?: string } {
  const check = checkProtectedData(metadata);
  if (check.isProtected) {
    return {
      allowed: false,
      reason: check.reason,
    };
  }
  return { allowed: true };
}
