/**
 * @nai/entitlement — Entitlement loading, quota enforcement, model tier gating.
 *
 * Per ENTITLEMENT_MODEL.md:
 * - Load plan→entitlement mapping from @nai/product-catalog
 * - Check entitlements server-side (never client-side only)
 * - Enforce command/token quotas
 * - Gate model tier access (free/standard/pro/enterprise)
 * - Academy Pass is standalone, not granted by machine plans
 */

import {
  getPlanEntitlements,
  getEntitlement,
  type PlanId,
  type EntitlementKey,
  type EntitlementValue,
  type Entitlements,
} from '@nai/product-catalog';

// ============================================================
// Types
// ============================================================

export interface EntitlementRecord {
  entitlement_id: string;
  user_id: string;
  tenant_id: string;
  key: string;
  value: unknown;
  source: string;
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface UsageState {
  commands_used_today: number;
  tokens_used_this_month: number;
  lessons_completed_this_month: number;
  cert_attempts_this_month: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number | null;
  limit: number | null;
  reason: string | null;
}

// ============================================================
// Entitlement store interface
// ============================================================

export interface EntitlementStore {
  getEntitlements(userId: string, tenantId: string): Promise<EntitlementRecord[]>;
  grant(record: Omit<EntitlementRecord, 'entitlement_id' | 'granted_at'>): Promise<string>;
  revoke(entitlementId: string, revokedBy: string): Promise<void>;
  getUsage(userId: string, tenantId: string): Promise<UsageState>;
  recordUsage(userId: string, tenantId: string, type: 'command' | 'tokens' | 'lesson' | 'cert_attempt', amount: number): Promise<void>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryEntitlementStore implements EntitlementStore {
  private records = new Map<string, EntitlementRecord>();
  private usage = new Map<string, UsageState>();

  async getEntitlements(userId: string, _tenantId: string): Promise<EntitlementRecord[]> {
    return [...this.records.values()].filter(
      (r) => r.user_id === userId && r.revoked_at === null
    );
  }

  async grant(record: Omit<EntitlementRecord, 'entitlement_id' | 'granted_at'>): Promise<string> {
    const id = crypto.randomUUID();
    this.records.set(id, { ...record, entitlement_id: id, granted_at: new Date().toISOString() });
    return id;
  }

  async revoke(entitlementId: string, _revokedBy: string): Promise<void> {
    const record = this.records.get(entitlementId);
    if (record) {
      this.records.set(entitlementId, { ...record, revoked_at: new Date().toISOString() });
    }
  }

  async getUsage(userId: string, _tenantId: string): Promise<UsageState> {
    return this.usage.get(userId) ?? {
      commands_used_today: 0,
      tokens_used_this_month: 0,
      lessons_completed_this_month: 0,
      cert_attempts_this_month: 0,
    };
  }

  async recordUsage(userId: string, _tenantId: string, type: 'command' | 'tokens' | 'lesson' | 'cert_attempt', amount: number): Promise<void> {
    const current = await this.getUsage(userId, _tenantId);
    switch (type) {
      case 'command': current.commands_used_today += amount; break;
      case 'tokens': current.tokens_used_this_month += amount; break;
      case 'lesson': current.lessons_completed_this_month += amount; break;
      case 'cert_attempt': current.cert_attempts_this_month += amount; break;
    }
    this.usage.set(userId, current);
  }

  /** Test helper — reset usage */
  resetUsage(userId: string) {
    this.usage.delete(userId);
  }
}

// ============================================================
// Default store + convenience
// ============================================================

let defaultStore: EntitlementStore = new InMemoryEntitlementStore();

export function setEntitlementStore(store: EntitlementStore) {
  defaultStore = store;
}

export function getEntitlementStore(): EntitlementStore {
  return defaultStore;
}

// ============================================================
// Entitlement resolution — merge plan entitlements + custom grants
// ============================================================

export interface ResolvedEntitlements {
  machine: {
    plan: string;
    instance_count: number | string;
    model_tier: string;
    command_quota: number | string;
    tokens_quota: number | string;
    agents_enabled: string[] | string;
    super_apps_enabled: string[] | string;
    approval_required: string;
  };
  academy: {
    pass: boolean | string;
    tracks_enabled: string[] | string;
    lessons_limit: number | string;
    cert_attempts: number | string;
    cert_discount: number | string;
  };
  custom: Record<string, unknown>;
}

/**
 * Resolve entitlements for a user by merging:
 * 1. Plan entitlements from product-catalog (base)
 * 2. Custom grants from the entitlement store (overrides + additions)
 */
export async function resolveEntitlements(
  userId: string,
  tenantId: string,
  planId: PlanId
): Promise<ResolvedEntitlements> {
  const planEnt = getPlanEntitlements(planId);
  const customRecords = await defaultStore.getEntitlements(userId, tenantId);

  // Start with plan entitlements
  const result: ResolvedEntitlements = {
    machine: {
      plan: String(planEnt['machine.plan'] ?? planId),
      instance_count: planEnt['machine.instance.count'] ?? 1,
      model_tier: String(planEnt['machine.model.tier'] ?? 'free'),
      command_quota: planEnt['machine.command.quota'] ?? 0,
      tokens_quota: planEnt['machine.tokens.quota'] ?? 0,
      agents_enabled: planEnt['machine.agents.enabled'] ?? [],
      super_apps_enabled: planEnt['machine.super_apps.enabled'] ?? [],
      approval_required: String(planEnt['machine.approval.required'] ?? 'all'),
    },
    academy: {
      pass: planEnt['academy.pass'] ?? false,
      tracks_enabled: planEnt['academy.tracks.enabled'] ?? [],
      lessons_limit: planEnt['academy.lessons.limit'] ?? 0,
      cert_attempts: planEnt['academy.cert.attempts'] ?? 0,
      cert_discount: planEnt['academy.cert.discount'] ?? 0,
    },
    custom: {},
  };

  // Apply custom grants (overrides)
  for (const record of customRecords) {
    if (record.key.startsWith('machine.')) {
      const field = record.key.replace('machine.', '').replace(/\./g, '_');
      (result.machine as Record<string, unknown>)[field] = record.value;
    } else if (record.key.startsWith('academy.')) {
      const field = record.key.replace('academy.', '').replace(/\./g, '_');
      (result.academy as Record<string, unknown>)[field] = record.value;
    } else {
      result.custom[record.key] = record.value;
    }
  }

  return result;
}

// ============================================================
// Quota enforcement — per ENTITLEMENT_MODEL.md §7
// ============================================================

export async function checkCommandQuota(
  userId: string,
  tenantId: string,
  planId: PlanId
): Promise<QuotaCheckResult> {
  const ent = await resolveEntitlements(userId, tenantId, planId);
  const limit = ent.machine.command_quota;
  if (typeof limit !== 'number') {
    return { allowed: true, remaining: null, limit: null, reason: 'unlimited or custom' };
  }
  const usage = await defaultStore.getUsage(userId, tenantId);
  const remaining = limit - usage.commands_used_today;
  if (remaining <= 0) {
    return { allowed: false, remaining: 0, limit, reason: 'command quota exhausted' };
  }
  return { allowed: true, remaining, limit, reason: null };
}

export async function checkTokenQuota(
  userId: string,
  tenantId: string,
  planId: PlanId,
  tokensNeeded: number
): Promise<QuotaCheckResult> {
  const ent = await resolveEntitlements(userId, tenantId, planId);
  const limit = ent.machine.tokens_quota;
  if (typeof limit !== 'number') {
    return { allowed: true, remaining: null, limit: null, reason: 'unlimited or custom' };
  }
  const usage = await defaultStore.getUsage(userId, tenantId);
  const remaining = limit - usage.tokens_used_this_month;
  if (remaining < tokensNeeded) {
    return { allowed: false, remaining, limit, reason: 'token quota insufficient' };
  }
  return { allowed: true, remaining, limit, reason: null };
}

export async function checkAcademyAccess(
  userId: string,
  tenantId: string,
  planId: PlanId
): Promise<{ canLearn: boolean; canSubmit: boolean; reason: string | null }> {
  const ent = await resolveEntitlements(userId, tenantId, planId);
  const hasPass = ent.academy.pass === true;
  const lessonsLimit = ent.academy.lessons_limit;
  const tracks = ent.academy.tracks_enabled;

  // Free intro track is always available
  const hasFreeAccess = Array.isArray(tracks) && tracks.includes('free-intro');

  if (!hasPass && !hasFreeAccess) {
    return { canLearn: false, canSubmit: false, reason: 'no Academy Pass and no free track access' };
  }

  if (typeof lessonsLimit === 'number' && !hasPass) {
    const usage = await defaultStore.getUsage(userId, tenantId);
    if (usage.lessons_completed_this_month >= lessonsLimit) {
      return { canLearn: false, canSubmit: false, reason: 'free lesson limit reached — upgrade to Academy Pass' };
    }
  }

  return { canLearn: true, canSubmit: hasPass, reason: null };
}

// ============================================================
// Model tier gating — per ENTITLEMENT_MODEL.md §2.1
// ============================================================

const TIER_HIERARCHY: Record<string, number> = {
  'free': 0,
  'standard': 1,
  'standard+': 2,
  'pro': 3,
  'enterprise': 4,
};

export function canUseModelTier(userTier: string, requiredTier: string): boolean {
  const userLevel = TIER_HIERARCHY[userTier] ?? 0;
  const requiredLevel = TIER_HIERARCHY[requiredTier] ?? 0;
  return userLevel >= requiredLevel;
}

export async function checkModelTierAccess(
  userId: string,
  tenantId: string,
  planId: PlanId,
  requiredTier: string
): Promise<{ allowed: boolean; userTier: string; reason: string | null }> {
  const ent = await resolveEntitlements(userId, tenantId, planId);
  const userTier = String(ent.machine.model_tier);
  if (canUseModelTier(userTier, requiredTier)) {
    return { allowed: true, userTier, reason: null };
  }
  return { allowed: false, userTier, reason: `model tier ${requiredTier} requires ${requiredTier}+ (current: ${userTier})` };
}
