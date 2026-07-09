/**
 * @nai/training-gateway — minimal smoke test
 */

import { invokeThroughTrainingGateway } from './index.js';

async function run() {
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

  if (typeof response.content !== 'string') {
    throw new Error('content must be a string');
  }
  if (!response.model) {
    throw new Error('model must be set');
  }

  // In test environment without real LLM providers, tier_allowed may be false
  // and receipt_id may be empty — that's expected behavior, not a bug.
  if (response.tier_allowed && !response.receipt_id) {
    throw new Error('receipt_id must be created when tier_allowed is true');
  }

  console.log('✅ Smoke test passed');
}

run().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
