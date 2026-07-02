/**
 * @nai/policy-engine — unit tests.
 */

import {
  evaluatePolicy,
  classifyData,
  requiresApprovalForClassification,
  checkEntitlementForAction,
  type PolicyContext,
  type ActionType,
} from './index.ts';
import type { Entitlements } from '@nai/entitlement';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

function makeCtx(overrides: Partial<PolicyContext> = {}): PolicyContext {
  const defaultEntitlements: Entitlements = {
    machine: {
      plan: 'personal',
      instance_count: 1,
      model_tier: 'standard',
      command_quota: 100,
      tokens_quota: 500000,
      agents_enabled: [],
      super_apps_enabled: [],
      approval_required: 'sensitive',
    },
    academy: {
      pass: false,
      tracks_enabled: ['free-intro'],
      lessons_limit: 5,
      cert_attempts: 0,
      cert_discount: 0,
    },
    custom: {},
  };
  return {
    user_id: 'u1',
    tenant_id: 't1',
    roles: ['USER'],
    permissions: ['machine:read', 'machine:operate', 'memory:read', 'memory:write', 'vault:upload', 'vault:download'],
    entitlements: defaultEntitlements,
    approval_gate: 'sensitive',
    ...overrides,
  };
}

function testBasicAllow() {
  console.log('Test: basic allow');
  const ctx = makeCtx();
  const decision = evaluatePolicy(ctx, 'machine:operate');
  assert(decision.allow === true, 'machine:operate allowed with permission');
  assert(decision.requires_approval === false, 'machine:operate not sensitive');
}

function testMissingPermission() {
  console.log('Test: missing permission');
  const ctx = makeCtx({ permissions: ['machine:read'] });
  const decision = evaluatePolicy(ctx, 'memory:write');
  assert(decision.allow === false, 'memory:write denied without permission');
  assert(decision.reason.includes('missing'), 'reason mentions missing permission');
}

function testSensitiveAction() {
  console.log('Test: sensitive action requires approval');
  const ctx = makeCtx({ permissions: ['memory:write', 'vault:upload', 'admin:user-manage'] });
  const decision = evaluatePolicy(ctx, 'memory:delete');
  assert(decision.allow === true, 'memory:delete allowed with permission');
  assert(decision.requires_approval === true, 'memory:delete requires approval');
}

function testApprovalGateAll() {
  console.log('Test: approval gate all');
  const ctx = makeCtx({ approval_gate: 'all' });
  const decision = evaluatePolicy(ctx, 'machine:operate');
  assert(decision.requires_approval === true, 'all gate requires approval even for non-sensitive');
}

function testApprovalGateNone() {
  console.log('Test: approval gate none');
  const ctx = makeCtx({ approval_gate: 'none', permissions: ['memory:write', 'vault:upload'] });
  const decision = evaluatePolicy(ctx, 'memory:delete');
  assert(decision.requires_approval === false, 'none gate does not require approval');
}

function testCrossTenantDenied() {
  console.log('Test: cross-tenant denied');
  const ctx = makeCtx({ tenant_id: 't1', roles: ['USER'] });
  const decision = evaluatePolicy(ctx, 'machine:operate', 't2');
  assert(decision.allow === false, 'cross-tenant denied for USER');
  assert(decision.reason.includes('cross-tenant'), 'reason mentions cross-tenant');
}

function testCrossTenantSuperAdmin() {
  console.log('Test: cross-tenant SUPER_ADMIN');
  const ctx = makeCtx({ tenant_id: 't1', roles: ['SUPER_ADMIN'], permissions: ['machine:operate'] });
  const decision = evaluatePolicy(ctx, 'machine:operate', 't2');
  assert(decision.allow === true, 'cross-tenant allowed for SUPER_ADMIN');
}

function testFinancialAction() {
  console.log('Test: financial action always requires approval');
  const ctx = makeCtx({
    roles: ['ADMIN'],
    permissions: ['admin:billing-manage'],
    approval_gate: 'none',
  });
  const decision = evaluatePolicy(ctx, 'admin:billing-manage');
  assert(decision.allow === true, 'billing allowed with permission');
  assert(decision.requires_approval === true, 'financial action requires approval even with none gate');
}

function testDataClassification() {
  console.log('Test: data classification');
  assert(classifyData('public_content') === 'public', 'public_content is public');
  assert(classifyData('user_profile') === 'confidential', 'user_profile is confidential');
  assert(classifyData('living_person_data') === 'living-person', 'living_person_data is living-person');
  assert(classifyData('financial_record') === 'financial', 'financial_record is financial');
  assert(classifyData('cap_table') === 'investor-private', 'cap_table is investor-private');
  assert(classifyData('audit_log') === 'restricted', 'audit_log is restricted');
}

function testRequiresApprovalForClassification() {
  console.log('Test: requires approval for classification');
  assert(requiresApprovalForClassification('public') === false, 'public does not require approval');
  assert(requiresApprovalForClassification('internal') === false, 'internal does not require approval');
  assert(requiresApprovalForClassification('confidential') === false, 'confidential does not require approval');
  assert(requiresApprovalForClassification('restricted') === true, 'restricted requires approval');
  assert(requiresApprovalForClassification('living-person') === true, 'living-person requires approval');
  assert(requiresApprovalForClassification('financial') === true, 'financial requires approval');
  assert(requiresApprovalForClassification('investor-private') === true, 'investor-private requires approval');
}

function testEntitlementCheckAcademy() {
  console.log('Test: entitlement check for academy');
  const ctx = makeCtx();
  const result = checkEntitlementForAction(ctx, 'academy:submit');
  assert(result.allowed === false, 'academy:submit denied without pass');

  const ctxWithPass = makeCtx({
    entitlements: {
      ...makeCtx().entitlements,
      academy: { pass: true, tracks_enabled: ['basic'], lessons_limit: 'unlimited', cert_attempts: 3, cert_discount: 0 },
    },
  });
  const result2 = checkEntitlementForAction(ctxWithPass, 'academy:submit');
  assert(result2.allowed === true, 'academy:submit allowed with pass');
}

function testEntitlementCheckCert() {
  console.log('Test: entitlement check for cert');
  const ctx = makeCtx();
  const result = checkEntitlementForAction(ctx, 'cert:request');
  assert(result.allowed === false, 'cert:request denied without fee paid');

  const ctxWithFee = makeCtx({
    entitlements: {
      ...makeCtx().entitlements,
      custom: { 'cert.fee.paid': true },
    },
  });
  const result2 = checkEntitlementForAction(ctxWithFee, 'cert:request');
  assert(result2.allowed === true, 'cert:request allowed with fee paid');
}

function main() {
  console.log('=== @nai/policy-engine unit tests ===\n');
  testBasicAllow();
  testMissingPermission();
  testSensitiveAction();
  testApprovalGateAll();
  testApprovalGateNone();
  testCrossTenantDenied();
  testCrossTenantSuperAdmin();
  testFinancialAction();
  testDataClassification();
  testRequiresApprovalForClassification();
  testEntitlementCheckAcademy();
  testEntitlementCheckCert();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
