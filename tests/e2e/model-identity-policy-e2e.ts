/**
 * E2E Test: Model identity policy enforcement.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md:
 * - AI Nguyễn / AI Nguyen allowed for assistant identity (Founder-approved exception)
 * - Banned brand names are blocked
 * - Identity policy is enforced on all model outputs
 */

import {
  InMemoryPolicyStore,
  setPolicyStore,
  checkIdentityPolicy,
  type Language,
  type DataClassification,
} from '@nai/model-policy';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    steps.push(`  ✓ ${msg}`);
  } else {
    failed++;
    steps.push(`  ✗ ${msg}`);
    console.error(`  ✗ ${msg}`);
  }
}

async function testAllowAINGuyenForAssistantIdentity() {
  console.log('Test: allow AI Nguyễn for assistant identity');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Xin chào, tôi là AI Nguyễn',
    language: 'vi' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkIdentityPolicy('Xin chào, tôi là AI Nguyễn', context);
  assert(result.passed === true, 'AI Nguyễn allowed for assistant identity');
}

async function testAllowAINguyenForAssistantIdentity() {
  console.log('Test: allow AI Nguyen for assistant identity');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Hello, I am AI Nguyen',
    language: 'en' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkIdentityPolicy('Hello, I am AI Nguyen', context);
  assert(result.passed === true, 'AI Nguyen allowed for assistant identity');
}

async function testBlockBannedBrandNames() {
  console.log('Test: block banned brand names');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Welcome to Nguyên AI',
    language: 'vi' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkIdentityPolicy('Welcome to Nguyên AI', context);
  assert(result.passed === false, 'Nguyên AI blocked');
  assert(result.reason?.includes('Nguyên AI'), 'reason mentions banned name');
}

async function testBlockAINguyenAsPublicBrand() {
  console.log('Test: block AI Nguyen as public brand');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Our product is AI Nguyen',
    language: 'en' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkIdentityPolicy('Our product is AI Nguyen', context);
  assert(result.passed === false, 'AI Nguyen blocked as public brand');
}

async function main() {
  console.log('=== Model identity policy E2E ===\n');
  await testAllowAINGuyenForAssistantIdentity();
  await testAllowAINguyenForAssistantIdentity();
  await testBlockBannedBrandNames();
  await testBlockAINguyenAsPublicBrand();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
