/**
 * @nai/gateway-sdk — Test suite
 */

import {
  PROVIDER_REGISTRY,
  callProvider,
  createGateway,
  type ProviderRequest,
  type GatewayConfig,
} from './index';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log('\n=== Gateway SDK Tests ===');

assert(typeof PROVIDER_REGISTRY === 'object', 'PROVIDER_REGISTRY is object');
assert(Object.keys(PROVIDER_REGISTRY).length > 0, 'PROVIDER_REGISTRY has entries');

const req: ProviderRequest = {
  provider: 'openai',
  model: 'gpt-4o',
  messages: [],
};
assert(typeof req.provider === 'string', 'ProviderRequest has provider');

const gateway = createGateway({ providers: {} } as GatewayConfig);
assert(typeof gateway === 'object', 'createGateway returns object');

console.log(`\nPassed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error('❌ TESTS FAILED');
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED');
}
