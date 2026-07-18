/**
 * @nai/model-gateway — unit tests.
 *
 * P0-AUDIT: Updated to use 'ai-provider-gateway' as the only valid provider
 * per AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16. Direct vendor names
 * (openai, anthropic, etc.) are no longer valid provider identities.
 */

import {
  InMemoryModelGatewayStore,
  setModelGatewayStore,
  setModelGatewayConfig,
  invokeModel,
  getInvocationReceipt,
  listUserInvocations,
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

async function testInvokeModel() {
  console.log('Test: invoke model');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['*'] });

  const result = await invokeModel(
    'user-1',
    'tenant-1',
    'session-1',
    'ai-provider-gateway',
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
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['*'] });

  const result = await invokeModel('user-1', 'tenant-1', 'session-1', 'ai-provider-gateway', 'claude-3', 50, 100, 0.005, 'public');
  const receipt = await getInvocationReceipt(result.invocationId);

  assert(receipt !== null, 'receipt retrieved');
  assert(receipt?.provider === 'ai-provider-gateway', 'provider matches');
  assert(receipt?.model === 'claude-3', 'model matches');
  assert(receipt?.total_tokens === 150, 'total tokens correct');
}

async function testListUserInvocations() {
  console.log('Test: list user invocations');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['*'] });

  await invokeModel('user-1', 'tenant-1', 'session-1', 'ai-provider-gateway', 'gpt-4', 100, 200, 0.01, 'public');
  await invokeModel('user-1', 'tenant-1', 'session-1', 'ai-provider-gateway', 'claude-3', 50, 100, 0.005, 'public');
  await invokeModel('user-2', 'tenant-1', 'session-2', 'ai-provider-gateway', 'gpt-4', 100, 200, 0.01, 'public');

  const user1Invocations = await listUserInvocations('user-1', 'tenant-1');
  assert(user1Invocations.length === 2, '2 invocations for user-1');

  const user2Invocations = await listUserInvocations('user-2', 'tenant-1');
  assert(user2Invocations.length === 1, '1 invocation for user-2');
}

async function testDirectVendorProviderNotAllowed() {
  console.log('Test: direct vendor provider not allowed');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['*'] });

  // P0-AUDIT: Direct vendor names must be rejected
  for (const vendor of ['openai', 'anthropic', 'google', 'cohere', 'meta', 'mistral']) {
    try {
      await invokeModel('user-1', 'tenant-1', 'session-1', vendor as never, 'test-model', 100, 200, 0.01, 'public');
      assert(false, `${vendor} should have been rejected`);
    } catch (err) {
      assert((err as Error).message.includes('not allowed'), `${vendor} correctly rejected`);
    }
  }
}

async function testGen1Gen2ProviderNotAllowed() {
  console.log('Test: Gen1/Gen2 provider not allowed');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['*'] });

  for (const gen of ['gen1', 'gen2']) {
    try {
      await invokeModel('user-1', 'tenant-1', 'session-1', gen as never, 'test-model', 100, 200, 0.01, 'public');
      assert(false, `${gen} should have been rejected`);
    } catch (err) {
      assert((err as Error).message.includes('not allowed'), `${gen} correctly rejected`);
    }
  }
}

async function testModelNotAllowed() {
  console.log('Test: model not allowed');
  const store = new InMemoryModelGatewayStore();
  setModelGatewayStore(store);
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['gpt-4', 'claude-3'] });

  try {
    await invokeModel('user-1', 'tenant-1', 'session-1', 'ai-provider-gateway', 'gpt-3.5', 100, 200, 0.01, 'public');
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
  await testDirectVendorProviderNotAllowed();
  await testGen1Gen2ProviderNotAllowed();
  await testModelNotAllowed();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
