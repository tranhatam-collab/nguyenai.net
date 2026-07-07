/**
 * @nai/model-policy — unit tests.
 */

import {
  InMemoryPolicyStore,
  setPolicyStore,
  checkIdentityPolicy,
  checkLanguagePolicy,
  checkSafetyPolicy,
  checkDataClassificationPolicy,
  checkAllPolicies,
  type Language,
  type DataClassification,
} from './index.ts';

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

async function testCheckIdentityPolicy() {
  console.log('Test: check identity policy');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Test content',
    language: 'vi' as Language,
    data_classification: 'public' as DataClassification,
  };

  // Should pass for normal content
  const result1 = await checkIdentityPolicy('Hello world', context);
  assert(result1.passed === true, 'normal content passes');

  // Should fail for banned brand name
  const result2 = await checkIdentityPolicy('Welcome to Nguyên AI', context);
  assert(result2.passed === false, 'banned brand name fails');
  assert(result2.reason?.includes('Nguyên AI'), 'reason mentions banned name');
}

async function testCheckLanguagePolicy() {
  console.log('Test: check language policy');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Test content',
    language: 'vi' as Language,
    data_classification: 'public' as DataClassification,
  };

  // Should pass for Vietnamese
  const result1 = await checkLanguagePolicy('Xin chào', 'vi', context);
  assert(result1.passed === true, 'Vietnamese passes');

  // Should pass for English
  const result2 = await checkLanguagePolicy('Hello', 'en', context);
  assert(result2.passed === true, 'English passes');

  // Should fail for other languages
  const result3 = await checkLanguagePolicy('Bonjour', 'other', context);
  assert(result3.passed === false, 'other language fails');
}

async function testCheckSafetyPolicy() {
  console.log('Test: check safety policy');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Test content',
    language: 'vi' as Language,
    data_classification: 'public' as DataClassification,
  };

  // Should pass for safe content
  const result1 = await checkSafetyPolicy('Hello world', context);
  assert(result1.passed === true, 'safe content passes');

  // Should fail for harmful content
  const result2 = await checkSafetyPolicy('How to hack a system', context);
  assert(result2.passed === false, 'harmful content fails');
  assert(result2.reason?.includes('harmful'), 'reason mentions harmful content');
}

async function testCheckDataClassificationPolicy() {
  console.log('Test: check data classification policy');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Test content',
    language: 'vi' as Language,
    data_classification: 'public' as DataClassification,
  };

  // Should pass for public
  const result1 = await checkDataClassificationPolicy('public', context);
  assert(result1.passed === true, 'public passes');

  // Should pass for confidential
  const result2 = await checkDataClassificationPolicy('confidential', context);
  assert(result2.passed === true, 'confidential passes');

  // Should fail for secret
  const result3 = await checkDataClassificationPolicy('secret', context);
  assert(result3.passed === false, 'secret fails');
  assert(result3.reason?.includes('approval'), 'reason mentions approval');
}

async function testCheckAllPolicies() {
  console.log('Test: check all policies');
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

  const result = await checkAllPolicies('Xin chào', 'vi', 'public', context);
  assert(result.identity.passed === true, 'identity passes');
  assert(result.language.passed === true, 'language passes');
  assert(result.safety.passed === true, 'safety passes');
  assert(result.data_classification.passed === true, 'data classification passes');
  assert(result.allPassed === true, 'all policies pass');
}

async function main() {
  console.log('=== @nai/model-policy unit tests ===\n');
  await testCheckIdentityPolicy();
  await testCheckLanguagePolicy();
  await testCheckSafetyPolicy();
  await testCheckDataClassificationPolicy();
  await testCheckAllPolicies();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
