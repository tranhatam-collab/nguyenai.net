/**
 * @nai/policy-engine — Policy evaluation for sensitive actions, data classification, entitlement checks.
 *
 * Per IDENTITY_AND_TENANCY_RFC.md §4 and ENTITLEMENT_MODEL.md §7:
 * - Every sensitive action must check a permission
 * - Data classification determines access level
 * - Entitlement checks are server-side
 *
 * Implements a rule-based policy engine (OPA-compatible API shape).
 * Production: swap with OPA or Stytz.
 */

import type { ResolvedEntitlements as Entitlements } from '@nai/entitlement';

// ============================================================
// Types
// ============================================================

export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'private'
  | 'living-person'
  | 'financial'
  | 'legal'
  | 'investor-private';

export type ActionType =
  | 'machine:operate'
  | 'memory:write'
  | 'memory:delete'
  | 'vault:upload'
  | 'vault:download'
  | 'vault:delete'
  | 'academy:submit'
  | 'cert:request'
  | 'invest:download'
  | 'invest:financial-read'
  | 'admin:user-manage'
  | 'admin:billing-manage'
  | 'admin:access-revoke'
  | 'data:export'
  | 'data:delete';

export type ApprovalGateLevel = 'none' | 'sensitive' | 'all' | 'per-role' | 'board' | 'custom';

export interface PolicyContext {
  user_id: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
  entitlements: Entitlements;
  approval_gate: ApprovalGateLevel;
  ip_address?: string;
  audience?: string;
}

export interface PolicyDecision {
  allow: boolean;
  requires_approval: boolean;
  reason: string;
  classification: DataClassification;
  checked_permissions: string[];
}

// ============================================================
// Sensitive action classification
// ============================================================

const ACTION_CLASSIFICATION: Record<ActionType, DataClassification> = {
  'machine:operate': 'internal',
  'memory:write': 'confidential',
  'memory:delete': 'restricted',
  'vault:upload': 'confidential',
  'vault:download': 'confidential',
  'vault:delete': 'restricted',
  'academy:submit': 'internal',
  'cert:request': 'internal',
  'invest:download': 'investor-private',
  'invest:financial-read': 'financial',
  'admin:user-manage': 'restricted',
  'admin:billing-manage': 'financial',
  'admin:access-revoke': 'restricted',
  'data:export': 'restricted',
  'data:delete': 'restricted',
};

const SENSITIVE_ACTIONS: Set<ActionType> = new Set([
  'memory:delete',
  'vault:delete',
  'admin:user-manage',
  'admin:billing-manage',
  'admin:access-revoke',
  'data:export',
  'data:delete',
  'invest:download',
  'invest:financial-read',
]);

const REQUIRED_PERMISSIONS: Record<ActionType, string[]> = {
  'machine:operate': ['machine:operate'],
  'memory:write': ['memory:write'],
  'memory:delete': ['memory:write'],
  'vault:upload': ['vault:upload'],
  'vault:download': ['vault:download'],
  'vault:delete': ['vault:upload'],
  'academy:submit': ['academy:submit'],
  'cert:request': ['cert:request'],
  'invest:download': ['invest:download'],
  'invest:financial-read': ['invest:financial-read'],
  'admin:user-manage': ['admin:user-manage'],
  'admin:billing-manage': ['admin:billing-manage'],
  'admin:access-revoke': ['admin:access-revoke'],
  'data:export': ['admin:audit-read'],
  'data:delete': ['admin:user-manage'],
};

// ============================================================
// Policy evaluation
// ============================================================

export function evaluatePolicy(
  ctx: PolicyContext,
  action: ActionType,
  resourceTenantId?: string
): PolicyDecision {
  const classification = ACTION_CLASSIFICATION[action] ?? 'internal';
  const requiredPerms = REQUIRED_PERMISSIONS[action] ?? [];

  // 1. Tenant isolation check
  if (resourceTenantId && resourceTenantId !== ctx.tenant_id) {
    if (!ctx.roles.includes('SUPER_ADMIN')) {
      return {
        allow: false,
        requires_approval: false,
        reason: 'cross-tenant access denied (not SUPER_ADMIN)',
        classification,
        checked_permissions: requiredPerms,
      };
    }
  }

  // 2. Permission check
  const hasAllPerms = requiredPerms.every((p) => ctx.permissions.includes(p));
  if (!hasAllPerms) {
    return {
      allow: false,
      requires_approval: false,
      reason: `missing required permissions: ${requiredPerms.filter((p) => !ctx.permissions.includes(p)).join(', ')}`,
      classification,
      checked_permissions: requiredPerms,
    };
  }

  // 3. Approval gate check
  let requiresApproval = false;
  switch (ctx.approval_gate) {
    case 'all':
      requiresApproval = true;
      break;
    case 'sensitive':
      requiresApproval = SENSITIVE_ACTIONS.has(action);
      break;
    case 'per-role':
    case 'board':
    case 'custom':
      requiresApproval = SENSITIVE_ACTIONS.has(action);
      break;
    case 'none':
      requiresApproval = false;
      break;
  }

  // 4. Data classification — living-person data requires extra check
  if (classification === 'living-person' || classification === 'investor-private') {
    requiresApproval = true;
  }

  // 5. Financial actions always require approval
  if (classification === 'financial') {
    requiresApproval = true;
  }

  return {
    allow: true,
    requires_approval: requiresApproval,
    reason: requiresApproval ? 'approved by policy, but requires human approval gate' : 'approved by policy',
    classification,
    checked_permissions: requiredPerms,
  };
}

// ============================================================
// Data classification helpers
// ============================================================

export function classifyData(dataType: string): DataClassification {
  const mapping: Record<string, DataClassification> = {
    'public_content': 'public',
    'marketing': 'public',
    'docs': 'internal',
    'agent_output': 'internal',
    'user_profile': 'confidential',
    'memory': 'confidential',
    'vault_file': 'confidential',
    'family_tree': 'private',
    'oral_history': 'private',
    'living_person_data': 'living-person',
    'financial_record': 'financial',
    'invoice': 'financial',
    'contract': 'legal',
    'investor_data_room': 'investor-private',
    'cap_table': 'investor-private',
    'audit_log': 'restricted',
  };
  return mapping[dataType] ?? 'confidential';
}

export function requiresApprovalForClassification(classification: DataClassification): boolean {
  return ['restricted', 'private', 'living-person', 'financial', 'legal', 'investor-private'].includes(classification);
}

// ============================================================
// Entitlement check integration
// ============================================================

export interface EntitlementCheckResult {
  allowed: boolean;
  reason: string;
}

export function checkEntitlementForAction(
  ctx: PolicyContext,
  action: ActionType
): EntitlementCheckResult {
  const ent = ctx.entitlements;

  // Machine operate requires machine plan
  if (action === 'machine:operate') {
    if (ent.machine.plan === 'free') {
      // Free plan can operate but with all approvals
      return { allowed: true, reason: 'free plan: all actions require approval' };
    }
    return { allowed: true, reason: 'plan allows machine operation' };
  }

  // Academy submit requires Academy Pass
  if (action === 'academy:submit') {
    if (ent.academy.pass !== true) {
      return { allowed: false, reason: 'Academy Pass required for submission' };
    }
    return { allowed: true, reason: 'Academy Pass valid' };
  }

  // Cert request requires cert.fee.paid
  if (action === 'cert:request') {
    const certFeePaid = ctx.entitlements.custom['cert.fee.paid'] === true;
    if (!certFeePaid) {
      return { allowed: false, reason: 'cert.fee.paid required for certification attempt' };
    }
    return { allowed: true, reason: 'cert fee paid' };
  }

  // Investor actions require qualification
  if (action === 'invest:download' || action === 'invest:financial-read') {
    const qualified = ctx.roles.includes('QUALIFIED_INVESTOR') || ctx.roles.includes('DATA_ROOM_MEMBER');
    if (!qualified) {
      return { allowed: false, reason: 'investor qualification required' };
    }
    return { allowed: true, reason: 'investor qualified' };
  }

  return { allowed: true, reason: 'no entitlement restriction' };
}
