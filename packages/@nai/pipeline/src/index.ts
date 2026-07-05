export const PACKAGE_INFO = {
  name: '@nai/pipeline',
  upstream: 'https://github.com/deepset-ai/haystack',
  tool: 'haystack',
  language: 'python',
  license: 'Apache-2.0',
} as const;

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  executor: (input: unknown) => Promise<unknown>;
  dependsOn?: string[];
  timeoutMs?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
}

export interface StageResult {
  stageId: string;
  status: StageStatus;
  output?: unknown;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface PipelineResult {
  pipelineId: string;
  status: StageStatus;
  stages: StageResult[];
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
}

export function createPipeline(pipeline: Omit<Pipeline, 'id'>): Pipeline {
  return {
    ...pipeline,
    id: `pipeline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
}

export function addStage(pipeline: Pipeline, stage: Omit<PipelineStage, 'id'>): Pipeline {
  const newStage: PipelineStage = {
    ...stage,
    id: `stage-${pipeline.stages.length}`,
  };
  return {
    ...pipeline,
    stages: [...pipeline.stages, newStage],
  };
}

export async function executePipeline(pipeline: Pipeline, input: unknown): Promise<PipelineResult> {
  const startedAt = new Date().toISOString();
  const results: StageResult[] = [];
  const completed = new Set<string>();
  const failed = new Set<string>();

  let progress = true;
  while (progress && completed.size + failed.size < pipeline.stages.length) {
    progress = false;

    for (const stage of pipeline.stages) {
      if (completed.has(stage.id) || failed.has(stage.id)) {
        continue;
      }

      const deps = stage.dependsOn ?? [];
      const depsCompleted = deps.every((dep) => completed.has(dep));
      const depsFailed = deps.some((dep) => failed.has(dep));

      if (depsFailed) {
        results.push({
          stageId: stage.id,
          status: 'skipped',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        });
        completed.add(stage.id);
        progress = true;
        continue;
      }

      if (!depsCompleted) {
        continue;
      }

      progress = true;
      const stageStartedAt = new Date().toISOString();

      try {
        let output: unknown;
        if (stage.timeoutMs) {
          output = await withTimeout(stage.executor(input), stage.timeoutMs);
        } else {
          output = await stage.executor(input);
        }

        const stageFinishedAt = new Date().toISOString();
        results.push({
          stageId: stage.id,
          status: 'completed',
          output,
          startedAt: stageStartedAt,
          finishedAt: stageFinishedAt,
          durationMs: Date.now() - Date.parse(stageStartedAt),
        });
        completed.add(stage.id);
      } catch (err) {
        const stageFinishedAt = new Date().toISOString();
        results.push({
          stageId: stage.id,
          status: 'failed',
          error: String(err),
          startedAt: stageStartedAt,
          finishedAt: stageFinishedAt,
          durationMs: Date.now() - Date.parse(stageStartedAt),
        });
        failed.add(stage.id);
      }
    }
  }

  const finishedAt = new Date().toISOString();
  const pipelineStatus = failed.size > 0 ? 'failed' : 'completed';

  return {
    pipelineId: pipeline.id,
    status: pipelineStatus,
    stages: results,
    startedAt,
    finishedAt,
    durationMs: Date.now() - Date.parse(startedAt),
    error: failed.size > 0 ? `${failed.size} stage(s) failed` : undefined,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export async function getPipelineStatus(pipelineId: string): Promise<PipelineResult | null> {
  return null;
}

export async function cancelPipeline(pipelineId: string): Promise<boolean> {
  return true;
}
