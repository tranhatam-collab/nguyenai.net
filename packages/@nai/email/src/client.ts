/**
 * @nai/email — Resend API client (fetch-based, Workers-compatible)
 *
 * Uses Resend REST API directly via fetch — no Node.js SDK dependency.
 * Works in Cloudflare Workers, Node.js, Deno, Bun.
 *
 * API docs: https://resend.com/api-reference/emails/send-email
 */

import type { EmailClient, EmailMessage, EmailSendResult, EmailAddress } from './types';

const RESEND_API_URL = 'https://api.resend.com/emails';

export interface ResendClientOptions {
  apiKey: string;
  /** Default from address if message doesn't specify */
  defaultFrom?: EmailAddress;
  /** Default reply-to address */
  defaultReplyTo?: EmailAddress;
  /** API URL override (for testing) */
  apiUrl?: string;
}

export class ResendClient implements EmailClient {
  private apiKey: string;
  private defaultFrom: EmailAddress | undefined;
  private defaultReplyTo: EmailAddress | undefined;
  private apiUrl: string;

  constructor(opts: ResendClientOptions) {
    if (!opts.apiKey) throw new Error('ResendClient: apiKey is required');
    this.apiKey = opts.apiKey;
    this.defaultFrom = opts.defaultFrom;
    this.defaultReplyTo = opts.defaultReplyTo;
    this.apiUrl = opts.apiUrl ?? RESEND_API_URL;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const from = message.from ?? this.defaultFrom;
    if (!from) throw new Error('ResendClient.send: from address is required');

    const to = normalizeRecipients(message.to);
    if (to.length === 0) throw new Error('ResendClient.send: at least one recipient is required');

    const body: Record<string, unknown> = {
      from: formatAddress(from),
      to: to.map((email: string) => email),
      subject: message.subject,
      html: message.html,
      text: message.text,
    };

    if (message.reply_to ?? this.defaultReplyTo) {
      body.reply_to = formatAddress(message.reply_to ?? this.defaultReplyTo!);
    }
    if (message.headers) {
      body.headers = message.headers;
    }
    if (message.tags?.length) {
      body.tags = message.tags.map((t) => ({ name: t, value: 'true' }));
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      return {
        id: '',
        to,
        status: 'bounced',
        error: `Resend API ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json() as { id?: string };
    return {
      id: data.id ?? '',
      to,
      status: 'sent',
    };
  }
}

/** Mock client for testing — never sends real emails */
export class MockEmailClient implements EmailClient {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<EmailSendResult> {
    this.sent.push(message);
    return {
      id: `mock_${this.sent.length}`,
      to: normalizeRecipients(message.to),
      status: 'sent',
    };
  }

  clear(): void {
    this.sent.length = 0;
  }

  last(): EmailMessage | undefined {
    return this.sent[this.sent.length - 1];
  }

  findByTemplate(templateId: string): EmailMessage[] {
    return this.sent.filter((m) => m.template_id === templateId);
  }
}

function normalizeRecipients(to: string | EmailAddress | (string | EmailAddress)[]): string[] {
  const recipients = Array.isArray(to) ? to : [to];
  return recipients.map((r) => (typeof r === 'string' ? r : r.email));
}

function formatAddress(addr: EmailAddress): string {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}
