/**
 * models.ts — Catalog of available models in the Model Mesh.
 */
import type { ModelOption } from '../types/command';

export const MODELS: ModelOption[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128_000,
    inputCostPer1M: 5,
    outputCostPer1M: 15,
    capabilities: ['reasoning', 'vision', 'code'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    contextWindow: 128_000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    capabilities: ['fast', 'code'],
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200_000,
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    capabilities: ['reasoning', 'code', 'vision'],
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200_000,
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    capabilities: ['reasoning', 'code', 'vision'],
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    contextWindow: 1_000_000,
    inputCostPer1M: 1.25,
    outputCostPer1M: 5,
    capabilities: ['reasoning', 'vision', 'long-context'],
  },
  {
    id: 'llama-3-1-70b',
    name: 'Llama 3.1 70B',
    provider: 'meta',
    contextWindow: 128_000,
    inputCostPer1M: 0.9,
    outputCostPer1M: 0.9,
    capabilities: ['reasoning', 'code'],
  },
  {
    id: 'llama-3-1-8b',
    name: 'Llama 3.1 8B',
    provider: 'meta',
    contextWindow: 128_000,
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.1,
    capabilities: ['fast', 'code'],
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    contextWindow: 128_000,
    inputCostPer1M: 2,
    outputCostPer1M: 6,
    capabilities: ['reasoning', 'code'],
  },
  {
    id: 'command-r-plus',
    name: 'Cohere Command R+',
    provider: 'cohere',
    contextWindow: 128_000,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
    capabilities: ['reasoning', 'retrieval'],
  },
  {
    id: 'auto-route',
    name: 'Auto-route',
    provider: 'auto',
    contextWindow: 1_000_000,
    inputCostPer1M: 1.5,
    outputCostPer1M: 6,
    capabilities: ['auto', 'cost-optimized'],
  },
];

export const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  meta: 'Meta',
  mistral: 'Mistral',
  cohere: 'Cohere',
  auto: 'Auto',
};

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

export function getModelById(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}
