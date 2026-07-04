/**
 * @nai/aqueduct — Workflow orchestrator for NAI.
 *
 * Per Founder Build Directive P1-B.8 / P1-C.1:
 *   Workflow engine: DAG-based, with retries, conditionals, parallel branches.
 *
 * Responsibilities:
 * - Define workflows as DAGs of steps
 * - Execute steps in topological order
 * - Support retries, timeouts, conditionals
 * - Support parallel branches (fan-out) and joins (fan-in)
 * - Track execution state (pending, running, succeeded, failed, skipped)
 * - Emit events for observability
 *
 * MVP: In-memory execution, no persistence. Interface swappable to D1/DO.
 */

// ============================================================
// Types
// ============================================================

export type StepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';

export interface WorkflowContext {
  /** Input data passed to the workflow. */
  input: unknown;
  /** Outputs from completed steps, keyed by step id. */
  outputs: Record<string, unknown>;
  /** Shared mutable state across steps. */
  state: Record<string, unknown>;
  /** Tenant id for multi-tenant isolation. */
  tenantId?: string;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  output?: unknown;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  attempts: number;
}

export interface WorkflowStep {
  id: string;
  /** Step executor function. */
  run: (ctx: WorkflowContext) => Promise<unknown>;
  /** Optional condition — if false, step is skipped. */
  condition?: (ctx: WorkflowContext) => boolean;
  /** Steps that must complete before this one (DAG edges). */
  dependsOn?: string[];
  /** Max retry attempts (default 0). */
  retries?: number;
  /** Retry delay in ms (default 0). */
  retryDelayMs?: number;
  /** Timeout in ms (default none). */
  timeoutMs?: number;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: StepStatus;
  results: Map<string, StepResult>;
  startedAt: string;
  finishedAt?: string;
  context: WorkflowContext;
}

export type WorkflowEvent =
  | { type: 'workflow_started'; executionId: string; workflowId: string }
  | { type: 'step_started'; executionId: string; stepId: string }
  | { type: 'step_succeeded'; executionId: string; stepId: string; output: unknown }
  | { type: 'step_failed'; executionId: string; stepId: string; error: string }
  | { type: 'step_skipped'; executionId: string; stepId: string }
  | { type: 'workflow_succeeded'; executionId: string; workflowId: string }
  | { type: 'workflow_failed'; executionId: string; workflowId: string; error: string };

export type WorkflowEventListener = (event: WorkflowEvent) => void;

// ============================================================
// Validation
// ============================================================

export function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const step of workflow.steps) {
    if (!step.id) errors.push(`Step missing id`);
    if (ids.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
    ids.add(step.id);
  }

  for (const step of workflow.steps) {
    for (const dep of step.dependsOn ?? []) {
      if (!ids.has(dep)) errors.push(`Step ${step.id} depends on unknown step: ${dep}`);
    }
  }

  // Cycle detection via DFS
  const visited = new Map<string, 'visiting' | 'done'>();
  const stepMap = new Map(workflow.steps.map((s) => [s.id, s]));

  function dfs(id: string): boolean {
    const state = visited.get(id);
    if (state === 'visiting') return true; // cycle
    if (state === 'done') return false;
    visited.set(id, 'visiting');
    const step = stepMap.get(id);
    for (const dep of step?.dependsOn ?? []) {
      if (dfs(dep)) return true;
    }
    visited.set(id, 'done');
    return false;
  }

  for (const step of workflow.steps) {
    visited.clear();
    if (dfs(step.id)) {
      errors.push(`Cycle detected involving step: ${step.id}`);
      break;
    }
  }

  return errors;
}

// ============================================================
// Executor
// ============================================================

export class WorkflowExecutor {
  private listeners: WorkflowEventListener[] = [];

  onEvent(listener: WorkflowEventListener): void {
    this.listeners.push(listener);
  }

  private emit(event: WorkflowEvent): void {
    for (const l of this.listeners) l(event);
  }

  async execute(
    workflow: Workflow,
    input: unknown,
    tenantId?: string,
  ): Promise<WorkflowExecution> {
    const errors = validateWorkflow(workflow);
    if (errors.length > 0) {
      throw new Error(`Invalid workflow: ${errors.join('; ')}`);
    }

    const executionId = crypto.randomUUID();
    const context: WorkflowContext = { input, outputs: {}, state: {}, tenantId };
    const execution: WorkflowExecution = {
      executionId,
      workflowId: workflow.id,
      status: 'running',
      results: new Map(),
      startedAt: new Date().toISOString(),
      context,
    };

    this.emit({ type: 'workflow_started', executionId, workflowId: workflow.id });

    const stepMap = new Map(workflow.steps.map((s) => [s.id, s]));
    const completed = new Set<string>();
    const failed = new Set<string>();

    // Process steps in topological order (simple iterative approach)
    const pending = [...workflow.steps];

    while (pending.length > 0) {
      // Find ready steps: all deps completed (succeeded), not yet processed
      const ready = pending.filter((step) => {
        return (step.dependsOn ?? []).every((dep) => completed.has(dep) || failed.has(dep));
      });

      if (ready.length === 0) {
        // Deadlock — remaining steps have unmet deps (likely due to failures)
        for (const step of pending) {
          execution.results.set(step.id, {
            stepId: step.id,
            status: 'skipped',
            attempts: 0,
          });
          this.emit({ type: 'step_skipped', executionId, stepId: step.id });
        }
        break;
      }

      // Execute ready steps in parallel
      const results = await Promise.all(
        ready.map((step) => this.executeStep(step, execution, completed, failed)),
      );

      // Remove processed steps from pending
      for (const step of ready) {
        const idx = pending.indexOf(step);
        if (idx >= 0) pending.splice(idx, 1);
      }

      // Check if any failed
      const anyFailed = results.some((r) => r.status === 'failed');
      if (anyFailed && pending.length > 0) {
        // Continue — dependent steps will be skipped
      }
    }

    execution.status = failed.size > 0 && completed.size === 0 ? 'failed' : 'succeeded';
    execution.finishedAt = new Date().toISOString();

    if (execution.status === 'succeeded') {
      this.emit({ type: 'workflow_succeeded', executionId, workflowId: workflow.id });
    } else {
      this.emit({
        type: 'workflow_failed',
        executionId,
        workflowId: workflow.id,
        error: `${failed.size} step(s) failed`,
      });
    }

    return execution;
  }

  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    completed: Set<string>,
    failed: Set<string>,
  ): Promise<StepResult> {
    // Check condition
    if (step.condition && !step.condition(execution.context)) {
      const result: StepResult = { stepId: step.id, status: 'skipped', attempts: 0 };
      execution.results.set(step.id, result);
      // Mark as completed so dependents can still run (skip is not a failure)
      completed.add(step.id);
      this.emit({ type: 'step_skipped', executionId: execution.executionId, stepId: step.id });
      return result;
    }

    // Check if any dependency failed
    const depFailed = (step.dependsOn ?? []).some((dep) => failed.has(dep));
    if (depFailed) {
      const result: StepResult = { stepId: step.id, status: 'skipped', attempts: 0 };
      execution.results.set(step.id, result);
      this.emit({ type: 'step_skipped', executionId: execution.executionId, stepId: step.id });
      return result;
    }

    this.emit({ type: 'step_started', executionId: execution.executionId, stepId: step.id });

    const maxAttempts = (step.retries ?? 0) + 1;
    let lastError = '';
    const startedAt = new Date().toISOString();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        let output: unknown;
        if (step.timeoutMs) {
          output = await this.withTimeout(step.run(execution.context), step.timeoutMs);
        } else {
          output = await step.run(execution.context);
        }

        execution.context.outputs[step.id] = output;
        const result: StepResult = {
          stepId: step.id,
          status: 'succeeded',
          output,
          startedAt,
          finishedAt: new Date().toISOString(),
          attempts: attempt,
        };
        execution.results.set(step.id, result);
        completed.add(step.id);
        this.emit({
          type: 'step_succeeded',
          executionId: execution.executionId,
          stepId: step.id,
          output,
        });
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts && step.retryDelayMs) {
          await new Promise((r) => setTimeout(r, step.retryDelayMs));
        }
      }
    }

    const result: StepResult = {
      stepId: step.id,
      status: 'failed',
      error: lastError,
      startedAt,
      finishedAt: new Date().toISOString(),
      attempts: maxAttempts,
    };
    execution.results.set(step.id, result);
    failed.add(step.id);
    this.emit({
      type: 'step_failed',
      executionId: execution.executionId,
      stepId: step.id,
      error: lastError,
    });
    return result;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }
}

// ============================================================
// Convenience: build + execute in one call
// ============================================================

export async function runWorkflow(
  steps: WorkflowStep[],
  input: unknown,
  name = 'anonymous',
  tenantId?: string,
): Promise<WorkflowExecution> {
  const workflow: Workflow = { id: crypto.randomUUID(), name, steps };
  const executor = new WorkflowExecutor();
  return executor.execute(workflow, input, tenantId);
}
