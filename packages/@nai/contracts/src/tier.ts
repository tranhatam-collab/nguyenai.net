export type Tier = string;
export type TierName = "free" | "basic" | "pro" | "enterprise";

export interface TierConfig {
  name: TierName;
  displayName: string;
  // NOTE: Pricing is owned by @nai/product-catalog (per PRICING_CATALOG_OWNERSHIP.md).
  // Do NOT add pricing fields here. Read prices from getAllPlans() / getPlan().
  maxRequestsPerDay: number;
  maxTokensPerMonth: number;
  maxConcurrentSessions: number;
  providers: string[];
  models: string[];
  maxToolsPerSession: number;
  multiAgentEnabled: boolean;
  selfLearningEnabled: boolean;
  reviewLevel: "basic" | "standard" | "full" | "custom";
  apiAccess: boolean;
  maxApiKeys: number;
  dataRetentionDays: number;
  teamsAllowed: boolean;
  customBranding: boolean;
  auditLogging: boolean;
  supportTier: "community" | "email" | "priority" | "dedicated";
}

export const TIER_CONFIGS: Record<TierName, TierConfig> = {
  free: {
    name: "free",
    displayName: "Free",
    maxRequestsPerDay: 0,
    maxTokensPerMonth: 0,
    maxConcurrentSessions: 1,
    providers: [],
    models: [],
    maxToolsPerSession: 10,
    multiAgentEnabled: false,
    selfLearningEnabled: false,
    reviewLevel: "basic",
    apiAccess: false,
    maxApiKeys: 3,
    dataRetentionDays: 30,
    teamsAllowed: false,
    customBranding: false,
    auditLogging: false,
    supportTier: "community"
  },
  basic: {
    name: "basic",
    displayName: "Basic",
    maxRequestsPerDay: 1000,
    maxTokensPerMonth: 10000000,
    maxConcurrentSessions: 5,
    providers: ["openai", "google"],
    models: ["gpt-4o", "gemini-2.0-flash", "gemini-2.0-pro"],
    maxToolsPerSession: 25,
    multiAgentEnabled: false,
    selfLearningEnabled: false,
    reviewLevel: "standard",
    apiAccess: true,
    maxApiKeys: 5,
    dataRetentionDays: 90,
    teamsAllowed: false,
    customBranding: false,
    auditLogging: false,
    supportTier: "email"
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    maxRequestsPerDay: 10000,
    maxTokensPerMonth: 100000000,
    maxConcurrentSessions: 20,
    providers: ["openai", "anthropic", "google", "groq", "mistral", "deepseek", "together"],
    models: ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet", "claude-3-haiku", "gemini-2.0-pro", "gemini-2.0-flash", "mixtral-8x7b", "deepseek-v3", "llama-3.1-70b", "llama-3.1-8b"],
    maxToolsPerSession: 50,
    multiAgentEnabled: true,
    selfLearningEnabled: true,
    reviewLevel: "full",
    apiAccess: true,
    maxApiKeys: 10,
    dataRetentionDays: 365,
    teamsAllowed: true,
    customBranding: true,
    auditLogging: true,
    supportTier: "priority"
  },
  enterprise: {
    name: "enterprise",
    displayName: "Enterprise",
    maxRequestsPerDay: 0,
    maxTokensPerMonth: 0,
    maxConcurrentSessions: 100,
    providers: [],
    models: [],
    maxToolsPerSession: 100,
    multiAgentEnabled: true,
    selfLearningEnabled: true,
    reviewLevel: "custom",
    apiAccess: true,
    maxApiKeys: 100,
    dataRetentionDays: 0,
    teamsAllowed: true,
    customBranding: true,
    auditLogging: true,
    supportTier: "dedicated"
  }
};

export interface TierRestriction {
  tier: TierName;
  maxParallelAgents: number;
  maxTools: number;
  streamingEnabled: boolean;
  visionEnabled: boolean;
  codeExecutionEnabled: boolean;
  imageGenerationEnabled: boolean;
  knowledgeCutoff: string;
  customInstructions: boolean;
  fileUploadEnabled: boolean;
  fileUploadSizeMb: number;
  webSearchEnabled: boolean;
  contextWindowTokens: number;
}

export const TIER_RESTRICTIONS: Record<TierName, TierRestriction> = {
  free: {
    tier: "free",
    maxParallelAgents: 1,
    maxTools: 10,
    streamingEnabled: true,
    visionEnabled: false,
    codeExecutionEnabled: false,
    imageGenerationEnabled: false,
    knowledgeCutoff: "2026-01",
    customInstructions: false,
    fileUploadEnabled: false,
    fileUploadSizeMb: 0,
    webSearchEnabled: true,
    contextWindowTokens: 8000
  },
  basic: {
    tier: "basic",
    maxParallelAgents: 1,
    maxTools: 25,
    streamingEnabled: true,
    visionEnabled: true,
    codeExecutionEnabled: true,
    imageGenerationEnabled: false,
    knowledgeCutoff: "2026-05",
    customInstructions: true,
    fileUploadEnabled: true,
    fileUploadSizeMb: 10,
    webSearchEnabled: true,
    contextWindowTokens: 32000
  },
  pro: {
    tier: "pro",
    maxParallelAgents: 5,
    maxTools: 50,
    streamingEnabled: true,
    visionEnabled: true,
    codeExecutionEnabled: true,
    imageGenerationEnabled: true,
    knowledgeCutoff: "2026-05",
    customInstructions: true,
    fileUploadEnabled: true,
    fileUploadSizeMb: 50,
    webSearchEnabled: true,
    contextWindowTokens: 128000
  },
  enterprise: {
    tier: "enterprise",
    maxParallelAgents: 20,
    maxTools: 100,
    streamingEnabled: true,
    visionEnabled: true,
    codeExecutionEnabled: true,
    imageGenerationEnabled: true,
    knowledgeCutoff: "2026-05",
    customInstructions: true,
    fileUploadEnabled: true,
    fileUploadSizeMb: 200,
    webSearchEnabled: true,
    contextWindowTokens: 512000
  }
};
