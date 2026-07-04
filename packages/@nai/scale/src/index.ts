/**
 * @nai/scale — LLM evaluation framework
 *
 * Provides test cases, scoring, and metrics for evaluating LLM outputs.
 * Supports accuracy, precision, recall, and F1 metrics for binary
 * classification, plus general eval runs with custom eval functions.
 */

export interface TestCase {
  id: string;
  input: unknown;
  expected: unknown;
  category?: string;
}

export interface EvalResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  actual: unknown;
  error?: string;
}

export interface EvalRun {
  id: string;
  name: string;
  testCases: TestCase[];
  results: EvalResult[];
  passed: number;
  failed: number;
  accuracy: number;
  durationMs: number;
  timestamp: number;
}

export type EvalFn = (testCase: TestCase) => Promise<{ score: number; actual: unknown }> | { score: number; actual: unknown };

let runIdCounter = 0;

function generateRunId(): string {
  runIdCounter++;
  return `eval_${Date.now()}_${runIdCounter}`;
}

/** Create a single test case. */
export function createTestCase(id: string, input: unknown, expected: unknown, category?: string): TestCase {
  const tc: TestCase = { id, input, expected };
  if (category !== undefined) tc.category = category;
  return tc;
}

/** Load test cases from an array of partial objects. */
export function loadTestCases(array: Array<{ id: string; input: unknown; expected: unknown; category?: string }>): TestCase[] {
  return array.map((a) => createTestCase(a.id, a.input, a.expected, a.category));
}

/** Run an evaluation over a set of test cases using a custom eval function. */
export async function runEval(name: string, testCases: TestCase[], evalFn: EvalFn): Promise<EvalRun> {
  const startTime = Date.now();
  const results: EvalResult[] = [];

  for (const tc of testCases) {
    try {
      const evalOutput = await evalFn(tc);
      const passed = evalOutput.score >= 1.0;
      results.push({
        testCaseId: tc.id,
        passed,
        score: evalOutput.score,
        actual: evalOutput.actual,
      });
    } catch (err) {
      results.push({
        testCaseId: tc.id,
        passed: false,
        score: 0,
        actual: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const durationMs = Date.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;
  const acc = results.length > 0 ? passedCount / results.length : 0;

  return {
    id: generateRunId(),
    name,
    testCases: [...testCases],
    results,
    passed: passedCount,
    failed: failedCount,
    accuracy: acc,
    durationMs,
    timestamp: startTime,
  };
}

/** Calculate accuracy (percentage passed) from results. */
export function accuracy(results: EvalResult[]): number {
  if (results.length === 0) return 0;
  return results.filter((r) => r.passed).length / results.length;
}

/**
 * Calculate precision for binary classification.
 * Precision = TP / (TP + FP)
 * Treats passed=true as positive prediction.
 */
export function precision(results: EvalResult[]): number {
  const truePositive = results.filter((r) => r.passed && r.score >= 1.0).length;
  const falsePositive = results.filter((r) => r.passed && r.score < 1.0).length;
  const denominator = truePositive + falsePositive;
  if (denominator === 0) return 0;
  return truePositive / denominator;
}

/**
 * Calculate recall for binary classification.
 * Recall = TP / (TP + FN)
 * Uses expected positive count derived from passed results.
 */
export function recall(results: EvalResult[]): number {
  if (results.length === 0) return 0;
  const truePositive = results.filter((r) => r.passed && r.score >= 1.0).length;
  const falseNegative = results.filter((r) => !r.passed).length;
  const denominator = truePositive + falseNegative;
  if (denominator === 0) return 0;
  return truePositive / denominator;
}

/** Calculate F1 score = 2 * (precision * recall) / (precision + recall). */
export function f1(results: EvalResult[]): number {
  const p = precision(results);
  const r = recall(results);
  if (p + r === 0) return 0;
  return (2 * (p * r)) / (p + r);
}

/** Export eval run results as JSON string. */
export function exportResults(run: EvalRun): string {
  return JSON.stringify(run, null, 2);
}
