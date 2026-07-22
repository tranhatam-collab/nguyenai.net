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

// Test 7: GatewayLLMProvider.chat returns the original catalog model ID, not the gateway's internal ID.
// This verifies the contract: user sends "nguyen-iris-3" → response echoes "nguyen-iris-3" (not "iai-one/iris-3").
// We mock fetch to capture the outbound request and return a response with the gateway model ID.
const captured: { body: { model?: string } | null } = { body: null };
const mockFetch = async (_url: string, init: RequestInit) => {
  const body = JSON.parse(init.body as string) as { model?: string };
  captured.body = body;
  return new Response(JSON.stringify({
    model: body.model, // gateway echoes back its internal ID
    content: 'test response',
    finish_reason: 'stop',
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    provider_response_id: 'resp-123',
    request_id: 'req-123',
    latency_ms: 100,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

const providerWithMock = new GatewayLLMProvider({
  gatewayUrl: 'https://api.aiagent.iai.one',
  apiKey: 'test-key',
  fetchImpl: mockFetch as typeof fetch,
});

const chatResp: { model: string; content: string; served_by: string } = await providerWithMock.chat(
  {
    tenant_id: 'nguyenai-net',
    user_id: 'user-1',
    plan_id: 'free',
    model: 'nguyen-iris-3',
    messages: [{ role: 'user', content: 'hello' }],
  } as unknown as Parameters<typeof providerWithMock.chat>[0],
  { id: 'nguyen-iris-3', displayName: 'Iris 3', tier: 'free' } as unknown as Parameters<typeof providerWithMock.chat>[1],
);

assert(captured.body?.model === 'iai-one/iris-3', 'Test 7a: outbound request uses gateway model ID (iai-one/iris-3)');
assert(chatResp.model === 'nguyen-iris-3', 'Test 7b: response echoes catalog model ID (nguyen-iris-3), not gateway internal ID');
assert(chatResp.served_by === 'ai-provider-gateway', 'Test 7c: served_by is ai-provider-gateway');

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) {
  // Use globalThis to avoid needing @types/node in the Workers-typed package.
  // tsx provides process.exit at runtime; the cast keeps typecheck happy.
  (globalThis as { process?: { exit: (code: number) => void } }).process?.exit(1);
}
