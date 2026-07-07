/**
 * @nai/admin-approval — unit tests.
 */

import {
  InMemoryApprovalStore,
  setApprovalStore,
  requestApproval,
  approveRequest,
  denyRequest,
  checkApprovalStatus,
  listPendingApprovals,
  checkProtectedData,
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

async function testRequestApproval() {
  console.log('Test: request approval');
  const store = new InMemoryApprovalStore();
  setApprovalStore(store);

  const id = await requestApproval('self_heal', 'preview', 'Test approval', 'Test description', 'admin-1');
  assert(id !== undefined, 'approval request created');
  assert(id.length === 36, 'request ID is UUID');

  const request = await store.getRequest(id);
  assert(request !== null, 'request retrieved');
  assert(request?.status === 'pending', 'status is pending');
  assert(request?.category === 'self_heal', 'category is self_heal');
}

async function testApproveRequest() {
  console.log('Test: approve request');
  const store = new InMemoryApprovalStore();
  setApprovalStore(store);

  const id = await requestApproval('deployment', 'production', 'Deploy to prod', 'Test', 'admin-1');
  await approveRequest(id, 'admin-2', 'Approved after review');

  const request = await store.getRequest(id);
  assert(request?.status === 'approved', 'status is approved');
  assert(request?.approver === 'admin-2', 'approver is admin-2');
  assert(request?.approved_at !== null, 'approved_at set');
  assert(request?.reason === 'Approved after review', 'reason is logged');
}

async function testDenyRequest() {
  console.log('Test: deny request');
  const store = new InMemoryApprovalStore();
  setApprovalStore(store);

  const id = await requestApproval('secret_rotation', 'preview', 'Rotate secret', 'Test', 'admin-1');
  await denyRequest(id, 'admin-2', 'Security risk identified');

  const request = await store.getRequest(id);
  assert(request?.status === 'denied', 'status is denied');
  assert(request?.denied_at !== null, 'denied_at set');
  assert(request?.reason === 'Security risk identified', 'reason is logged');
}

async function testCheckApprovalStatus() {
  console.log('Test: check approval status');
  const store = new InMemoryApprovalStore();
  setApprovalStore(store);

  const id = await requestApproval('other', 'preview', 'Test', 'Test', 'admin-1');
  const status = await checkApprovalStatus(id);
  assert(status === 'pending', 'status is pending');

  await approveRequest(id, 'admin-2', 'Approved for testing');
  const status2 = await checkApprovalStatus(id);
  assert(status2 === 'approved', 'status is approved after approval');
}

async function testListPendingApprovals() {
  console.log('Test: list pending approvals');
  const store = new InMemoryApprovalStore();
  setApprovalStore(store);

  await requestApproval('self_heal', 'preview', 'Test 1', 'Test', 'admin-1');
  await requestApproval('deployment', 'production', 'Test 2', 'Test', 'admin-1');
  await requestApproval('self_heal', 'preview', 'Test 3', 'Test', 'admin-1');

  const pending = await listPendingApprovals();
  assert(pending.length === 3, '3 pending approvals');

  const selfHeal = await listPendingApprovals('self_heal');
  assert(selfHeal.length === 2, '2 self_heal pending');
}

async function testCheckProtectedData() {
  console.log('Test: check protected data');
  const check1 = checkProtectedData({ operation: 'delete', target_type: 'user_data' });
  assert(check1.isProtected === true, 'user_data is protected');
  assert(check1.reason === 'Protected data type: user_data', 'reason set');

  const check2 = checkProtectedData({ operation: 'read', target_type: 'user_data' });
  assert(check2.isProtected === false, 'read is not protected');

  const check3 = checkProtectedData({ operation: 'mutation', target_type: 'secret' });
  assert(check3.isProtected === true, 'secret is protected');

  const check4 = checkProtectedData({ operation: 'delete', target_type: 'other' });
  assert(check4.isProtected === false, 'other is not protected');
}

async function testRequireReason() {
  console.log('Test: require reason for approval/deny');
  const store = new InMemoryApprovalStore();
  setApprovalStore(store);

  const id = await requestApproval('deployment', 'production', 'Test', 'Test', 'admin-1');

  let errorCaught = false;
  try {
    await approveRequest(id, 'admin-2', '');
  } catch (e) {
    errorCaught = true;
  }
  assert(errorCaught === true, 'empty reason throws error');

  errorCaught = false;
  try {
    await denyRequest(id, 'admin-2', '   ');
  } catch (e) {
    errorCaught = true;
  }
  assert(errorCaught === true, 'whitespace-only reason throws error');
}

async function main() {
  console.log('=== @nai/admin-approval unit tests ===\n');
  await testRequestApproval();
  await testApproveRequest();
  await testDenyRequest();
  await testCheckApprovalStatus();
  await testListPendingApprovals();
  await testCheckProtectedData();
  await testRequireReason();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
