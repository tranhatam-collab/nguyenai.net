/**
 * @nai/ai-provider-client — Typed client for AI Provider Gateway
 *
 * Single source for all model invocations in Nguyen AI.
 * Every call goes through aiagent.iai.one gateway contract.
 * No direct vendor keys (OpenAI/Anthropic/Google) are used.
 *
 * Contract: AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md
 */

// ============================================================
// Types
// ============================================================

export interface ProviderGatewayConfig {
  /** Gateway URL (e.g. https://api.aiagent.iai.one). Not a secret — contract URL. */
  gatewayUrl: string;
  /** API key issued by Team A. Stored in Worker secret store. */
  apiKey: string;
  /** Optional tenant/audience identity if contract requires. */
  tenantId?: string;
  /** Optional audience claim. */
  audience?: string;
  /** Request timeout in ms (default: 60000). */
  timeoutMs?: number;
  /** Max retries on 5xx/timeout (default: 2). */
  maxRetries?: number;
  /** Retry backoff base in ms (default: 500). */
  retryBackoffMs?: number;
  /** Optional fetch implementation (defaults to global fetch). */
  fetchImpl?: typeof fetch;
}

export interface ProviderChatRequest {
  /** NAI model ID (e.g. "nai-auto", "nai-standard", "nai-pro"). */
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_call_id?: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  /** Request ID for traceability (generated if not provided). */
  request_id?: string;
  /** Trace ID for distributed tracing. */
  trace_id?: string;
  /** Tenant ID for multi-tenant isolation. */
  tenant_id?: string;
  /** User pseudonym (not raw user ID). */
  user_pseudonym?: string;
}

export interface ProviderChatResponse {
  model: string;
  content: string;
  finish_reason: 'stop' | 'length' | 'tool_call' | 'error';
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Provider response ID for traceability. */
  provider_response_id: string | null;
  /** Request ID echoed back by gateway. */
  request_id: string | null;
  /** Latency in ms. */
  latency_ms: number | null;
}

export interface ProviderHealthResponse {
  status: 'ok' | 'degraded' | 'down';
  models: string[];
  version: string | null;
}

export class ProviderGatewayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly providerResponseId: string | null,
    public readonly isRetryable: boolean,
  ) {
    super(message);
    this.name = 'ProviderGatewayError';
  }
}

// ============================================================
// Client
// ============================================================

export class AIProviderClient {
  private config: Required<Omit<ProviderGatewayConfig, 'tenantId' | 'audience' | 'fetchImpl'>> &
    Pick<ProviderGatewayConfig, 'tenantId' | 'audience' | 'fetchImpl'>;

  constructor(cfg: ProviderGatewayConfig) {
    this.config = {
      gatewayUrl: cfg.gatewayUrl.replace(/\/$/, ''),
      apiKey: cfg.apiKey,
      tenantId: cfg.tenantId,
      audience: cfg.audience,
      timeoutMs: cfg.timeoutMs ?? 60000,
      maxRetries: cfg.maxRetries ?? 2,
      retryBackoffMs: cfg.retryBackoffMs ?? 500,
      fetchImpl: cfg.fetchImpl ?? fetch,
    };
  }

  /** Check gateway health. */
  async health(): Promise<ProviderHealthResponse> {
    const resp = await this.doFetch('GET', '/v1/health', undefined, 0);
    if (!resp.ok) {
      throw new ProviderGatewayError(
        `Health check failed: ${resp.status}`,
        resp.status,
        null,
        false,
      );
    }
    const data = (await resp.json()) as Partial<ProviderHealthResponse>;
    return {
      status: data.status ?? 'degraded',
      models: data.models ?? [],
      version: data.version ?? null,
    };
  }

  /** Chat completion through gateway. */
  async chat(req: ProviderChatRequest): Promise<ProviderChatResponse> {
    const requestId = req.request_id ?? generateRequestId();
    const body = {
      model: req.model,
      messages: req.messages,
      max_tokens: req.max_tokens,
      temperature: req.temperature,
      request_id: requestId,
      trace_id: req.trace_id,
      tenant_id: req.tenant_id ?? this.config.tenantId,
      user_pseudonym: req.user_pseudonym,
      audience: this.config.audience,
    };

    let lastError: ProviderGatewayError | null = null;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const resp = await this.doFetch('POST', '/v1/chat', body, attempt);
        const data = (await resp.json()) as Partial<ProviderChatResponse>;

        if (!resp.ok) {
          const isRetryable = resp.status >= 500 || resp.status === 429;
          lastError = new ProviderGatewayError(
            data.content ?? `Gateway returned ${resp.status}`,
            resp.status,
            data.provider_response_id ?? null,
            isRetryable,
          );
          if (!isRetryable || attempt >= this.config.maxRetries) throw lastError;
          await sleep(this.config.retryBackoffMs * Math.pow(2, attempt));
          continue;
        }

        return {
          model: data.model ?? req.model,
          content: data.content ?? '',
          finish_reason: data.finish_reason ?? 'stop',
          usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          provider_response_id: data.provider_response_id ?? null,
          request_id: data.request_id ?? requestId,
          latency_ms: data.latency_ms ?? null,
        };
      } catch (err) {
        if (err instanceof ProviderGatewayError) {
          if (!err.isRetryable || attempt >= this.config.maxRetries) throw err;
          lastError = err;
        } else {
          lastError = new ProviderGatewayError(
            err instanceof Error ? err.message : String(err),
            0,
            null,
            true,
          );
          if (attempt >= this.config.maxRetries) throw lastError;
        }
        await sleep(this.config.retryBackoffMs * Math.pow(2, attempt));
      }
    }
    throw lastError ?? new ProviderGatewayError('Exhausted retries', 0, null, false);
  }

  private async doFetch(
    method: string,
    path: string,
    body: unknown,
    _attempt: number,
  ): Promise<Response> {
    const url = `${this.config.gatewayUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      return await this.config.fetchImpl!(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.tenantId ? { 'X-Tenant-ID': this.config.tenantId } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ============================================================
// Helpers
// ============================================================

export function generateRequestId(): string {
  return `nai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Model ID mapping — nguyenai.net model catalog → aiagent.iai.one model IDs
// ============================================================

/**
 * Maps Nguyen AI product-catalog model IDs (e.g. "nguyen-iris-3") to
 * AI Provider Gateway model IDs (e.g. "iai-one/iris-3").
 *
 * The gateway only recognizes the iaione/* namespace. Without this map,
 * the gateway rejects every Nguyen AI model ID with 400/404.
 *
 * Models not in the map fall back to a heuristic: strip "nguyen-" prefix
 * and prepend "iai-one/". Unknown models are passed through unchanged
 * so the gateway can return its own error (preserves contract surface).
 */
const NAI_TO_GATEWAY_MODEL_MAP: Record<string, string> = {
  'nguyen-iris-3': 'iai-one/iris-3',
  'nguyen-pulse-3': 'iai-one/pulse-3',
  'nguyen-echo-mini': 'iai-one/echo-mini',
};

/**
 * Resolve a Nguyen AI model ID to the AI Provider Gateway model ID.
 * Order: explicit map → heuristic (nguyen-X → iai-one/X) → passthrough.
 */
export function resolveGatewayModelId(naiModelId: string): string {
  if (NAI_TO_GATEWAY_MODEL_MAP[naiModelId]) {
    return NAI_TO_GATEWAY_MODEL_MAP[naiModelId]!;
  }
  // Heuristic: nguyen-iris-3 → iris-3 → iai-one/iris-3
  if (naiModelId.startsWith('nguyen-')) {
    const stripped = naiModelId.slice('nguyen-'.length);
    return `iai-one/${stripped}`;
  }
  // Already gateway-shaped or unknown — pass through
  return naiModelId;
}

// ============================================================
// LLMProvider adapter for @nai/prism
// ============================================================

import type { LLMProvider, ChatRequest, ChatResponse, ModelDescriptor } from '@nai/prism';

/**
 * Adapter that implements @nai/prism's LLMProvider interface
 * but routes all calls through the AI Provider Gateway.
 */
export class GatewayLLMProvider implements LLMProvider {
  private client: AIProviderClient;

  constructor(cfg: ProviderGatewayConfig) {
    this.client = new AIProviderClient(cfg);
  }

  async chat(req: ChatRequest, model: ModelDescriptor): Promise<ChatResponse> {
    const gatewayModelId = resolveGatewayModelId(model.id);
    const resp = await this.client.chat({
      model: gatewayModelId,
      messages: req.messages,
      max_tokens: req.max_tokens,
      temperature: req.temperature,
      tenant_id: req.tenant_id,
      user_pseudonym: req.user_id,
    });

    return {
      model: resp.model,
      content: resp.content,
      finish_reason: resp.finish_reason,
      usage: resp.usage,
      served_by: 'ai-provider-gateway',
      provider_response_id: resp.provider_response_id,
    };
  }
}

/**
 * SetLLMProvider function type — injected by caller to avoid circular dependency.
 */
export type SetLLMProviderFn = (provider: LLMProvider) => void;

/**
 * Configure the AI Provider Gateway as the LLM provider.
 * Caller passes setLLMProvider from @nai/prism to avoid circular import.
 * Returns true if the gateway was configured successfully.
 */
export function configureProviderGateway(
  cfg: ProviderGatewayConfig,
  setLLMProvider: SetLLMProviderFn,
): boolean {
  if (!cfg.gatewayUrl || !cfg.apiKey) return false;
  setLLMProvider(new GatewayLLMProvider(cfg));
  return true;
}
