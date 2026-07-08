/**
 * @nai/incident — unit tests.
 */

import {
  InMemoryIncidentStore,
  setIncidentStore,
  createIncident,
  diagnoseIncident,
  containIncident,
  resolveIncident,
  closeIncident,
  assignIncident,
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

async function testCreateIncident() {
  console.log('Test: create incident');
  const store = new InMemoryIncidentStore();
  setIncidentStore(store);

  const id = await createIncident('S3', 'Test incident', 'Test description', 'test-component', 10, 'system');
  assert(id !== undefined, 'incident created');
  assert(id.length === 36, 'incident ID is UUID');

  const incident = await store.getIncident(id);
  assert(incident !== null, 'incident retrieved');
  assert(incident?.severity === 'S3', 'severity is S3');
  assert(incident?.status === 'detected', 'status is detected');
  assert(incident?.component === 'test-component', 'component matches');
}

async function testIncidentLifecycle() {
  console.log('Test: incident lifecycle');
  const store = new InMemoryIncidentStore();
  setIncidentStore(store);

  const id = await createIncident('S2', 'Lifecycle test', 'Test', 'test', 5, 'system');

  await diagnoseIncident(id, 'Root cause found', 'system');
  const diagnosed = await store.getIncident(id);
  assert(diagnosed?.status === 'diagnosing', 'status is diagnosing');
  assert(diagnosed?.root_cause === 'Root cause found', 'root cause set');

  await containIncident(id, 'system');
  const contained = await store.getIncident(id);
  assert(contained?.status === 'containing', 'status is containing');
  assert(contained?.contained_at !== null, 'contained_at set');

  await resolveIncident(id, 'Fix applied', 'system');
  const resolved = await store.getIncident(id);
  assert(resolved?.status === 'resolved', 'status is resolved');
  assert(resolved?.resolution === 'Fix applied', 'resolution set');

  await closeIncident(id, 'system');
  const closed = await store.getIncident(id);
  assert(closed?.status === 'closed', 'status is closed');
  assert(closed?.closed_at !== null, 'closed_at set');
}

async function testIncidentAssignment() {
  console.log('Test: incident assignment');
  const store = new InMemoryIncidentStore();
  setIncidentStore(store);

  const id = await createIncident('S1', 'Assignment test', 'Test', 'test', 1, 'system');
  await assignIncident(id, 'admin-1');

  const incident = await store.getIncident(id);
  assert(incident?.assigned_to === 'admin-1', 'assigned to admin-1');
}

async function testIncidentEvents() {
  console.log('Test: incident events');
  const store = new InMemoryIncidentStore();
  setIncidentStore(store);

  const id = await createIncident('S4', 'Events test', 'Test', 'test', 20, 'system');
  const events = await store.getEvents(id);
  assert(events.length === 1, '1 event (detected)');

  await diagnoseIncident(id, 'Root cause found', 'system');
  const events2 = await store.getEvents(id);
  assert(events2.length === 2, '2 events (detected + diagnosed)');
}

async function testIncidentList() {
  console.log('Test: list incidents');
  const store = new InMemoryIncidentStore();
  setIncidentStore(store);

  await createIncident('S5', 'Low severity', 'Test', 'comp1', 1, 'system');
  await createIncident('S4', 'Medium severity', 'Test', 'comp1', 5, 'system');
  await createIncident('S3', 'High severity', 'Test', 'comp2', 10, 'system');

  const all = await store.listIncidents();
  assert(all.length === 3, '3 incidents total');

  const s5 = await store.listIncidents({ severity: 'S5' });
  assert(s5.length === 1, '1 S5 incident');

  const comp1 = await store.listIncidents({ component: 'comp1' });
  assert(comp1.length === 2, '2 incidents in comp1');
}

async function main() {
  console.log('=== @nai/incident unit tests ===\n');
  await testCreateIncident();
  await testIncidentLifecycle();
  await testIncidentAssignment();
  await testIncidentEvents();
  await testIncidentList();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
