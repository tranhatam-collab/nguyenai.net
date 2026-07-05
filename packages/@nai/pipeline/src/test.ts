import {
  createPipeline,
  addStage,
  executePipeline,
  getPipelineStatus,
  cancelPipeline,
  PACKAGE_INFO,
} from './index';

async function runTests() {
  console.log('@nai/pipeline tests\n');

  let passed = 0;
  let failed = 0;

  try {
    console.log('Test 1: PACKAGE_INFO...');
    if (
      PACKAGE_INFO.name === '@nai/pipeline' &&
      PACKAGE_INFO.upstream === 'https://github.com/deepset-ai/haystack' &&
      PACKAGE_INFO.tool === 'haystack' &&
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
    console.log('Test 2: createPipeline...');
    const pipeline = createPipeline({
      name: 'Test Pipeline',
      description: 'Test pipeline',
      stages: [],
    });

    if (
      pipeline.id.match(/^pipeline-\d+-[a-z0-9]+$/) &&
      pipeline.name === 'Test Pipeline' &&
      pipeline.description === 'Test pipeline' &&
      pipeline.stages.length === 0
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
    console.log('Test 3: addStage...');
    const pipeline = createPipeline({
      name: 'Test Pipeline',
      stages: [],
    });

    const updated = addStage(pipeline, {
      name: 'Stage 1',
      executor: async () => ({ data: 'test' }),
    });

    if (
      updated.stages.length === 1 &&
      updated.stages[0].id === 'stage-0' &&
      updated.stages[0].name === 'Stage 1'
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
    console.log('Test 4: executePipeline...');
    const pipeline = createPipeline({
      name: 'Test Pipeline',
      stages: [],
    });

    const withStage = addStage(pipeline, {
      name: 'Stage 1',
      executor: async () => ({ result: 'success' }),
    });

    const result = await executePipeline(withStage, { input: 'test' });

    if (
      result.pipelineId === withStage.id &&
      result.status === 'completed' &&
      result.stages.length === 1 &&
      result.stages[0].status === 'completed' &&
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
    console.log('Test 5: getPipelineStatus...');
    const result = await getPipelineStatus('non-existent-pipeline');
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
    console.log('Test 6: cancelPipeline...');
    const result = await cancelPipeline('pipeline-id');
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
