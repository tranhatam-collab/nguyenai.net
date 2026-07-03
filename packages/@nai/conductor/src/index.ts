/**
 * @nai/conductor — Agent orchestration: 9 NAI Agents + state machine.
 *
 * Original source: https://github.com/langchain-ai/langgraph (TypeScript, MIT)
 * This package does NOT bundle the original source. It provides a
 * TypeScript-native agent graph per Founder Build Directive Phase 3 task 3.2.
 *
 * 9 NAI Agents (per AGENTS.md):
 *   nguyen-guide          — onboarding, navigation, general help
 *   nguyen-researcher     — research, source gathering, synthesis
 *   nguyen-archivist      — family records, documents, genealogy archive
 *   nguyen-verifier       — evidence verification, source checking, labels
 *   nguyen-family-steward — family tree, living-person privacy, branch records
 *   nguyen-founder        — founder profile, business context, strategy
 *   nguyen-business-operator — business ops, finance, legal workspace
 *   nguyen-global-connector — network, chapters, global Nguyen community
 *   nguyen-guardian       — safety, privacy, harm prevention, approval gates
 *
 * State machine (per command):
 *   init → plan → execute → verify → done
 *                ↘ approval_required → (approved) → execute → verify → done
 *                                    → (denied)   → cancelled
 *
 * Ethics (per AGENTS.md):
 * - Never imply shared bloodline / royal descent / genetics.
 * - Use evidence labels: verified, primary, secondary, oral history,
 *   insufficient evidence, disputed, cannot conclude.
 * - Financial/legal tools = analysis only, not licensed advisory.
 */

// ============================================================
// Agent definitions
// ============================================================

export type AgentId =
  | 'nguyen-guide'
  | 'nguyen-researcher'
  | 'nguyen-archivist'
  | 'nguyen-verifier'
  | 'nguyen-family-steward'
  | 'nguyen-founder'
  | 'nguyen-business-operator'
  | 'nguyen-global-connector'
  | 'nguyen-guardian';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  nameVi: string;
  role: string;
  description: string;
  /** Default model tier this agent prefers. */
  defaultTier: 'free' | 'student' | 'standard' | 'pro' | 'business';
  /** Capabilities / tool categories this agent can use. */
  capabilities: string[];
  /** System prompt template name (registered in @nai/prism). */
  systemPromptName: string;
  systemPromptVersion: string;
  /** Whether this agent's actions always require approval. */
  alwaysRequiresApproval: boolean;
}

export const AGENTS: Record<AgentId, AgentDefinition> = {
  'nguyen-guide': {
    id: 'nguyen-guide',
    name: 'Nguyen Guide',
    nameVi: 'Nguyễn Hướng Dẫn',
    role: 'Onboarding, navigation, general help',
    description: 'First contact for new users. Helps navigate the AI Computer, explains features, routes to specialized agents.',
    defaultTier: 'free',
    capabilities: ['navigation', 'onboarding', 'help'],
    systemPromptName: 'nguyen-guide-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: false,
  },
  'nguyen-researcher': {
    id: 'nguyen-researcher',
    name: 'Nguyen Researcher',
    nameVi: 'Nguyễn Nghiên Cứu',
    role: 'Research, source gathering, synthesis',
    description: 'Conducts research, gathers sources, synthesizes findings with proper citations and evidence labels.',
    defaultTier: 'student',
    capabilities: ['research', 'web-search', 'source-synthesis', 'citation'],
    systemPromptName: 'nguyen-researcher-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: false,
  },
  'nguyen-archivist': {
    id: 'nguyen-archivist',
    name: 'Nguyen Archivist',
    nameVi: 'Nguyễn Lưu Trữ',
    role: 'Family records, documents, genealogy archive',
    description: 'Manages family records, historical documents, and the genealogy archive. Applies evidence labels.',
    defaultTier: 'student',
    capabilities: ['archive', 'documents', 'genealogy', 'records'],
    systemPromptName: 'nguyen-archivist-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: false,
  },
  'nguyen-verifier': {
    id: 'nguyen-verifier',
    name: 'Nguyen Verifier',
    nameVi: 'Nguyễn Xác Minh',
    role: 'Evidence verification, source checking, labels',
    description: 'Verifies evidence, checks sources, assigns evidence labels (verified, primary, secondary, oral history, disputed, cannot conclude).',
    defaultTier: 'student',
    capabilities: ['verification', 'source-check', 'evidence-labels'],
    systemPromptName: 'nguyen-verifier-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: false,
  },
  'nguyen-family-steward': {
    id: 'nguyen-family-steward',
    name: 'Nguyen Family Steward',
    nameVi: 'Nguyễn Quản Gia Đình',
    role: 'Family tree, living-person privacy, branch records',
    description: 'Manages family trees, ensures living-person privacy, maintains branch records. Never claims bloodline confirmation.',
    defaultTier: 'standard',
    capabilities: ['family-tree', 'privacy', 'branch-records'],
    systemPromptName: 'nguyen-family-steward-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: true, // family data is sensitive
  },
  'nguyen-founder': {
    id: 'nguyen-founder',
    name: 'Nguyen Founder',
    nameVi: 'Nguyễn Khởi Nghiệp',
    role: 'Founder profile, business context, strategy',
    description: 'Supports founders with business context, strategy analysis, and founder OS features. Analysis only, not licensed advisory.',
    defaultTier: 'pro',
    capabilities: ['founder-profile', 'strategy', 'business-context'],
    systemPromptName: 'nguyen-founder-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: false,
  },
  'nguyen-business-operator': {
    id: 'nguyen-business-operator',
    name: 'Nguyen Business Operator',
    nameVi: 'Nguyễn Vận Hành Kinh Doanh',
    role: 'Business ops, finance, legal workspace',
    description: 'Handles business operations, finance workspace, legal workspace. Analysis only, not licensed advisory.',
    defaultTier: 'pro',
    capabilities: ['business-ops', 'finance', 'legal', 'sales'],
    systemPromptName: 'nguyen-business-operator-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: true, // financial/legal actions are sensitive
  },
  'nguyen-global-connector': {
    id: 'nguyen-global-connector',
    name: 'Nguyen Global Connector',
    nameVi: 'Nguyễn Kết Nối Toàn Cầu',
    role: 'Network, chapters, global Nguyen community',
    description: 'Connects the global Nguyen community, manages chapters, facilitates network interactions.',
    defaultTier: 'standard',
    capabilities: ['network', 'chapters', 'community'],
    systemPromptName: 'nguyen-global-connector-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: false,
  },
  'nguyen-guardian': {
    id: 'nguyen-guardian',
    name: 'Nguyen Guardian',
    nameVi: 'Nguyễn Bảo Vệ',
    role: 'Safety, privacy, harm prevention, approval gates',
    description: 'Guards safety, privacy, and prevents harm. Enforces approval gates for sensitive actions. Classifies harmful content.',
    defaultTier: 'free',
    capabilities: ['safety', 'privacy', 'harm-prevention', 'approval-gate'],
    systemPromptName: 'nguyen-guardian-system',
    systemPromptVersion: '1.0.0',
    alwaysRequiresApproval: false,
  },
};

export const ALL_AGENT_IDS = Object.keys(AGENTS) as AgentId[];

export function getAgent(id: AgentId): AgentDefinition {
  return AGENTS[id];
}

export function listAgents(): AgentDefinition[] {
  return ALL_AGENT_IDS.map((id) => AGENTS[id]);
}

// ============================================================
// Command state machine
// ============================================================

export type CommandState =
  | 'init'
  | 'plan'
  | 'execute'
  | 'approval_required'
  | 'verify'
  | 'done'
  | 'cancelled'
  | 'failed';

export interface CommandContext {
  command_id: string;
  tenant_id: string;
  user_id: string;
  /** The user's natural-language command. */
  input: string;
  /** Plan id (for entitlement + model tier). */
  plan_id: string;
  /** Model tier entitlement resolved from plan. */
  model_tier: string;
  /** Agent selected to handle the command. */
  agent_id: AgentId;
  /** Agents enabled for the user's plan (from entitlement). */
  agents_enabled: AgentId[];
  /** Whether the user's plan requires approval for all actions. */
  approval_required: 'all' | 'sensitive' | 'none';
  /** Current state. */
  state: CommandState;
  /** Plan produced by the agent (after plan state). */
  plan: string | null;
  /** Output produced by execution. */
  output: string | null;
  /** Tool calls made during execution. */
  tool_calls: ToolCall[];
  /** Evidence labels assigned by the verifier. */
  evidence_labels: EvidenceLabel[];
  /** Approval request id (if approval_required state). */
  approval_request_id: string | null;
  /** Error message (if failed state). */
  error: string | null;
  /** ISO timestamps for each state transition. */
  transitions: { state: CommandState; at: string }[];
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  success: boolean;
  /** ISO timestamp. */
  at: string;
}

export type EvidenceLabel =
  | 'verified'
  | 'primary-source'
  | 'secondary-source'
  | 'according-to-branch-genealogy'
  | 'oral-history'
  | 'insufficient-evidence'
  | 'disputed'
  | 'cannot-conclude';

// ============================================================
// State machine transitions
// ============================================================

const VALID_TRANSITIONS: Record<CommandState, CommandState[]> = {
  init: ['plan'],
  plan: ['execute', 'approval_required', 'failed'],
  execute: ['verify', 'approval_required', 'failed'],
  approval_required: ['execute', 'cancelled'],
  verify: ['done', 'failed'],
  done: [],
  cancelled: [],
  failed: [],
};

export function canTransition(from: CommandState, to: CommandState): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

export function transition(ctx: CommandContext, to: CommandState): CommandContext {
  if (!canTransition(ctx.state, to)) {
    throw new Error(`Invalid state transition: ${ctx.state} → ${to}`);
  }
  return {
    ...ctx,
    state: to,
    transitions: [...ctx.transitions, { state: to, at: new Date().toISOString() }],
  };
}

export function newCommandContext(input: {
  command_id: string;
  tenant_id: string;
  user_id: string;
  input: string;
  plan_id: string;
  model_tier: string;
  agent_id: AgentId;
  agents_enabled: AgentId[];
  approval_required: 'all' | 'sensitive' | 'none';
}): CommandContext {
  return {
    ...input,
    state: 'init',
    plan: null,
    output: null,
    tool_calls: [],
    evidence_labels: [],
    approval_request_id: null,
    error: null,
    transitions: [{ state: 'init', at: new Date().toISOString() }],
  };
}

// ============================================================
// Agent dispatch — route command to the right agent
// ============================================================

/** Route a command to the most appropriate agent based on keyword hints. */
export function routeAgent(command: string, agentsEnabled: AgentId[]): AgentId {
  const cmd = command.toLowerCase();
  const has = (kw: string[]) => kw.some((k) => cmd.includes(k));

  // Order matters: most specific first.
  if (agentsEnabled.includes('nguyen-guardian') && has(['safety', 'privacy', 'harm', 'block', 'approve'])) {
    return 'nguyen-guardian';
  }
  if (agentsEnabled.includes('nguyen-family-steward') && has(['family', 'tree', 'ancestor', 'branch', 'genealogy', 'gia phả', 'gia đình'])) {
    return 'nguyen-family-steward';
  }
  if (agentsEnabled.includes('nguyen-archivist') && has(['archive', 'document', 'record', 'lưu trữ', 'tài liệu'])) {
    return 'nguyen-archivist';
  }
  if (agentsEnabled.includes('nguyen-researcher') && has(['research', 'find', 'search', 'nghiên cứu', 'tìm'])) {
    return 'nguyen-researcher';
  }
  if (agentsEnabled.includes('nguyen-verifier') && has(['verify', 'check', 'evidence', 'source', 'xác minh', 'nguồn'])) {
    return 'nguyen-verifier';
  }
  if (agentsEnabled.includes('nguyen-founder') && has(['founder', 'startup', 'strategy', 'khởi nghiệp', 'chiến lược'])) {
    return 'nguyen-founder';
  }
  if (agentsEnabled.includes('nguyen-business-operator') && has(['business', 'finance', 'legal', 'sales', 'kinh doanh', 'tài chính'])) {
    return 'nguyen-business-operator';
  }
  if (agentsEnabled.includes('nguyen-global-connector') && has(['network', 'chapter', 'community', 'connect', 'mạng', 'cộng đồng'])) {
    return 'nguyen-global-connector';
  }
  // Default: guide (always enabled)
  return agentsEnabled.includes('nguyen-guide') ? 'nguyen-guide' : agentsEnabled[0]!;
}

/** Check if an agent is enabled for the user's plan. */
export function isAgentEnabled(agentId: AgentId, agentsEnabled: AgentId[]): boolean {
  return agentsEnabled.includes(agentId);
}

// ============================================================
// Execution — agent step functions
// ============================================================

/** A step function executes one state transition and returns the updated context. */
export type StepFn = (ctx: CommandContext) => Promise<CommandContext>;

export interface AgentRuntime {
  /** Plan: produce a plan from the user input. */
  plan(ctx: CommandContext): Promise<CommandContext>;
  /** Execute: run the plan, possibly calling tools. */
  execute(ctx: CommandContext): Promise<CommandContext>;
  /** Verify: check output, assign evidence labels. */
  verify(ctx: CommandContext): Promise<CommandContext>;
}

// ============================================================
// Default runtime — uses an LLM chat function (from @nai/prism or mock)
// ============================================================

export interface LLMChatFn {
  (opts: {
    agentId: AgentId;
    systemPrompt: string;
    userMessage: string;
    modelTier: string;
    tenantId: string;
    userId: string;
  }): Promise<string>;
}

export class DefaultAgentRuntime implements AgentRuntime {
  constructor(private chatFn: LLMChatFn) {}

  async plan(ctx: CommandContext): Promise<CommandContext> {
    const agent = getAgent(ctx.agent_id);
    const systemPrompt = `You are ${agent.name} (${agent.nameVi}). Role: ${agent.role}. ${agent.description} Produce a concise plan (3-5 steps) for the user's command. Do not execute yet.`;
    const planText = await this.chatFn({
      agentId: ctx.agent_id,
      systemPrompt,
      userMessage: ctx.input,
      modelTier: ctx.model_tier,
      tenantId: ctx.tenant_id,
      userId: ctx.user_id,
    });
    let next = transition(ctx, 'plan');
    next = { ...next, plan: planText };

    // Check if approval is required before execute.
    const needsApproval = agent.alwaysRequiresApproval || ctx.approval_required === 'all';
    if (needsApproval && canTransition('plan', 'approval_required')) {
      return transition(next, 'approval_required');
    }
    return next;
  }

  async execute(ctx: CommandContext): Promise<CommandContext> {
    // execute() is reachable from 'plan' (normal flow) or 'approval_required'
    // (after approval — resumeCommand calls execute directly without pre-transition).
    if (ctx.state !== 'plan' && ctx.state !== 'approval_required') {
      throw new Error(`Cannot execute from state "${ctx.state}" — expected plan or approval_required`);
    }
    const agent = getAgent(ctx.agent_id);
    const systemPrompt = `You are ${agent.name}. Execute the plan and produce the final output. Plan: ${ctx.plan ?? '(no plan)'}`;
    const output = await this.chatFn({
      agentId: ctx.agent_id,
      systemPrompt,
      userMessage: ctx.input,
      modelTier: ctx.model_tier,
      tenantId: ctx.tenant_id,
      userId: ctx.user_id,
    });
    let next = transition(ctx, 'execute');
    next = { ...next, output };
    return next;
  }

  async verify(ctx: CommandContext): Promise<CommandContext> {
    // The verifier agent (or self-verify) assigns evidence labels.
    const labels = inferEvidenceLabels(ctx.output ?? '');
    let next = transition(ctx, 'verify');
    next = { ...next, evidence_labels: labels };
    return next;
  }
}

/** Heuristic: infer evidence labels from output text. */
export function inferEvidenceLabels(output: string): EvidenceLabel[] {
  const labels: EvidenceLabel[] = [];
  const lower = output.toLowerCase();
  if (lower.includes('verified') || lower.includes('xác minh')) labels.push('verified');
  if (lower.includes('primary source') || lower.includes('nguồn gốc')) labels.push('primary-source');
  if (lower.includes('secondary source') || lower.includes('nguồn thứ cấp')) labels.push('secondary-source');
  if (lower.includes('oral history') || lower.includes('truyền miệng')) labels.push('oral-history');
  if (lower.includes('branch genealogy') || lower.includes('gia phả')) labels.push('according-to-branch-genealogy');
  if (lower.includes('insufficient') || lower.includes('không đủ')) labels.push('insufficient-evidence');
  if (lower.includes('disputed') || lower.includes('tranh chấp')) labels.push('disputed');
  if (lower.includes('cannot conclude') || lower.includes('không thể kết luận')) labels.push('cannot-conclude');
  // Default: if no labels inferred, mark as insufficient-evidence.
  if (labels.length === 0) labels.push('insufficient-evidence');
  return labels;
}

// ============================================================
// Full run — convenience that drives the state machine end-to-end
// ============================================================

export interface RunResult {
  context: CommandContext;
  success: boolean;
}

/**
 * Drive a command through the full state machine:
 * init → plan → [approval_required → execute] → verify → done
 *
 * If approval is required, the run pauses at 'approval_required' and
 * returns success=false with state='approval_required'. The caller
 * approves via the approval package, then calls resumeRun().
 */
export async function runCommand(ctx: CommandContext, runtime: AgentRuntime): Promise<RunResult> {
  let c = ctx;
  try {
    // init → plan
    c = await runtime.plan(c);
    if (c.state === 'approval_required') {
      return { context: c, success: false };
    }
    if (c.state === 'failed') return { context: c, success: false };

    // plan → execute
    c = await runtime.execute(c);
    if (c.state === 'failed') return { context: c, success: false };

    // execute → verify → done
    c = await runtime.verify(c);
    if (c.state === 'failed') return { context: c, success: false };
    c = transition(c, 'done');
    return { context: c, success: true };
  } catch (err) {
    return { context: { ...c, state: 'failed', error: (err as Error).message }, success: false };
  }
}

/** Resume a run after approval: approval_required → execute → verify → done. */
export async function resumeCommand(ctx: CommandContext, runtime: AgentRuntime): Promise<RunResult> {
  if (ctx.state !== 'approval_required') {
    return { context: ctx, success: false };
  }
  // execute() handles the approval_required → execute transition internally.
  let c = ctx;
  try {
    c = await runtime.execute(c);
    if (c.state === 'failed') return { context: c, success: false };
    c = await runtime.verify(c);
    if (c.state === 'failed') return { context: c, success: false };
    c = transition(c, 'done');
    return { context: c, success: true };
  } catch (err) {
    return { context: { ...c, state: 'failed', error: (err as Error).message }, success: false };
  }
}

/** Cancel a run (from approval_required). */
export function cancelCommand(ctx: CommandContext): CommandContext {
  if (ctx.state !== 'approval_required') return ctx;
  return transition(ctx, 'cancelled');
}
