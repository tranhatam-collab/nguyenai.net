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
  getPlan,
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
      instance_count: (planEnt['machine.instance.count'] ?? 1) as number | string,
      model_tier: String(planEnt['machine.model.tier'] ?? 'free'),
      command_quota: (planEnt['machine.command.quota'] ?? 0) as number | string,
      tokens_quota: (planEnt['machine.tokens.quota'] ?? 0) as number | string,
      agents_enabled: (planEnt['machine.agents.enabled'] ?? []) as string[] | string,
      super_apps_enabled: (planEnt['machine.super_apps.enabled'] ?? []) as string[] | string,
      approval_required: String(planEnt['machine.approval.required'] ?? 'all'),
    },
    academy: {
      pass: (planEnt['academy.pass'] ?? false) as boolean | string,
      tracks_enabled: (planEnt['academy.tracks.enabled'] ?? []) as string[] | string,
      lessons_limit: (planEnt['academy.lessons.limit'] ?? 0) as number | string,
      cert_attempts: (planEnt['academy.cert.attempts'] ?? 0) as number | string,
      cert_discount: (planEnt['academy.cert.discount'] ?? 0) as number | string,
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

// ============================================================
// Plan management — upgrade, downgrade, cancel
// ============================================================

export interface PlanChangeResult {
  success: boolean;
  new_plan_id: string | null;
  effective_at: string;
  prorated_refund_amount: number | null;
  reason: string | null;
}

/**
 * Upgrade user to a higher-tier plan.
 * Effective immediately. No proration for MVP.
 */
export async function upgradePlan(
  userId: string,
  tenantId: string,
  currentPlanId: PlanId,
  newPlanId: PlanId
): Promise<PlanChangeResult> {
  const currentPlan = getPlan(currentPlanId);
  const newPlan = getPlan(newPlanId);
  const currentPrice = currentPlan?.price_usd ?? 0;
  const newPrice = newPlan?.price_usd ?? 0;

  if (newPrice <= currentPrice) {
    return {
      success: false,
      new_plan_id: null,
      effective_at: '',
      prorated_refund_amount: null,
      reason: 'New plan must be higher tier (higher price) for upgrade',
    };
  }

  await defaultStore.grant({
    user_id: userId,
    tenant_id: tenantId,
    key: 'machine.plan',
    value: newPlanId,
    source: 'plan_upgrade',
    granted_by: 'system',
    expires_at: null,
    revoked_at: null,
  });

  return {
    success: true,
    new_plan_id: newPlanId,
    effective_at: new Date().toISOString(),
    prorated_refund_amount: null,
    reason: null,
  };
}

/**
 * Downgrade user to a lower-tier plan.
 * Effective at end of current billing period (MVP: immediate for simplicity).
 */
export async function downgradePlan(
  userId: string,
  tenantId: string,
  currentPlanId: PlanId,
  newPlanId: PlanId
): Promise<PlanChangeResult> {
  const currentPlan = getPlan(currentPlanId);
  const newPlan = getPlan(newPlanId);
  const currentPrice = currentPlan?.price_usd ?? 0;
  const newPrice = newPlan?.price_usd ?? 0;

  if (newPrice >= currentPrice) {
    return {
      success: false,
      new_plan_id: null,
      effective_at: '',
      prorated_refund_amount: null,
      reason: 'New plan must be lower tier (lower price) for downgrade',
    };
  }

  await defaultStore.grant({
    user_id: userId,
    tenant_id: tenantId,
    key: 'machine.plan',
    value: newPlanId,
    source: 'plan_downgrade',
    granted_by: 'system',
    expires_at: null,
    revoked_at: null,
  });

  return {
    success: true,
    new_plan_id: newPlanId,
    effective_at: new Date().toISOString(),
    prorated_refund_amount: null,
    reason: null,
  };
}

/**
 * Cancel user's plan (revert to free Start plan).
 * Effective at end of current billing period (MVP: immediate).
 */
export async function cancelPlan(
  userId: string,
  tenantId: string,
  currentPlanId: PlanId
): Promise<PlanChangeResult> {
  await defaultStore.grant({
    user_id: userId,
    tenant_id: tenantId,
    key: 'machine.plan',
    value: 'start',
    source: 'plan_cancellation',
    granted_by: 'system',
    expires_at: null,
    revoked_at: null,
  });

  return {
    success: true,
    new_plan_id: 'start',
    effective_at: new Date().toISOString(),
    prorated_refund_amount: null,
    reason: null,
  };
}

// ============================================================
// Subscription lifecycle — billing cycle, renewal, expiry
// ============================================================

export interface SubscriptionState {
  subscription_id: string;
  user_id: string;
  tenant_id: string;
  plan_id: PlanId;
  gateway: 'stripe' | 'vnpay' | 'payos';
  gateway_subscription_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'expired' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStore {
  getSubscription(userId: string, tenantId: string): Promise<SubscriptionState | null>;
  createSubscription(sub: Omit<SubscriptionState, 'subscription_id' | 'created_at' | 'updated_at'>): Promise<string>;
  updateSubscription(subscriptionId: string, updates: Partial<SubscriptionState>): Promise<void>;
  deleteSubscription(subscriptionId: string): Promise<void>;
  listSubscriptions?(userId: string, tenantId: string): Promise<SubscriptionState[]>;
}

export class InMemorySubscriptionStore implements SubscriptionStore {
  private subs = new Map<string, SubscriptionState>();

  async getSubscription(userId: string, tenantId: string): Promise<SubscriptionState | null> {
    return [...this.subs.values()].find(
      (s) => s.user_id === userId && s.tenant_id === tenantId && s.status === 'active'
    ) ?? null;
  }

  async createSubscription(sub: Omit<SubscriptionState, 'subscription_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: SubscriptionState = {
      ...sub,
      subscription_id: id,
      created_at: now,
      updated_at: now,
    };
    this.subs.set(id, full);
    return id;
  }

  async listSubscriptions(userId: string, tenantId: string): Promise<SubscriptionState[]> {
    return [...this.subs.values()].filter(
      (s) => s.user_id === userId && s.tenant_id === tenantId
    );
  }

  async updateSubscription(subscriptionId: string, updates: Partial<SubscriptionState>): Promise<void> {
    const existing = this.subs.get(subscriptionId);
    if (existing) {
      this.subs.set(subscriptionId, { ...existing, ...updates, updated_at: new Date().toISOString() });
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    this.subs.delete(subscriptionId);
  }
}

let defaultSubscriptionStore: SubscriptionStore = new InMemorySubscriptionStore();

export function setSubscriptionStore(store: SubscriptionStore) {
  defaultSubscriptionStore = store;
}

export function getSubscriptionStore(): SubscriptionStore {
  return defaultSubscriptionStore;
}

/**
 * Create a new subscription after successful payment.
 */
export async function createSubscription(
  userId: string,
  tenantId: string,
  planId: PlanId,
  gateway: 'stripe' | 'vnpay' | 'payos',
  gatewaySubscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<string> {
  return await defaultSubscriptionStore.createSubscription({
    user_id: userId,
    tenant_id: tenantId,
    plan_id: planId,
    gateway,
    gateway_subscription_id: gatewaySubscriptionId,
    status: 'active',
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
  });
}

/**
 * Mark subscription for cancellation at period end.
 */
export async function scheduleCancellation(userId: string, tenantId: string): Promise<boolean> {
  const sub = await defaultSubscriptionStore.getSubscription(userId, tenantId);
  if (!sub) return false;

  await defaultSubscriptionStore.updateSubscription(sub.subscription_id, {
    cancel_at_period_end: true,
  });
  return true;
}

/**
 * Process subscription expiry (called by billing webhook).
 */
export async function processSubscriptionExpiry(subscriptionId: string): Promise<void> {
  const sub = await defaultSubscriptionStore.getSubscription('', '');
  if (!sub) return;

  await defaultStore.grant({
    user_id: sub.user_id,
    tenant_id: sub.tenant_id,
    key: 'machine.plan',
    value: 'start',
    source: 'subscription_expiry',
    granted_by: 'system',
    expires_at: null,
    revoked_at: null,
  });

  await defaultSubscriptionStore.updateSubscription(subscriptionId, {
    status: 'expired',
  });
}

// ============================================================
// Payment → Entitlement grant
// ============================================================

/**
 * Grant entitlement after successful payment.
 * Handles both plan subscriptions and standalone prices.
 *
 * @param userId - User who paid
 * @param tenantId - Tenant ID
 * @param priceId - price_id from prices.json
 * @param gateway - Payment gateway (stripe/vnpay/payos)
 * @param paymentId - Gateway payment ID for audit
 * @returns { granted: boolean, key?: string, value?: unknown, reason?: string }
 */
export async function grantPaymentEntitlement(
  userId: string,
  tenantId: string,
  priceId: string,
  gateway: string,
  paymentId: string,
): Promise<{ granted: boolean; key?: string; value?: unknown; reason?: string }> {
  // Find the price item
  const prices = (await import('@nai/product-catalog')).prices;
  const price = prices.find((p) => p.id === priceId);
  if (!price) {
    return { granted: false, reason: `Price not found: ${priceId}` };
  }

  // Grant the entitlement from the price item
  const entitlementKey = price.entitlement_key;
  const entitlementValue = price.entitlement_value;

  if (!entitlementKey) {
    return { granted: false, reason: `Price ${priceId} has no entitlement_key` };
  }

  await defaultStore.grant({
    user_id: userId,
    tenant_id: tenantId,
    key: entitlementKey,
    value: entitlementValue ?? true,
    source: `payment:${gateway}`,
    granted_by: `webhook:${gateway}`,
    expires_at: null, // No expiry for MVP — subscription lifecycle handles revocation
    revoked_at: null,
  });

  // Also create a subscription record if it's a recurring price
  if (price.period === 'month' || price.period === 'year') {
    const now = new Date();
    const periodEnd = new Date(now);
    if (price.period === 'month') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    await defaultSubscriptionStore.createSubscription({
      user_id: userId,
      tenant_id: tenantId,
      plan_id: priceId as PlanId,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      gateway: gateway as 'stripe' | 'vnpay' | 'payos',
      gateway_subscription_id: paymentId,
      cancel_at_period_end: false,
    });
  }

  return {
    granted: true,
    key: entitlementKey,
    value: entitlementValue,
  };
}

/**
 * Revoke entitlement after refund.
 *
 * @param userId - User who was refunded
 * @param tenantId - Tenant ID
 * @param priceId - price_id from prices.json
 * @param refundId - Refund ID for audit
 * @returns { revoked: boolean, reason?: string }
 */
export async function revokePaymentEntitlement(
  userId: string,
  tenantId: string,
  priceId: string,
  refundId: string,
): Promise<{ revoked: boolean; reason?: string }> {
  const prices = (await import('@nai/product-catalog')).prices;
  const price = prices.find((p) => p.id === priceId);
  if (!price) {
    return { revoked: false, reason: `Price not found: ${priceId}` };
  }

  // Find and revoke the entitlement
  const records = await defaultStore.getEntitlements(userId, tenantId);
  const target = records.find(
    (r) => r.key === price.entitlement_key && r.source?.startsWith('payment:') && r.revoked_at === null,
  );
  if (target) {
    await defaultStore.revoke(target.entitlement_id, `refund:${refundId}`);
  }

  // Cancel subscription if exists
  if (defaultSubscriptionStore.listSubscriptions) {
    const subs = await defaultSubscriptionStore.listSubscriptions(userId, tenantId);
    for (const sub of subs) {
      if (sub.plan_id === priceId && sub.status === 'active') {
        await defaultSubscriptionStore.updateSubscription(sub.subscription_id, {
          status: 'canceled',
        });
      }
    }
  }

  return { revoked: true };
}
