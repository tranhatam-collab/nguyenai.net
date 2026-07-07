/**
 * @nai/notifier — unit tests.
 */

import {
  InMemoryNotificationStore,
  setNotificationStore,
  setNotificationConfig,
  sendNotification,
  EmailAdapter,
  SMSAdapter,
  SlackAdapter,
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

async function testSendNotificationDryRun() {
  console.log('Test: send notification (dry-run)');
  const store = new InMemoryNotificationStore();
  setNotificationStore(store);
  setNotificationConfig({ dryRun: true, channels: {} });

  const id = await sendNotification('email', 'test@example.com', 'Test subject', 'Test body');
  assert(id !== undefined, 'notification created');
  assert(id.length === 36, 'notification ID is UUID');

  const notification = await store.getNotification(id);
  assert(notification !== null, 'notification retrieved');
  assert(notification?.status === 'sent', 'status is sent (dry-run)');
  assert(notification?.channel === 'email', 'channel is email');
}

async function testSendNotificationWithAdapter() {
  console.log('Test: send notification with adapter');
  const store = new InMemoryNotificationStore();
  setNotificationStore(store);
  setNotificationConfig({
    dryRun: false,
    channels: {
      email: new EmailAdapter(),
      sms: new SMSAdapter(),
      slack: new SlackAdapter(),
    },
  });

  const id = await sendNotification('email', 'test@example.com', 'Test', 'Body');
  const notification = await store.getNotification(id);
  assert(notification?.status === 'sent', 'status is sent (with adapter)');
}

async function testSendNotificationFailed() {
  console.log('Test: send notification failed (no adapter)');
  const store = new InMemoryNotificationStore();
  setNotificationStore(store);
  setNotificationConfig({ dryRun: false, channels: {} });

  const id = await sendNotification('sms', '+1234567890', 'Test', 'Body');
  const notification = await store.getNotification(id);
  assert(notification?.status === 'failed', 'status is failed');
  assert(notification?.error !== null, 'error is set');
}

async function testNotificationList() {
  console.log('Test: list notifications');
  const store = new InMemoryNotificationStore();
  setNotificationStore(store);
  setNotificationConfig({ dryRun: true, channels: {} });

  await sendNotification('email', 'a@example.com', 'Test', 'Body');
  await sendNotification('sms', '+1234567890', 'Test', 'Body');
  await sendNotification('email', 'b@example.com', 'Test', 'Body');

  const all = await store.listNotifications();
  assert(all.length === 3, '3 notifications total');

  const email = await store.listNotifications({ channel: 'email' });
  assert(email.length === 2, '2 email notifications');
}

async function main() {
  console.log('=== @nai/notifier unit tests ===\n');
  await testSendNotificationDryRun();
  await testSendNotificationWithAdapter();
  await testSendNotificationFailed();
  await testNotificationList();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
