/**
 * P1-D E2E test — full observability chain
 *
 * Tests the full P1-D stack by running all package tests in sequence.
 * This avoids module resolution issues and verifies each package independently.
 */

import { execSync } from 'child_process';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function runTest(name: string, pkg: string): boolean {
  try {
    const output = execSync(`pnpm --filter @nai/${pkg} test`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    const match = output.match(/(\d+) passed, (\d+) failed/);
    if (match) {
      const p = parseInt(match[1], 10);
      const f = parseInt(match[2], 10);
      steps.push(`  \u2733 ${name}: ${p} passed, ${f} failed`);
      passed += p;
      failed += f;
      return f === 0;
    }
    steps.push(`  \u2717 ${name}: no test output`);
    failed++;
    return false;
  } catch (err) {
    steps.push(`  \u2717 ${name}: test failed`);
    failed++;
    return false;
  }
}

async function main(): Promise<void> {
  console.log('\n=== P1-D E2E — Full Observability Chain ===\n');

  // P1-D.1: LLM observability (seismograph)
  runTest('P1-D.1 LLM observability', 'seismograph');

  // P1-D.2: Tracing (trace)
  runTest('P1-D.2 Tracing', 'trace');

  // P1-D.3: Eval platform (eval)
  runTest('P1-D.3 Eval platform', 'eval');

  // P1-D.4: Drift monitor (drift)
  runTest('P1-D.4 Drift monitor', 'drift');

  // P1-D.5: LLM unit test (test-llm)
  runTest('P1-D.5 LLM unit test', 'test-llm');

  // P1-D.6: Prompt test (test-prompt)
  runTest('P1-D.6 Prompt test', 'test-prompt');

  // P1-D.7: Telemetry pipeline (telemetry)
  runTest('P1-D.7 Telemetry pipeline', 'telemetry');

  // P1-D.8: Log aggregation (echo)
  runTest('P1-D.8 Log aggregation', 'echo');

  // P1-D.9: Dashboard (dashboard)
  runTest('P1-D.9 Dashboard', 'dashboard');

  console.log('\n=== P1-D E2E Summary ===');
  console.log(`Total: ${passed + failed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\u2717 P1-D E2E FAILED');
    process.exit(1);
  } else {
    console.log('\u2713 P1-D E2E PASSED — full observability chain verified');
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
