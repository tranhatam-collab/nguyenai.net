/**
 * @nai/audit — unit tests.
 * Run via `pnpm --filter @nai/audit test`.
 */

import {
  InMemoryAuditStore,
  logAuditEvent,
  queryAuditLog,
  countAuditEvents,
  logLoginSuccess,
  logLoginFailure,
  logLogout,
  logAccessDenied,
  logSessionRevoked,
  setAuditStore,
  type AuditEventType,
} from './index.ts';

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

async function testBasicLog() {
  console.log('Test: basic log + query');
  const store = new InMemoryAuditStore();
  setAuditStore(store);

  const id1 = await logAuditEvent({
    user_id: 'user-1',
    session_id: 'session-1',
    event_type: 'login_success',
    actor_ip: '127.0.0.1',
    user_agent: 'test',
    target: null,
    result: 'success',
    metadata: { method: 'password' },
  });

  assert(typeof id1 === 'string' && id1.length > 0, 'log returns event_id');

  const events = await queryAuditLog({ user_id: 'user-1' });
  assert(events.length === 1, 'query returns 1 event');
  assert(events[0].event_type === 'login_success', 'event type correct');
  assert(events[0].metadata?.method === 'password', 'metadata preserved');
}

async function testAppendOnly() {
  console.log('Test: append-only enforcement (in-memory)');
  const store = new InMemoryAuditStore();
  setAuditStore(store);

  await logLoginSuccess('user-1', 'session-1', '127.0.0.1', 'test');
  await logLoginFailure('bad@example.com', '127.0.0.1', 'test');
  await logLogout('user-1', 'session-1');

  const raw = store.getRawEvents();
  assert(raw.length === 3, '3 events stored');
  // Verify events are immutable — no method to modify them
  assert(typeof (store as unknown as { update?: unknown }).update === 'undefined', 'no update method exposed');
  assert(typeof (store as unknown as { delete?: unknown }).delete === 'undefined', 'no delete method exposed');
}

async function testQueryFilters() {
  console.log('Test: query filters');
  const store = new InMemoryAuditStore();
  setAuditStore(store);

  await logLoginSuccess('user-1', 's1', '127.0.0.1', 'test');
  await logLoginFailure('user-1@example.com', '127.0.0.1', 'test');
  await logLoginSuccess('user-2', 's2', '127.0.0.1', 'test');
  await logAccessDenied('user-1', 's1', '/admin', 'missing role');
  await logSessionRevoked('user-2', 's2', 'admin-1');

  const allUser1 = await queryAuditLog({ user_id: 'user-1' });
  assert(allUser1.length === 2, 'user-1 has 2 events (login + access_denied)');

  const loginSuccesses = await queryAuditLog({ event_type: 'login_success' });
  assert(loginSuccesses.length === 2, '2 login_success events');

  const denied = await queryAuditLog({ result: 'denied' });
  assert(denied.length === 1, '1 denied event');
  assert(denied[0].event_type === 'access_denied', 'denied event is access_denied');

  const failures = await queryAuditLog({ result: 'failure' });
  assert(failures.length === 1, '1 failure event');
  assert(failures[0].event_type === 'login_failure', 'failure event is login_failure');
}

async function testCount() {
  console.log('Test: count');
  const store = new InMemoryAuditStore();
  setAuditStore(store);

  await logLoginSuccess('user-1', 's1', null, null);
  await logLoginSuccess('user-1', 's2', null, null);
  await logLoginSuccess('user-2', 's3', null, null);

  const countUser1 = await countAuditEvents({ user_id: 'user-1' });
  assert(countUser1 === 2, 'user-1 has 2 events');

  const countAll = await countAuditEvents({});
  assert(countAll === 3, 'total 3 events');
}

async function testPagination() {
  console.log('Test: pagination');
  const store = new InMemoryAuditStore();
  setAuditStore(store);

  for (let i = 0; i < 10; i++) {
    await logLoginSuccess(`user-${i}`, `s-${i}`, null, null);
  }

  const page1 = await queryAuditLog({ limit: 3, offset: 0 });
  const page2 = await queryAuditLog({ limit: 3, offset: 3 });
  assert(page1.length === 3, 'page 1 has 3 events');
  assert(page2.length === 3, 'page 2 has 3 events');
  // Sorted descending by timestamp, so page1 and page2 should have different events
  assert(page1[0].event_id !== page2[0].event_id, 'pages have different events');
}

async function main() {
  console.log('=== @nai/audit unit tests ===\n');
  await testBasicLog();
  await testAppendOnly();
  await testQueryFilters();
  await testCount();
  await testPagination();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
