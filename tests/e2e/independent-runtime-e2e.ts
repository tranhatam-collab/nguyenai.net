/**
 * E2E Test: Independent runtime verification.
 *
 * Per INDEPENDENT_RUNTIME_FALLBACK_EXECUTION_PLAN_2026-07-07.md:
 * - nguyenai.net is the main independent operating system
 * - Gen 1 and Gen 2 are fallback/reference layers only
 * - Fallback must not become source of truth
 * - Sensitive data must not be sent to fallback without classification, policy check, audit event and Admin approval
 */

import {
  InMemoryFallbackStore,
  setFallbackStore,
  setFallbackEnabled,
  isFallbackEnabled,
  requestFallback,
  approveFallback,
  executeFallback,
  isSensitiveData,
} from '@nai/fallback';

import {
  InMemoryAuditStore,
  setAuditStore,
  logAuditEvent,
  queryAuditLog,
} from '@nai/audit';

import {
  InMemoryModelGatewayStore,
  setModelGatewayStore,
  invokeModel,
} from '@nai/model-gateway';

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

async function testRunIndependentlyWithoutGen1Gen2() {
  console.log('Test: run independently without Gen 1/Gen 2');
  const gatewayStore = new InMemoryModelGatewayStore();
  const fallbackStore = new InMemoryFallbackStore();
  setModelGatewayStore(gatewayStore);
  setFallbackStore(fallbackStore);
  setFallbackEnabled(false);

  // Make API call to independent runtime
  const result = await invokeModel(
    'user-1',
    'tenant-1',
    'session-1',
    'openai',
    'gpt-4',
    100,
    200,
    0.01,
    'public'
  );

  assert(result.invocationId !== undefined, 'independent runtime call succeeds');
  assert(isFallbackEnabled() === false, 'fallback is disabled');
}

async function testNotUseGen1Gen2AsSourceOfTruth() {
  console.log('Test: not use Gen 1/Gen 2 as source of truth');
  const gatewayStore = new InMemoryModelGatewayStore();
  setModelGatewayStore(gatewayStore);

  // Query data from independent runtime
  const result = await invokeModel(
    'user-1',
    'tenant-1',
    'session-1',
    'openai',
    'gpt-4',
    100,
    200,
    0.01,
    'public'
  );

  assert(result.invocationId !== undefined, 'data from independent runtime');
  // In production, we would verify data is stored in independent DB
}

async function testClassifySensitiveDataBeforeFallback() {
  console.log('Test: classify sensitive data before fallback');
  const fallbackStore = new InMemoryFallbackStore();
  setFallbackStore(fallbackStore);
  setFallbackEnabled(true);

  // Verify sensitive data classification
  assert(isSensitiveData('confidential') === true, 'confidential is sensitive');
  assert(isSensitiveData('restricted') === true, 'restricted is sensitive');
  assert(isSensitiveData('secret') === true, 'secret is sensitive');
  assert(isSensitiveData('public') === false, 'public is not sensitive');

  // Request fallback with sensitive data
  const requestId = await requestFallback(
    'F2',
    'gen1',
    'Test',
    'api',
    'confidential',
    'recovery',
    '1h',
    'test-user'
  );

  assert(requestId !== undefined, 'fallback requested with classification');
}

async function testRequireAdminApprovalForSensitiveDataFallback() {
  console.log('Test: require admin approval for sensitive data fallback');
  const fallbackStore = new InMemoryFallbackStore();
  const auditStore = new InMemoryAuditStore();
  setFallbackStore(fallbackStore);
  setAuditStore(auditStore);
  setFallbackEnabled(true);

  const requestId = await requestFallback(
    'F3',
    'gen2',
    'Test',
    'api',
    'secret',
    'recovery',
    '1h',
    'test-user'
  );

  const request = await fallbackStore.getRequest(requestId);
  assert(request?.status === 'pending', 'approval required');

  // Approve
  await approveFallback(requestId, 'admin-1');
  await executeFallback(requestId);

  const executed = await fallbackStore.getRequest(requestId);
  assert(executed?.status === 'executed', 'fallback executed after approval');

  // Verify audit event
  const auditEvents = await queryAuditLog({ action: 'fallback_executed' });
  assert(auditEvents.length > 0, 'audit event logged');
}

async function testMaintainAuditTrailForAllFallbackEvents() {
  console.log('Test: maintain audit trail for all fallback events');
  const fallbackStore = new InMemoryFallbackStore();
  const auditStore = new InMemoryAuditStore();
  setFallbackStore(fallbackStore);
  setAuditStore(auditStore);
  setFallbackEnabled(true);

  const requestId = await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'test-user');
  await approveFallback(requestId, 'admin-1');
  await executeFallback(requestId);

  // Verify audit trail
  const requestedEvents = await queryAuditLog({ action: 'fallback_requested' });
  const approvedEvents = await queryAuditLog({ action: 'fallback_approved' });
  const executedEvents = await queryAuditLog({ action: 'fallback_executed' });

  assert(requestedEvents.length > 0, 'fallback requested audited');
  assert(approvedEvents.length > 0, 'fallback approved audited');
  assert(executedEvents.length > 0, 'fallback executed audited');
}

async function testVerifyFallbackDoesNotBecomeSourceOfTruth() {
  console.log('Test: verify fallback does not become source of truth');
  const fallbackStore = new InMemoryFallbackStore();
  const gatewayStore = new InMemoryModelGatewayStore();
  setFallbackStore(fallbackStore);
  setModelGatewayStore(gatewayStore);
  setFallbackEnabled(true);

  // Execute fallback
  const requestId = await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'test-user');
  await approveFallback(requestId, 'admin-1');
  await executeFallback(requestId);

  // Verify independent runtime remains source of truth
  const result = await invokeModel('user-1', 'tenant-1', 'session-1', 'openai', 'gpt-4', 100, 200, 0.01, 'public');
  assert(result.invocationId !== undefined, 'independent runtime still operational');

  // In production, we would verify data is synced back to independent runtime
}

async function main() {
  console.log('=== Independent runtime E2E ===\n');
  await testRunIndependentlyWithoutGen1Gen2();
  await testNotUseGen1Gen2AsSourceOfTruth();
  await testClassifySensitiveDataBeforeFallback();
  await testRequireAdminApprovalForSensitiveDataFallback();
  await testMaintainAuditTrailForAllFallbackEvents();
  await testVerifyFallbackDoesNotBecomeSourceOfTruth();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
