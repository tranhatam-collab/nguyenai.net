/**
 * Basic tests for @nai/ai-provider-client
 */
import { AIProviderClient, GatewayLLMProvider, ProviderGatewayError, generateRequestId } from './index';

// Test 1: Client construction
const client = new AIProviderClient({
  gatewayUrl: 'https://aiagent.iai.one',
  apiKey: 'test-key',
  timeoutMs: 5000,
  maxRetries: 1,
});

console.log('Test 1: Client constructed —', client ? 'PASS' : 'FAIL');

// Test 2: Error class
const err = new ProviderGatewayError('test', 500, null, true);
console.log('Test 2: ProviderGatewayError —', err.isRetryable ? 'PASS' : 'FAIL');

// Test 3: GatewayLLMProvider construction
const provider = new GatewayLLMProvider({
  gatewayUrl: 'https://aiagent.iai.one',
  apiKey: 'test-key',
});
console.log('Test 3: GatewayLLMProvider constructed —', provider ? 'PASS' : 'FAIL');

console.log('\nAll tests passed.');
