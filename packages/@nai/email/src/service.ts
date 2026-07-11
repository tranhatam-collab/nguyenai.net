/**
 * @nai/email — Email service facade
 *
 * Wraps email client + templates into a unified send API.
 */

import type { EmailClient, EmailAddress, EmailTemplateId, TemplateContext, EmailMessage, EmailSendResult } from './types';
import { MailIaiOneClient, ResendClient, MockEmailClient } from './client';
import { renderTemplate } from './templates';

export type EmailProvider = 'mail_iai_one' | 'resend';

export interface EmailServiceOptions {
  apiKey?: string;
  from: EmailAddress;
  replyTo?: EmailAddress;
  client?: EmailClient;
  /** If true, use MockEmailClient (no real sends) */
  mock?: boolean;
  /** mail.iai.one API URL override (for testing) */
  mailApiUrl?: string;
  /**
   * Which real provider to use when apiKey is set.
   * Default: mail_iai_one. Use `resend` only as temporary fallback.
   */
  provider?: EmailProvider;
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
    } else if (opts.provider === 'resend') {
      this.client = new ResendClient({
        apiKey: opts.apiKey,
        defaultFrom: opts.from,
        defaultReplyTo: opts.replyTo,
      });
    } else {
      this.client = new MailIaiOneClient({
        apiKey: opts.apiKey,
        defaultFrom: opts.from,
        defaultReplyTo: opts.replyTo,
        apiUrl: opts.mailApiUrl,
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
 * Primary: MAIL_IAI_ONE_API_KEY → mail.iai.one
 * Temporary fallback: RESEND_API_KEY → ResendClient (only when MAIL key absent)
 * Dev: omit both → MockEmailClient
 */
export function createEmailService(env: {
  MAIL_IAI_ONE_API_KEY?: string;
  RESEND_API_KEY?: string;
  ENVIRONMENT?: string;
}): EmailService {
  const from: EmailAddress = {
    email: 'hello@nguyenai.net',
    name: 'Nguyen AI',
  };
  const replyTo: EmailAddress = {
    email: 'support@nguyenai.net',
    name: 'Nguyen AI Support',
  };

  const mailKey = env.MAIL_IAI_ONE_API_KEY;
  const resendKey = env.RESEND_API_KEY;
  const useMail = Boolean(mailKey);
  const apiKey = mailKey ?? resendKey;
  const provider: EmailProvider = useMail ? 'mail_iai_one' : 'resend';

  return new EmailService({
    apiKey,
    from,
    replyTo,
    provider,
    mock: !apiKey || env.ENVIRONMENT === 'development',
  });
}
