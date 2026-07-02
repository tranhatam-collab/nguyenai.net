export type ReviewStatus = "pending" | "approved" | "rejected" | "needs-revision";
export type ReviewLevel = "pre-response" | "post-response" | "batch";
export type ReviewSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface ReviewGate {
  id: string;
  name: string;
  level?: ReviewLevel;
  severity?: ReviewSeverity;
  rules: ReviewRule[];
  requiredApprovers?: number;
  autoApprove?: boolean;
  timeout?: number;
  tier?: string[];
  autoRemediate?: boolean;
}

export interface ReviewRule {
  id: string;
  name?: string;
  type?: "content-safety" | "accuracy" | "relevance" | "quality" | "bias" | "toxicity" | "factual" | "policy" | "format";
  action?: "block" | "flag" | "warn" | "log";
  threshold?: number;
  prompt?: string;
  description?: string;
}

export interface ReviewResult {
  gateId: string;
  status: ReviewStatus;
  score: number;
  violations: ReviewViolation[];
  reviewedBy: string;
  reviewedAt: number;
  notes?: string;
}

export interface ReviewViolation {
  ruleId: string;
  severity: ReviewSeverity;
  message: string;
  excerpt: string;
  suggestion?: string;
}

export interface ReviewMatrix {
  id: string;
  name: string;
  description: string;
  gates: ReviewGate[];
  minOverallScore: number;
  requiresHumanReview: boolean;
  autoRemediate: boolean;
}

export interface QualityScore {
  overall: number;
  accuracy: number;
  relevance: number;
  clarity: number;
  safety: number;
  completeness: number;
  codeQuality?: number;
}

export interface ModerationCheck {
  toxic: number;
  hate: number;
  harassment: number;
  sexual: number;
  violence: number;
  selfHarm: number;
  spam: number;
  policy: number;
}

export const DEFAULT_REVIEW_MATRIX: ReviewMatrix = {
  id: "review-matrix-v1",
  name: "Nguyen AI Review Matrix v1",
  description: "Multi-layer review and approval gate for all agent responses",
  minOverallScore: 0.7,
  requiresHumanReview: true,
  autoRemediate: true,
  gates: [
    {
      id: "gate-pre-content-safety",
      name: "Pre-response Content Safety",
      level: "pre-response",
      severity: "critical",
      requiredApprovers: 1,
      autoApprove: false,
      timeout: 5000,
      rules: [
        {
          id: "rule-toxicity",
          name: "Toxicity Check",
          type: "toxicity",
          action: "block",
          threshold: 0.8,
          prompt: "Check if the response contains toxic, hateful, or harmful content."
        },
        {
          id: "rule-policy",
          name: "Policy Compliance",
          type: "policy",
          action: "block",
          threshold: 0.9,
          prompt: "Check if the response complies with platform policies and TOS."
        },
        {
          id: "rule-personal-data",
          name: "Personal Data Protection",
          type: "content-safety",
          action: "block",
          threshold: 0.95,
          prompt: "Check if any personal or sensitive data is being exposed."
        }
      ]
    },
    {
      id: "gate-post-quality",
      name: "Post-response Quality Gate",
      level: "post-response",
      severity: "high",
      requiredApprovers: 1,
      autoApprove: true,
      timeout: 3000,
      rules: [
        {
          id: "rule-accuracy",
          name: "Factual Accuracy",
          type: "accuracy",
          action: "flag",
          threshold: 0.7,
          prompt: "Check if the response is factually accurate given available context."
        },
        {
          id: "rule-relevance",
          name: "Response Relevance",
          type: "relevance",
          action: "warn",
          threshold: 0.6,
          prompt: "Check if the response directly addresses the user's question."
        },
        {
          id: "rule-format",
          name: "Output Format Quality",
          type: "format",
          action: "warn",
          threshold: 0.5,
          prompt: "Check if the response follows proper formatting and structure."
        }
      ]
    },
    {
      id: "gate-batch-learning",
      name: "Batch Learning Review",
      level: "batch",
      severity: "medium",
      requiredApprovers: 2,
      autoApprove: false,
      timeout: 30000,
      rules: [
        {
          id: "rule-improvement",
          name: "Learning Improvement",
          type: "quality",
          action: "log",
          threshold: 0.5,
          prompt: "Extract improvement suggestions from this interaction."
        },
        {
          id: "rule-pattern",
          name: "Pattern Detection",
          type: "quality",
          action: "log",
          threshold: 0.5,
          prompt: "Identify recurring patterns in user requests for skill improvement."
        }
      ]
    }
  ]
};
