/**
 * @nai/self-heal — unit tests.
 */

import {
  InMemorySelfHealStore,
  setSelfHealStore,
  detectIssue,
  diagnoseIssue,
  proposePatch,
  runTests,
  requestPreviewApproval,
  deployPreview,
  verifyPreview,
  requestProductionApproval,
  deployProduction,
  completeSelfHeal,
  failSelfHeal,
  denySelfHeal,
  canMutateData,
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

async function testDetectIssue() {
  console.log('Test: detect issue');
  const store = new InMemorySelfHealStore();
  setSelfHealStore(store);

  const id = await detectIssue('test-component', 'Test issue', 'system');
  assert(id !== undefined, 'attempt created');
  assert(id.length === 36, 'attempt ID is UUID');

  const attempt = await store.getAttempt(id);
  assert(attempt !== null, 'attempt retrieved');
  assert(attempt?.status === 'detected', 'status is detected');
  assert(attempt?.component === 'test-component', 'component matches');
}

async function testSelfHealWorkflow() {
  console.log('Test: self-heal workflow');
  const store = new InMemorySelfHealStore();
  setSelfHealStore(store);

  const id = await detectIssue('api', 'API error', 'system');
  await diagnoseIssue(id, 'Root cause found');
  await proposePatch(id, 'Fix bug', 'const fix = true');
  await runTests(id, 'All tests pass');

  const attempt = await store.getAttempt(id);
  assert(attempt?.status === 'testing', 'status is testing');
  assert(attempt?.diagnosis === 'Root cause found', 'diagnosis set');
  assert(attempt?.patch_code === 'const fix = true', 'patch code set');
}

async function testPreviewApproval() {
  console.log('Test: preview approval');
  const store = new InMemorySelfHealStore();
  setSelfHealStore(store);

  const id = await detectIssue('api', 'Test', 'system');
  const approvalId = await requestPreviewApproval(id, 'admin-1');

  const attempt = await store.getAttempt(id);
  assert(attempt?.status === 'awaiting_preview_approval', 'status is awaiting_preview_approval');
  assert(attempt?.preview_approval_request_id === approvalId, 'approval ID set');
}

async function testProductionApproval() {
  console.log('Test: production approval');
  const store = new InMemorySelfHealStore();
  setSelfHealStore(store);

  const id = await detectIssue('api', 'Test', 'system');
  const approvalId = await requestProductionApproval(id, 'admin-1');

  const attempt = await store.getAttempt(id);
  assert(attempt?.status === 'awaiting_production_approval', 'status is awaiting_production_approval');
  assert(attempt?.production_approval_request_id === approvalId, 'approval ID set');
}

async function testCompleteSelfHeal() {
  console.log('Test: complete self-heal');
  const store = new InMemorySelfHealStore();
  setSelfHealStore(store);

  const id = await detectIssue('api', 'Test', 'system');
  await deployPreview(id, 'preview-123');
  await verifyPreview(id, 'Preview verified');
  await deployProduction(id, 'prod-456');
  await completeSelfHeal(id, 'Production verified');

  const attempt = await store.getAttempt(id);
  assert(attempt?.status === 'completed', 'status is completed');
  assert(attempt?.completed_at !== null, 'completed_at set');
}

async function testFailSelfHeal() {
  console.log('Test: fail self-heal');
  const store = new InMemorySelfHealStore();
  setSelfHealStore(store);

  const id = await detectIssue('api', 'Test', 'system');
  await failSelfHeal(id, 'Deployment failed');

  const attempt = await store.getAttempt(id);
  assert(attempt?.status === 'failed', 'status is failed');
  assert(attempt?.error === 'Deployment failed', 'error set');
}

async function testCanMutateData() {
  console.log('Test: can mutate data');
  const check1 = canMutateData({ operation: 'delete', target_type: 'user_data' });
  assert(check1.allowed === false, 'user_data mutation not allowed');
  assert(check1.reason !== undefined, 'reason set');

  const check2 = canMutateData({ operation: 'read', target_type: 'user_data' });
  assert(check2.allowed === true, 'read is allowed');

  const check3 = canMutateData({ operation: 'mutation', target_type: 'secret' });
  assert(check3.allowed === false, 'secret mutation not allowed');

  const check4 = canMutateData({ operation: 'delete', target_type: 'other' });
  assert(check4.allowed === true, 'other is allowed');
}

async function main() {
  console.log('=== @nai/self-heal unit tests ===\n');
  await testDetectIssue();
  await testSelfHealWorkflow();
  await testPreviewApproval();
  await testProductionApproval();
  await testCompleteSelfHeal();
  await testFailSelfHeal();
  await testCanMutateData();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
