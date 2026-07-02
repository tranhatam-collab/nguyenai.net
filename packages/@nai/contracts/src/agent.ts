import type { ReviewResult, ReviewGate } from "./review.js";

export type AgentId = string;
export type SessionId = string;
export type AgentRole = "coordinator" | "researcher" | "analyst" | "writer" | "reviewer" | "coder" | "translator" | "fact-checker" | "planner" | "critic" | "tool";

export interface AgentIdentity {
  id: AgentId;
  name: string;
  role: AgentRole;
  model: string;
  provider: string;
  systemPrompt: string;
  skills: string[];
  maxTokens: number;
  temperature: number;
}

export interface AgentContext {
  sessionId: SessionId;
  userId: string;
  tier: string;
  language: string;
  features?: unknown;
  apiKey?: string;
  parentAgentId?: AgentId;
  childAgentIds?: AgentId[];
  metadata: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
  agentId?: AgentId;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface AgentTask {
  id: string;
  type: string;
  input: string;
  context: AgentContext;
  requiredSkills: string[];
  priority?: number;
  reviewRequired: boolean;
  maxAgents: number;
  timeout?: number;
}

export interface AgentResponse {
  id: string;
  taskId: string;
  content: string;
  agentId: AgentId;
  agentRole: AgentRole;
  confidence: number;
  reviewResult?: ReviewResult;
  toolCalls: ToolCall[];
  tokensUsed: number;
  latency: number;
  trace: AgentTrace[];
  failoverInfo?: { from?: string; to?: string; reason?: string; latencyMs?: number; triggered?: boolean; chain?: Array<{ from: string; to: string; reason: string }> };
}

export interface AgentTrace {
  step: string;
  agentId: AgentId;
  input: string;
  output: string;
  timestamp: number;
  duration: number;
}

export interface FeedbackEntry {
  id: string;
  sessionId: string;
  messageId?: string;
  rating: number;
  comment?: string;
  category?: string;
  timestamp: number;
  source?: string;
}

export interface OrchestrationPlan {
  id: string;
  task: AgentTask;
  agents: AgentIdentity[];
  sequence: OrchestrationStep[];
  reviewGates: ReviewGate[];
}

export interface OrchestrationStep {
  order: number;
  agentId: AgentId;
  action: string;
  input: string;
  dependsOn: string[];
  parallel: boolean;
}
