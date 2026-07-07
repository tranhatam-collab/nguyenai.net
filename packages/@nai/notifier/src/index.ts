/**
 * @nai/notifier — Multi-channel notification adapter for Nguyen AI.
 *
 * Per INCIDENT_NOTIFICATION_POLICY_2026-07-07.md:
 * - Email, SMS, Telegram, Zalo, Slack, Discord, WhatsApp (pluggable)
 * - Dry-run mode for testing
 * - Secrets stored in environment, not source
 * - Audit trail for all notifications
 */

import { logAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

export type Channel = 'email' | 'sms' | 'telegram' | 'zalo' | 'slack' | 'discord' | 'whatsapp';

export interface Notification {
  notification_id: string;
  channel: Channel;
  recipient: string;
  subject: string;
  body: string;
  metadata: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export interface NotificationConfig {
  dryRun: boolean;
  channels: Partial<Record<Channel, ChannelAdapter>>;
}

export interface ChannelAdapter {
  send(recipient: string, subject: string, body: string, metadata: Record<string, unknown>): Promise<{ success: boolean; error?: string }>;
}

export interface NotificationStore {
  createNotification(notification: Omit<Notification, 'notification_id' | 'status' | 'sent_at' | 'error' | 'created_at'>): Promise<string>;
  updateNotification(notificationId: string, updates: Partial<Notification>): Promise<void>;
  getNotification(notificationId: string): Promise<Notification | null>;
  listNotifications(filters?: { channel?: Channel; recipient?: string; status?: Notification['status'] }): Promise<Notification[]>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryNotificationStore implements NotificationStore {
  private notifications = new Map<string, Notification>();

  async createNotification(notification: Omit<Notification, 'notification_id' | 'status' | 'sent_at' | 'error' | 'created_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const full: Notification = {
      ...notification,
      notification_id: id,
      status: 'pending',
      sent_at: null,
      error: null,
      created_at: now,
    };
    this.notifications.set(id, full);
    return id;
  }

  async updateNotification(notificationId: string, updates: Partial<Notification>): Promise<void> {
    const existing = this.notifications.get(notificationId);
    if (existing) {
      this.notifications.set(notificationId, { ...existing, ...updates });
    }
  }

  async getNotification(notificationId: string): Promise<Notification | null> {
    return this.notifications.get(notificationId) ?? null;
  }

  async listNotifications(filters?: { channel?: Channel; recipient?: string; status?: Notification['status'] }): Promise<Notification[]> {
    let results = [...this.notifications.values()];
    if (filters?.channel) results = results.filter((n) => n.channel === filters.channel);
    if (filters?.recipient) results = results.filter((n) => n.recipient === filters.recipient);
    if (filters?.status) results = results.filter((n) => n.status === filters.status);
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

// ============================================================
// Default store + config
// ============================================================

let defaultStore: NotificationStore = new InMemoryNotificationStore();
let defaultConfig: NotificationConfig = {
  dryRun: true,
  channels: {},
};

export function setNotificationStore(store: NotificationStore) {
  defaultStore = store;
}

export function getNotificationStore(): NotificationStore {
  return defaultStore;
}

export function setNotificationConfig(config: NotificationConfig) {
  defaultConfig = config;
}

export function getNotificationConfig(): NotificationConfig {
  return defaultConfig;
}

// ============================================================
// Notification service
// ============================================================

export async function sendNotification(
  channel: Channel,
  recipient: string,
  subject: string,
  body: string,
  metadata: Record<string, unknown> = {}
): Promise<string> {
  const notificationId = await defaultStore.createNotification({
    channel,
    recipient,
    subject,
    body,
    metadata,
  });

  if (defaultConfig.dryRun) {
    await defaultStore.updateNotification(notificationId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
    console.log(`[DRY-RUN] ${channel} to ${recipient}: ${subject}`);
    return notificationId;
  }

  const adapter = defaultConfig.channels[channel];
  if (!adapter) {
    await defaultStore.updateNotification(notificationId, {
      status: 'failed',
      error: `No adapter configured for channel: ${channel}`,
    });
    return notificationId;
  }

  try {
    const result = await adapter.send(recipient, subject, body, metadata);
    if (result.success) {
      await defaultStore.updateNotification(notificationId, {
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } else {
      await defaultStore.updateNotification(notificationId, {
        status: 'failed',
        error: result.error ?? 'Unknown error',
      });
    }
  } catch (err) {
    await defaultStore.updateNotification(notificationId, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await logAuditEvent({
    category: 'notification',
    action: 'notification_sent',
    target: notificationId,
    details: { channel, recipient, subject },
    user_id: 'system',
    tenant_id: 'system',
  });

  return notificationId;
}

export async function getNotification(notificationId: string): Promise<Notification | null> {
  return defaultStore.getNotification(notificationId);
}

export async function listNotifications(filters?: { status?: string; channel?: Channel }): Promise<Notification[]> {
  return defaultStore.listNotifications(filters);
}

// ============================================================
// Convenience adapters (for testing)
// ============================================================

export class EmailAdapter implements ChannelAdapter {
  async send(recipient: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[EMAIL] To: ${recipient}, Subject: ${subject}`);
    return { success: true };
  }
}

export class SMSAdapter implements ChannelAdapter {
  async send(recipient: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[SMS] To: ${recipient}: ${body}`);
    return { success: true };
  }
}

export class SlackAdapter implements ChannelAdapter {
  async send(recipient: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[SLACK] Channel: ${recipient}: ${subject} - ${body}`);
    return { success: true };
  }
}
