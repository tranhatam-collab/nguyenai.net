import type {
  AgentId, AgentIdentity, AgentRole, AgentContext, AgentMessage, AgentTask,
  AgentResponse, AgentTrace, OrchestrationPlan, OrchestrationStep,
  ToolCall, ToolResult, ReviewResult, ReviewGate, ReviewViolation, QualityScore
} from "@nai/contracts";

export type { AgentTask, AgentId, AgentIdentity, AgentRole, AgentContext, AgentResponse, OrchestrationPlan, OrchestrationStep, QualityScore, ReviewResult, ReviewViolation };
import type { ProviderResponse } from "@nai/contracts";
import { callProvider, PROVIDER_REGISTRY, type ProviderRequest } from "@nai/gateway-sdk";
// connector-sdk not yet forked — stubbed locally
const executeConnector = async (_call: unknown): Promise<unknown> => { throw new Error("connector-sdk not yet forked"); };
const buildToolSystemPrompt = (): string => "";
const initDefaultTools = (): void => {};

initDefaultTools();

export class AgentRuntime {
  private agents: Map<AgentId, AgentIdentity> = new Map();
  private sessions: Map<string, { messages: AgentMessage[]; createdAt: number }> = new Map();
  private reviewHandlers: ReviewHandler[] = [];
  private learningCallbacks: LearningCallback[] = [];
  private systemPromptGenerator?: (context: AgentContext) => string;

  constructor() {
    this.registerDefaultAgents();
  }

  private registerDefaultAgents(): void {
    const defaultAgents: AgentIdentity[] = [
      {
        id: "coordinator-v1", name: "Coordinator", role: "coordinator",
        model: "llama-3.3-70b-versatile", provider: "groq",
        systemPrompt: "You are the coordinator agent. Analyze user requests, break them into subtasks, delegate to specialist agents, and synthesize final responses. Always plan first, then execute.",
        skills: ["planning", "delegation", "synthesis", "quality-check"],
        maxTokens: 4096, temperature: 0.7
      },
      {
        id: "researcher-v1", name: "Researcher", role: "researcher",
        model: "claude-3.5-sonnet-20241022", provider: "anthropic",
        systemPrompt: "You are a research specialist. Gather information from web searches, APIs, and documents. Provide comprehensive, well-sourced findings. Always cite sources.",
        skills: ["web-research", "fact-checking", "source-analysis", "data-collection"],
        maxTokens: 8192, temperature: 0.5
      },
      {
        id: "analyst-v1", name: "Analyst", role: "analyst",
        model: "gpt-4o", provider: "openai",
        systemPrompt: "You are an analysis specialist. Examine data, identify patterns, evaluate options, and provide structured recommendations. Think step by step.",
        skills: ["data-analysis", "critical-thinking", "problem-solving", "decision-support"],
        maxTokens: 4096, temperature: 0.4
      },
      {
        id: "writer-v1", name: "Writer", role: "writer",
        model: "claude-3-5-haiku-20241022", provider: "anthropic",
        systemPrompt: "You are a writing specialist. Craft clear, engaging, and well-structured content. Adapt tone to audience and purpose.",
        skills: ["content-creation", "editing", "storytelling", "formatting"],
        maxTokens: 4096, temperature: 0.7
      },
      {
        id: "coder-v1", name: "Coder", role: "coder",
        model: "deepseek-chat", provider: "deepseek",
        systemPrompt: "You are a code specialist. Write clean, efficient, well-documented code. Review for bugs, security, and performance. Support multiple languages.",
        skills: ["code-generation", "code-review", "debugging", "architecture"],
        maxTokens: 8192, temperature: 0.3
      },
      {
        id: "reviewer-v1", name: "Reviewer", role: "reviewer",
        model: "gpt-4o", provider: "openai",
        systemPrompt: "You are a quality assurance specialist. Review all outputs for accuracy, safety, clarity, and completeness. Flag issues and suggest improvements.",
        skills: ["quality-check", "safety-review", "accuracy-verification", "bias-detection"],
        maxTokens: 4096, temperature: 0.3
      },
      {
        id: "translator-v1", name: "Translator", role: "translator",
        model: "gemini-2.0-flash", provider: "google",
        systemPrompt: "Bạn là chuyên gia dịch thuật song ngữ Việt-Anh. Dịch chính xác, giữ nguyên sắc thái và ngữ cảnh. Luôn cung cấp cả bản dịch và mức độ tin cậy.",
        skills: ["translation", "localization", "bilingual", "cultural-adaptation"],
        maxTokens: 4096, temperature: 0.3
      },
      {
        id: "safety-v1", name: "Safety", role: "coordinator",
        model: "gpt-4o-mini", provider: "openai",
        systemPrompt: "You are a content safety specialist. Scan all inputs and outputs for toxic language, PII, credentials, and policy violations. Flag and redact immediately. Never let harmful content through.",
        skills: ["content-moderation", "pii-redaction", "toxicity-detection", "policy-enforcement"],
        maxTokens: 2048, temperature: 0.1
      },
      {
        id: "memory-v1", name: "Memory", role: "coordinator",
        model: "llama-3.1-8b-instant", provider: "groq",
        systemPrompt: "You are a memory management specialist. Extract key information from conversations, summarize context, manage session state, and retrieve relevant past interactions. Keep context concise and relevant.",
        skills: ["context-management", "information-extraction", "summarization", "session-persistence"],
        maxTokens: 4096, temperature: 0.3
      },
      {
        id: "cost-governor-v1", name: "Cost Governor", role: "coordinator",
        model: "llama-3.1-8b-instant", provider: "groq",
        systemPrompt: "You are a cost optimization specialist. Monitor token usage, suggest cheaper alternatives when appropriate, warn when approaching rate limits, and optimize prompt lengths. Keep costs predictable.",
        skills: ["token-budgeting", "cost-optimization", "rate-limit-awareness", "model-selection"],
        maxTokens: 2048, temperature: 0.2
      },
      {
        id: "tool-router-v1", name: "Tool Router", role: "tool",
        model: "llama-3.1-8b-instant", provider: "groq",
        systemPrompt: "You are a tool routing specialist. Match user requests to the most appropriate tool, validate permissions, format parameters correctly, and handle tool errors gracefully.",
        skills: ["tool-selection", "parameter-validation", "permission-checking", "error-handling"],
        maxTokens: 2048, temperature: 0.2
      },
      {
        id: "verifier-v1", name: "Verifier", role: "reviewer",
        model: "llama-3.3-70b-versatile", provider: "groq",
        systemPrompt: "You are a verification specialist. Double-check facts, validate code correctness, verify source citations, and ensure output consistency. If uncertain, flag for human review.",
        skills: ["fact-verification", "code-validation", "source-checking", "consistency-check"],
        maxTokens: 4096, temperature: 0.2
      }
    ];

    for (const agent of defaultAgents) {
      this.registerAgent(agent);
    }
  }

  registerAgent(agent: AgentIdentity): void {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: AgentId): AgentIdentity | undefined {
    return this.agents.get(id);
  }

  listAgents(role?: AgentRole): AgentIdentity[] {
    if (role) return Array.from(this.agents.values()).filter(a => a.role === role);
    return Array.from(this.agents.values());
  }

  setSystemPromptGenerator(fn: (context: AgentContext) => string): void {
    this.systemPromptGenerator = fn;
  }

  addReviewHandler(handler: ReviewHandler): void {
    this.reviewHandlers.push(handler);
  }

  addLearningCallback(callback: LearningCallback): void {
    this.learningCallbacks.push(callback);
  }

  async processTask(task: AgentTask): Promise<AgentResponse> {
    const trace: AgentTrace[] = [];
    const plan = await this.createPlan(task);

    trace.push({
      step: "plan-created", agentId: "system", input: task.input,
      output: JSON.stringify({ agents: plan.agents.map(a => a.role), steps: plan.sequence.length }),
      timestamp: Date.now(), duration: 0
    });

    const results: Map<string, string> = new Map();
    let finalContent = "";

    // Execute steps — sequential by default, parallel when declared
    let idx = 0;
    while (idx < plan.sequence.length) {
      const step = plan.sequence[idx];
      if (!step) break;

      if (!step.parallel) {
        // Sequential step
        const { content, stepTrace, error } = await this.executeStep(step, plan, task, results);
        results.set(step.order.toString(), content);
        finalContent = content;
        trace.push(stepTrace);
        idx++;
        if (error) throw error;
      } else {
        // Parallel batch: consecutive steps marked parallel run together
        const batch: OrchestrationStep[] = [step];
        let j = idx + 1;
        while (j < plan.sequence.length) {
          const nextStep = plan.sequence[j];
          if (!nextStep || !nextStep.parallel) break;
          batch.push(nextStep);
          j++;
        }

        const batchResults = await Promise.allSettled(
          batch.map(s => this.executeStep(s, plan, task, results))
        );

        let batchError: Error | undefined;
        for (const r of batchResults) {
          if (r.status === "fulfilled") {
            const val = r.value;
            results.set(val.step.order.toString(), val.content);
            finalContent = val.content;
            trace.push(val.stepTrace);
            if (val.error && !batchError) batchError = val.error;
          } else {
            // Promise was rejected (should not happen with new executeStep, but guard)
            const err = r.reason instanceof Error ? r.reason : new Error(String(r.reason));
            if (!batchError) batchError = err;
          }
        }
        idx = j;
        if (batchError) throw batchError;
      }
    }

    const finalReview = await this.runReviewGates(finalContent, task.context);
    const quality = await this.calculateQuality(finalContent, task);

    const response: AgentResponse = {
      id: crypto.randomUUID(),
      taskId: task.id,
      content: finalContent,
      agentId: plan.agents[plan.sequence.length - 1]?.id || "unknown",
      agentRole: plan.agents[plan.sequence.length - 1]?.role || "coordinator",
      confidence: quality.overall,
      reviewResult: finalReview,
      toolCalls: [],
      tokensUsed: 0,
      latency: trace.reduce((sum, t) => sum + t.duration, 0),
      trace
    };

    for (const cb of this.learningCallbacks) {
      try { cb(response, task); } catch { /* silent */ }
    }

    return response;
  }

  private async executeStep(
    step: OrchestrationStep,
    plan: OrchestrationPlan,
    task: AgentTask,
    results: Map<string, string>,
  ): Promise<{ step: OrchestrationStep; content: string; stepTrace: AgentTrace; error?: Error }> {
    const stepStart = Date.now();
    const agent = plan.agents.find(a => a.id === step.agentId);
    if (!agent) {
      const emptyTrace: AgentTrace = {
        step: step.action, agentId: step.agentId, input: step.input,
        output: "[Agent not found]", timestamp: stepStart, duration: 0
      };
      return { step, content: "", stepTrace: emptyTrace };
    }

    const stepInput = this.resolveStepInput(step, results);
    const messages = this.buildMessages(agent, task.context, stepInput);

    const stepTrace: AgentTrace = {
      step: step.action, agentId: agent.id, input: stepInput,
      output: "", timestamp: stepStart, duration: 0
    };

    try {
      const providerRequest: ProviderRequest = {
        provider: agent.provider,
        model: agent.model,
        messages,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens
      };

      const providerResponse = await callProvider(providerRequest);

      stepTrace.output = providerResponse.content;
      stepTrace.duration = Date.now() - stepStart;

      const reviewResult = await this.runReviewGates(
        providerResponse.content, task.context
      );

      if (reviewResult?.status === "rejected") {
        stepTrace.output += `\n\n[REVIEW BLOCKED: ${reviewResult.violations.map(v => v.message).join(", ")}]`;
        if (reviewResult.violations.some(v => v.severity === "critical")) {
          const firstViolation = reviewResult.violations[0];
          return { step, content: "", stepTrace, error: new Error(`Content blocked by review: ${firstViolation?.message ?? 'unknown'}`) };
        }
      }

      return { step, content: providerResponse.content, stepTrace };
    } catch (error: any) {
      stepTrace.output = `ERROR: ${error.message}`;
      stepTrace.duration = Date.now() - stepStart;
      return { step, content: "", stepTrace, error };
    }
  }

  private async createPlan(task: AgentTask): Promise<OrchestrationPlan> {
    const coordinator = this.agents.get("coordinator-v1") || this.agents.values().next().value;
    const sequence: OrchestrationStep[] = [];

    const agentsForTask = task.maxAgents > 1
      ? this.selectAgentsForTask(task)
      : [coordinator!];

    const plan: OrchestrationPlan = {
      id: crypto.randomUUID(),
      task,
      agents: agentsForTask,
      sequence: [],
      reviewGates: []
    };

    if (agentsForTask.length === 1) {
      sequence.push({
        order: 0, agentId: agentsForTask[0]?.id ?? '',
        action: "process-request", input: task.input,
        dependsOn: [], parallel: false
      });
    } else {
      const planningStep = {
        order: 0, agentId: coordinator!.id,
        action: "analyze-and-plan", input: task.input,
        dependsOn: [], parallel: false
      };
      sequence.push(planningStep);

      const workerAgents = agentsForTask.filter(a => a.role !== "coordinator");
      workerAgents.forEach((agent, i) => {
        sequence.push({
          order: i + 1, agentId: agent.id,
          action: `execute-${agent.role}`,
          input: task.input,
          dependsOn: ["0"],
          parallel: workerAgents.length > 2
        });
      });

      const synthesisStep = {
        order: workerAgents.length + 1,
        agentId: coordinator!.id,
        action: "synthesize-results",
        input: task.input,
        dependsOn: workerAgents.map((_, i) => String(i + 1)),
        parallel: false
      };
      sequence.push(synthesisStep);

      const reviewStep = {
        order: workerAgents.length + 2,
        agentId: "reviewer-v1",
        action: "quality-review",
        input: task.input,
        dependsOn: [String(workerAgents.length + 1)],
        parallel: false
      };
      sequence.push(reviewStep);
    }

    plan.sequence = sequence;
    return plan;
  }

  private selectAgentsForTask(task: AgentTask): AgentIdentity[] {
    const selected: AgentIdentity[] = [];
    const roleScores: Partial<Record<AgentRole, number>> = {};

    const coordinator = this.agents.get("coordinator-v1");
    if (coordinator) selected.push(coordinator);

    for (const skill of task.requiredSkills) {
      for (const agent of this.agents.values()) {
        if (agent.role === "coordinator" || agent.role === "reviewer") continue;
        if (agent.skills.includes(skill) && !selected.find(s => s.id === agent.id)) {
          roleScores[agent.role] = (roleScores[agent.role] || 0) + 1;
        }
      }
    }

    const sortedRoles = Object.entries(roleScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, task.maxAgents - 1);

    for (const [role] of sortedRoles) {
      const agent = Array.from(this.agents.values()).find(a => a.role === role && !selected.find(s => s.id === a.id));
      if (agent) selected.push(agent);
    }

    if (task.reviewRequired && !selected.find(a => a.role === "reviewer")) {
      const reviewer = this.agents.get("reviewer-v1");
      if (reviewer && selected.length < task.maxAgents) selected.push(reviewer);
    }

    return selected;
  }

  private resolveStepInput(step: OrchestrationStep, results: Map<string, string>): string {
    if (step.dependsOn.length === 0) return step.input;
    const dependencies = step.dependsOn
      .map(d => results.get(d))
      .filter(Boolean)
      .join("\n\n--- Previous Result ---\n");
    return `${step.input}\n\nContext from previous steps:\n${dependencies}`;
  }

  private buildMessages(agent: AgentIdentity, context: AgentContext, input: string): ProviderRequest["messages"] {
    const systemPrompt = this.systemPromptGenerator
      ? this.systemPromptGenerator(context)
      : this.buildDefaultSystemPrompt(agent, context);

    const session = this.sessions.get(context.sessionId);
    const conversationHistory = session?.messages.slice(-10) || [];

    return [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      })),
      { role: "user", content: input }
    ];
  }

  private buildDefaultSystemPrompt(agent: AgentIdentity, context: AgentContext): string {
    const tierInfo = context.tier === "free"
      ? "You are running on FREE tier — BYOK (Bring Your Own Key). Users may have limited access to tools and features."
      : `You are running on ${context.tier.toUpperCase()} tier with managed provider access.`;

    return `${agent.systemPrompt}

Your identity: ${agent.name} (${agent.role})
Platform: NGUYEN AI
Language: ${context.language}
Tier: ${tierInfo}
Session: ${context.sessionId}

Guidelines:
- Always provide accurate, helpful, and safe responses
- Use available tools when they can improve the response
- If you cannot fulfill a request, explain why and offer alternatives
- For FREE tier users, remind them they can bring their own API keys for expanded access
- Respect user privacy and never ask for sensitive information
- When translating between Vietnamese and English, preserve cultural context`;
  }

  private async runReviewGates(content: string, context: AgentContext): Promise<ReviewResult | undefined> {
    if (this.reviewHandlers.length === 0) return undefined;

    const violations: ReviewViolation[] = [];

    for (const handler of this.reviewHandlers) {
      const result = await handler(content, context);
      if (result) violations.push(...result);
    }

    if (violations.length === 0) return undefined;

    const criticalViolations = violations.filter(v => v.severity === "critical");
    return {
      gateId: "runtime-review",
      status: criticalViolations.length > 0 ? "rejected" : violations.length > 3 ? "needs-revision" : "approved",
      score: 1 - (violations.length * 0.1),
      violations,
      reviewedBy: "runtime-reviewer",
      reviewedAt: Date.now()
    };
  }

  private async calculateQuality(content: string, task: AgentTask): Promise<QualityScore> {
    const base: QualityScore = {
      overall: 0.85, accuracy: 0.8, relevance: 0.85, clarity: 0.8, safety: 0.9, completeness: 0.75
    };

    if (content.length < 10) base.completeness = 0.2;
    if (content.length > 100) base.completeness = 0.8;

    const hasQuestion = task.input.includes("?");
    const isAnswer = content.includes("\n") || content.includes(":");
    base.relevance = hasQuestion && isAnswer ? 0.9 : 0.7;

    const hasStructure = /^[#*-]|\d+\./.test(content) || content.split("\n").length > 3;
    base.clarity = hasStructure ? 0.9 : 0.6;

    base.overall = Object.values(base).reduce((sum, v) => sum + v, 0) / Object.keys(base).length;
    return base;
  }

  getSessionContext(sessionId: string): { messages: AgentMessage[]; createdAt: number } | undefined {
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId: string, message: AgentMessage): void {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { messages: [], createdAt: Date.now() });
    }
    const session = this.sessions.get(sessionId)!;
    session.messages.push(message);
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-50);
    }
  }
}

export type ReviewHandler = (content: string, context: AgentContext) => Promise<ReviewViolation[] | undefined>;

export type LearningCallback = (response: AgentResponse, task: AgentTask) => Promise<void> | void;

export function createRuntime(): AgentRuntime {
  return new AgentRuntime();
}

export async function checkContentSafety(content: string): Promise<ReviewViolation[]> {
  const violations: ReviewViolation[] = [];

  const toxicPatterns = [
    /\b(kill|die|murder|suicide|self-harm|hurt yourself)\b/i,
    /\b(hate speech|racist|discriminat)\b/i,
    /\b(harass|stalk|doxx|threaten)\b/i,
  ];

  for (const pattern of toxicPatterns) {
    if (pattern.test(content)) {
      violations.push({
        ruleId: "runtime-toxicity",
        severity: "high",
        message: "Content contains potentially harmful language",
        excerpt: content.substring(Math.max(0, content.search(pattern) - 20), content.search(pattern) + 40)
      });
    }
  }

  const sensitivePatterns = [
    /\b(password|secret|api.?key|access.?token)\s*[:=]\s*\S{10,}/i,
    /\b(ssn|social security|credit card|cvv)\b.{0,20}\d{4,}/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      violations.push({
        ruleId: "runtime-sensitive-data",
        severity: "critical",
        message: "Response may contain sensitive or credential information",
        excerpt: content.substring(Math.max(0, content.search(pattern) - 10), content.search(pattern) + 30)
      });
    }
  }

  const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 5) {
    violations.push({
      ruleId: "runtime-excessive-links",
      severity: "low",
      message: "Response contains excessive external links",
      excerpt: `${urlCount} URLs found`
    });
  }

  return violations;
}

export const defaultSafetyHandler: ReviewHandler = async (content) => {
  return checkContentSafety(content);
};

export function createSelfLearningCallback(): LearningCallback {
  const learningStore: Map<string, { rating: number; pattern: string }[]> = new Map();

  return async (response: AgentResponse, task: AgentTask) => {
    const userId = task.context.userId;
    if (!learningStore.has(userId)) {
      learningStore.set(userId, []);
    }
    const history = learningStore.get(userId)!;

    const contentLength = response.content.length;
    const hasCodeBlock = response.content.includes("```");
    const hasBulletPoints = /^[*-]|\d+\./.test(response.content);
    const avgLatency = response.latency / (response.trace.length || 1);

    const pattern = {
      type: task.type,
      contentLength,
      hasCode: hasCodeBlock,
      structured: hasBulletPoints,
      agentsUsed: response.agentId,
      latency: avgLatency,
      rating: response.confidence
    };

    history.push({
      rating: response.confidence,
      pattern: JSON.stringify(pattern)
    });

    if (history.length >= 10) {
      const avgRating = history.reduce((s, h) => s + h.rating, 0) / history.length;
      const patterns = history.map(h => JSON.parse(h.pattern));

      const codePatterns = patterns.filter((p: any) => p.hasCode);
      const structuredPatterns = patterns.filter((p: any) => p.structured);
      const fastResponses = patterns.filter((p: any) => p.latency < 2000);

      if (codePatterns.length > 5 && avgRating > 0.8) {
        const recentImprovement = {
          id: crypto.randomUUID(),
          agentId: "coder-v1",
          pattern: "frequent-code-generation",
          suggestion: `Deploy coder agent more aggressively — ${codePatterns.length}/${history.length} requests involve code, with avg ${(avgRating * 100).toFixed(0)}% quality`,
          source: "auto" as const,
          confidence: avgRating,
          implemented: false,
          timestamp: Date.now()
        };
        addLearningSuggestion(recentImprovement);
      }
    }
  };
}

const learningSuggestions: Map<string, unknown[]> = new Map();

export function addLearningSuggestion(suggestion: unknown): void {
  const id = crypto.randomUUID();
  learningSuggestions.set(id, [suggestion]);
}

export function getLearningSuggestions(agentId?: string): unknown[] {
  const results: unknown[] = [];
  for (const suggestions of learningSuggestions.values()) {
    for (const s of suggestions as any[]) {
      if (!agentId || s.agentId === agentId) results.push(s);
    }
  }
  return results;
}

export function createOrchestrationPlanForFreeTier(task: AgentTask): OrchestrationPlan {
  const coordinator = {
    id: "coordinator-free", name: "Assistant", role: "coordinator" as AgentRole,
    model: "", provider: "",
    systemPrompt: "You are a helpful AI assistant. Provide clear, accurate responses.",
    skills: ["general"],
    maxTokens: 2048, temperature: 0.7
  };

  return {
    id: crypto.randomUUID(),
    task,
    agents: [coordinator],
    sequence: [{
      order: 0, agentId: "coordinator-free",
      action: "respond", input: task.input,
      dependsOn: [], parallel: false
    }],
    reviewGates: []
  };
}
