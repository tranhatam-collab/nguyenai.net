export type TOSSection = string;
export type TOSCategory = "terms" | "privacy" | "acceptable-use" | "api-terms" | "free-tier";
export type UserType = "free" | "basic" | "pro" | "enterprise";

export interface TermsOfService {
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  governingLaw: string;
  jurisdiction: string;
  sections: TOSSection[];
}

export interface AcceptableUsePolicy {
  prohibited: ProhibitedActivity[];
  restricted: RestrictedActivity[];
  enforcement: EnforcementAction[];
  reporting: ReportingChannel;
}

export interface ProhibitedActivity {
  id: string;
  category: string;
  description: string;
  severity: "critical" | "high" | "medium";
  examples: string[];
}

export interface RestrictedActivity {
  id: string;
  description: string;
  conditions: string[];
  requiresApproval: boolean;
}

export interface EnforcementAction {
  level: number;
  violation: string;
  action: string;
  appealable: boolean;
}

export interface ReportingChannel {
  email: string;
  responseTime: string;
  anonymous: boolean;
}

export interface ApiTerms {
  rateLimit: RateLimitTerms;
  dataUse: DataUseTerms;
  keyManagement: KeyManagementTerms;
  usageMonitoring: UsageMonitoringTerms;
}

export interface RateLimitTerms {
  freeTier: string;
  basicTier: string;
  proTier: string;
  enterpriseTier: string;
  burstAllowed: boolean;
  fairUsePolicy: string;
}

export interface DataUseTerms {
  trainingData: string;
  retentionPeriod: string;
  deletionProcess: string;
  userContentOwnership: string;
  analytics: string;
}

export interface KeyManagementTerms {
  byok: ByokTerms;
  managedKeys: ManagedKeyTerms;
}

export interface ByokTerms {
  allowed: boolean;
  supportedProviders: string[];
  securityRequirements: string[];
  keyRotationRequired: boolean;
  liability: string;
}

export interface ManagedKeyTerms {
  costIncluded: boolean;
  usageTracking: string;
  overagePolicy: string;
}

export interface UsageMonitoringTerms {
  trackingMethod: string;
  dataCollected: string[];
  optOutAvailable: boolean;
  thirdPartySharing: string;
}

export interface TierComparison {
  tier: UserType;
  price: string;
  providerAccess: string;
  byokSupport: boolean;
  modelsAvailable: string;
  rateLimit: string;
  toolsAccess: string;
  multiAgent: boolean;
  selfLearning: boolean;
  reviewGates: string;
  apiAccess: boolean;
  supportLevel: string;
  dataRetention: string;
}

export const TIER_COMPARISON: Record<UserType, TierComparison> = {
  free: {
    tier: "free",
    price: "$0",
    providerAccess: "BYOK only",
    byokSupport: true,
    modelsAvailable: "Depends on BYOK provider",
    rateLimit: "No platform rate limit (BYOK rate applies)",
    toolsAccess: "20+ free built-in tools",
    multiAgent: false,
    selfLearning: false,
    reviewGates: "Basic safety review",
    apiAccess: false,
    supportLevel: "Community",
    dataRetention: "30 days"
  },
  basic: {
    tier: "basic",
    price: "$9.99/month",
    providerAccess: "Managed OpenAI + Google",
    byokSupport: true,
    modelsAvailable: "GPT-4o, Gemini 2.0, Claude 3 Haiku",
    rateLimit: "1000 requests/day",
    toolsAccess: "40+ tools (free + basic tier)",
    multiAgent: false,
    selfLearning: false,
    reviewGates: "Safety + quality review",
    apiAccess: true,
    supportLevel: "Email (24h)",
    dataRetention: "90 days"
  },
  pro: {
    tier: "pro",
    price: "$29.99/month",
    providerAccess: "Managed: OpenAI, Anthropic, Google, Groq, Mistral, DeepSeek",
    byokSupport: true,
    modelsAvailable: "All models across 6 providers",
    rateLimit: "10000 requests/day",
    toolsAccess: "60+ tools (all available tools)",
    multiAgent: true,
    selfLearning: true,
    reviewGates: "Full multi-layer review",
    apiAccess: true,
    supportLevel: "Priority email + chat (4h)",
    dataRetention: "1 year"
  },
  enterprise: {
    tier: "enterprise",
    price: "Custom",
    providerAccess: "All providers + custom provider integration",
    byokSupport: true,
    modelsAvailable: "Unlimited access + custom models",
    rateLimit: "Custom unlimited",
    toolsAccess: "All tools + custom tool development",
    multiAgent: true,
    selfLearning: true,
    reviewGates: "Custom review matrix",
    apiAccess: true,
    supportLevel: "Dedicated support (1h)",
    dataRetention: "Custom"
  }
};
