/**
 * @nai/entitlement — unit tests.
 */

import {
  InMemoryEntitlementStore,
  setEntitlementStore,
  resolveEntitlements,
  checkCommandQuota,
  checkTokenQuota,
  checkAcademyAccess,
  checkModelTierAccess,
  canUseModelTier,
} from './index';

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

async function testResolveStartPlan() {
  console.log('Test: resolve Start plan entitlements');
  const store = new InMemoryEntitlementStore();
  setEntitlementStore(store);

  const ent = await resolveEntitlements('u1', 't1', 'nguyen-start');
  assert(ent.machine.plan === 'free', 'Start plan is free');
  assert(ent.machine.model_tier === 'free', 'Start model tier is free');
  assert(ent.machine.command_quota === 10, 'Start has 10 commands/day');
  assert(ent.machine.tokens_quota === 50000, 'Start has 50K tokens/month');
  assert(ent.machine.approval_required === 'all', 'Start requires all approvals');
  assert(ent.academy.pass === false, 'Start has no Academy Pass');
}

async function testResolveFounderPlan() {
  console.log('Test: resolve Founder plan entitlements');
  const store = new InMemoryEntitlementStore();
  setEntitlementStore(store);

  const ent = await resolveEntitlements('u1', 't1', 'nguyen-founder');
  assert(ent.machine.plan === 'founder', 'Founder plan is founder');
  assert(ent.machine.model_tier === 'pro', 'Founder model tier is pro');
  assert(ent.machine.command_quota === 1000, 'Founder has 1000 commands/day');
  assert(ent.machine.approval_required === 'sensitive', 'Founder requires sensitive approval');
  assert(Array.isArray(ent.machine.agents_enabled) && ent.machine.agents_enabled.length === 7, 'Founder has 7 agents');
}

async function testCommandQuota() {
  console.log('Test: command quota enforcement');
  const store = new InMemoryEntitlementStore();
  setEntitlementStore(store);

  // Start plan: 10 commands/day
  const check1 = await checkCommandQuota('u1', 't1', 'nguyen-start');
  assert(check1.allowed === true, 'first command allowed');
  assert(check1.remaining === 10, '10 remaining');
  assert(check1.limit === 10, 'limit is 10');

  // Use 10 commands
  for (let i = 0; i < 10; i++) {
    await store.recordUsage('u1', 't1', 'command', 1);
  }

  const check2 = await checkCommandQuota('u1', 't1', 'nguyen-start');
  assert(check2.allowed === false, 'quota exhausted');
  assert(check2.remaining === 0, '0 remaining');
  assert(check2.reason === 'command quota exhausted', 'reason correct');
}

async function testTokenQuota() {
  console.log('Test: token quota enforcement');
  const store = new InMemoryEntitlementStore();
  setEntitlementStore(store);

  // Personal plan: 500K tokens/month
  const check = await checkTokenQuota('u1', 't1', 'nguyen-personal', 100000);
  assert(check.allowed === true, '100K tokens allowed within 500K');
  assert(check.remaining === 500000, '500K remaining');

  // Use 450K tokens
  await store.recordUsage('u1', 't1', 'tokens', 450000);
  const check2 = await checkTokenQuota('u1', 't1', 'nguyen-personal', 100000);
  assert(check2.allowed === false, '100K tokens not allowed when only 50K remaining');
  assert(check2.reason === 'token quota insufficient', 'reason correct');
}

async function testAcademyAccess() {
  console.log('Test: academy access');
  const store = new InMemoryEntitlementStore();
  setEntitlementStore(store);

  // Without Academy Pass — free track only, 5 lessons
  const access1 = await checkAcademyAccess('u1', 't1', 'nguyen-start');
  assert(access1.canLearn === true, 'can learn free intro without pass');
  assert(access1.canSubmit === false, 'cannot submit without pass');

  // Use 5 lessons
  for (let i = 0; i < 5; i++) {
    await store.recordUsage('u1', 't1', 'lesson', 1);
  }
  const access2 = await checkAcademyAccess('u1', 't1', 'nguyen-start');
  assert(access2.canLearn === false, 'cannot learn after 5 free lessons');
  assert(access2.reason === 'free lesson limit reached — upgrade to Academy Pass', 'upgrade CTA shown');

  // Grant Academy Pass
  store.resetUsage('u1');
  await store.grant({
    user_id: 'u1',
    tenant_id: 't1',
    key: 'academy.pass',
    value: true,
    source: 'add-on:academy-pass',
    granted_by: 'system',
    expires_at: null,
    revoked_at: null,
  });
  const access3 = await checkAcademyAccess('u1', 't1', 'nguyen-start');
  assert(access3.canLearn === true, 'can learn with Academy Pass');
  assert(access3.canSubmit === true, 'can submit with Academy Pass');
}

async function testModelTierGating() {
  console.log('Test: model tier gating');
  assert(canUseModelTier('free', 'free') === true, 'free can use free');
  assert(canUseModelTier('free', 'standard') === false, 'free cannot use standard');
  assert(canUseModelTier('standard', 'free') === true, 'standard can use free');
  assert(canUseModelTier('standard', 'standard') === true, 'standard can use standard');
  assert(canUseModelTier('standard', 'pro') === false, 'standard cannot use pro');
  assert(canUseModelTier('pro', 'pro') === true, 'pro can use pro');
  assert(canUseModelTier('pro', 'standard') === true, 'pro can use standard');
  assert(canUseModelTier('enterprise', 'pro') === true, 'enterprise can use pro');
}

async function testModelTierAccessCheck() {
  console.log('Test: model tier access check');
  const store = new InMemoryEntitlementStore();
  setEntitlementStore(store);

  const check1 = await checkModelTierAccess('u1', 't1', 'nguyen-start', 'free');
  assert(check1.allowed === true, 'Start can use free models');

  const check2 = await checkModelTierAccess('u1', 't1', 'nguyen-start', 'pro');
  assert(check2.allowed === false, 'Start cannot use pro models');
  assert(check2.reason !== null, 'denied has reason');

  const check3 = await checkModelTierAccess('u1', 't1', 'nguyen-founder', 'pro');
  assert(check3.allowed === true, 'Founder can use pro models');
}

async function main() {
  console.log('=== @nai/entitlement unit tests ===\n');
  await testResolveStartPlan();
  await testResolveFounderPlan();
  await testCommandQuota();
  await testTokenQuota();
  await testAcademyAccess();
  await testModelTierGating();
  await testModelTierAccessCheck();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
