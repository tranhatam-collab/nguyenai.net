/**
 * @nai/gateway-sdk — API gateway SDK stub.
 *
 * Placeholder for future API gateway integration.
 * Will provide: request routing, rate limiting, API key validation,
 * provider failover, and model routing for the Nguyen AI API gateway.
 *
 * Status: Stub — not yet implemented.
 * Reference: Gen1 (aiagent.iai.one) model-gateway-sdk for architecture.
 */

export interface ProviderRequest {
  provider?: string;
  model: string;
  messages: unknown[];
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderResponse {
  content: string;
  usage: { promptTokens: number; completionTokens: number };
  model: string;
  provider: string;
}

export const PROVIDER_REGISTRY: Record<string, { baseUrl: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1' },
  cloudflare: { baseUrl: 'https://api.cloudflare.com/client/v4/accounts' },
  // Gen1 upstream (aiagent.iai.one — FROZEN reference, adapter only)
  'gen1-iai-one': { baseUrl: 'https://aiagent-iai-one-api-prod.tranhatam.workers.dev' },
};

export async function callProvider(_req: ProviderRequest): Promise<ProviderResponse> {
  throw new Error('gateway-sdk callProvider not yet implemented — use apps/api for live routing');
}

export interface GatewayConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface GatewayRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Create a gateway client.
 * TODO: implement actual gateway routing logic.
 */
export function createGateway(_config: GatewayConfig): {
  request: (_req: GatewayRequest) => Promise<GatewayResponse>;
} {
  return {
    request: async (_req: GatewayRequest): Promise<GatewayResponse> => {
      throw new Error('gateway-sdk not yet implemented — use @nai/billing for payment routing');
    },
  };
}
