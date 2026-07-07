/**
 * E2E Test: Model language policy enforcement.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md:
 * - Only Vietnamese and English are allowed
 * - Other languages are blocked
 * - Language policy is enforced on all model outputs
 */

import {
  InMemoryPolicyStore,
  setPolicyStore,
  checkLanguagePolicy,
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

async function testAllowVietnameseLanguage() {
  console.log('Test: allow Vietnamese language');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Xin chào',
    language: 'vi' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkLanguagePolicy('Xin chào', 'vi', context);
  assert(result.passed === true, 'Vietnamese allowed');
}

async function testAllowEnglishLanguage() {
  console.log('Test: allow English language');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Hello',
    language: 'en' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkLanguagePolicy('Hello', 'en', context);
  assert(result.passed === true, 'English allowed');
}

async function testBlockOtherLanguages() {
  console.log('Test: block other languages');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Bonjour',
    language: 'other' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkLanguagePolicy('Bonjour', 'other', context);
  assert(result.passed === false, 'other language blocked');
  assert(result.reason?.includes('not allowed'), 'reason mentions not allowed');
}

async function testBlockMixedLanguageWithoutVietnameseEnglish() {
  console.log('Test: block mixed language without Vietnamese/English');
  const store = new InMemoryPolicyStore();
  setPolicyStore(store);

  const context = {
    user_id: 'user-1',
    tenant_id: 'tenant-1',
    session_id: 'session-1',
    content: 'Guten Tag',
    language: 'other' as Language,
    data_classification: 'public' as DataClassification,
  };

  const result = await checkLanguagePolicy('Guten Tag', 'other', context);
  assert(result.passed === false, 'German blocked');
}

async function main() {
  console.log('=== Model language policy E2E ===\n');
  await testAllowVietnameseLanguage();
  await testAllowEnglishLanguage();
  await testBlockOtherLanguages();
  await testBlockMixedLanguageWithoutVietnameseEnglish();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
