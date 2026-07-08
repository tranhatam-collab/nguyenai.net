/**
 * @nai/model-policy — Model policy enforcement (identity, language, safety, data classification).
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md:
 * - Identity policy: AI Nguyễn / AI Nguyen for assistant identity (Founder-approved exception)
 * - Language policy: Vietnamese + English only
 * - Safety policy: No harmful content
 * - Data classification: Public/Confidential/Restricted/Secret
 */

import { logGovernanceAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

export type Language = 'vi' | 'en' | 'other';
export type DataClassification = 'public' | 'confidential' | 'restricted' | 'secret';
export type PolicyCheckResult = { passed: boolean; reason?: string };

export interface PolicyCheckContext {
  user_id: string;
  tenant_id: string;
  session_id: string | null;
  content: string;
  language: Language;
  data_classification: DataClassification;
}

export interface PolicyStore {
  recordPolicyCheck(check: {
    check_id: string;
    user_id: string;
    tenant_id: string;
    check_type: 'identity' | 'language' | 'safety' | 'data_classification';
    passed: boolean;
    reason?: string;
    created_at: string;
  }): Promise<void>;
  listPolicyChecks(filters?: { user_id?: string; check_type?: string }): Promise<any[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryPolicyStore implements PolicyStore {
  private checks: any[] = [];

  async recordPolicyCheck(check: any): Promise<void> {
    this.checks.push(check);
  }

  async listPolicyChecks(filters?: { user_id?: string; check_type?: string }): Promise<any[]> {
    let results = [...this.checks];
    if (filters?.user_id) results = results.filter((c) => c.user_id === filters.user_id);
    if (filters?.check_type) results = results.filter((c) => c.check_type === filters.check_type);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

// ============================================================
// Default store
// ============================================================

let defaultStore: PolicyStore = new InMemoryPolicyStore();

export function setPolicyStore(store: PolicyStore) {
  defaultStore = store;
}

export function getPolicyStore(): PolicyStore {
  return defaultStore;
}

// ============================================================
// Identity policy
// ============================================================

export async function checkIdentityPolicy(
  content: string,
  context: PolicyCheckContext
): Promise<PolicyCheckResult> {
  // Per Founder-approved exception: AI Nguyễn / AI Nguyen allowed for assistant identity
  // But not as public brand
  const hasVietnameseIdentity = content.includes('AI Nguyễn');
  const hasEnglishIdentity = content.includes('AI Nguyen');

  // Allow for assistant identity responses
  if (hasVietnameseIdentity || hasEnglishIdentity) {
    // Check if this is an assistant identity response (simplified check)
    const isAssistantResponse = content.toLowerCase().includes('tôi là') || content.toLowerCase().includes('i am');
    
    if (isAssistantResponse) {
      await recordCheck('identity', true, context);
      return { passed: true };
    }
  }

  // Check for banned brand names (per FOUNDER_BRAND_NAMING_LOCK)
  const bannedNames = ['Nguyên AI', 'AI Nguyen', 'NguyenAI', 'Nguyễn.AI', 'Nguyen Artificial Intelligence'];
  for (const banned of bannedNames) {
    if (content.includes(banned)) {
      await recordCheck('identity', false, context, `Banned brand name: ${banned}`);
      return { passed: false, reason: `Banned brand name: ${banned}` };
    }
  }

  await recordCheck('identity', true, context);
  return { passed: true };
}

// ============================================================
// Language policy
// ============================================================

export async function checkLanguagePolicy(
  content: string,
  language: Language,
  context: PolicyCheckContext
): Promise<PolicyCheckResult> {
  // Only Vietnamese and English are allowed
  if (language === 'other') {
    await recordCheck('language', false, context, 'Language not allowed');
    return { passed: false, reason: 'Language not allowed (only Vietnamese and English)' };
  }

  await recordCheck('language', true, context);
  return { passed: true };
}

// ============================================================
// Safety policy
// ============================================================

export async function checkSafetyPolicy(
  content: string,
  context: PolicyCheckContext
): Promise<PolicyCheckResult> {
  // Simplified safety check — in production, use proper content moderation
  const harmfulPatterns = [
    'hack', 'exploit', 'malware', 'phishing', 'fraud',
    'violence', 'harm', 'illegal', 'terrorist'
  ];

  const lowerContent = content.toLowerCase();
  for (const pattern of harmfulPatterns) {
    if (lowerContent.includes(pattern)) {
      await recordCheck('safety', false, context, `Harmful content detected: ${pattern}`);
      return { passed: false, reason: `Harmful content detected: ${pattern}` };
    }
  }

  await recordCheck('safety', true, context);
  return { passed: true };
}

// ============================================================
// Data classification policy
// ============================================================

export async function checkDataClassificationPolicy(
  dataClassification: DataClassification,
  context: PolicyCheckContext
): Promise<PolicyCheckResult> {
  // All classifications are allowed, but Secret requires additional approval
  if (dataClassification === 'secret') {
    await recordCheck('data_classification', false, context, 'Secret data requires approval');
    return { passed: false, reason: 'Secret data requires approval' };
  }

  await recordCheck('data_classification', true, context);
  return { passed: true };
}

// ============================================================
// Combined policy check
// ============================================================

export async function checkAllPolicies(
  content: string,
  language: Language,
  dataClassification: DataClassification,
  context: PolicyCheckContext
): Promise<{
  identity: PolicyCheckResult;
  language: PolicyCheckResult;
  safety: PolicyCheckResult;
  data_classification: PolicyCheckResult;
  allPassed: boolean;
}> {
  const identity = await checkIdentityPolicy(content, context);
  const languageResult = await checkLanguagePolicy(content, language, context);
  const safety = await checkSafetyPolicy(content, context);
  const dataClassificationResult = await checkDataClassificationPolicy(dataClassification, context);

  const allPassed = identity.passed && languageResult.passed && safety.passed && dataClassificationResult.passed;

  return {
    identity,
    language: languageResult,
    safety,
    data_classification: dataClassificationResult,
    allPassed,
  };
}

// ============================================================
// Helper: record check
// ============================================================

async function recordCheck(
  checkType: string,
  passed: boolean,
  context: PolicyCheckContext,
  reason?: string
): Promise<void> {
  const checkId = crypto.randomUUID();
  await defaultStore.recordPolicyCheck({
    check_id: checkId,
    user_id: context.user_id,
    tenant_id: context.tenant_id,
    check_type: checkType as 'identity' | 'language' | 'safety' | 'data_classification',
    passed,
    reason,
    created_at: new Date().toISOString(),
  });

  if (!passed) {
    await logGovernanceAuditEvent({
      category: 'model_policy',
      action: 'policy_check_failed',
      target: checkId,
      details: { check_type: checkType, reason },
      user_id: context.user_id,
      tenant_id: context.tenant_id,
    });
  }
}
