/**
 * @nai/output-guard — unit tests.
 */

import {
  InMemoryOutputGuardStore,
  setOutputGuardStore,
  guardOutput,
  listUserGuardResults,
  type Language,
  type DataClassification,
} from './index.js';

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

async function testGuardOutputAllow() {
  console.log('Test: guard output (allow)');
  const store = new InMemoryOutputGuardStore();
  setOutputGuardStore(store);

  const result = await guardOutput(
    'user-1',
    'tenant-1',
    'session-1',
    'invocation-1',
    'Xin chào, tôi là AI Nguyễn',
    'vi' as Language,
    'public' as DataClassification
  );

  assert(result.action === 'allow', 'action is allow');
  assert(result.original_output === 'Xin chào, tôi là AI Nguyễn', 'original output preserved');
  assert(result.policy_checks.identity.passed === true, 'identity check passed');
  assert(result.policy_checks.language.passed === true, 'language check passed');
  assert(result.policy_checks.safety.passed === true, 'safety check passed');
  assert(result.policy_checks.data_classification.passed === true, 'data classification check passed');
}

async function testGuardOutputBlock() {
  console.log('Test: guard output (block)');
  const store = new InMemoryOutputGuardStore();
  setOutputGuardStore(store);

  const result = await guardOutput(
    'user-1',
    'tenant-1',
    'session-1',
    'invocation-1',
    'Welcome to Nguyên AI',
    'en' as Language,
    'public' as DataClassification
  );

  assert(result.action === 'block', 'action is block');
  assert(result.reason?.includes('Nguyên AI') ?? false, 'reason mentions banned brand');
  assert(result.policy_checks.identity.passed === false, 'identity check failed');
}

async function testGuardOutputRequireApproval() {
  console.log('Test: guard output (require approval)');
  const store = new InMemoryOutputGuardStore();
  setOutputGuardStore(store);

  const result = await guardOutput(
    'user-1',
    'tenant-1',
    'session-1',
    'invocation-1',
    'Secret data content',
    'en' as Language,
    'secret' as DataClassification
  );

  assert(result.action === 'require_approval', 'action is require_approval');
  assert(result.reason?.includes('approval') ?? false, 'reason mentions approval');
  assert(result.policy_checks.data_classification.passed === false, 'data classification check failed');
}

async function testListUserGuardResults() {
  console.log('Test: list user guard results');
  const store = new InMemoryOutputGuardStore();
  setOutputGuardStore(store);

  await guardOutput('user-1', 'tenant-1', 'session-1', 'inv-1', 'Test', 'vi', 'public');
  await guardOutput('user-1', 'tenant-1', 'session-1', 'inv-2', 'Test', 'en', 'public');
  await guardOutput('user-2', 'tenant-1', 'session-2', 'inv-3', 'Test', 'vi', 'public');

  const user1Results = await listUserGuardResults('user-1', 'tenant-1');
  assert(user1Results.length === 2, '2 results for user-1');

  const user2Results = await listUserGuardResults('user-2', 'tenant-1');
  assert(user2Results.length === 1, '1 result for user-2');
}

async function main() {
  console.log('=== @nai/output-guard unit tests ===\n');
  await testGuardOutputAllow();
  await testGuardOutputBlock();
  await testGuardOutputRequireApproval();
  await testListUserGuardResults();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
