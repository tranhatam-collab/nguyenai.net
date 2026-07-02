import type { ToolCall } from "./agent.js";

export type ProviderName =
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "mistral"
  | "cohere"
  | "deepseek"
  | "together"
  | "perplexity"
  | "elevenlabs"
  | "stability"
  | "replicate"
  | "huggingface"
  | "fireworks"
  | "xai"
  | "openrouter"
  | "cerebras"               // Wave 1 — 1M tokens/day free, CEREBRAS_API_KEY
  | "cloudflare-workers-ai"; // Wave 1 — CF native AI binding, 10k neurons/day free

export interface ProviderTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  function?: { name: string; description: string; parameters: Record<string, unknown> };
  inputSchema?: Record<string, unknown>;
}

export type Capability =
  | "chat"
  | "completion"
  | "embedding"
  | "image-generation"
  | "image-understanding"
  | "audio-transcription"
  | "audio-generation"
  | "code-execution"
  | "function-calling"
  | "streaming"
  | "json-mode"
  | "vision"
  | "tool-use";

export interface ProviderConfig {
  name: ProviderName;
  displayName: string;
  baseUrl: string;
  apiKeyEnv: string;
  capabilities: Capability[];
  models: ModelConfig[];
  rateLimit: RateLimitConfig;
  pricing: PricingTier[];
  docsUrl: string;
  freeTier: boolean;
}

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: ProviderName;
  capabilities: Capability[];
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  speed: "fast" | "medium" | "slow";
  quality: "draft" | "standard" | "high" | "premium";
}

export interface RateLimitConfig {
  requestsPerMin: number;
  tokensPerMin: number;
  concurrentLimit: number;
}

export interface PricingTier {
  tier: "free" | "basic" | "pro" | "enterprise";
  requestsPerMonth: number;
  tokensPerMonth: number;
  features: string[];
}

export interface ProviderRequest {
  model: string;
  messages: ProviderMessage[];
  tools?: ProviderTool[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  jsonMode?: boolean;
}

export interface ProviderMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ProviderContent[];
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ProviderContent {
  type: "text" | "image_url" | "image" | "tool_result";
  text?: string;
  imageUrl?: { url: string; detail?: string };
  source?: { type: string; data: string; mediaType: string };
}

export interface ProviderResponse {
  id: string;
  model: string;
  provider: ProviderName;
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latency: number;
  finishReason: string;
}

export interface ApiKeyRecord {
  id: string;
  userId: string;
  provider: ProviderName;
  keyHint: string;
  isActive: boolean;
  tier: string;
  usageLimit: number;
  usageCurrent: number;
  createdAt: number;
  expiresAt?: number;
}
