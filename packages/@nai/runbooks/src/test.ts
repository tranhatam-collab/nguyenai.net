/**
 * @nai/runbooks — unit tests.
 */

import {
  InMemoryRunbookStore,
  setRunbookStore,
  seedDefaultRunbooks,
  findRunbookForIncident,
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

async function testSeedDefaultRunbooks() {
  console.log('Test: seed default runbooks');
  const store = new InMemoryRunbookStore();
  setRunbookStore(store);

  await seedDefaultRunbooks();

  const runbooks = await store.listRunbooks();
  assert(runbooks.length === 4, '4 default runbooks seeded');
}

async function testFindRunbookForIncident() {
  console.log('Test: find runbook for incident');
  const store = new InMemoryRunbookStore();
  setRunbookStore(store);

  await seedDefaultRunbooks();

  const apiRunbook = await findRunbookForIncident('api', 'performance');
  assert(apiRunbook !== null, 'API performance runbook found');
  assert(apiRunbook?.name === 'API High Latency', 'runbook name matches');

  const dbRunbook = await findRunbookForIncident('database', 'resource');
  assert(dbRunbook !== null, 'Database resource runbook found');
  assert(dbRunbook?.name === 'Database Connection Pool Exhaustion', 'runbook name matches');

  const notFound = await findRunbookForIncident('unknown', 'unknown');
  assert(notFound === null, 'unknown runbook not found');
}

async function testRunbookStructure() {
  console.log('Test: runbook structure');
  const store = new InMemoryRunbookStore();
  setRunbookStore(store);

  await seedDefaultRunbooks();

  const runbooks = await store.listRunbooks();
  const apiRunbook = runbooks.find((r) => r.name === 'API High Latency');

  assert(apiRunbook !== undefined, 'API runbook exists');
  assert((apiRunbook?.diagnostic_steps.length ?? 0) > 0, 'has diagnostic steps');
  assert((apiRunbook?.remediation_steps.length ?? 0) > 0, 'has remediation steps');
  assert(apiRunbook?.approval_required === true, 'approval required');
  assert(apiRunbook?.risk_level === 'medium', 'risk level is medium');
}

async function testFilterRunbooks() {
  console.log('Test: filter runbooks');
  const store = new InMemoryRunbookStore();
  setRunbookStore(store);

  await seedDefaultRunbooks();

  const apiRunbooks = await store.listRunbooks({ component: 'api' });
  assert(apiRunbooks.length === 1, '1 API runbook');

  const authRunbooks = await store.listRunbooks({ component: 'auth' });
  assert(authRunbooks.length === 1, '1 auth runbook');

  const performanceRunbooks = await store.listRunbooks({ incident_type: 'performance' });
  assert(performanceRunbooks.length === 1, '1 performance runbook');
}

async function main() {
  console.log('=== @nai/runbooks unit tests ===\n');
  await testSeedDefaultRunbooks();
  await testFindRunbookForIncident();
  await testRunbookStructure();
  await testFilterRunbooks();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
