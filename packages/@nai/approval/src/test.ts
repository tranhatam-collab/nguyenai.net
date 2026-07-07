/**
 * @nai/approval — unit tests.
 */

import {
  InMemoryApprovalStore,
  setApprovalStore,
  requestApproval,
  approveRequest,
  denyRequest,
  markExecuted,
  checkApprovalStatus,
  listPendingApprovals,
} from './index.ts';
import { InMemoryAuditStore, setAuditStore, queryAuditLog } from '@nai/audit';

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

async function testRequestApproval() {
  console.log('Test: request approval');
  const approvalStore = new InMemoryApprovalStore();
  const auditStore = new InMemoryAuditStore();
  setApprovalStore(approvalStore);
  setAuditStore(auditStore);

  const id = await requestApproval({
    user_id: 'u1',
    tenant_id: 't1',
    action: 'memory:delete',
    resource: 'memory:m123',
    requested_by: 'u1',
    reason: 'cleaning up old data',
  });

  assert(typeof id === 'string' && id.length > 0, 'approval request returns id');
  const status = await checkApprovalStatus(id);
  assert(status === 'pending', 'new approval is pending');

  // Verify audit log
  const auditEvents = await queryAuditLog({ event_type: 'approval_requested' });
  assert(auditEvents.length === 1, '1 approval_requested audit event');
  assert(auditEvents[0].target === id, 'audit target is approval id');
}

async function testApproveFlow() {
  console.log('Test: approve flow');
  const approvalStore = new InMemoryApprovalStore();
  const auditStore = new InMemoryAuditStore();
  setApprovalStore(approvalStore);
  setAuditStore(auditStore);

  const id = await requestApproval({
    user_id: 'u1',
    tenant_id: 't1',
    action: 'vault:delete',
    resource: 'vault:f456',
    requested_by: 'u1',
  });

  await approveRequest(id, 'admin-1', 't1', 'looks safe');
  const status = await checkApprovalStatus(id);
  assert(status === 'approved', 'approval is approved');

  const grantEvents = await queryAuditLog({ event_type: 'approval_granted' });
  assert(grantEvents.length === 1, '1 approval_granted audit event');
}

async function testDenyFlow() {
  console.log('Test: deny flow');
  const approvalStore = new InMemoryApprovalStore();
  const auditStore = new InMemoryAuditStore();
  setApprovalStore(approvalStore);
  setAuditStore(auditStore);

  const id = await requestApproval({
    user_id: 'u1',
    tenant_id: 't1',
    action: 'data:export',
    resource: 'tenant:t1',
    requested_by: 'u1',
  });

  await denyRequest(id, 'admin-1', 't1', 'not allowed');
  const status = await checkApprovalStatus(id);
  assert(status === 'denied', 'approval is denied');

  const denyEvents = await queryAuditLog({ event_type: 'approval_denied' });
  assert(denyEvents.length === 1, '1 approval_denied audit event');
}

async function testExecuteFlow() {
  console.log('Test: execute flow');
  const approvalStore = new InMemoryApprovalStore();
  const auditStore = new InMemoryAuditStore();
  setApprovalStore(approvalStore);
  setAuditStore(auditStore);

  const id = await requestApproval({
    user_id: 'u1',
    tenant_id: 't1',
    action: 'memory:delete',
    resource: 'memory:m789',
    requested_by: 'u1',
  });

  await approveRequest(id, 'admin-1', 't1');
  await markExecuted(id);
  const status = await checkApprovalStatus(id);
  assert(status === 'executed', 'approval is executed after markExecuted');

  const execEvents = await queryAuditLog({ event_type: 'sensitive_action_executed' });
  assert(execEvents.length === 1, '1 sensitive_action_executed audit event');
}

async function testCannotExecuteWithoutApproval() {
  console.log('Test: cannot execute without approval');
  const approvalStore = new InMemoryApprovalStore();
  setApprovalStore(approvalStore);

  const id = await requestApproval({
    user_id: 'u1',
    tenant_id: 't1',
    action: 'memory:delete',
    resource: 'memory:m000',
    requested_by: 'u1',
  });

  try {
    await markExecuted(id);
    assert(false, 'should throw when executing without approval');
  } catch (e) {
    assert((e as Error).message.includes('must be approved'), 'throws correct error');
  }
}

async function testCannotApproveNonPending() {
  console.log('Test: cannot approve non-pending');
  const approvalStore = new InMemoryApprovalStore();
  setApprovalStore(approvalStore);

  const id = await requestApproval({
    user_id: 'u1',
    tenant_id: 't1',
    action: 'memory:delete',
    resource: 'memory:m001',
    requested_by: 'u1',
  });

  await denyRequest(id, 'admin-1', 't1');
  try {
    await approveRequest(id, 'admin-2', 't1');
    assert(false, 'should throw when approving denied request');
  } catch (e) {
    assert((e as Error).message.includes('not pending'), 'throws correct error');
  }
}

async function testListPending() {
  console.log('Test: list pending');
  const approvalStore = new InMemoryApprovalStore();
  setApprovalStore(approvalStore);

  await requestApproval({ user_id: 'u1', tenant_id: 't1', action: 'a1', resource: 'r1', requested_by: 'u1' });
  await requestApproval({ user_id: 'u1', tenant_id: 't1', action: 'a2', resource: 'r2', requested_by: 'u1' });
  const id3 = await requestApproval({ user_id: 'u2', tenant_id: 't2', action: 'a3', resource: 'r3', requested_by: 'u2' });
  await approveRequest(id3, 'admin-1', 't2');

  const pending = await listPendingApprovals('u1', 't1');
  assert(pending.length === 2, '2 pending for t1');
}

async function testIDORCrossTenant() {
  console.log('Test: IDOR — cross-tenant approve denied');
  const approvalStore = new InMemoryApprovalStore();
  setApprovalStore(approvalStore);

  // User in tenant t1 creates approval
  const id = await requestApproval({
    user_id: 'u1',
    tenant_id: 't1',
    action: 'memory:delete',
    resource: 'memory:m-idor',
    requested_by: 'u1',
  });

  // User from tenant t2 tries to approve — must fail
  try {
    await approveRequest(id, 'attacker', 't2');
    assert(false, 'cross-tenant approve should throw');
  } catch (e) {
    assert((e as Error).message.includes('tenant'), 'cross-tenant approve throws tenant error');
  }

  // User from tenant t2 tries to deny — must fail
  try {
    await denyRequest(id, 'attacker', 't2');
    assert(false, 'cross-tenant deny should throw');
  } catch (e) {
    assert((e as Error).message.includes('tenant'), 'cross-tenant deny throws tenant error');
  }

  // Same-tenant approve still works
  await approveRequest(id, 'admin-1', 't1');
  const status = await checkApprovalStatus(id);
  assert(status === 'approved', 'same-tenant approve still works after IDOR check');
}

async function main() {
  console.log('=== @nai/approval unit tests ===\n');
  await testRequestApproval();
  await testApproveFlow();
  await testDenyFlow();
  await testExecuteFlow();
  await testCannotExecuteWithoutApproval();
  await testCannotApproveNonPending();
  await testListPending();
  await testIDORCrossTenant();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
  // User from tenant t2 tries to approve — must fail
  try {
    await approveRequest(id, 'attacker', 't2');
    assert(false, 'cross-tenant approve should throw');
  } catch (e) {
    assert((e as Error).message.includes('tenant'), 'cross-tenant approve throws tenant error');
  }

  // User from tenant t2 tries to deny — must fail
  try {
    await denyRequest(id, 'attacker', 't2');
    assert(false, 'cross-tenant deny should throw');
  } catch (e) {
    assert((e as Error).message.includes('tenant'), 'cross-tenant deny throws tenant error');
  }

  // Same-tenant approve still works
  await approveRequest(id, 'admin-1', 't1');
  const status = await checkApprovalStatus(id);
  assert(status === 'approved', 'same-tenant approve still works after IDOR check');
}

async function main() {
  console.log('=== @nai/approval unit tests ===\n');
  await testRequestApproval();
  await testApproveFlow();
  await testDenyFlow();
  await testExecuteFlow();
  await testCannotExecuteWithoutApproval();
  await testCannotApproveNonPending();
  await testListPending();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
