/**
 * @nai/email — Email service facade
 *
 * Wraps email client + templates into a unified send API.
 */

import type { EmailClient, EmailAddress, EmailTemplateId, TemplateContext, EmailMessage, EmailSendResult } from './types';
import { ResendClient, MockEmailClient } from './client';
import { renderTemplate } from './templates';

export interface EmailServiceOptions {
  apiKey?: string;
  from: EmailAddress;
  replyTo?: EmailAddress;
  client?: EmailClient;
  /** If true, use MockEmailClient (no real sends) */
  mock?: boolean;
}

export class EmailService {
  private client: EmailClient;
  private from: EmailAddress;
  private replyTo: EmailAddress | undefined;

  constructor(opts: EmailServiceOptions) {
    this.from = opts.from;
    this.replyTo = opts.replyTo;

    if (opts.client) {
      this.client = opts.client;
    } else if (opts.mock || !opts.apiKey) {
      this.client = new MockEmailClient();
    } else {
      this.client = new ResendClient({
        apiKey: opts.apiKey,
        defaultFrom: opts.from,
        defaultReplyTo: opts.replyTo,
      });
    }
  }

  /**
   * Send an email using a template ID + context.
   * The template renders subject, html, text from the context.
   */
  async sendTemplate(
    templateId: EmailTemplateId,
    ctx: TemplateContext,
    opts?: { to?: string | EmailAddress | (string | EmailAddress)[] },
  ): Promise<EmailSendResult> {
    const rendered = renderTemplate(templateId, ctx);
    const to = opts?.to ?? ctx.user_email;

    const message: EmailMessage = {
      to,
      from: this.from,
      reply_to: this.replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template_id: templateId,
      template_data: ctx,
      tags: [templateId],
    };

    return this.client.send(message);
  }

  /**
   * Send a raw email (no template).
   */
  async send(message: Omit<EmailMessage, 'from'> & { from?: EmailAddress }): Promise<EmailSendResult> {
    return this.client.send({
      ...message,
      from: message.from ?? this.from,
    });
  }

  /**
   * Get the underlying client (for testing with MockEmailClient).
   */
  getClient(): EmailClient {
    return this.client;
  }
}

/**
 * Factory: create EmailService from environment (Workers or Node.js).
 *
 * In Workers: pass env.RESEND_API_KEY
 * In dev/test: omit apiKey → MockEmailClient is used.
 */
export function createEmailService(env: { RESEND_API_KEY?: string; ENVIRONMENT?: string }): EmailService {
  const from: EmailAddress = {
    email: 'hello@nguyenai.net',
    name: 'Nguyen AI',
  };
  const replyTo: EmailAddress = {
    email: 'support@nguyenai.net',
    name: 'Nguyen AI Support',
  };

  return new EmailService({
    apiKey: env.RESEND_API_KEY,
    from,
    replyTo,
    mock: !env.RESEND_API_KEY || env.ENVIRONMENT === 'development',
  });
}
