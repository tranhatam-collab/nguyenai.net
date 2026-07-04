/**
 * entitlements.ts — Entitlement keys + categories.
 *
 * Per ENTITLEMENT_MODEL.md §2 (LOCKED):
 * 6 categories defined in the RFC: machine, academy, certification,
 * sme_deployment, marketplace, investor.
 *
 * 4 additional categories required by V4 contract + audit findings:
 * - audit (audit log access + export)
 * - retention (data retention controls + deletion)
 * - scholarship (scholarship program entitlements)
 * - support (support tier + ticket access)
 *
 * Total: 10 categories. No repo may define entitlements outside this contract.
 */

// ============================================================
// Entitlement categories (10)
// ============================================================

export type EntitlementCategory =
  | 'machine'
  | 'academy'
  | 'certification'
  | 'sme_deployment'
  | 'marketplace'
  | 'investor'
  | 'audit'
  | 'retention'
  | 'scholarship'
  | 'support';

// ============================================================
// Entitlement keys (locked per ENTITLEMENT_MODEL.md §2)
// ============================================================

export const ENTITLEMENT_KEYS = [
  // 2.1 Machine entitlements
  'machine.plan',
  'machine.instance.count',
  'machine.model.tier',
  'machine.command.quota',
  'machine.tokens.quota',
  'machine.agents.enabled',
  'machine.super_apps.enabled',
  'machine.approval.required',

  // 2.2 Academy entitlements
  'academy.pass',
  'academy.tracks.enabled',
  'academy.lessons.limit',
  'academy.cert.attempts',
  'academy.cert.discount',

  // 2.3 Certification entitlements
  'cert.fee.paid',
  'cert.program',
  'cert.attempt.id',
  'cert.eligible',

  // 2.4 SME deployment entitlements
  'sme.deployment.id',
  'sme.runtime.isolated',
  'sme.tenant.isolated',
  'sme.region',
  'sme.custom.entitlements',

  // 2.5 Marketplace entitlements
  'marketplace.purchase.id',
  'marketplace.item.id',
  'marketplace.access.expires',

  // 2.6 Investor entitlements
  'invest.request.submitted',
  'invest.qualification.status',
  'invest.private.scope',
  'invest.access.expires',
  'invest.nda.signed',
  'invest.download.allowed',

  // === 4 missing categories (per V4 + audit findings) ===

  // Audit entitlements — audit log access + export
  'audit.read.scope',          // 'own' | 'tenant' | 'all'
  'audit.export.allowed',      // boolean
  'audit.retention.override',  // boolean (legal hold)

  // Retention entitlements — data retention controls + deletion
  'retention.sweep.allowed',   // boolean (admin only)
  'retention.export.own',      // boolean (GDPR/PDPD data export)
  'retention.delete.own',      // boolean (right to erasure)

  // Scholarship entitlements — scholarship program
  'scholarship.apply.allowed',     // boolean
  'scholarship.review.scope',      // 'assigned' | 'all' | 'cohort'
  'scholarship.sponsor.allowed',   // boolean
  'scholarship.progress.view',     // boolean (view scholar progress reports)

  // Support entitlements — support tier + ticket access
  'support.tier',              // 'community' | 'email' | 'priority' | 'dedicated'
  'support.ticket.limit',      // tickets per period
  'support.sla.hours',         // response SLA in hours
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

// ============================================================
// Category → keys mapping
// ============================================================

export const CATEGORY_TO_KEYS: Record<EntitlementCategory, EntitlementKey[]> = {
  machine: [
    'machine.plan', 'machine.instance.count', 'machine.model.tier',
    'machine.command.quota', 'machine.tokens.quota', 'machine.agents.enabled',
    'machine.super_apps.enabled', 'machine.approval.required',
  ],
  academy: [
    'academy.pass', 'academy.tracks.enabled', 'academy.lessons.limit',
    'academy.cert.attempts', 'academy.cert.discount',
  ],
  certification: [
    'cert.fee.paid', 'cert.program', 'cert.attempt.id', 'cert.eligible',
  ],
  sme_deployment: [
    'sme.deployment.id', 'sme.runtime.isolated', 'sme.tenant.isolated',
    'sme.region', 'sme.custom.entitlements',
  ],
  marketplace: [
    'marketplace.purchase.id', 'marketplace.item.id', 'marketplace.access.expires',
  ],
  investor: [
    'invest.request.submitted', 'invest.qualification.status', 'invest.private.scope',
    'invest.access.expires', 'invest.nda.signed', 'invest.download.allowed',
  ],
  audit: [
    'audit.read.scope', 'audit.export.allowed', 'audit.retention.override',
  ],
  retention: [
    'retention.sweep.allowed', 'retention.export.own', 'retention.delete.own',
  ],
  scholarship: [
    'scholarship.apply.allowed', 'scholarship.review.scope',
    'scholarship.sponsor.allowed', 'scholarship.progress.view',
  ],
  support: [
    'support.tier', 'support.ticket.limit', 'support.sla.hours',
  ],
};

// ============================================================
// Helpers
// ============================================================

export function isEntitlementKey(key: string): key is EntitlementKey {
  return (ENTITLEMENT_KEYS as readonly string[]).includes(key);
}

export function getCategoryForKey(key: string): EntitlementCategory | null {
  for (const [cat, keys] of Object.entries(CATEGORY_TO_KEYS)) {
    if ((keys as readonly string[]).includes(key)) {
      return cat as EntitlementCategory;
    }
  }
  return null;
}

export function listCategories(): EntitlementCategory[] {
  return Object.keys(CATEGORY_TO_KEYS) as EntitlementCategory[];
}

export function listKeysForCategory(cat: EntitlementCategory): EntitlementKey[] {
  return CATEGORY_TO_KEYS[cat];
}
