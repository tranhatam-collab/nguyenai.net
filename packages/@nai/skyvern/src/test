import {
  createVisualBrowserTask,
  executeVisualTask,
  getVisualTaskStatus,
  cancelVisualTask,
  PACKAGE_INFO,
} from './index';

async function runTests() {
  console.log('@nai/skyvern tests\n');

  let passed = 0;
  let failed = 0;

  try {
    console.log('Test 1: PACKAGE_INFO...');
    if (
      PACKAGE_INFO.name === '@nai/skyvern' &&
      PACKAGE_INFO.upstream === 'https://github.com/skyvern-ai/skyvern' &&
      PACKAGE_INFO.tool === 'skyvern' &&
      PACKAGE_INFO.language === 'python' &&
      PACKAGE_INFO.license === 'Apache-2.0'
    ) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  try {
    console.log('Test 2: createVisualBrowserTask...');
    const task = createVisualBrowserTask({
      description: 'Test task',
      url: 'https://example.com',
      actions: [{ type: 'navigate', url: 'https://example.com' }],
    });

    if (
      task.id.match(/^task-\d+-[a-z0-9]+$/) &&
      task.description === 'Test task' &&
      task.url === 'https://example.com' &&
      task.actions.length === 1
    ) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  try {
    console.log('Test 3: executeVisualTask...');
    const task = createVisualBrowserTask({
      description: 'Navigate task',
      url: 'https://example.com',
      actions: [{ type: 'navigate', url: 'https://example.com' }],
    });

    const result = await executeVisualTask(task);

    if (
      result.taskId === task.id &&
      result.status === 'completed' &&
      result.steps.length === 1 &&
      result.steps[0].status === 'completed' &&
      result.startedAt &&
      result.finishedAt
    ) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  try {
    console.log('Test 4: getVisualTaskStatus...');
    const result = await getVisualTaskStatus('non-existent-task');
    if (result === null) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  try {
    console.log('Test 5: cancelVisualTask...');
    const result = await cancelVisualTask('task-id');
    if (result === true) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  console.log('========================================');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
