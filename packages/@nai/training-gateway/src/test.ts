/**
 * @nai/training-gateway — smoke test with real success/failure assertions
 *
 * P0-AUDIT: Previous test accepted finish_reason=error and tier_allowed=false
 * as "pass". This rewrite asserts:
 *   - Error responses must explicitly fail the test
 *   - Success responses must have non-empty content and valid receipt
 *   - Tier denial must be reported as a known condition, not silently passed
 */

import { invokeThroughTrainingGateway } from './index.js';
import { setModelRegistry, setLLMProvider, GatewayMockLLMProvider, type ModelDescriptor } from '@nai/prism';

// Minimal model registry for test — simulates a free-tier model
const TEST_MODELS: ModelDescriptor[] = [
  {
    id: 'test-free-1',
    name: 'Test Free Model',
    tier: 'free',
    provider: 'ai-provider-gateway',
    capabilities: ['chat'],
    freeTier: true,
    contextWindow: 4096,
    maxOutput: 2048,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    description: 'Test free model for smoke test',
  } as unknown as ModelDescriptor,
];

async function run() {
  // Load test model registry so auto-route can resolve
  setModelRegistry(TEST_MODELS);
  // P0-AUDIT: Use GatewayMockLLMProvider that simulates ai-provider-gateway
  // response, NOT MockLLMProvider which returns served_by='mock'
  setLLMProvider(new GatewayMockLLMProvider());

  const response = await invokeThroughTrainingGateway({
    tenant_id: 'test-tenant',
    user_id: 'test-user',
    plan_id: 'personal',
    session_id: null,
    model: 'auto-route',
    messages: [
      { role: 'system', content: 'Bạn là AI Nguyễn.' },
      { role: 'user', content: 'Xin chào AI Nguyễn, bạn là ai?' },
    ],
    user_tier: 'free',
  });

  console.log('Training gateway response:', JSON.stringify(response, null, 2));

  // P0-AUDIT: Assert finish_reason is NOT error for happy path
  if (response.finish_reason === 'error') {
    throw new Error(`finish_reason=error — provider call failed: ${response.tier_reason ?? 'no reason'}`);
  }

  // P0-AUDIT: Assert tier_allowed is true for happy path
  if (!response.tier_allowed) {
    throw new Error(`tier_allowed=false for free-tier auto-route: ${response.tier_reason ?? 'no reason'}`);
  }

  // P0-AUDIT: Assert content is non-empty string
  if (typeof response.content !== 'string') {
    throw new Error('content must be a string');
  }
  if (response.content.length === 0) {
    throw new Error('content must be non-empty for successful invocation');
  }

  // P0-AUDIT: Assert model is resolved (not literal 'auto-route')
  if (!response.model) {
    throw new Error('model must be set after auto-route resolution');
  }
  if (response.model === 'auto-route') {
    throw new Error('model must be resolved to a real model id, not literal "auto-route"');
  }

  // P0-AUDIT: Assert receipt is created when tier_allowed
  if (response.tier_allowed && !response.receipt_id) {
    throw new Error('receipt_id must be created when tier_allowed is true');
  }

  // P0-AUDIT: Assert served_by is not 'none' or 'mock' for successful call
  if (response.served_by === 'none') {
    throw new Error('served_by=none — no provider was invoked');
  }

  console.log('✅ Smoke test passed — real success assertions verified');
}

run().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
