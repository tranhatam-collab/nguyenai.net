/**
 * @nai/harness — Agent SDK: tool call, approval integration, evidence generation.
 *
 * Original source: https://github.com/OpenHands/software-agent-sdk (Python, MIT)
 * This package does NOT bundle the original source. It provides a
 * TypeScript-native agent SDK per Founder Build Directive Phase 3 task 3.3.
 *
 * Responsibilities:
 * - Tool registry: register tools with name, description, handler, approval requirement.
 * - Tool execution: call tool handler, capture result, generate evidence record.
 * - Approval gate: check if a tool/action requires approval, request via @nai/approval.
 * - Evidence generation: wrap @nai/evidence.recordEvidence for each tool call.
 * - Memory integration: optionally persist tool results to @nai/relic.
 * - High-level facade: AgentSDK ties tool + approval + evidence + memory together.
 *
 * Integration:
 *   @nai/approval  — sensitive action approval workflow
 *   @nai/evidence  — proof record + HMAC-signed evidence pack
 *   @nai/audit     — audit trail (via @nai/evidence)
 *   @nai/relic     — long-term memory (optional)
 *   @nai/conductor — agent state machine (optional, used by high-level facade)
 */

import { requestApproval, checkApprovalStatus, type ApprovalStatus } from '@nai/approval';
import { recordEvidence, type ProofType, type EvidenceClass } from '@nai/evidence';

// ============================================================
// Tool registry
// ============================================================

export interface ToolDefinition {
  name: string;
  description: string;
  /** Whether this tool always requires approval before execution. */
  requiresApproval: boolean;
  /** Tool handler — receives args + context, returns result. */
  handler: ToolHandler;
  /** Evidence classification for records produced by this tool. */
  evidenceClass: EvidenceClass;
}

export interface ToolHandler {
  (args: Record<string, unknown>, ctx: ToolCallContext): Promise<ToolCallResult>;
}

export interface ToolCallContext {
  command_id: string;
  tenant_id: string;
  user_id: string;
  agent_id: string;
  /** Signing secret for evidence records. */
  evidenceSigningSecret: string;
}

export interface ToolCallResult {
  success: boolean;
  output: unknown;
  /** Optional error message (if success=false). */
  error?: string;
  /** Optional metadata to include in evidence payload. */
  metadata?: Record<string, unknown>;
}

const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  toolRegistry.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | null {
  return toolRegistry.get(name) ?? null;
}

export function listTools(): ToolDefinition[] {
  return [...toolRegistry.values()];
}

export function clearTools(): void {
  toolRegistry.clear();
}

// ============================================================
// Approval gate
// ============================================================

export interface ApprovalGateResult {
  /** Whether the action may proceed without approval. */
  allowed: boolean;
  /** If an approval request was created, its id. */
  approval_request_id: string | null;
  /** Current approval status (if a request exists). */
  approval_status: ApprovalStatus | null;
  /** Reason for the decision. */
  reason: string;
}

/**
 * Check whether a tool call requires approval, and if so, request it.
 *
 * Approval is required if ANY of:
 * - The tool definition has requiresApproval=true
 * - The caller passes forceApproval=true
 * - The user's plan requires approval for all actions (planRequiresApproval='all')
 *
 * If approval is required, an approval request is created via @nai/approval
 * and the gate returns allowed=false with the request id. The caller must
 * poll checkApprovalStatus() and, once approved, call executeTool() again
 * with skipApprovalCheck=true.
 */
export async function checkApprovalGate(opts: {
  tool: ToolDefinition;
  ctx: ToolCallContext;
  args: Record<string, unknown>;
  planRequiresApproval: 'all' | 'sensitive' | 'none';
  forceApproval?: boolean;
  skipApprovalCheck?: boolean;
}): Promise<ApprovalGateResult> {
  if (opts.skipApprovalCheck) {
    return { allowed: true, approval_request_id: null, approval_status: null, reason: 'approval check skipped' };
  }

  const needsApproval =
    opts.tool.requiresApproval ||
    opts.forceApproval === true ||
    opts.planRequiresApproval === 'all';

  if (!needsApproval) {
    return { allowed: true, approval_request_id: null, approval_status: null, reason: 'no approval required' };
  }

  // Request approval via @nai/approval
  const approvalId = await requestApproval({
    user_id: opts.ctx.user_id,
    tenant_id: opts.ctx.tenant_id,
    action: `tool:${opts.tool.name}`,
    resource: `command:${opts.ctx.command_id}`,
    requested_by: opts.ctx.user_id,
    metadata: {
      agent_id: opts.ctx.agent_id,
      tool: opts.tool.name,
      args: opts.args,
    },
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  });

  return {
    allowed: false,
    approval_request_id: approvalId,
    approval_status: 'pending',
    reason: 'approval required — poll checkApprovalStatus() until approved, then re-execute with skipApprovalCheck=true',
  };
}

/** Check the status of an approval request. */
export async function pollApproval(approvalId: string): Promise<{ status: ApprovalStatus; canProceed: boolean }> {
  try {
    const status = await checkApprovalStatus(approvalId);
    return {
      status,
      canProceed: status === 'approved',
    };
  } catch {
    return { status: 'pending', canProceed: false };
  }
}

// ============================================================
// Tool execution + evidence generation
// ============================================================

export interface ExecuteToolOpts {
  toolName: string;
  args: Record<string, unknown>;
  ctx: ToolCallContext;
  planRequiresApproval: 'all' | 'sensitive' | 'none';
  forceApproval?: boolean;
  /** Set true when re-executing after approval was granted. */
  skipApprovalCheck?: boolean;
}

export interface ExecuteToolResult {
  success: boolean;
  output: unknown;
  error?: string;
  /** Evidence record id (if evidence was generated). */
  evidence_id: string | null;
  /** Approval request id (if approval was required). */
  approval_request_id: string | null;
  /** Whether the call was blocked pending approval. */
  approval_pending: boolean;
}

/**
 * Execute a tool with full approval + evidence integration.
 *
 * Flow:
 * 1. Look up the tool in the registry.
 * 2. Check the approval gate (unless skipApprovalCheck).
 * 3. If approval is pending, return with approval_pending=true.
 * 4. Call the tool handler.
 * 5. Generate an evidence record (proof_type=tool_called or tool_output_captured).
 * 6. Return the result + evidence_id.
 */
export async function executeTool(opts: ExecuteToolOpts): Promise<ExecuteToolResult> {
  const tool = getTool(opts.toolName);
  if (!tool) {
    return {
      success: false,
      output: null,
      error: `tool "${opts.toolName}" not registered`,
      evidence_id: null,
      approval_request_id: null,
      approval_pending: false,
    };
  }

  // 1. Approval gate
  const gate = await checkApprovalGate({
    tool,
    ctx: opts.ctx,
    args: opts.args,
    planRequiresApproval: opts.planRequiresApproval,
    forceApproval: opts.forceApproval,
    skipApprovalCheck: opts.skipApprovalCheck,
  });
  if (!gate.allowed) {
    return {
      success: false,
      output: null,
      error: gate.reason,
      evidence_id: null,
      approval_request_id: gate.approval_request_id,
      approval_pending: true,
    };
  }

  // 2. Execute tool handler
  let result: ToolCallResult;
  try {
    result = await tool.handler(opts.args, opts.ctx);
  } catch (err) {
    result = { success: false, output: null, error: (err as Error).message };
  }

  // 3. Generate evidence record
  const proofType: ProofType = result.success ? 'tool_called' : 'command_failed';
  let evidenceId: string | null = null;
  try {
    const rec = await recordEvidence({
      command_id: opts.ctx.command_id,
      user_id: opts.ctx.user_id,
      tenant_id: opts.ctx.tenant_id,
      agent_id: opts.ctx.agent_id,
      proof_type: proofType,
      classification: tool.evidenceClass,
      payload: {
        tool: tool.name,
        args: opts.args,
        success: result.success,
        output: result.output,
        error: result.error ?? null,
        metadata: result.metadata ?? {},
      },
    }, opts.ctx.evidenceSigningSecret);
    evidenceId = rec.evidence_id;
  } catch {
    // Evidence failure should not mask the tool result.
  }

  return {
    success: result.success,
    output: result.output,
    error: result.error,
    evidence_id: evidenceId,
    approval_request_id: gate.approval_request_id,
    approval_pending: false,
  };
}

// ============================================================
// Built-in tools — minimal set for Phase 3 MVP
// ============================================================

/** Built-in: echo tool (for testing). */
export function registerBuiltinTools(): void {
  registerTool({
    name: 'echo',
    description: 'Echo back the input (test tool).',
    requiresApproval: false,
    evidenceClass: 'internal',
    handler: async (args) => ({ success: true, output: args }),
  });

  registerTool({
    name: 'web_search',
    description: 'Search the web for information (delegates to browser agent in Phase 5).',
    requiresApproval: false,
    evidenceClass: 'internal',
    handler: async (args) => ({
      success: true,
      output: { query: args.query, results: [], note: 'web_search stub — real implementation in Phase 5 (browser agent)' },
    }),
  });

  registerTool({
    name: 'memory_write',
    description: 'Write a memory record (delegates to @nai/relic).',
    requiresApproval: false,
    evidenceClass: 'internal',
    handler: async (args, ctx) => {
      // Lazy import to avoid hard dependency in case relic is not configured.
      const { writeMemory } = await import('@nai/relic');
      const id = await writeMemory({
        tenant_id: ctx.tenant_id,
        user_id: ctx.user_id,
        memory_type: args.memory_type as never,
        key: args.key as string,
        value: args.value,
        tags: args.tags as string[] | undefined,
      });
      return { success: true, output: { memory_id: id } };
    },
  });

  registerTool({
    name: 'memory_read',
    description: 'Read a memory record (delegates to @nai/relic).',
    requiresApproval: false,
    evidenceClass: 'internal',
    handler: async (args, ctx) => {
      const { readMemory } = await import('@nai/relic');
      const rec = await readMemory(ctx.tenant_id, ctx.user_id, args.key as string);
      return { success: true, output: rec };
    },
  });

  // Sensitive tool example: family record mutation (requires approval).
  registerTool({
    name: 'family_record_update',
    description: 'Update a family record (sensitive — requires approval).',
    requiresApproval: true,
    evidenceClass: 'sensitive',
    handler: async (args) => ({
      success: true,
      output: { updated: true, record_id: args.record_id, fields: args.fields },
    }),
  });

  // Sensitive tool example: external action (requires approval).
  registerTool({
    name: 'external_action',
    description: 'Perform an external action (sensitive — requires approval).',
    requiresApproval: true,
    evidenceClass: 'restricted',
    handler: async (args) => ({
      success: true,
      output: { action: args.action, executed: true },
    }),
  });
}

// ============================================================
// High-level facade — AgentSDK
// ============================================================

export interface AgentSDKConfig {
  /** Signing secret for evidence records. */
  evidenceSigningSecret: string;
  /** Whether the user's plan requires approval for all/sensitive/none. */
  planRequiresApproval: 'all' | 'sensitive' | 'none';
}

export class AgentSDK {
  constructor(private cfg: AgentSDKConfig) {
    // Ensure built-in tools are registered (idempotent — registerTool overwrites).
    registerBuiltinTools();
  }

  /** Execute a tool by name with full approval + evidence integration. */
  async call(toolName: string, args: Record<string, unknown>, ctx: Omit<ToolCallContext, 'evidenceSigningSecret'>): Promise<ExecuteToolResult> {
    return executeTool({
      toolName,
      args,
      ctx: { ...ctx, evidenceSigningSecret: this.cfg.evidenceSigningSecret },
      planRequiresApproval: this.cfg.planRequiresApproval,
    });
  }

  /** Execute a tool after approval was granted (skip approval check). */
  async callAfterApproval(toolName: string, args: Record<string, unknown>, ctx: Omit<ToolCallContext, 'evidenceSigningSecret'>): Promise<ExecuteToolResult> {
    return executeTool({
      toolName,
      args,
      ctx: { ...ctx, evidenceSigningSecret: this.cfg.evidenceSigningSecret },
      planRequiresApproval: this.cfg.planRequiresApproval,
      skipApprovalCheck: true,
    });
  }

  /** Check approval status for a pending request. */
  async checkApproval(approvalId: string): Promise<{ status: ApprovalStatus; canProceed: boolean }> {
    return pollApproval(approvalId);
  }

  /** List all registered tools. */
  listTools(): ToolDefinition[] {
    return listTools();
  }
}
