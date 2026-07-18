/**
 * E2E Test: No direct model provider calls from browser.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md + AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16:
 * - No direct browser call to model providers
 * - All model calls must pass through Nguyen AI Model Gateway
 * - The only valid provider identity is 'ai-provider-gateway' (aiagent.iai.one)
 * - Direct vendor names (openai, anthropic, etc.) are NOT valid provider identities
 */

import {
  InMemoryModelGatewayStore,
  setModelGatewayStore,
  setModelGatewayConfig,
  invokeModel,
  getInvocationReceipt,
  listUserInvocations,
} from '@nai/model-gateway';

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

async function testBlockDirectVendorProviderCalls() {
  console.log('Test: block direct vendor provider calls');
  const gatewayStore = new InMemoryModelGatewayStore();
  setModelGatewayStore(gatewayStore);
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['*'] });

  // P0-AUDIT: Direct vendor names must be rejected by the gateway
  for (const vendor of ['openai', 'anthropic', 'cohere', 'google', 'meta', 'mistral']) {
    try {
      await invokeModel('user-1', 'tenant-1', 'session-1', vendor as never, 'test', 100, 200, 0.01, 'public');
      assert(false, `${vendor} direct call should be blocked`);
    } catch {
      assert(true, `${vendor} direct call blocked by gateway`);
    }
  }
}

async function testAllowModelCallsThroughGateway() {
  console.log('Test: allow model calls through ai-provider-gateway');
  const gatewayStore = new InMemoryModelGatewayStore();
  const auditStore = new InMemoryAuditStore();
  setModelGatewayStore(gatewayStore);
  setAuditStore(auditStore);
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

  const receipt = await getInvocationReceipt(result.invocationId);
  assert(receipt !== null, 'receipt retrieved');
  assert(receipt?.provider === 'ai-provider-gateway', 'provider is ai-provider-gateway');
  assert(receipt?.model === 'gpt-4', 'model matches');

  const auditEvents = await queryAuditLog({ action: 'model_invoked' });
  assert(auditEvents.length > 0, 'audit event logged');
}

async function testEnforceGatewayRoutingForAllModels() {
  console.log('Test: enforce gateway routing for all models');
  const gatewayStore = new InMemoryModelGatewayStore();
  setModelGatewayStore(gatewayStore);
  setModelGatewayConfig({ allowedProviders: ['ai-provider-gateway'], allowedModels: ['*'] });

  // P0-AUDIT: All models go through ai-provider-gateway, not direct vendor providers
  const result1 = await invokeModel('user-1', 'tenant-1', 'session-1', 'ai-provider-gateway', 'gpt-4', 100, 200, 0.01, 'public');
  const result2 = await invokeModel('user-1', 'tenant-1', 'session-1', 'ai-provider-gateway', 'claude-3', 50, 100, 0.005, 'public');
  const result3 = await invokeModel('user-1', 'tenant-1', 'session-1', 'ai-provider-gateway', 'command-r', 30, 60, 0.003, 'public');

  assert(result1.invocationId !== undefined, 'gpt-4 call succeeds through gateway');
  assert(result2.invocationId !== undefined, 'claude-3 call succeeds through gateway');
  assert(result3.invocationId !== undefined, 'command-r call succeeds through gateway');

  const invocations = await listUserInvocations('user-1', 'tenant-1');
  assert(invocations.length === 3, '3 invocations recorded');
  assert(invocations.every((i) => i.provider === 'ai-provider-gateway'), 'all providers are ai-provider-gateway');
}

async function main() {
  console.log('=== No direct model call E2E ===\n');
  await testBlockDirectVendorProviderCalls();
  await testAllowModelCallsThroughGateway();
  await testEnforceGatewayRoutingForAllModels();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
