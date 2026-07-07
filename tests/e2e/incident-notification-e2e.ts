/**
 * E2E Test: Incident and notification workflow.
 *
 * Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md:
 * - Create incident
 * - Diagnose, contain, resolve, close
 * - Send notifications
 * - Verify audit trail
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
  getIncident,
  listIncidents,
} from '@nai/incident';

import {
  InMemoryNotificationStore,
  setNotificationStore,
  sendNotification,
  getNotification,
  listNotifications,
} from '@nai/notifier';

import {
  InMemoryAuditStore,
  setAuditStore,
  logAuditEvent,
  queryAuditLog,
} from '@nai/audit';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    steps.push(`  ✓ ${msg}`);
  } else {
    failed++;
    steps.push(`  ✗ ${msg}`);
    console.error(`  ✗ ${msg}`);
  }
}

async function testCreateIncidentAndSendNotification() {
  console.log('Test: create incident and send notification');
  const incidentStore = new InMemoryIncidentStore();
  const notificationStore = new InMemoryNotificationStore();
  const auditStore = new InMemoryAuditStore();
  setIncidentStore(incidentStore);
  setNotificationStore(notificationStore);
  setAuditStore(auditStore);

  const incidentId = await createIncident(
    'S3',
    'API downtime',
    'api',
    'API is not responding',
    0,
    'test-user'
  );

  assert(incidentId !== undefined, 'incident created');
  const incident = await getIncident(incidentId);
  assert(incident?.status === 'detected', 'incident status is detected');
  assert(incident?.severity === 'S3', 'incident severity is S3');

  // Send notification
  const notificationId = await sendNotification(
    'test-user',
    'email',
    'admin@nguyenai.net',
    `Incident ${incidentId} created`,
    'API is down, please investigate'
  );

  assert(notificationId !== undefined, 'notification sent');
  const notification = await getNotification(notificationId);
  assert(notification?.status === 'sent', 'notification status is sent');

  // Verify audit event
  const auditEvents = await queryAuditLog({ action: 'incident_detected' });
  assert(auditEvents.length > 0, 'audit event logged');
}

async function testDiagnoseAndContainIncident() {
  console.log('Test: diagnose and contain incident');
  const incidentStore = new InMemoryIncidentStore();
  setIncidentStore(incidentStore);

  const incidentId = await createIncident('S2', 'Database failure', 'db', 'DB connection failed', 0, 'test-user');
  await diagnoseIncident(incidentId, 'Connection pool exhausted', 'test-user');
  await containIncident(incidentId, 'test-user');

  const incident = await getIncident(incidentId);
  assert(incident?.status === 'containing', 'incident status is containing');
  assert(incident?.root_cause === 'Connection pool exhausted', 'diagnosis recorded');
}

async function testResolveAndCloseIncident() {
  console.log('Test: resolve and close incident');
  const incidentStore = new InMemoryIncidentStore();
  setIncidentStore(incidentStore);

  const incidentId = await createIncident('S1', 'Critical error', 'api', 'System crash', 0, 'test-user');
  await diagnoseIncident(incidentId, 'Memory leak', 'test-user');
  await containIncident(incidentId, 'Killed process', 'test-user');
  await resolveIncident(incidentId, 'Fixed memory leak', 'test-user');
  await closeIncident(incidentId, 'Verified fix', 'test-user');

  const incident = await getIncident(incidentId);
  assert(incident?.status === 'closed', 'incident status is closed');
  assert(incident?.resolution === 'Fixed memory leak', 'resolution recorded');
}

async function testSendNotificationViaMultipleChannels() {
  console.log('Test: send notification via multiple channels');
  const notificationStore = new InMemoryNotificationStore();
  setNotificationStore(notificationStore);

  const emailId = await sendNotification('test-user', 'email', 'admin@nguyenai.net', 'Test', 'Test message');
  const smsId = await sendNotification('test-user', 'sms', '+1234567890', 'Test', 'Test message');
  const slackId = await sendNotification('test-user', 'slack', '#alerts', 'Test', 'Test message');

  assert(emailId !== undefined, 'email notification sent');
  assert(smsId !== undefined, 'SMS notification sent');
  assert(slackId !== undefined, 'Slack notification sent');

  const notifications = await listNotifications();
  assert(notifications.length === 3, '3 notifications recorded');
}

async function main() {
  console.log('=== Incident and notification E2E ===\n');
  await testCreateIncidentAndSendNotification();
  await testDiagnoseAndContainIncident();
  await testResolveAndCloseIncident();
  await testSendNotificationViaMultipleChannels();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
