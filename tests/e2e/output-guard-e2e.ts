/**
 * E2E Test: Output guard enforcement.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md:
 * - Every model output must pass identity, language, safety, privacy, approval, and evidence policy
 * - Output guard can block, modify, or allow output
 * - Blocked outputs are not returned to user
 */

import {
  InMemoryOutputGuardStore,
  setOutputGuardStore,
  guardOutput,
  listUserGuardResults,
  type Language,
  type DataClassification,
} from '@nai/output-guard';

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

async function testAllowSafeAndCompliantOutput() {
  console.log('Test: allow safe and compliant output');
  const guardStore = new InMemoryOutputGuardStore();
  const auditStore = new InMemoryAuditStore();
  setOutputGuardStore(guardStore);
  setAuditStore(auditStore);

  const result = await guardOutput(
    'user-1',
    'tenant-1',
    'session-1',
    'invocation-1',
    'Xin chào, tôi là AI Nguyễn',
    'vi' as Language,
    'public' as DataClassification
  );

  assert(result.action === 'allow', 'output is allowed');
  assert(result.policy_checks.identity.passed === true, 'identity check passed');
  assert(result.policy_checks.language.passed === true, 'language check passed');
  assert(result.policy_checks.safety.passed === true, 'safety check passed');
  assert(result.policy_checks.data_classification.passed === true, 'data classification check passed');
}

async function testBlockOutputWithIdentityPolicyViolation() {
  console.log('Test: block output with identity policy violation');
  const guardStore = new InMemoryOutputGuardStore();
  setOutputGuardStore(guardStore);

  const result = await guardOutput(
    'user-1',
    'tenant-1',
    'session-1',
    'invocation-1',
    'Welcome to Nguyên AI',
    'en' as Language,
    'public' as DataClassification
  );

  assert(result.action === 'block', 'output is blocked');
  assert(result.reason?.includes('Nguyên AI'), 'reason mentions banned brand');
  assert(result.policy_checks.identity.passed === false, 'identity check failed');
}

async function testBlockOutputWithSafetyPolicyViolation() {
  console.log('Test: block output with safety policy violation');
  const guardStore = new InMemoryOutputGuardStore();
  setOutputGuardStore(guardStore);

  const result = await guardOutput(
    'user-1',
    'tenant-1',
    'session-1',
    'invocation-1',
    'How to hack a system',
    'en' as Language,
    'public' as DataClassification
  );

  assert(result.action === 'block', 'output is blocked');
  assert(result.reason !== undefined, 'reason mentions harmful content');
  assert(result.policy_checks.safety.passed === false, 'safety check failed');
}

async function testRequireApprovalForSecretDataOutput() {
  console.log('Test: require approval for secret data output');
  const guardStore = new InMemoryOutputGuardStore();
  setOutputGuardStore(guardStore);

  const result = await guardOutput(
    'user-1',
    'tenant-1',
    'session-1',
    'invocation-1',
    'Secret data content',
    'en' as Language,
    'secret' as DataClassification
  );

  assert(result.action === 'require_approval', 'approval is required');
  assert(result.reason?.includes('approval'), 'reason mentions approval');
  assert(result.policy_checks.data_classification.passed === false, 'data classification check failed');
}

async function testRecordAllGuardResultsInAuditLog() {
  console.log('Test: record all guard results in audit log');
  const guardStore = new InMemoryOutputGuardStore();
  const auditStore = new InMemoryAuditStore();
  setOutputGuardStore(guardStore);
  setAuditStore(auditStore);

  await guardOutput('user-1', 'tenant-1', 'session-1', 'inv-1', 'Test', 'vi', 'public');
  await guardOutput('user-1', 'tenant-1', 'session-1', 'inv-2', 'Test', 'en', 'public');
  await guardOutput('user-1', 'tenant-1', 'session-1', 'inv-3', 'Test', 'vi', 'public');

  const results = await listUserGuardResults('user-1', 'tenant-1');
  assert(results.length === 3, '3 guard results recorded');

  const auditEvents = await queryAuditLog({ action: 'output_guarded' });
  assert(auditEvents.length >= 3, 'audit events logged');
}

async function main() {
  console.log('=== Output guard E2E ===\n');
  await testAllowSafeAndCompliantOutput();
  await testBlockOutputWithIdentityPolicyViolation();
  await testBlockOutputWithSafetyPolicyViolation();
  await testRequireApprovalForSecretDataOutput();
  await testRecordAllGuardResultsInAuditLog();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
