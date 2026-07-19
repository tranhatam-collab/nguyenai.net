/**
 * Basic tests for @nai/ai-provider-client
 */
import {
  AIProviderClient,
  GatewayLLMProvider,
  ProviderGatewayError,
  generateRequestId,
  resolveGatewayModelId,
} from './index';

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    pass++;
    console.log(`PASS — ${label}`);
  } else {
    fail++;
    console.error(`FAIL — ${label}`);
  }
}

// Test 1: Client construction
const client = new AIProviderClient({
  gatewayUrl: 'https://aiagent.iai.one',
  apiKey: 'test-key',
  timeoutMs: 5000,
  maxRetries: 1,
});
assert(!!client, 'Test 1: Client constructed');

// Test 2: Error class
const err = new ProviderGatewayError('test', 500, null, true);
assert(err.isRetryable === true, 'Test 2: ProviderGatewayError isRetryable');

// Test 3: GatewayLLMProvider construction
const provider = new GatewayLLMProvider({
  gatewayUrl: 'https://aiagent.iai.one',
  apiKey: 'test-key',
});
assert(!!provider, 'Test 3: GatewayLLMProvider constructed');

// Test 4: Model ID mapping — explicit map
assert(resolveGatewayModelId('nguyen-iris-3') === 'iai-one/iris-3', 'Test 4a: nguyen-iris-3 → iai-one/iris-3');
assert(resolveGatewayModelId('nguyen-pulse-3') === 'iai-one/pulse-3', 'Test 4b: nguyen-pulse-3 → iai-one/pulse-3');
assert(resolveGatewayModelId('nguyen-echo-mini') === 'iai-one/echo-mini', 'Test 4c: nguyen-echo-mini → iai-one/echo-mini');

// Test 5: Model ID mapping — heuristic for unmapped nguyen-* IDs
assert(resolveGatewayModelId('nguyen-iris-7') === 'iai-one/iris-7', 'Test 5a: nguyen-iris-7 → iai-one/iris-7 (heuristic)');
assert(resolveGatewayModelId('nguyen-nova-9') === 'iai-one/nova-9', 'Test 5b: nguyen-nova-9 → iai-one/nova-9 (heuristic)');
assert(resolveGatewayModelId('nguyen-spectra-xl') === 'iai-one/spectra-xl', 'Test 5c: nguyen-spectra-xl → iai-one/spectra-xl (heuristic)');

// Test 6: Model ID mapping — passthrough for already-gateway-shaped or unknown
assert(resolveGatewayModelId('iai-one/iris-3') === 'iai-one/iris-3', 'Test 6a: iai-one/iris-3 passthrough');
assert(resolveGatewayModelId('gpt-4o') === 'gpt-4o', 'Test 6b: unknown vendor ID passthrough (gateway will reject)');

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) {
  // Use globalThis to avoid needing @types/node in the Workers-typed package.
  // tsx provides process.exit at runtime; the cast keeps typecheck happy.
  (globalThis as { process?: { exit: (code: number) => void } }).process?.exit(1);
}
