/**
 * @nai/model-gateway — unit tests.
 */

import {
  InMemoryModelGatewayStore,
  setModelGatewayStore,
  setModelGatewayConfig,
  invokeModel,
  getInvocationReceipt,
  listUserInvocations,
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

async function testInvokeModel() {
  console.log('Test: invoke model');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);

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

  assert(result.invocationId !== undefined, 'invocation ID created');
  assert(result.receiptId !== undefined, 'receipt ID created');
  assert(result.invocationId.length === 36, 'invocation ID is UUID');
}

async function testGetInvocationReceipt() {
  console.log('Test: get invocation receipt');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);

  const result = await invokeModel('user-1', 'tenant-1', 'session-1', 'anthropic', 'claude-3', 50, 100, 0.005, 'public');
  const receipt = await getInvocationReceipt(result.invocationId);

  assert(receipt !== null, 'receipt retrieved');
  assert(receipt?.provider === 'anthropic', 'provider matches');
  assert(receipt?.model === 'claude-3', 'model matches');
  assert(receipt?.total_tokens === 150, 'total tokens correct');
}

async function testListUserInvocations() {
  console.log('Test: list user invocations');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);

  await invokeModel('user-1', 'tenant-1', 'session-1', 'openai', 'gpt-4', 100, 200, 0.01, 'public');
  await invokeModel('user-1', 'tenant-1', 'session-1', 'anthropic', 'claude-3', 50, 100, 0.005, 'public');
  await invokeModel('user-2', 'tenant-1', 'session-2', 'openai', 'gpt-4', 100, 200, 0.01, 'public');

  const user1Invocations = await listUserInvocations('user-1', 'tenant-1');
  assert(user1Invocations.length === 2, '2 invocations for user-1');

  const user2Invocations = await listUserInvocations('user-2', 'tenant-1');
  assert(user2Invocations.length === 1, '1 invocation for user-2');
}

async function testProviderNotAllowed() {
  console.log('Test: provider not allowed');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);
  setModelGatewayConfig({ allowedProviders: ['openai', 'anthropic'] });

  try {
    await invokeModel('user-1', 'tenant-1', 'session-1', 'google', 'gemini', 100, 200, 0.01, 'public');
    assert(false, 'should have thrown error');
  } catch (err) {
    assert((err as Error).message.includes('not allowed'), 'error message correct');
  }
}

async function testModelNotAllowed() {
  console.log('Test: model not allowed');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);
  setModelGatewayConfig({ allowedModels: ['gpt-4', 'claude-3'] });

  try {
    await invokeModel('user-1', 'tenant-1', 'session-1', 'openai', 'gpt-3.5', 100, 200, 0.01, 'public');
    assert(false, 'should have thrown error');
  } catch (err) {
    assert((err as Error).message.includes('not allowed'), 'error message correct');
  }
}

async function main() {
  console.log('=== @nai/model-gateway unit tests ===\n');
  await testInvokeModel();
  await testGetInvocationReceipt();
  await testListUserInvocations();
  await testProviderNotAllowed();
  await testModelNotAllowed();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
