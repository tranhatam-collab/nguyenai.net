/**
 * @nai/ensemble — Multi-agent crew orchestration for NAI.
 *
 * Per Founder Build Directive P1-B.8 / P1-C.4:
 *   Crew: coordinate multiple agents with roles, goals, and tasks.
 *
 * Responsibilities:
 * - Define crews (collection of agents with roles)
 * - Assign tasks to agents based on role
 * - Support sequential and parallel task execution
 * - Enable agent-to-agent delegation
 * - Track crew execution state and results
 * - Support consensus/voting for decision tasks
 *
 * MVP: In-memory, agents are simple functions. Interface swappable to
 * LLM-backed agents via @nai/prism.
 */

// ============================================================
// Types
// ============================================================

export type AgentRole = 'researcher' | 'writer' | 'reviewer' | 'analyst' | 'approver' | 'executor' | 'coordinator';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  /** System prompt describing the agent's persona and capabilities. */
  systemPrompt: string;
  /** Execute a task and return a result. */
  execute: (task: Task, ctx: CrewContext) => Promise<unknown>;
  /** Optional: can this agent handle this task? */
  canHandle?: (task: Task) => boolean;
}

export type TaskStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'delegated';

export interface Task {
  id: string;
  description: string;
  /** Required role to handle this task. */
  requiredRole?: AgentRole;
  /** Specific agent id to handle this task. */
  assignedAgentId?: string;
  /** Tasks that must complete before this one. */
  dependsOn?: string[];
  /** Input data for the task. */
  input?: unknown;
  /** Priority (higher = more important). */
  priority?: number;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  assignedTo?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface CrewContext {
  crewId: string;
  tenantId?: string;
  /** Outputs from completed tasks, keyed by task id. */
  taskOutputs: Record<string, unknown>;
  /** Shared mutable state. */
  state: Record<string, unknown>;
}

export interface Crew {
  id: string;
  name: string;
  agents: Agent[];
  tasks: Task[];
}

export interface CrewResult {
  crewId: string;
  status: 'succeeded' | 'failed' | 'partial';
  taskResults: Map<string, Task>;
  totalDurationMs: number;
  context: CrewContext;
}

export type CrewEvent =
  | { type: 'crew_started'; crewId: string }
  | { type: 'task_assigned'; crewId: string; taskId: string; agentId: string }
  | { type: 'task_completed'; crewId: string; taskId: string; result: unknown }
  | { type: 'task_failed'; crewId: string; taskId: string; error: string }
  | { type: 'crew_completed'; crewId: string; status: string }
  | { type: 'delegation'; crewId: string; fromAgentId: string; toAgentId: string; taskId: string };

export type CrewEventListener = (event: CrewEvent) => void;

// ============================================================
// Crew executor
// ============================================================

export class CrewExecutor {
  private listeners: CrewEventListener[] = [];

  onEvent(listener: CrewEventListener): void {
    this.listeners.push(listener);
  }

  private emit(event: CrewEvent): void {
    for (const l of this.listeners) l(event);
  }

  async execute(crew: Crew, tenantId?: string): Promise<CrewResult> {
    const start = Date.now();
    const ctx: CrewContext = {
      crewId: crew.id,
      tenantId,
      taskOutputs: {},
      state: {},
    };

    this.emit({ type: 'crew_started', crewId: crew.id });

    const agentMap = new Map(crew.agents.map((a) => [a.id, a]));
    const taskMap = new Map(crew.tasks.map((t) => [t.id, { ...t }]));
    const completed = new Set<string>();
    const failed = new Set<string>();

    // Process tasks in dependency order
    const pending = [...taskMap.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    while (pending.length > 0) {
      // Find ready tasks
      const ready = pending.filter((t) => {
        return (t.dependsOn ?? []).every((dep) => completed.has(dep) || failed.has(dep));
      });

      if (ready.length === 0) {
        // Deadlock — skip remaining
        for (const t of pending) {
          t.status = 'failed';
          t.error = 'Unmet dependencies';
          failed.add(t.id);
        }
        break;
      }

      // Assign and execute ready tasks in parallel
      const results = await Promise.all(
        ready.map((task) => this.executeTask(task, agentMap, ctx, completed, failed, crew.id)),
      );

      // Remove from pending
      for (const task of ready) {
        const idx = pending.findIndex((t) => t.id === task.id);
        if (idx >= 0) pending.splice(idx, 1);
      }
    }

    const status = failed.size === 0 ? 'succeeded' : completed.size === 0 ? 'failed' : 'partial';
    this.emit({ type: 'crew_completed', crewId: crew.id, status });

    return {
      crewId: crew.id,
      status,
      taskResults: taskMap,
      totalDurationMs: Date.now() - start,
      context: ctx,
    };
  }

  private async executeTask(
    task: Task,
    agentMap: Map<string, Agent>,
    ctx: CrewContext,
    completed: Set<string>,
    failed: Set<string>,
    crewId: string,
  ): Promise<void> {
    // Check if any dependency failed
    const depFailed = (task.dependsOn ?? []).some((dep) => failed.has(dep));
    if (depFailed) {
      task.status = 'failed';
      task.error = 'Dependency failed';
      failed.add(task.id);
      this.emit({ type: 'task_failed', crewId, taskId: task.id, error: task.error });
      return;
    }

    // Find agent for this task
    const agent = this.findAgent(task, agentMap);
    if (!agent) {
      task.status = 'failed';
      task.error = `No agent available for role: ${task.requiredRole ?? 'any'}`;
      failed.add(task.id);
      this.emit({ type: 'task_failed', crewId, taskId: task.id, error: task.error });
      return;
    }

    task.assignedTo = agent.id;
    task.status = 'running';
    task.startedAt = new Date().toISOString();
    this.emit({ type: 'task_assigned', crewId, taskId: task.id, agentId: agent.id });

    try {
      const result = await agent.execute(task, ctx);
      task.result = result;
      task.status = 'completed';
      task.finishedAt = new Date().toISOString();
      ctx.taskOutputs[task.id] = result;
      completed.add(task.id);
      this.emit({ type: 'task_completed', crewId, taskId: task.id, result });
    } catch (err) {
      task.error = err instanceof Error ? err.message : String(err);
      task.status = 'failed';
      task.finishedAt = new Date().toISOString();
      failed.add(task.id);
      this.emit({ type: 'task_failed', crewId, taskId: task.id, error: task.error });
    }
  }

  private findAgent(task: Task, agentMap: Map<string, Agent>): Agent | null {
    // If specific agent assigned, use that
    if (task.assignedAgentId) {
      return agentMap.get(task.assignedAgentId) ?? null;
    }

    const agents = [...agentMap.values()];

    // If a required role is specified, ONLY match agents with that role
    if (task.requiredRole) {
      const matching = agents.filter((a) => a.role === task.requiredRole);
      if (matching.length === 0) return null;
      const capable = matching.find((a) => !a.canHandle || a.canHandle(task));
      return capable ?? matching[0]!;
    }

    // No required role — find any agent that can handle the task
    const capable = agents.find((a) => !a.canHandle || a.canHandle(task));
    return capable ?? agents[0] ?? null;
  }
}

// ============================================================
// Consensus voting
// ============================================================

export interface Vote {
  agentId: string;
  vote: string;
  reason?: string;
}

export interface ConsensusResult {
  decision: string | null;
  votes: Vote[];
  agreement: number; // 0-1
}

export function tallyVotes(votes: Vote[]): ConsensusResult {
  if (votes.length === 0) {
    return { decision: null, votes: [], agreement: 0 };
  }

  const counts = new Map<string, number>();
  for (const v of votes) {
    counts.set(v.vote, (counts.get(v.vote) ?? 0) + 1);
  }

  let maxVotes = 0;
  let decision: string | null = null;
  for (const [choice, count] of counts) {
    if (count > maxVotes) {
      maxVotes = count;
      decision = choice;
    }
  }

  const agreement = maxVotes / votes.length;
  return { decision, votes, agreement };
}

// ============================================================
// Convenience: create simple function-based agents
// ============================================================

export function createAgent(
  id: string,
  name: string,
  role: AgentRole,
  executeFn: (task: Task, ctx: CrewContext) => Promise<unknown>,
  opts: { systemPrompt?: string; canHandle?: (task: Task) => boolean } = {},
): Agent {
  return {
    id,
    name,
    role,
    systemPrompt: opts.systemPrompt ?? `You are a ${role} agent named ${name}.`,
    execute: executeFn,
    canHandle: opts.canHandle,
  };
}
