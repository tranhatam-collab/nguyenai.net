/**
 * @nai/qa-loop — Unit tests
 */

import { PACKAGE_INFO, type QAResult, type QALoopResult } from './index';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function main() {
  console.log('=== @nai/qa-loop unit tests ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Package info
  try {
    assert(PACKAGE_INFO.name === '@nai/qa-loop', 'package name correct');
    assert(PACKAGE_INFO.version === '0.1.0', 'version correct');
    console.log('✓ Test 1: Package info');
    passed++;
  } catch (e) {
    console.log(`✗ Test 1: ${(e as Error).message}`);
    failed++;
  }

  // Test 2: Types are correct
  try {
    const result: QAResult = { step: 'test', passed: true, detail: 'ok', durationMs: 100 };
    assert(result.step === 'test', 'QAResult step');
    assert(result.passed === true, 'QAResult passed');
    console.log('✓ Test 2: QAResult type');
    passed++;
  } catch (e) {
    console.log(`✗ Test 2: ${(e as Error).message}`);
    failed++;
  }

  // Test 3: QALoopResult type
  try {
    const loop: QALoopResult = {
      loopNumber: 1,
      timestamp: new Date().toISOString(),
      results: [],
      allGreen: true,
      durationMs: 1000,
    };
    assert(loop.loopNumber === 1, 'loopNumber');
    assert(loop.allGreen === true, 'allGreen');
    console.log('✓ Test 3: QALoopResult type');
    passed++;
  } catch (e) {
    console.log(`✗ Test 3: ${(e as Error).message}`);
    failed++;
  }

  // Test 4: getQALoopHistory returns array (may be empty)
  try {
    const { getQALoopHistory } = await import('./index');
    const history = getQALoopHistory();
    assert(Array.isArray(history), 'history is array');
    console.log(`✓ Test 4: getQALoopHistory returns array (${history.length} entries)`);
    passed++;
  } catch (e) {
    console.log(`✗ Test 4: ${(e as Error).message}`);
    failed++;
  }

  // Test 5: getSelfUpgradeHistory returns array
  try {
    const { getSelfUpgradeHistory } = await import('./index');
    const history = getSelfUpgradeHistory();
    assert(Array.isArray(history), 'history is array');
    console.log(`✓ Test 5: getSelfUpgradeHistory returns array (${history.length} entries)`);
    passed++;
  } catch (e) {
    console.log(`✗ Test 5: ${(e as Error).message}`);
    failed++;
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
