import {
  PACKAGE_INFO,
  createDataset,
  getDataset,
  listDatasets,
  addSamples,
  clearDatasets,
  registerMetric,
  getMetric,
  listMetrics,
  exactMatch,
  containsMatch,
  lengthMetric,
  keywordOverlap,
  runEval,
  getEvalRun,
  listEvalRuns,
  compareEvalRuns,
  clearEvalRuns,
  type EvalSample,
} from './index.js';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    steps.push(`  \u2713 ${msg}`);
  } else {
    failed++;
    steps.push(`  \u2717 ${msg}`);
    console.error(`  \u2717 ${msg}`);
  }
}

async function main(): Promise<void> {
  clearDatasets();
  clearEvalRuns();

  // Smoke test
  assert(PACKAGE_INFO.name === '@nai/opik', 'PACKAGE_INFO.name is @nai/opik');
  assert(PACKAGE_INFO.upstream.startsWith('https://'), 'PACKAGE_INFO.upstream is https URL');

  // ============================================================
  // Datasets
  // ============================================================

  // 1. createDataset
  const samples: EvalSample[] = [
    { id: 's1', input: 'What is 2+2?', expected: '4' },
    { id: 's2', input: 'Capital of Vietnam?', expected: 'Hanoi' },
    { id: 's3', input: 'Say hello in Vietnamese', expected: 'Xin chào' },
  ];
  const ds = createDataset('math-qa', samples, 'Math and QA samples');
  assert(ds.name === 'math-qa', 'createDataset sets name');
  assert(ds.samples.length === 3, 'createDataset stores 3 samples');
  assert(ds.description === 'Math and QA samples', 'createDataset sets description');

  // 2. getDataset
  const retrieved = getDataset('math-qa');
  assert(retrieved !== null, 'getDataset returns dataset');
  assert(getDataset('nonexistent') === null, 'getDataset returns null for unknown');

  // 3. listDatasets
  createDataset('empty-ds', []);
  assert(listDatasets().length === 2, 'listDatasets returns 2');

  // 4. addSamples
  addSamples('math-qa', [{ id: 's4', input: '1+1?', expected: '2' }]);
  assert(getDataset('math-qa')?.samples.length === 4, 'addSamples adds to dataset');

  // 5. addSamples throws for unknown
  let addThrew = false;
  try { addSamples('unknown', []); } catch { addThrew = true; }
  assert(addThrew, 'addSamples throws for unknown dataset');

  // ============================================================
  // Metrics
  // ============================================================

  // 6. built-in metrics registered
  assert(listMetrics().includes('exact_match'), 'exact_match metric registered');
  assert(listMetrics().includes('contains_match'), 'contains_match metric registered');
  assert(listMetrics().includes('length'), 'length metric registered');

  // 7. exactMatch
  const em1 = exactMatch({ id: 's', input: 'q', expected: 'hello' }, 'hello');
  assert(em1.score === 1, 'exactMatch returns 1 for exact match');
  const em2 = exactMatch({ id: 's', input: 'q', expected: 'hello' }, 'world');
  assert(em2.score === 0, 'exactMatch returns 0 for mismatch');
  const em3 = exactMatch({ id: 's', input: 'q' }, 'hello');
  assert(em3.score === 0, 'exactMatch returns 0 when no expected');

  // 8. containsMatch
  const cm1 = containsMatch({ id: 's', input: 'q', expected: 'Hanoi' }, 'The capital is Hanoi city');
  assert(cm1.score === 1, 'containsMatch returns 1 when output contains expected');
  const cm2 = containsMatch({ id: 's', input: 'q', expected: 'Saigon' }, 'The capital is Hanoi');
  assert(cm2.score === 0, 'containsMatch returns 0 when not found');

  // 9. lengthMetric
  const lm = lengthMetric({ id: 's', input: 'q' }, 'short');
  assert(lm.score > 0 && lm.score <= 1, 'lengthMetric returns score in 0..1');
  const lmLong = lengthMetric({ id: 's', input: 'q' }, 'x'.repeat(600));
  assert(lmLong.score === 1, 'lengthMetric caps at 1 for long output');

  // 10. keywordOverlap
  const ko = keywordOverlap(['family', 'tree', 'genealogy']);
  const koResult = ko({ id: 's', input: 'q' }, 'The family tree shows our genealogy');
  assert(koResult.score === 1, 'keywordOverlap returns 1 when all keywords found');
  const koPartial = ko({ id: 's', input: 'q' }, 'The family tree');
  assert(koPartial.score === 2 / 3, 'keywordOverlap returns 2/3 for 2 of 3 keywords');

  // 11. registerMetric custom
  registerMetric('custom_score', (sample, output) => ({
    metric_name: 'custom_score',
    score: output.length > 0 ? 0.5 : 0,
  }));
  assert(listMetrics().includes('custom_score'), 'custom metric registered');
  assert(getMetric('custom_score') !== null, 'getMetric returns custom metric');
  assert(getMetric('unknown') === null, 'getMetric returns null for unknown');

  // ============================================================
  // Eval runs
  // ============================================================

  // 12. runEval with exact_match
  clearDatasets();
  createDataset('test-ds', [
    { id: 's1', input: '2+2', expected: '4' },
    { id: 's2', input: '3+3', expected: '6' },
    { id: 's3', input: '4+4', expected: '8' },
  ]);
  const run1 = await runEval({
    dataset_name: 'test-ds',
    metrics: ['exact_match'],
    predict_fn: async (input) => {
      const map: Record<string, string> = { '2+2': '4', '3+3': '6', '4+4': '8' };
      return map[input] ?? 'unknown';
    },
  });
  assert(run1.run_id.length === 16, 'runEval generates run_id');
  assert(run1.status === 'completed', 'runEval status is completed');
  assert(run1.total_samples === 3, 'runEval total_samples is 3');
  assert(run1.sample_results.length === 3, 'runEval produces 3 sample results');
  assert(run1.aggregate_scores['exact_match'] === 1, 'runEval exact_match avg = 1.0 (all correct)');

  // 13. runEval with partial correctness
  const run2 = await runEval({
    dataset_name: 'test-ds',
    metrics: ['exact_match'],
    predict_fn: async (input) => {
      const map: Record<string, string> = { '2+2': '4', '3+3': 'wrong', '4+4': '8' };
      return map[input] ?? 'unknown';
    },
  });
  assert(run2.aggregate_scores['exact_match'] === 2 / 3, 'runEval exact_match avg = 2/3 (2 of 3 correct)');

  // 14. runEval with multiple metrics
  const run3 = await runEval({
    dataset_name: 'test-ds',
    metrics: ['exact_match', 'length'],
    predict_fn: async (input) => {
      const map: Record<string, string> = { '2+2': '4', '3+3': '6', '4+4': '8' };
      return map[input] ?? 'unknown';
    },
  });
  assert(run3.metric_names.length === 2, 'runEval with 2 metrics');
  assert(run3.aggregate_scores['exact_match'] === 1, 'run3 exact_match = 1.0');
  assert(run3.aggregate_scores['length'] > 0, 'run3 length > 0');

  // 15. runEval throws for unknown dataset
  let evalThrew = false;
  try {
    await runEval({ dataset_name: 'unknown', metrics: ['exact_match'], predict_fn: async () => '' });
  } catch { evalThrew = true; }
  assert(evalThrew, 'runEval throws for unknown dataset');

  // 16. runEval throws for unknown metric
  let metricThrew = false;
  try {
    await runEval({ dataset_name: 'test-ds', metrics: ['nonexistent'], predict_fn: async () => '' });
  } catch { metricThrew = true; }
  assert(metricThrew, 'runEval throws for unknown metric');

  // 17. getEvalRun
  const fetched = getEvalRun(run1.run_id);
  assert(fetched !== null, 'getEvalRun returns run');
  assert(getEvalRun('nonexistent') === null, 'getEvalRun returns null for unknown');

  // 18. listEvalRuns
  assert(listEvalRuns().length === 3, 'listEvalRuns returns 3 runs');

  // 19. compareEvalRuns
  const comparison = compareEvalRuns(run1.run_id, run2.run_id);
  assert(comparison.run_a !== null, 'compareEvalRuns returns run_a');
  assert(comparison.run_b !== null, 'compareEvalRuns returns run_b');
  assert(comparison.deltas['exact_match'] === 2 / 3 - 1, 'compareEvalRuns delta = -1/3');

  // 20. clearEvalRuns
  clearEvalRuns();
  assert(listEvalRuns().length === 0, 'clearEvalRuns empties runs');

  // Print results
  console.log('\n@nai/eval tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
