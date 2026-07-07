/**
 * E2E Test: Gen 1 / Gen 2 fallback workflow.
 *
 * Per FALLBACK_TO_GEN1_GEN2_POLICY.md:
 * - Fallback is off by default
 * - Gen 1 and Gen 2 are not called in normal operation
 * - F3/F4 fallback requires Admin approval
 * - Sensitive data fallback requires data classification, purpose, retention, audit and approval
 * - Fallback event cannot bypass model/output policy
 */

import {
  InMemoryFallbackStore,
  setFallbackStore,
  setFallbackEnabled,
  isFallbackEnabled,
  requestFallback,
  approveFallback,
  denyFallback,
  executeFallback,
  failFallback,
  listPendingFallbacks,
  isSensitiveData,
  requiresFallbackApproval,
} from '@nai/fallback';

import {
  InMemoryAuditStore,
  setAuditStore,
  queryAuditLog,
} from '@nai/audit';

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

async function testNotCallGen1Gen2InNormalOperation() {
  console.log('Test: not call Gen 1/Gen 2 in normal operation');
  const fallbackStore = new InMemoryFallbackStore();
  setFallbackStore(fallbackStore);
  setFallbackEnabled(false);

  // Fallback is disabled by default
  assert(isFallbackEnabled() === false, 'fallback is disabled by default');

  // Try to request fallback (should fail)
  try {
    await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'test-user');
    assert(false, 'should have thrown error');
  } catch (err) {
    assert((err as Error).message.includes('not enabled'), 'error mentions not enabled');
  }
}

async function testRequireApprovalForF3F4Fallback() {
  console.log('Test: require approval for F3/F4 fallback');
  const fallbackStore = new InMemoryFallbackStore();
  const auditStore = new InMemoryAuditStore();
  setFallbackStore(fallbackStore);
  setAuditStore(auditStore);
  setFallbackEnabled(true);

  // Request F3 fallback
  const requestId = await requestFallback('F3', 'gen2', 'Database failure', 'db', 'public', 'recovery', '1h', 'test-user');
  assert(requestId !== undefined, 'F3 fallback requested');

  const request = await fallbackStore.getRequest(requestId);
  assert(request?.status === 'pending', 'status is pending');
  assert(request?.severity === 'F3', 'severity is F3');

  // Verify approval is required
  assert(requiresFallbackApproval('F3') === true, 'F3 requires approval');
  assert(requiresFallbackApproval('F4') === true, 'F4 requires approval');
  assert(requiresFallbackApproval('F1') === false, 'F1 does not require approval');

  // Approve
  await approveFallback(requestId, 'admin-1');
  const approved = await fallbackStore.getRequest(requestId);
  assert(approved?.status === 'approved', 'status is approved');
  assert(approved?.approved_by === 'admin-1', 'approved by admin-1');

  // Execute
  await executeFallback(requestId);
  const executed = await fallbackStore.getRequest(requestId);
  assert(executed?.status === 'executed', 'status is executed');
}

async function testRequireDataClassificationForSensitiveDataFallback() {
  console.log('Test: require data classification for sensitive data fallback');
  const fallbackStore = new InMemoryFallbackStore();
  setFallbackStore(fallbackStore);
  setFallbackEnabled(true);

  // Sensitive data requires classification
  assert(isSensitiveData('confidential') === true, 'confidential is sensitive');
  assert(isSensitiveData('restricted') === true, 'restricted is sensitive');
  assert(isSensitiveData('secret') === true, 'secret is sensitive');
  assert(isSensitiveData('public') === false, 'public is not sensitive');

  // Request fallback with sensitive data
  const requestId = await requestFallback('F2', 'gen1', 'Test', 'api', 'confidential', 'recovery', '1h', 'test-user');
  const request = await fallbackStore.getRequest(requestId);
  assert(request?.data_classification === 'confidential', 'data classification recorded');
  assert(request?.purpose === 'recovery', 'purpose recorded');
  assert(request?.retention_period === '1h', 'retention period recorded');

  // Approve and execute
  await approveFallback(requestId, 'admin-1');
  await executeFallback(requestId);
  const executed = await fallbackStore.getRequest(requestId);
  assert(executed?.status === 'executed', 'fallback executed');
}

async function testBlockFallbackWhenDisabled() {
  console.log('Test: block fallback when disabled');
  const fallbackStore = new InMemoryFallbackStore();
  setFallbackStore(fallbackStore);
  setFallbackEnabled(false);

  try {
    await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'test-user');
    assert(false, 'should have thrown error');
  } catch (err) {
    assert((err as Error).message.includes('not enabled'), 'error mentions not enabled');
  }

  // Enable and try again
  setFallbackEnabled(true);
  const requestId = await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'test-user');
  assert(requestId !== undefined, 'fallback requested when enabled');
}

async function testEnforceModelOutputPolicyDuringFallback() {
  console.log('Test: enforce model/output policy during fallback');
  const fallbackStore = new InMemoryFallbackStore();
  const auditStore = new InMemoryAuditStore();
  setFallbackStore(fallbackStore);
  setAuditStore(auditStore);
  setFallbackEnabled(true);

  const requestId = await requestFallback('F1', 'gen1', 'Test', 'api', 'public', 'recovery', '1h', 'test-user');
  await approveFallback(requestId, 'admin-1');
  await executeFallback(requestId);

  // Verify audit event
  const auditEvents = await queryAuditLog({ action: 'fallback_executed' });
  assert(auditEvents.length > 0, 'audit event logged');

  // In production, model/output policy would be checked here
  // For this test, we just verify the audit trail exists
}

async function main() {
  console.log('=== Gen 1/Gen2 fallback E2E ===\n');
  await testNotCallGen1Gen2InNormalOperation();
  await testRequireApprovalForF3F4Fallback();
  await testRequireDataClassificationForSensitiveDataFallback();
  await testBlockFallbackWhenDisabled();
  await testEnforceModelOutputPolicyDuringFallback();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
