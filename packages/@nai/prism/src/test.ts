/**
 * @nai/prism — LLM platform unit + integration test.
 *
 * Verifies:
 * - model registry + tier gating (free < student < standard < pro < business < enterprise)
 * - auto-route picks best model for tier + task hint
 * - prompt versioning: register, render, variable substitution
 * - mock provider: deterministic response + usage accounting
 * - GEN1 adapter: maps NAI model ids to GEN1 native ids, calls /v1/chat (with mock fetch)
 * - high-level chat(): tier gate blocks disallowed models, allows allowed ones
 */

import {
  setModelRegistry,
  getModelRegistry,
  getModelById,
  listModelsForTier,
  autoRouteModel,
  canUseModelTier,
  registerPrompt,
  getPrompt,
  renderPrompt,
  MockLLMProvider,
  configureMockProvider,
  Gen1AdapterProvider,
  setLLMProvider,
  chat,
  type ModelDescriptor,
  type ChatRequest,
} from './index.ts';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

// Test model registry (subset of product-catalog models.json shape)
const TEST_MODELS: ModelDescriptor[] = [
  { id: 'nguyen-iris-3', displayName: 'Iris 3', provider: 'cf', providerModel: 'llama-3.1-8b', tier: 'free', capabilities: ['chat'], contextWindow: 8000, maxOutputTokens: 2048, costPer1kInput: 0, costPer1kOutput: 0, speed: 'fast', quality: 'standard', freeTier: true },
  { id: 'nguyen-pulse-7', displayName: 'Pulse 7', provider: 'cerebras', providerModel: 'llama3.1-70b', tier: 'student', capabilities: ['chat', 'function-calling', 'tool-use'], contextWindow: 8192, maxOutputTokens: 8192, costPer1kInput: 0, costPer1kOutput: 0, speed: 'fast', quality: 'high', freeTier: true },
  { id: 'nguyen-nova-3', displayName: 'Nova 3', provider: 'groq', providerModel: 'llama-3.3-70b', tier: 'pro', capabilities: ['chat', 'function-calling', 'tool-use'], contextWindow: 131072, maxOutputTokens: 8192, costPer1kInput: 0.0001, costPer1kOutput: 0.0002, speed: 'fast', quality: 'high', freeTier: false },
  { id: 'nguyen-titan-1', displayName: 'Titan 1', provider: 'anthropic', providerModel: 'claude-sonnet-4', tier: 'business', capabilities: ['chat', 'function-calling', 'tool-use'], contextWindow: 200000, maxOutputTokens: 8192, costPer1kInput: 0.003, costPer1kOutput: 0.015, speed: 'standard', quality: 'premium', freeTier: false },
];

async function main(): Promise<void> {
  setModelRegistry(TEST_MODELS);

  // --- 1. tier hierarchy ---
  assert(canUseModelTier('free', 'free') === true, 'free can use free');
  assert(canUseModelTier('free', 'student') === false, 'free cannot use student');
  assert(canUseModelTier('pro', 'free') === true, 'pro can use free');
  assert(canUseModelTier('enterprise', 'business') === true, 'enterprise can use business');
  assert(canUseModelTier('student', 'pro') === false, 'student cannot use pro');

  // --- 2. model registry ---
  assert(getModelRegistry().length === 4, 'registry has 4 models');
  const iris = getModelById('nguyen-iris-3');
  assert(iris !== null, 'getModelById finds iris-3');
  assert(getModelById('nonexistent') === null, 'getModelById returns null for unknown');

  // --- 3. listModelsForTier ---
  const freeModels = listModelsForTier('free');
  assert(freeModels.length === 1, 'free tier sees 1 model (iris-3)');
  assert(freeModels[0]!.id === 'nguyen-iris-3', 'free tier model is iris-3');
  const proModels = listModelsForTier('pro');
  assert(proModels.length === 3, 'pro tier sees 3 models (free + student + pro)');

  // --- 4. auto-route ---
  const freeRoute = autoRouteModel('free');
  assert(freeRoute !== null, 'auto-route free returns a model');
  assert(freeRoute?.id === 'nguyen-iris-3', 'auto-route free picks iris-3');
  const proRoute = autoRouteModel('pro');
  assert(proRoute !== null, 'auto-route pro returns a model');
  // pro should prefer nova-3 (highest tier available to pro)
  assert(proRoute?.id === 'nguyen-nova-3', 'auto-route pro picks nova-3 (highest tier)');
  // tool-use hint should prefer models with function-calling
  const studentRouteTool = autoRouteModel('student', 'tool-use');
  assert(studentRouteTool?.id === 'nguyen-pulse-7', 'auto-route student+tool-use picks pulse-7 (has function-calling)');

  // --- 5. prompt versioning ---
  registerPrompt({
    name: 'nguyen-guide-greeting',
    version: '1.0.0',
    description: 'Greeting prompt for Nguyen Guide agent',
    template: 'You are Nguyen Guide. Greet the user {{user_name}} in {{language}}. Context: {{context}}.',
    defaults: { language: 'vi' },
    locked_at: '2026-07-03T00:00:00Z',
  });
  const tpl = getPrompt('nguyen-guide-greeting', '1.0.0');
  assert(tpl !== null, 'getPrompt finds registered template');
  assert(getPrompt('missing', '1.0.0') === null, 'getPrompt returns null for unknown');
  const rendered = renderPrompt('nguyen-guide-greeting', '1.0.0', { user_name: 'Tam', context: 'first visit' });
  assert(rendered.includes('Tam'), 'render substitutes user_name');
  assert(rendered.includes('vi'), 'render uses default language');
  const renderedEn = renderPrompt('nguyen-guide-greeting', '1.0.0', { user_name: 'Tam', context: 'first visit', language: 'en' });
  assert(renderedEn.includes('en'), 'render overrides default language');

  // --- 6. mock provider ---
  const mock = configureMockProvider();
  mock.setResponse('*', 'Hello from mock LLM');
  const mockReq: ChatRequest = {
    tenant_id: 't_1', user_id: 'u_1', plan_id: 'nguyen-start',
    model: 'nguyen-iris-3',
    messages: [{ role: 'user', content: 'Hi there' }],
  };
  const mockResp = await chat(mockReq, 'free');
  assert(mockResp.content === 'Hello from mock LLM', 'mock provider returns canned response');
  assert(mockResp.served_by === 'mock', 'mock response served_by = mock');
  assert(mockResp.tier_allowed === true, 'free tier allowed for free model');
  assert(mockResp.usage.total_tokens > 0, 'mock usage total_tokens > 0');
  assert(mock.getCallCount() === 1, 'mock call count = 1');

  // --- 7. tier gate blocks disallowed model ---
  const blockedReq: ChatRequest = {
    tenant_id: 't_1', user_id: 'u_1', plan_id: 'nguyen-start',
    model: 'nguyen-titan-1', // business tier
    messages: [{ role: 'user', content: 'Hi' }],
  };
  const blockedResp = await chat(blockedReq, 'free');
  assert(blockedResp.tier_allowed === false, 'free tier blocked from business model');
  assert(blockedResp.finish_reason === 'error', 'blocked response finish_reason = error');
  assert(blockedResp.tier_reason?.includes('business') ?? false, 'blocked reason mentions business tier');
  assert(mock.getCallCount() === 1, 'blocked request did NOT call provider (still 1 call)');

  // --- 8. auto-route via chat() ---
  const autoReq: ChatRequest = {
    tenant_id: 't_1', user_id: 'u_1', plan_id: 'nguyen-start',
    model: 'auto-route',
    messages: [{ role: 'user', content: 'Hello' }],
  };
  const autoResp = await chat(autoReq, 'free');
  assert(autoResp.tier_allowed === true, 'auto-route free allowed');
  assert(autoResp.model_descriptor.id === 'nguyen-iris-3', 'auto-route picked iris-3 for free');
  assert(mock.getCallCount() === 2, 'auto-route called provider (2 calls)');

  // --- 9. GEN1 adapter with mock fetch ---
  let gen1Called = false;
  let gen1Body: Record<string, unknown> = {};
  let gen1Headers: Record<string, string> = {};
  const mockFetch = async (url: string, init: RequestInit) => {
    gen1Called = true;
    gen1Body = JSON.parse(init.body as string);
    gen1Headers = init.headers as Record<string, string>;
    return new Response(JSON.stringify({
      content: 'Hello from GEN1',
      usage: { prompt_tokens: 5, completion_tokens: 4, total_tokens: 9 },
      id: 'gen1-resp-1',
      finish_reason: 'stop',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const gen1 = new Gen1AdapterProvider({
    baseUrl: 'https://gen1.example.com',
    adminKey: 'secret',
    fetchImpl: mockFetch as unknown as typeof fetch,
  });
  setLLMProvider(gen1);
  const gen1Req: ChatRequest = {
    tenant_id: 't_1', user_id: 'u_1', plan_id: 'nguyen-start',
    model: 'nguyen-iris-3',
    messages: [{ role: 'user', content: 'Hi from GEN1 test' }],
  };
  const gen1Resp = await chat(gen1Req, 'free');
  assert(gen1Called, 'GEN1 adapter called fetch');
  assert(gen1Resp.served_by === 'gen1-adapter', 'GEN1 response served_by = gen1-adapter');
  assert(gen1Resp.content === 'Hello from GEN1', 'GEN1 response content correct');
  assert(gen1Resp.usage.total_tokens === 9, 'GEN1 usage total_tokens = 9');
  assert(gen1Resp.provider_response_id === 'gen1-resp-1', 'GEN1 provider_response_id preserved');
  // Verify model mapping: nguyen-iris-3 → iris-3
  assert(gen1Body.model === 'iris-3', 'GEN1 adapter maps nguyen-iris-3 → iris-3');
  // Verify session id synthesis
  assert(typeof gen1Headers['X-Session-Id'] === 'string', 'GEN1 adapter sends X-Session-Id');
  assert(gen1Headers['X-Session-Id']?.startsWith('nai-t_1-') ?? false, 'GEN1 session id starts with nai-t_1-');
  assert(gen1Headers['Authorization'] === 'Bearer secret', 'GEN1 adapter sends Authorization header');

  // --- 10. GEN1 adapter maps other models ---
  const pulseReq: ChatRequest = {
    tenant_id: 't_1', user_id: 'u_1', plan_id: 'nguyen-personal',
    model: 'nguyen-pulse-7',
    messages: [{ role: 'user', content: 'test' }],
  };
  gen1Body = {};
  await chat(pulseReq, 'student');
  assert(gen1Body.model === 'pulse-3', 'GEN1 adapter maps nguyen-pulse-7 → pulse-3');

  // --- 11. GEN1 adapter handles non-OK response ---
  const errorFetch = async () => new Response('upstream error', { status: 500 });
  const gen1Err = new Gen1AdapterProvider({ baseUrl: 'https://gen1.example.com', fetchImpl: errorFetch as unknown as typeof fetch });
  setLLMProvider(gen1Err);
  const errResp = await chat({ ...mockReq, model: 'nguyen-iris-3' }, 'free');
  assert(errResp.finish_reason === 'error', 'GEN1 500 response → finish_reason = error');
  assert(errResp.content === '', 'GEN1 500 response → empty content');

  // --- Report ---
  console.log('\n@nai/prism test');
  console.log('---------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
