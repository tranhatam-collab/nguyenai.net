import {
  createTestCase,
  loadTestCases,
  runEval,
  accuracy,
  precision,
  recall,
  f1,
  exportResults,
  type TestCase,
  type EvalResult,
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

function approx(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}

async function main(): Promise<void> {
  // 1. createTestCase
  const tc1 = createTestCase('tc-1', 'What is 2+2?', '4', 'math');
  assert(tc1.id === 'tc-1', 'createTestCase sets id');
  assert(tc1.input === 'What is 2+2?', 'createTestCase sets input');
  assert(tc1.expected === '4', 'createTestCase sets expected');
  assert(tc1.category === 'math', 'createTestCase sets category');

  // 2. createTestCase without category
  const tc2 = createTestCase('tc-2', 'Hello', 'Hi');
  assert(tc2.category === undefined, 'createTestCase without category has undefined category');

  // 3. loadTestCases
  const loaded = loadTestCases([
    { id: 'l1', input: 'a', expected: 'A', category: 'alpha' },
    { id: 'l2', input: 'b', expected: 'B' },
  ]);
  assert(loaded.length === 2, 'loadTestCases returns 2 cases');
  assert(loaded[0]?.id === 'l1' && loaded[1]?.id === 'l2', 'loadTestCases preserves ids');

  // 4. runEval basic
  const cases: TestCase[] = [
    createTestCase('e1', 'q1', 'r1'),
    createTestCase('e2', 'q2', 'r2'),
    createTestCase('e3', 'q3', 'r3'),
  ];
  const run = await runEval('test-run', cases, async (tc) => {
    if (tc.id === 'e1') return { score: 1.0, actual: 'r1' };
    if (tc.id === 'e2') return { score: 0.5, actual: 'wrong' };
    return { score: 1.0, actual: 'r3' };
  });
  assert(run.name === 'test-run', 'runEval sets name');
  assert(run.results.length === 3, 'runEval produces 3 results');
  assert(run.passed === 2, 'runEval passed count = 2 (score >= 1.0)');
  assert(run.failed === 1, 'runEval failed count = 1');
  assert(approx(run.accuracy, 2 / 3), 'runEval accuracy = 2/3');
  assert(run.id.startsWith('eval_'), 'runEval generates id');
  assert(run.durationMs >= 0, 'runEval sets durationMs');

  // 5. runEval with error in evalFn
  const errorRun = await runEval('error-run', [createTestCase('err1', 'q', 'r')], async () => {
    throw new Error('eval crashed');
  });
  assert(errorRun.results[0]?.passed === false, 'runEval error result passed=false');
  assert(errorRun.results[0]?.score === 0, 'runEval error result score=0');
  assert(errorRun.results[0]?.error === 'eval crashed', 'runEval error result has error message');

  // 6. runEval with empty test cases
  const emptyRun = await runEval('empty', [], async () => ({ score: 1.0, actual: 'x' }));
  assert(emptyRun.results.length === 0, 'runEval empty produces 0 results');
  assert(emptyRun.accuracy === 0, 'runEval empty accuracy = 0');

  // 7. accuracy
  const results: EvalResult[] = [
    { testCaseId: '1', passed: true, score: 1.0, actual: 'a' },
    { testCaseId: '2', passed: true, score: 1.0, actual: 'b' },
    { testCaseId: '3', passed: false, score: 0.0, actual: 'c' },
    { testCaseId: '4', passed: false, score: 0.0, actual: 'd' },
  ];
  assert(approx(accuracy(results), 0.5), 'accuracy = 0.5 for 2/4 passed');
  assert(accuracy([]) === 0, 'accuracy empty = 0');

  // 8. precision
  // TP=2, FP=0 (no passed with score < 1.0), so precision = 2/2 = 1.0
  assert(approx(precision(results), 1.0), 'precision = 1.0 (no false positives)');

  // 9. precision with false positives
  const resultsWithFP: EvalResult[] = [
    { testCaseId: '1', passed: true, score: 1.0, actual: 'a' },
    { testCaseId: '2', passed: true, score: 0.5, actual: 'b' }, // FP: passed but score < 1
    { testCaseId: '3', passed: false, score: 0.0, actual: 'c' },
  ];
  // TP=1, FP=1 => precision = 0.5
  assert(approx(precision(resultsWithFP), 0.5), 'precision = 0.5 with 1 TP and 1 FP');

  // 10. recall
  // TP=2, FN=2 => recall = 2/4 = 0.5
  assert(approx(recall(results), 0.5), 'recall = 0.5 for 2 TP and 2 FN');

  // 11. recall empty
  assert(recall([]) === 0, 'recall empty = 0');

  // 12. f1
  // For `results`: precision=1.0, recall=0.5 => f1 = 2*(1*0.5)/(1+0.5) = 1/1.5 = 0.6667
  const f1Val = f1(results);
  assert(approx(f1Val, (2 * (1.0 * 0.5)) / (1.0 + 0.5)), 'f1 = 2*P*R/(P+R) for results');

  // 13. f1 with zero precision and recall
  const allFail: EvalResult[] = [
    { testCaseId: '1', passed: false, score: 0.0, actual: 'a' },
    { testCaseId: '2', passed: false, score: 0.0, actual: 'b' },
  ];
  assert(f1(allFail) === 0, 'f1 = 0 when all fail');

  // 14. exportResults
  const exported = exportResults(run);
  const parsed = JSON.parse(exported);
  assert(parsed.name === 'test-run', 'exportResults JSON has name');
  assert(parsed.results.length === 3, 'exportResults JSON has 3 results');
  assert(typeof parsed.accuracy === 'number', 'exportResults JSON has accuracy as number');

  // 15. runEval preserves testCases in run
  assert(run.testCases.length === 3, 'runEval run preserves testCases');
  assert(run.testCases[0]?.id === 'e1', 'runEval run testCases[0] has correct id');

  // Print results
  console.log('\n@nai/scale tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
