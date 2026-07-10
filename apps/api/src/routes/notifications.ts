/**
 * @nai/api — Notification routes.
 *
 * Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md:
 * - Send notifications via multiple channels
 * - List notifications with filters
 * - Get notification details
 * - Dry-run mode for testing
 */

import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  sendNotification,
  getNotificationStore,
  setNotificationConfig,
  EmailAdapter,
  SMSAdapter,
  SlackAdapter,
  type Channel,
} from '@nai/notifier';
import { requireAdminSession } from '../session-auth';

const notificationRoutes = new Hono();

// ============================================================
// Helper: require admin role
// ============================================================

function requireAdmin(c: Context) {
  const result = requireAdminSession(c);
  if (result instanceof Response) return result;
  return null;
}

// ============================================================
// Initialize notification config (called on first request)
// ============================================================

let configInitialized = false;
function initNotificationConfig(env: any) {
  if (configInitialized) return;

  // In production, load real adapter configs from env secrets
  // For now, use dry-run mode with mock adapters
  setNotificationConfig({
    dryRun: env.ENVIRONMENT === 'development',
    channels: {
      email: new EmailAdapter(),
      sms: new SMSAdapter(),
      slack: new SlackAdapter(),
    },
  });

  configInitialized = true;
}

// ============================================================
// POST /v1/notifications — send notification
// ============================================================

notificationRoutes.post('/v1/notifications', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  initNotificationConfig(c.env);

  const body = await c.req.json();
  const { channel, recipient, subject, body: message, metadata } = body;

  if (!channel || !recipient || !subject || !message) {
    return c.json({ error: 'Missing required fields: channel, recipient, subject, body' }, 400);
  }

  const validChannels: Channel[] = ['email', 'sms', 'telegram', 'zalo', 'slack', 'discord', 'whatsapp'];
  if (!validChannels.includes(channel)) {
    return c.json({ error: 'Invalid channel. Must be one of: email, sms, telegram, zalo, slack, discord, whatsapp' }, 400);
  }

  const notificationId = await sendNotification(
    channel,
    recipient,
    subject,
    message,
    metadata ?? {}
  );

  return c.json({ notification_id: notificationId }, 201);
});

// ============================================================
// GET /v1/notifications — list notifications
// ============================================================

notificationRoutes.get('/v1/notifications', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const { channel, recipient, status } = c.req.query();
  const store = getNotificationStore();

  const notifications = await store.listNotifications({
    channel: channel as Channel,
    recipient,
    status: status as any,
  });

  return c.json({ notifications });
});

// ============================================================
// GET /v1/notifications/:id — get notification details
// ============================================================

notificationRoutes.get('/v1/notifications/:id', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const store = getNotificationStore();

  const notification = await store.getNotification(id);
  if (!notification) {
    return c.json({ error: 'Notification not found' }, 404);
  }

  return c.json({ notification });
});

export default notificationRoutes;
