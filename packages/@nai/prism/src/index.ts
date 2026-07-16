/**
 * @nai/prism — LLM platform: model routing, prompt versioning, GEN1 adapter.
 *
 * Original source: https://github.com/langgenius/dify (Python/TS, Apache-2.0)
 * This package does NOT bundle the original source. It provides a
 * TypeScript-native LLM platform layer per Founder Build Directive Phase 3 task 3.4.
 *
 * Responsibilities:
 * - Model routing by tier (free / student / standard / pro / business / enterprise)
 *   gated by the user's plan entitlement (@nai/entitlement).
 * - Prompt versioning (named, versioned prompt templates with render).
 * - GEN1 adapter client — calls aiagent.iai.one (FROZEN reference) per
 *   Founder Architecture Amendment. Adapter is NOT source of truth.
 * - Mock provider for tests (no network, deterministic).
 *
 * Per Founder decision 2026-07-16: real LLM calls go via AI Provider Gateway
 * (aiagent.iai.one) using @nai/ai-provider-client. Direct vendor keys
 * (OpenAI/Anthropic/Google) are BANNED. Direct vendor provider class removed.
 */

// ============================================================
// Types
// ============================================================

export type ModelTier = 'free' | 'student' | 'standard' | 'pro' | 'business' | 'enterprise';

export interface ModelDescriptor {
  id: string;
  displayName: string;
  provider: string;
  providerModel: string;
  tier: ModelTier;
  capabilities: string[];
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  speed: string;
  quality: string;
  freeTier: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ChatRequest {
  /** Tenant + user for entitlement gating + audit. */
  tenant_id: string;
  user_id: string;
  /** Plan id (used to resolve model tier entitlement). */
  plan_id: string;
  /** Explicit model id, or 'auto-route' to pick by tier + task. */
  model: string;
  messages: ChatMessage[];
  /** Max output tokens (clamped to model.maxOutputTokens). */
  max_tokens?: number;
  /** Temperature 0..2. */
  temperature?: number;
  /** Optional GEN1 session id (adapter synthesizes if absent). */
  gen1_session_id?: string;
  /** Optional metadata for audit. */
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  model: string;
  content: string;
  finish_reason: 'stop' | 'length' | 'tool_call' | 'error';
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Provider that served the request ('gen1-adapter' | 'mock' | 'gateway'). */
  served_by: string;
  /** Raw provider response id (if any). */
  provider_response_id: string | null;
}

/** LLM provider interface — swap Gen1Adapter / Mock / direct OpenAI etc. */
export interface LLMProvider {
  chat(req: ChatRequest, model: ModelDescriptor): Promise<ChatResponse>;
}

// ============================================================
// Tier hierarchy — used for gating
// ============================================================

const TIER_RANK: Record<ModelTier, number> = {
  free: 0,
  student: 1,
  standard: 2,
  pro: 3,
  business: 4,
  enterprise: 5,
};

/** Returns true if userTier >= requiredTier. */
export function canUseModelTier(userTier: string, requiredTier: string): boolean {
  const u = TIER_RANK[userTier as ModelTier] ?? 0;
  const r = TIER_RANK[requiredTier as ModelTier] ?? 0;
  return u >= r;
}

// ============================================================
// Model registry — loaded from product-catalog models.json
// ============================================================

let modelRegistry: ModelDescriptor[] = [];

export function setModelRegistry(models: ModelDescriptor[]): void {
  modelRegistry = models;
}

export function getModelRegistry(): ModelDescriptor[] {
  return modelRegistry;
}

export function getModelById(id: string): ModelDescriptor | null {
  return modelRegistry.find((m) => m.id === id) ?? null;
}

/** List models available to a given tier. */
export function listModelsForTier(userTier: string): ModelDescriptor[] {
  return modelRegistry.filter((m) => canUseModelTier(userTier, m.tier));
}

/** Auto-route: pick the best model for a tier + task hint. */
export function autoRouteModel(userTier: string, taskHint?: string): ModelDescriptor | null {
  const available = listModelsForTier(userTier);
  if (available.length === 0) return null;
  // Prefer higher tier, then 'fast' speed for short tasks, 'high' quality otherwise.
  const sorted = [...available].sort((a, b) => {
    const tierDiff = TIER_RANK[b.tier] - TIER_RANK[a.tier];
    if (tierDiff !== 0) return tierDiff;
    // For tool-use / function-calling tasks, prefer models that support it.
    if (taskHint === 'tool-use' || taskHint === 'function-calling') {
      const aTool = a.capabilities.includes('function-calling') || a.capabilities.includes('tool-use') ? 1 : 0;
      const bTool = b.capabilities.includes('function-calling') || b.capabilities.includes('tool-use') ? 1 : 0;
      if (aTool !== bTool) return bTool - aTool;
    }
    // Prefer free tier within same rank (cost optimization).
    if (a.freeTier && !b.freeTier) return -1;
    if (!a.freeTier && b.freeTier) return 1;
    return 0;
  });
  return sorted[0] ?? null;
}

// ============================================================
// Prompt versioning
// ============================================================

export interface PromptTemplate {
  name: string;
  version: string;
  description: string;
  /** Template string with {{variable}} placeholders. */
  template: string;
  /** Default values for optional variables. */
  defaults?: Record<string, string>;
  /** ISO date when this version was locked. */
  locked_at?: string;
}

const promptRegistry = new Map<string, PromptTemplate>();

function promptKey(name: string, version: string): string {
  return `${name}@${version}`;
}

export function registerPrompt(tpl: PromptTemplate): void {
  promptRegistry.set(promptKey(tpl.name, tpl.version), tpl);
}

export function getPrompt(name: string, version: string): PromptTemplate | null {
  return promptRegistry.get(promptKey(name, version)) ?? null;
}

export function listPrompts(): PromptTemplate[] {
  return [...promptRegistry.values()];
}

/** Render a prompt template, substituting {{variables}}. */
export function renderPrompt(name: string, version: string, vars: Record<string, string>): string {
  const tpl = getPrompt(name, version);
  if (!tpl) throw new Error(`Prompt template "${name}@${version}" not found`);
  let out = tpl.template;
  const merged = { ...tpl.defaults, ...vars };
  for (const [k, v] of Object.entries(merged)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

// ============================================================
// Mock provider — deterministic, no network (for tests / dev fallback)
// ============================================================

export class MockLLMProvider implements LLMProvider {
  private responses = new Map<string, string>();
  private callCount = 0;

  /** Set a canned response for a given input fingerprint (or default). */
  setResponse(key: string, response: string): void {
    this.responses.set(key, response);
  }

  async chat(req: ChatRequest, model: ModelDescriptor): Promise<ChatResponse> {
    this.callCount++;
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const fingerprint = lastUser?.content.slice(0, 64) ?? '';
    const canned = this.responses.get(fingerprint) ?? this.responses.get('*') ??
      `[mock:${model.id}] ${lastUser?.content ?? '(empty)'}`;
    const promptTokens = req.messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0);
    const completionTokens = Math.ceil(canned.length / 4);
    return {
      model: model.id,
      content: canned,
      finish_reason: 'stop',
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      served_by: 'mock',
      provider_response_id: `mock-${this.callCount}`,
    };
  }

  getCallCount(): number {
    return this.callCount;
  }
}

// ============================================================
// GEN1 adapter provider — calls aiagent.iai.one (FROZEN reference)
// ============================================================

export interface Gen1AdapterConfig {
  /** Base URL of the GEN1 gateway (e.g. https://aiagent-iai-one-api-prod.tranhatam.workers.dev). */
  baseUrl: string;
  /** Optional admin key for authenticated calls. */
  adminKey?: string;
  /** Optional fetch implementation (defaults to global fetch). */
  fetchImpl?: typeof fetch;
  /** Request timeout in ms. */
  timeoutMs?: number;
}

export class Gen1AdapterProvider implements LLMProvider {
  constructor(private cfg: Gen1AdapterConfig) {}

  /**
   * Call GEN1 /v1/chat. Per Founder Amendment, this is an adapter only —
   * GEN1 is FROZEN reference, not source of truth. Entitlement + audit
   * remain Nguyen AI's responsibility (enforced by the caller, not GEN1).
   *
   * The adapter maps NAI model ids to GEN1 native model ids (iris-3, pulse-3,
   * echo-mini) and synthesizes a deterministic GEN1 session id.
   */
  async chat(req: ChatRequest, model: ModelDescriptor): Promise<ChatResponse> {
    const fetchFn = this.cfg.fetchImpl ?? fetch;
    const gen1Model = mapToGen1Model(model.id);
    const gen1SessionId = req.gen1_session_id ?? `nai-${req.tenant_id}-${req.user_id.slice(0, 8)}`;
    const url = `${this.cfg.baseUrl}/v1/chat`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? 30000);
    try {
      const resp = await fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': gen1SessionId,
          ...(this.cfg.adminKey ? { Authorization: `Bearer ${this.cfg.adminKey}` } : {}),
        },
        body: JSON.stringify({
          model: gen1Model,
          messages: req.messages,
          max_tokens: req.max_tokens ?? model.maxOutputTokens,
          temperature: req.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        return {
          model: model.id,
          content: '',
          finish_reason: 'error',
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          served_by: 'gen1-adapter',
          provider_response_id: null,
        };
      }
      const data = await resp.json() as {
        content?: string;
        message?: string;
        response?: string;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        id?: string;
        finish_reason?: string;
      };
      const content = data.content ?? data.message ?? data.response ?? '';
      const usage = data.usage ?? {};
      return {
        model: model.id,
        content,
        finish_reason: (data.finish_reason as ChatResponse['finish_reason']) ?? 'stop',
        usage: {
          prompt_tokens: usage.prompt_tokens ?? 0,
          completion_tokens: usage.completion_tokens ?? 0,
          total_tokens: usage.total_tokens ?? 0,
        },
        served_by: 'gen1-adapter',
        provider_response_id: data.id ?? null,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Map NAI model id → GEN1 native model id. */
function mapToGen1Model(naiModelId: string): string {
  // GEN1 exposes: iris-3, pulse-3, echo-mini
  if (naiModelId.includes('iris')) return 'iris-3';
  if (naiModelId.includes('pulse')) return 'pulse-3';
  if (naiModelId.includes('echo')) return 'echo-mini';
  // Default to iris-3 (free tier) for unknown models.
  return 'iris-3';
}

// ============================================================
// Provider singleton + high-level chat API
// ============================================================

let defaultProvider: LLMProvider = new MockLLMProvider();

export function setLLMProvider(provider: LLMProvider): void {
  defaultProvider = provider;
}

export function getLLMProvider(): LLMProvider {
  return defaultProvider;
}

/** Convenience: configure GEN1 adapter as the default provider. */
export function configureGen1Adapter(cfg: Gen1AdapterConfig): void {
  setLLMProvider(new Gen1AdapterProvider(cfg));
}

/** Convenience: configure mock provider (for tests). */
export function configureMockProvider(): MockLLMProvider {
  const mock = new MockLLMProvider();
  setLLMProvider(mock);
  return mock;
}

export interface ChatResult extends ChatResponse {
  /** The model descriptor that was selected (after routing). */
  model_descriptor: ModelDescriptor;
  /** Whether the requested model was allowed for the user's tier. */
  tier_allowed: boolean;
  /** Reason if tier was not allowed. */
  tier_reason: string | null;
}

/**
 * High-level chat: resolve model (auto-route or explicit), check tier,
 * call provider, return response. Does NOT enforce quota (caller does that
 * via @nai/entitlement checkCommandQuota).
 *
 * @param userTier  The user's model tier entitlement (e.g. 'free', 'pro').
 */
export async function chat(req: ChatRequest, userTier: string): Promise<ChatResult> {
  // Resolve model
  let model: ModelDescriptor | null;
  if (req.model === 'auto-route' || !req.model) {
    model = autoRouteModel(userTier);
  } else {
    model = getModelById(req.model);
  }
  if (!model) {
    return {
      model: req.model,
      content: '',
      finish_reason: 'error',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      served_by: 'none',
      provider_response_id: null,
      model_descriptor: {} as ModelDescriptor,
      tier_allowed: false,
      tier_reason: `model "${req.model}" not found in registry`,
    };
  }

  // Tier gate
  const tierAllowed = canUseModelTier(userTier, model.tier);
  if (!tierAllowed) {
    return {
      model: model.id,
      content: '',
      finish_reason: 'error',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      served_by: 'none',
      provider_response_id: null,
      model_descriptor: model,
      tier_allowed: false,
      tier_reason: `model tier "${model.tier}" requires ${model.tier}+ (current: ${userTier})`,
    };
  }

  // Call provider
  const resp = await defaultProvider.chat(req, model);
  return {
    ...resp,
    model_descriptor: model,
    tier_allowed: true,
    tier_reason: null,
  };
}
