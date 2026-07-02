export type MemoryType = "conversation" | "fact" | "preference" | "skill" | "feedback" | "error" | "learning";

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  agentId: string;
  sessionId: string;
  userId: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  importance: number;
  timestamp: number;
  expiresAt?: number;
}

export interface MemoryQuery {
  agentId?: string;
  userId?: string;
  type?: MemoryType;
  query?: string;
  limit?: number;
  minImportance?: number;
  since?: number;
}

export interface LearningRecord {
  id: string;
  userId: string;
  interactionId: string;
  input: string;
  output: string;
  feedback: FeedbackData;
  improvements: string[];
  timestamp: number;
}

export interface FeedbackData {
  rating: number;
  accurate: boolean;
  helpful: boolean;
  fast: boolean;
  comments?: string;
  correctedOutput?: string;
}

export interface ImprovementSuggestion {
  id: string;
  agentId: string;
  pattern: string;
  suggestion: string;
  source: "feedback" | "auto" | "review";
  confidence: number;
  implemented: boolean;
  timestamp: number;
}

export interface SessionStore {
  id: string;
  userId: string;
  agentId: string;
  messages: number;
  tokensUsed: number;
  toolsUsed: string[];
  startedAt: number;
  lastActiveAt: number;
  metadata: Record<string, unknown>;
}
