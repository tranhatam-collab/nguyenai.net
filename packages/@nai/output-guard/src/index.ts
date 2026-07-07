/**
 * @nai/output-guard — Output guard for model responses.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md:
 * - Every model output must pass identity, language, safety, privacy, approval, and evidence policy
 * - Output guard runs after model generation, before returning to user
 * - Can block, modify, or allow output based on policy checks
 */

import { logAuditEvent } from '@nai/audit';
import {
  checkAllPolicies,
  type Language,
  type DataClassification,
  type PolicyCheckContext,
} from '@nai/model-policy';

// ============================================================
// Types
// ============================================================

export type OutputGuardAction = 'allow' | 'block' | 'modify' | 'require_approval';

export interface OutputGuardResult {
  action: OutputGuardAction;
  original_output: string;
  modified_output?: string;
  reason?: string;
  policy_checks: {
    identity: { passed: boolean; reason?: string };
    language: { passed: boolean; reason?: string };
    safety: { passed: boolean; reason?: string };
    data_classification: { passed: boolean; reason?: string };
  };
}

export interface OutputGuardStore {
  recordGuardResult(result: {
    guard_id: string;
    user_id: string;
    tenant_id: string;
    invocation_id: string;
    action: OutputGuardAction;
    reason?: string;
    created_at: string;
  }): Promise<void>;
  listGuardResults(filters?: { user_id?: string; action?: OutputGuardAction }): Promise<any[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryOutputGuardStore implements OutputGuardStore {
  private results: any[] = [];

  async recordGuardResult(result: any): Promise<void> {
    this.results.push(result);
  }

  async listGuardResults(filters?: { user_id?: string; action?: OutputGuardAction }): Promise<any[]> {
    let results = [...this.results];
    if (filters?.user_id) results = results.filter((r) => r.user_id === filters.user_id);
    if (filters?.action) results = results.filter((r) => r.action === filters.action);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: OutputGuardStore = new InMemoryOutputGuardStore();

export function setOutputGuardStore(store: OutputGuardStore) {
  defaultStore = store;
}

export function getOutputGuardStore(): OutputGuardStore {
  return defaultStore;
}

// ============================================================
// Output guard service
// ============================================================

export async function guardOutput(
  userId: string,
  tenantId: string,
  sessionId: string | null,
  invocationId: string,
  output: string,
  language: Language,
  dataClassification: DataClassification
): Promise<OutputGuardResult> {
  const context: PolicyCheckContext = {
    user_id: userId,
    tenant_id: tenantId,
    session_id: sessionId,
    content: output,
    language,
    data_classification,
  };

  // Run all policy checks
  const policyChecks = await checkAllPolicies(output, language, dataClassification, context);

  // Determine action based on policy results
  let action: OutputGuardAction = 'allow';
  let reason: string | undefined;
  let modifiedOutput: string | undefined;

  if (!policyChecks.identity.passed) {
    action = 'block';
    reason = policyChecks.identity.reason;
  } else if (!policyChecks.language.passed) {
    action = 'block';
    reason = policyChecks.language.reason;
  } else if (!policyChecks.safety.passed) {
    action = 'block';
    reason = policyChecks.safety.reason;
  } else if (!policyChecks.data_classification.passed) {
    action = 'require_approval';
    reason = policyChecks.data_classification.reason;
  }

  // Record guard result
  const guardId = crypto.randomUUID();
  await defaultStore.recordGuardResult({
    guard_id: guardId,
    user_id: userId,
    tenant_id: tenantId,
    invocation_id: invocationId,
    action,
    reason,
    created_at: new Date().toISOString(),
  });

  // Audit event
  await logAuditEvent({
    category: 'output_guard',
    action: 'output_guarded',
    target: invocationId,
    details: { action, reason, output_length: output.length },
    user_id: userId,
    tenant_id: tenantId,
  });

  return {
    action,
    original_output: output,
    modified_output,
    reason,
    policy_checks: {
      identity: { passed: policyChecks.identity.passed, reason: policyChecks.identity.reason },
      language: { passed: policyChecks.language.passed, reason: policyChecks.language.reason },
      safety: { passed: policyChecks.safety.passed, reason: policyChecks.safety.reason },
      data_classification: { passed: policyChecks.data_classification.passed, reason: policyChecks.data_classification.reason },
    },
  };
}

export async function listUserGuardResults(userId: string, tenantId: string): Promise<any[]> {
  return defaultStore.listGuardResults({ user_id: userId });
}
