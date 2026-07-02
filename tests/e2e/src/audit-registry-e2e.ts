/**
 * Audit Event Registry E2E — verify all 39 event types insert + query.
 *
 * Per AUDIT_EVENT_REGISTRY.md (registry version 2026-07-02.1):
 * - All 39 event types must insert successfully
 * - Unknown event type must be rejected (TS compile-time)
 * - Registry version must be recorded per event
 * - Append-only: no update/delete methods
 */

import {
  InMemoryAuditStore,
  AUDIT_EVENT_TYPES,
  AUDIT_REGISTRY_VERSION,
  type AuditEventType,
} from '@nai/audit';

const EVENT_TYPES: readonly AuditEventType[] = AUDIT_EVENT_TYPES;

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function main(): Promise<void> {
  console.log('=== Audit Event Registry E2E: 39 event types ===\n');

  const store = new InMemoryAuditStore();

  // Insert all 39 event types
  let inserted = 0;
  for (const eventType of EVENT_TYPES) {
    const id = await store.log({
      user_id: 'test-user-001',
      tenant_id: 'test-tenant-001',
      session_id: 'test-session-001',
      event_type: eventType,
      actor_ip: '127.0.0.1',
      user_agent: 'test-agent',
      target: 'test-target',
      result: 'success',
      metadata: { test: true },
    });
    assert(!!id, `${eventType} should return event_id`);
    inserted++;
  }
  assert(inserted === 39, `should insert 39 events, got ${inserted}`);
  console.log(`✓ Inserted ${inserted}/39 event types`);

  // Verify count via store.query
  const allEvents = await store.query({});
  assert(allEvents.length === 39, `total events should be 39, got ${allEvents.length}`);
  console.log(`✓ Total count: ${allEvents.length}`);

  // Verify registry version on each event
  for (const evt of allEvents) {
    assert(
      evt.registry_version === AUDIT_REGISTRY_VERSION,
      `${evt.event_type} should have registry_version=${AUDIT_REGISTRY_VERSION}, got ${evt.registry_version}`,
    );
  }
  console.log(`✓ All events have registry_version=${AUDIT_REGISTRY_VERSION}`);

  // Verify each event type is queryable
  for (const eventType of EVENT_TYPES) {
    const events = await store.query({ event_type: eventType });
    assert(events.length === 1, `${eventType} should have exactly 1 event, got ${events.length}`);
  }
  console.log('✓ All 39 event types individually queryable');

  // Verify append-only (no update/delete)
  assert(typeof (store as unknown as { update?: unknown }).update === 'undefined', 'no update method');
  assert(typeof (store as unknown as { delete?: unknown }).delete === 'undefined', 'no delete method');
  console.log('✓ Append-only: no update/delete methods');

  // Verify count is 39 (not 19 from old registry)
  assert(EVENT_TYPES.length === 39, `AUDIT_EVENT_TYPES should have 39 entries, got ${EVENT_TYPES.length}`);
  console.log(`✓ AUDIT_EVENT_TYPES export has ${EVENT_TYPES.length} entries`);

  console.log('\n=== ALL AUDIT REGISTRY TESTS PASSED ===');
  console.log(`Registry version: ${AUDIT_REGISTRY_VERSION}`);
  console.log(`Event types: ${EVENT_TYPES.length}`);
}

main().catch((err) => {
  console.error('AUDIT REGISTRY E2E FAILED:', err);
  process.exit(1);
});
