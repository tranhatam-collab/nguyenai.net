/**
 * @nai/product-catalog — Single source of truth for plans, entitlements, limits, prices.
 *
 * Per ENTITLEMENT_MODEL.md §10 and PRODUCT_CATALOG_9x9.md.
 * No repo may hardcode prices or plan→entitlement mapping in source.
 */

import plansData from '../plans.json' with { type: 'json' };
import entitlementsData from '../entitlements.json' with { type: 'json' };
import limitsData from '../limits.json' with { type: 'json' };
import pricesData from '../prices.json' with { type: 'json' };
import academyAccessData from '../academy-access.json' with { type: 'json' };

export type PlanId =
  | 'nguyen-start'
  | 'nguyen-personal'
  | 'nguyen-family'
  | 'nguyen-creator'
  | 'nguyen-founder'
  | 'nguyen-business'
  | 'nguyen-chapter'
  | 'nguyen-enterprise';

export type PlanStatus = 'Available' | 'Beta' | 'Planned' | 'Enterprise only';
export type ModelTier = 'free' | 'standard' | 'standard+' | 'pro' | 'enterprise';
export type ApprovalGate = 'all' | 'sensitive' | 'per-role' | 'board' | 'custom';

export interface Plan {
  id: PlanId;
  name: string;
  name_vi: string;
  name_en: string;
  price_vnd: number | null;
  price_usd: number | null;
  currency: string;
  period: string;
  status: PlanStatus;
  target_vi: string;
  target_en: string;
  model_tier: ModelTier;
  agents: string[] | string;
  memory_mb: number | null;
  vault_mb: number | null;
  commands_per_day: number | null;
  tokens_per_month: number | null;
  super_apps: string[] | string;
  approval_gate: ApprovalGate;
  academy_pass: boolean | string;
  academy_cert_discount: number | string;
}

export type EntitlementKey =
  | 'machine.plan'
  | 'machine.instance.count'
  | 'machine.model.tier'
  | 'machine.command.quota'
  | 'machine.tokens.quota'
  | 'machine.agents.enabled'
  | 'machine.super_apps.enabled'
  | 'machine.approval.required'
  | 'academy.pass'
  | 'academy.tracks.enabled'
  | 'academy.lessons.limit'
  | 'academy.cert.attempts'
  | 'academy.cert.discount';

export type EntitlementValue = string | number | boolean | string[] | null;

export type Entitlements = Partial<Record<EntitlementKey, EntitlementValue>>;

export interface StandalonePrice {
  id: string;
  name: string;
  name_vi: string;
  name_en: string;
  price_vnd: number;
  price_usd: number;
  currency: string;
  period: string;
  status: PlanStatus;
  entitlement_key?: string;
  entitlement_value?: boolean;
  compatible_plans?: PlanId[];
  description_vi: string;
  description_en: string;
}

export const plans: Plan[] = plansData as Plan[];
export const entitlements: Record<PlanId, Entitlements> = entitlementsData as Record<PlanId, Entitlements>;
export const limits = limitsData;
export const prices: StandalonePrice[] = pricesData as StandalonePrice[];
export const academyAccess = academyAccessData;

const planMap = new Map<PlanId, Plan>(plans.map((p) => [p.id, p]));

export function getPlan(id: PlanId): Plan | undefined {
  return planMap.get(id);
}

export function getPlanEntitlements(id: PlanId): Entitlements {
  return entitlements[id] ?? {};
}

export function getEntitlement(id: PlanId, key: EntitlementKey): EntitlementValue {
  return entitlements[id]?.[key] ?? null;
}

export function getAllPlans(): Plan[] {
  return plans;
}

export function getStandalonePrices(): StandalonePrice[] {
  return prices;
}

export function isPlanCompatible(addonId: string, planId: PlanId): boolean {
  const addon = prices.find((p) => p.id === addonId);
  if (!addon?.compatible_plans) return false;
  return addon.compatible_plans.includes(planId);
}
