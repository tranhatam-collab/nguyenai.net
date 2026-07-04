/**
 * @nai/loom — Pipeline builder for NAI.
 *
 * Per Founder Build Directive P1-B.8 / P1-C.5:
 *   Pipeline: sequential data processing stages with transforms, filters, joins.
 *
 * Responsibilities:
 * - Define pipelines as ordered stages
 * - Each stage transforms input → output
 * - Support filters (drop items), maps (transform), reduces (aggregate)
 * - Track per-stage metrics (items in/out, duration, errors)
 * - Support batch processing
 * - Emit events for observability
 *
 * MVP: In-memory, no persistence. Interface swappable to D1/Queues.
 */

// ============================================================
// Types
// ============================================================

export type StageStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export interface StageMetrics {
  itemsIn: number;
  itemsOut: number;
  durationMs: number;
  errors: number;
}

export interface StageResult<T = unknown> {
  stageId: string;
  status: StageStatus;
  output: T[];
  metrics: StageMetrics;
  error?: string;
}

export interface PipelineStage<TIn = unknown, TOut = unknown> {
  id: string;
  /** Transform function: takes array of items, returns array of items. */
  transform: (items: TIn[], ctx: PipelineContext) => Promise<TOut[]> | TOut[];
  /** Optional filter — items where filter returns false are dropped. */
  filter?: (item: TOut, ctx: PipelineContext) => boolean;
  /** Optional batch size — if set, items are processed in batches. */
  batchSize?: number;
  /** Max retry attempts (default 0). */
  retries?: number;
}

export interface PipelineContext {
  /** Pipeline metadata. */
  pipelineId: string;
  /** Tenant id for multi-tenant isolation. */
  tenantId?: string;
  /** Shared mutable state across stages. */
  state: Record<string, unknown>;
  /** Configuration passed to the pipeline. */
  config: Record<string, unknown>;
}

export interface PipelineResult {
  pipelineId: string;
  status: StageStatus;
  stages: StageResult[];
  totalDurationMs: number;
  finalOutput: unknown[];
}

export type PipelineEvent =
  | { type: 'pipeline_started'; pipelineId: string; itemCount: number }
  | { type: 'stage_started'; pipelineId: string; stageId: string; itemsIn: number }
  | { type: 'stage_succeeded'; pipelineId: string; stageId: string; itemsOut: number; durationMs: number }
  | { type: 'stage_failed'; pipelineId: string; stageId: string; error: string }
  | { type: 'pipeline_succeeded'; pipelineId: string; totalItems: number }
  | { type: 'pipeline_failed'; pipelineId: string; error: string };

export type PipelineEventListener = (event: PipelineEvent) => void;

// ============================================================
// Pipeline builder
// ============================================================

export class Pipeline {
  readonly id: string;
  readonly stages: PipelineStage[] = [];
  private listeners: PipelineEventListener[] = [];

  constructor(id: string, stages?: PipelineStage[]) {
    this.id = id;
    if (stages) this.stages.push(...stages);
  }

  stage<TIn, TOut>(stage: PipelineStage<TIn, TOut>): this {
    this.stages.push(stage as unknown as PipelineStage);
    return this;
  }

  onEvent(listener: PipelineEventListener): this {
    this.listeners.push(listener);
    return this;
  }

  private emit(event: PipelineEvent): void {
    for (const l of this.listeners) l(event);
  }

  async run<T = unknown>(
    input: unknown[],
    opts?: { tenantId?: string; config?: Record<string, unknown> },
  ): Promise<PipelineResult> {
    const ctx: PipelineContext = {
      pipelineId: this.id,
      tenantId: opts?.tenantId,
      state: {},
      config: opts?.config ?? {},
    };

    const startTime = Date.now();
    this.emit({ type: 'pipeline_started', pipelineId: this.id, itemCount: input.length });

    let current: unknown[] = input;
    const stageResults: StageResult[] = [];

    for (const stage of this.stages) {
      const stageStart = Date.now();
      this.emit({ type: 'stage_started', pipelineId: this.id, stageId: stage.id, itemsIn: current.length });

      const maxAttempts = (stage.retries ?? 0) + 1;
      let lastError = '';
      let output: unknown[] = [];
      let succeeded = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // Batch processing
          if (stage.batchSize && stage.batchSize > 0) {
            const batches: unknown[][] = [];
            for (let i = 0; i < current.length; i += stage.batchSize) {
              batches.push(current.slice(i, i + stage.batchSize));
            }
            const batchResults = await Promise.all(
              batches.map((b) => stage.transform(b, ctx)),
            );
            output = batchResults.flat();
          } else {
            output = await stage.transform(current, ctx);
          }

          // Apply filter if present
          if (stage.filter) {
            output = output.filter((item) => stage.filter!(item, ctx));
          }

          succeeded = true;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      const durationMs = Date.now() - stageStart;

      if (!succeeded) {
        const result: StageResult = {
          stageId: stage.id,
          status: 'failed',
          output: [],
          metrics: { itemsIn: current.length, itemsOut: 0, durationMs, errors: maxAttempts },
          error: lastError,
        };
        stageResults.push(result);
        this.emit({ type: 'stage_failed', pipelineId: this.id, stageId: stage.id, error: lastError });

        const totalDurationMs = Date.now() - startTime;
        this.emit({ type: 'pipeline_failed', pipelineId: this.id, error: lastError });
        return {
          pipelineId: this.id,
          status: 'failed',
          stages: stageResults,
          totalDurationMs,
          finalOutput: [],
        };
      }

      const result: StageResult = {
        stageId: stage.id,
        status: 'succeeded',
        output,
        metrics: { itemsIn: current.length, itemsOut: output.length, durationMs, errors: 0 },
      };
      stageResults.push(result);
      this.emit({
        type: 'stage_succeeded',
        pipelineId: this.id,
        stageId: stage.id,
        itemsOut: output.length,
        durationMs,
      });

      current = output;
    }

    const totalDurationMs = Date.now() - startTime;
    this.emit({ type: 'pipeline_succeeded', pipelineId: this.id, totalItems: current.length });

    return {
      pipelineId: this.id,
      status: 'succeeded',
      stages: stageResults,
      totalDurationMs,
      finalOutput: current as T[],
    };
  }
}

// ============================================================
// Convenience: common stage factories
// ============================================================

export function mapStage<TIn, TOut>(
  id: string,
  fn: (item: TIn, ctx: PipelineContext) => Promise<TOut> | TOut,
): PipelineStage<TIn, TOut> {
  return {
    id,
    transform: async (items, ctx) => {
      return Promise.all(items.map((item) => fn(item, ctx)));
    },
  };
}

export function filterStage<T>(
  id: string,
  predicate: (item: T, ctx: PipelineContext) => boolean,
): PipelineStage<T, T> {
  return {
    id,
    transform: (items) => items,
    filter: (item, ctx) => predicate(item as T, ctx),
  };
}

export function reduceStage<TIn, TOut>(
  id: string,
  fn: (acc: TOut, item: TIn, ctx: PipelineContext) => TOut,
  initial: TOut,
): PipelineStage<TIn, TOut> {
  return {
    id,
    transform: async (items, ctx) => {
      let acc = initial;
      for (const item of items) {
        acc = fn(acc, item, ctx);
      }
      return [acc];
    },
  };
}
