/**
 * @nai/fallback — unit tests.
 */

import {
  InMemoryFallbackStore,
  setFallbackStore,
  setFallbackEnabled,
  requestFallback,
  approveFallback,
  denyFallback,
  executeFallback,
  failFallback,
  listPendingFallbacks,
  isSensitiveData,
  requiresFallbackApproval,
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

async function testRequestFallback() {
  console.log('Test: request fallback');
  const store = new InMemoryFallbackStore();
  setFallbackStore(store);
  setFallbackEnabled(true);

  const id = await requestFallback(
    'F1',
    'gen1',
    'API timeout',
    'api',
    'public',
    'recovery',
    '1h',
    'system'
  );

  assert(id !== undefined, 'fallback request created');
  assert(id.length === 36, 'request ID is UUID');

  const request = await store.getRequest(id);
  assert(request !== null, 'request retrieved');
  assert(request?.status === 'pending', 'status is pending');
  assert(request?.severity === 'F1', 'severity is F1');
}

async function testFallbackDisabled() {
  console.log('Test: fallback disabled');
  const store = new InMemoryFallbackStore();
  setFallbackStore(store);
  setFallbackEnabled(false);

  try {
    await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'system');
    assert(false, 'should have thrown error');
  } catch (err) {
    assert((err as Error).message.includes('not enabled'), 'error message correct');
  }
}

async function testApproveFallback() {
  console.log('Test: approve fallback');
  const store = new InMemoryFallbackStore();
  setFallbackStore(store);
  setFallbackEnabled(true);

  const id = await requestFallback('F3', 'gen2', 'Database failure', 'db', 'public', 'recovery', '1h', 'system');
  await approveFallback(id, 'admin-1');

  const request = await store.getRequest(id);
  assert(request?.status === 'approved', 'status is approved');
  assert(request?.approved_by === 'admin-1', 'approved by admin-1');
  assert(request?.approved_at !== null, 'approved_at set');
}

async function testDenyFallback() {
  console.log('Test: deny fallback');
  const store = new InMemoryFallbackStore();
  setFallbackStore(store);
  setFallbackEnabled(true);

  const id = await requestFallback('F3', 'gen2', 'Test', 'api', 'public', 'recovery', '1h', 'system');
  await denyFallback(id, 'admin-1');

  const request = await store.getRequest(id);
  assert(request?.status === 'denied', 'status is denied');
}

async function testExecuteFallback() {
  console.log('Test: execute fallback');
  const store = new InMemoryFallbackStore();
  setFallbackStore(store);
  setFallbackEnabled(true);

  const id = await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'system');
  await approveFallback(id, 'admin-1');
  await executeFallback(id);

  const request = await store.getRequest(id);
  assert(request?.status === 'executed', 'status is executed');
  assert(request?.executed_at !== null, 'executed_at set');
}

async function testFailFallback() {
  console.log('Test: fail fallback');
  const store = new InMemoryFallbackStore();
  setFallbackStore(store);
  setFallbackEnabled(true);

  const id = await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'system');
  await approveFallback(id, 'admin-1');
  await failFallback(id, 'Connection failed');

  const request = await store.getRequest(id);
  assert(request?.status === 'failed', 'status is failed');
  assert(request?.error === 'Connection failed', 'error set');
}

async function testListPendingFallbacks() {
  console.log('Test: list pending fallbacks');
  const store = new InMemoryFallbackStore();
  setFallbackStore(store);
  setFallbackEnabled(true);

  await requestFallback('F1', 'gen1', 'Test 1', 'api', 'public', 'recovery', '1h', 'system');
  await requestFallback('F2', 'gen2', 'Test 2', 'db', 'public', 'recovery', '1h', 'system');
  await requestFallback('F3', 'gen1', 'Test 3', 'api', 'public', 'recovery', '1h', 'system');

  const pending = await listPendingFallbacks();
  assert(pending.length === 3, '3 pending fallbacks');
}

async function testIsSensitiveData() {
  console.log('Test: is sensitive data');
  assert(isSensitiveData('public') === false, 'public is not sensitive');
  assert(isSensitiveData('confidential') === true, 'confidential is sensitive');
  assert(isSensitiveData('restricted') === true, 'restricted is sensitive');
  assert(isSensitiveData('secret') === true, 'secret is sensitive');
}

async function testRequiresFallbackApproval() {
  console.log('Test: requires fallback approval');
  assert(requiresFallbackApproval('F1') === false, 'F1 does not require approval');
  assert(requiresFallbackApproval('F2') === false, 'F2 does not require approval');
  assert(requiresFallbackApproval('F3') === true, 'F3 requires approval');
  assert(requiresFallbackApproval('F4') === true, 'F4 requires approval');
  assert(requiresFallbackApproval('F5') === false, 'F5 does not require approval');
}

async function main() {
  console.log('=== @nai/fallback unit tests ===\n');
  await testRequestFallback();
  await testFallbackDisabled();
  await testApproveFallback();
  await testDenyFallback();
  await testExecuteFallback();
  await testFailFallback();
  await testListPendingFallbacks();
  await testIsSensitiveData();
  await testRequiresFallbackApproval();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
