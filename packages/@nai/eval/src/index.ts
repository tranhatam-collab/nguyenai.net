/**
 * @nai/eval — Eval platform (opik rebrand)
 *
 * Provides eval datasets, metrics, eval runs, and scoring.
 * Supports custom metric functions and dataset management.
 *
 * P1-D.3: Eval platform — eval dataset + metric
 */

export const PACKAGE_INFO = {
  name: '@nai/opik',
  upstream: 'https://github.com/opik/opik',
  tool: 'opik',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

// ============================================================
// Eval datasets
// ============================================================

export interface EvalSample {
  id: string;
  input: string;
  expected?: string;
  context?: Record<string, unknown>;
  tags?: string[];
}

export interface EvalDataset {
  name: string;
  description?: string;
  samples: EvalSample[];
  created_at: number;
}

const datasets = new Map<string, EvalDataset>();

/** Create or replace a dataset. */
export function createDataset(name: string, samples: EvalSample[], description?: string): EvalDataset {
  const dataset: EvalDataset = {
    name,
    description,
    samples,
    created_at: Date.now(),
  };
  datasets.set(name, dataset);
  return dataset;
}

/** Get a dataset by name. */
export function getDataset(name: string): EvalDataset | null {
  return datasets.get(name) ?? null;
}

/** List all datasets. */
export function listDatasets(): EvalDataset[] {
  return Array.from(datasets.values());
}

/** Add samples to an existing dataset. */
export function addSamples(name: string, samples: EvalSample[]): void {
  const dataset = datasets.get(name);
  if (!dataset) throw new Error(`Dataset ${name} not found`);
  dataset.samples.push(...samples);
}

/** Clear all datasets (for testing). */
export function clearDatasets(): void {
  datasets.clear();
}

// ============================================================
// Metrics
// ============================================================

export type MetricScore = number; // 0..1

export interface MetricResult {
  metric_name: string;
  score: MetricScore;
  reason?: string;
}

export type MetricFn = (sample: EvalSample, output: string) => MetricResult;

const metricRegistry = new Map<string, MetricFn>();

/** Register a custom metric function. */
export function registerMetric(name: string, fn: MetricFn): void {
  metricRegistry.set(name, fn);
}

/** Get a registered metric function. */
export function getMetric(name: string): MetricFn | null {
  return metricRegistry.get(name) ?? null;
}

/** List all registered metrics. */
export function listMetrics(): string[] {
  return Array.from(metricRegistry.keys());
}

// Built-in metrics

/** Exact match metric — 1 if output equals expected, 0 otherwise. */
export const exactMatch: MetricFn = (sample, output) => {
  if (!sample.expected) return { metric_name: 'exact_match', score: 0, reason: 'no expected value' };
  const score = output.trim().toLowerCase() === sample.expected.trim().toLowerCase() ? 1 : 0;
  return { metric_name: 'exact_match', score, reason: score === 1 ? 'match' : 'mismatch' };
};

/** Contains metric — 1 if output contains expected, 0 otherwise. */
export const containsMatch: MetricFn = (sample, output) => {
  if (!sample.expected) return { metric_name: 'contains_match', score: 0, reason: 'no expected value' };
  const score = output.toLowerCase().includes(sample.expected.toLowerCase()) ? 1 : 0;
  return { metric_name: 'contains_match', score };
};

/** Length metric — normalized output length (0..1, capped at 500 chars). */
export const lengthMetric: MetricFn = (_sample, output) => {
  const score = Math.min(output.length / 500, 1);
  return { metric_name: 'length', score, reason: `${output.length} chars` };
};

/** Keyword overlap metric — fraction of expected keywords found in output. */
export function keywordOverlap(keywords: string[]): MetricFn {
  return (sample, output) => {
    const lower = output.toLowerCase();
    const found = keywords.filter((k) => lower.includes(k.toLowerCase()));
    const score = keywords.length > 0 ? found.length / keywords.length : 0;
    return { metric_name: 'keyword_overlap', score, reason: `${found.length}/${keywords.length} keywords` };
  };
}

// Register built-in metrics
registerMetric('exact_match', exactMatch);
registerMetric('contains_match', containsMatch);
registerMetric('length', lengthMetric);

// ============================================================
// Eval runs
// ============================================================

export interface EvalRunSampleResult {
  sample_id: string;
  input: string;
  output: string;
  expected?: string;
  metrics: MetricResult[];
}

export interface EvalRunResult {
  run_id: string;
  dataset_name: string;
  metric_names: string[];
  started_at: number;
  completed_at?: number;
  sample_results: EvalRunSampleResult[];
  aggregate_scores: Record<string, number>;
  total_samples: number;
  status: 'running' | 'completed' | 'failed';
}

export type EvalPredictFn = (input: string, context?: Record<string, unknown>) => Promise<string>;

const evalRuns = new Map<string, EvalRunResult>();

/** Run an evaluation against a dataset with given metrics. */
export async function runEval(opts: {
  dataset_name: string;
  metrics: string[];
  predict_fn: EvalPredictFn;
}): Promise<EvalRunResult> {
  const dataset = datasets.get(opts.dataset_name);
  if (!dataset) throw new Error(`Dataset ${opts.dataset_name} not found`);

  const runId = generateId(16);

  // Validate metrics before creating the run
  const metricFns: { name: string; fn: MetricFn }[] = [];
  for (const name of opts.metrics) {
    const fn = metricRegistry.get(name);
    if (!fn) throw new Error(`Metric ${name} not registered`);
    metricFns.push({ name, fn });
  }

  const run: EvalRunResult = {
    run_id: runId,
    dataset_name: opts.dataset_name,
    metric_names: opts.metrics,
    started_at: Date.now(),
    sample_results: [],
    aggregate_scores: {},
    total_samples: dataset.samples.length,
    status: 'running',
  };
  evalRuns.set(runId, run);

  const scoreSums: Record<string, number> = {};
  for (const name of opts.metrics) scoreSums[name] = 0;

  for (const sample of dataset.samples) {
    const output = await opts.predict_fn(sample.input, sample.context);
    const metrics: MetricResult[] = [];
    for (const { name, fn } of metricFns) {
      const result = fn(sample, output);
      metrics.push(result);
      scoreSums[name] += result.score;
    }
    run.sample_results.push({
      sample_id: sample.id,
      input: sample.input,
      output,
      expected: sample.expected,
      metrics,
    });
  }

  for (const name of opts.metrics) {
    run.aggregate_scores[name] = run.total_samples > 0 ? scoreSums[name]! / run.total_samples : 0;
  }

  run.completed_at = Date.now();
  run.status = 'completed';
  return run;
}

/** Get an eval run by ID. */
export function getEvalRun(runId: string): EvalRunResult | null {
  return evalRuns.get(runId) ?? null;
}

/** List all eval runs. */
export function listEvalRuns(): EvalRunResult[] {
  return Array.from(evalRuns.values()).sort((a, b) => b.started_at - a.started_at);
}

/** Compare two eval runs by aggregate scores. */
export function compareEvalRuns(runIdA: string, runIdB: string): {
  run_a: EvalRunResult | null;
  run_b: EvalRunResult | null;
  deltas: Record<string, number>;
} {
  const runA = evalRuns.get(runIdA);
  const runB = evalRuns.get(runIdB);
  const deltas: Record<string, number> = {};
  if (runA && runB) {
    const allMetrics = new Set([...Object.keys(runA.aggregate_scores), ...Object.keys(runB.aggregate_scores)]);
    for (const m of allMetrics) {
      deltas[m] = (runB.aggregate_scores[m] ?? 0) - (runA.aggregate_scores[m] ?? 0);
    }
  }
  return { run_a: runA ?? null, run_b: runB ?? null, deltas };
}

/** Clear all eval runs (for testing). */
export function clearEvalRuns(): void {
  evalRuns.clear();
}

// ============================================================
// Helpers
// ============================================================

function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}
