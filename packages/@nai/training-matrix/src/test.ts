/**
 * @nai/training-matrix — unit tests.
 */

import {
  InMemoryTrainingStore,
  setTrainingStore,
  requestTraining,
  approveTraining,
  startTraining,
  completeTraining,
  failTraining,
  cancelTraining,
  listPendingTrainings,
} from './index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

async function testRequestTraining() {
  console.log('Test: request training');
  const store = new InMemoryTrainingStore();
  setTrainingStore(store);

  const id = await requestTraining(
    'fine_tune',
    'gpt-4',
    'nguyen-gpt-4',
    'dataset-1',
    { learning_rate: 0.001, epochs: 10 },
    'user-1'
  );

  assert(id !== undefined, 'training ID created');
  assert(id.length === 36, 'training ID is UUID');

  const training = await store.getTraining(id);
  assert(training !== null, 'training retrieved');
  assert(training?.status === 'pending', 'status is pending');
  assert(training?.type === 'fine_tune', 'type is fine_tune');
}

async function testTrainingWorkflow() {
  console.log('Test: training workflow');
  const store = new InMemoryTrainingStore();
  setTrainingStore(store);

  const id = await requestTraining('pretrain', 'gpt-3', 'nguyen-gpt-3', 'dataset-1', {}, 'user-1');
  await approveTraining(id, 'admin-1');
  await startTraining(id);

  const training = await store.getTraining(id);
  assert(training?.status === 'running', 'status is running');
  assert(training?.approved_by === 'admin-1', 'approved by admin-1');
  assert(training?.started_at !== null, 'started_at set');

  await completeTraining(id, { loss: 0.1, accuracy: 0.95 });
  const completed = await store.getTraining(id);
  assert(completed?.status === 'completed', 'status is completed');
  assert(completed?.metrics?.accuracy === 0.95, 'metrics set');
}

async function testFailTraining() {
  console.log('Test: fail training');
  const store = new InMemoryTrainingStore();
  setTrainingStore(store);

  const id = await requestTraining('rlhf', 'claude-3', 'nguyen-claude-3', 'dataset-1', {}, 'user-1');
  await startTraining(id);
  await failTraining(id, 'Out of memory');

  const training = await store.getTraining(id);
  assert(training?.status === 'failed', 'status is failed');
  assert(training?.error === 'Out of memory', 'error set');
}

async function testCancelTraining() {
  console.log('Test: cancel training');
  const store = new InMemoryTrainingStore();
  setTrainingStore(store);

  const id = await requestTraining('distillation', 'gpt-4', 'nguyen-gpt-4-small', 'dataset-1', {}, 'user-1');
  await cancelTraining(id);

  const training = await store.getTraining(id);
  assert(training?.status === 'cancelled', 'status is cancelled');
}

async function testListPendingTrainings() {
  console.log('Test: list pending trainings');
  const store = new InMemoryTrainingStore();
  setTrainingStore(store);

  await requestTraining('fine_tune', 'gpt-4', 'nguyen-gpt-4', 'dataset-1', {}, 'user-1');
  await requestTraining('pretrain', 'gpt-3', 'nguyen-gpt-3', 'dataset-1', {}, 'user-1');
  await requestTraining('rlhf', 'claude-3', 'nguyen-claude-3', 'dataset-1', {}, 'user-1');

  const pending = await listPendingTrainings();
  assert(pending.length === 3, '3 pending trainings');
}

async function main() {
  console.log('=== @nai/training-matrix unit tests ===\n');
  await testRequestTraining();
  await testTrainingWorkflow();
  await testFailTraining();
  await testCancelTraining();
  await testListPendingTrainings();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
