/**
 * command.ts — Shared types for Command Center and Model Mesh
 */

export interface Command {
  id: string;
  text: string;
  model: string;
  timestamp: number;
  status: 'running' | 'completed' | 'failed';
  result?: string;
}

export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'mistral'
  | 'cohere'
  | 'auto';

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  contextWindow: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  capabilities: string[];
}

export interface RoutingRule {
  id: string;
  condition: string;
  modelId: string;
}
