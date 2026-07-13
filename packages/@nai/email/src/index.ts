/**
 * @nai/email — Email service facade
 *
 * Provides a unified API for sending transactional emails via Resend.
 * Maps audit events to email templates automatically.
 *
 * Usage:
 *   import { EmailService } from '@nai/email';
 *   const email = new EmailService({ apiKey: env.RESEND_API_KEY, from: { email: 'hello@nguyenai.net', name: 'Nguyen AI' } });
 *   await email.sendTemplate('welcome', { locale: 'vi', user_email: 'user@example.com', user_name: 'Nguyen' });
 */

export type { EmailClient, EmailMessage, EmailSendResult, EmailAddress, EmailTemplate, EmailTemplateId, TemplateContext } from './types';
export { MailGatewayClient, ResendClient, MockEmailClient } from './client';
export { TEMPLATES, getTemplate, listTemplates, renderTemplate } from './templates';
export { EmailService, createEmailService } from './service';
export type { EmailProvider } from './service';

// Audit event → email template mapping
export const AUDIT_EVENT_TO_TEMPLATE: Record<string, import('./types').EmailTemplateId> = {
  login_success: 'login_alert',
  passkey_registered: 'passkey_registered',
  mfa_enrolled: 'mfa_enrolled',
  api_key_created: 'api_key_created',
  role_changed: 'role_changed',
  org_member_added: 'org_member_added',
  approval_requested: 'approval_requested',
  approval_granted: 'approval_granted',
  approval_denied: 'approval_denied',
  entitlement_granted: 'entitlement_granted',
  entitlement_revoked: 'entitlement_revoked',
  entitlement_expired: 'entitlement_expired',
  payment_received: 'payment_received',
  proof_submitted: 'proof_submitted',
  certificate_issued: 'certificate_issued',
  certificate_revoked: 'certificate_revoked',
  account_deletion_requested: 'account_deletion_requested',
  investor_room_accessed: 'investor_access_granted',
  // Scholarship (Section XXVII)
  scholarship_application_submitted: 'scholarship_application_submitted',
  sponsorship_committed: 'scholarship_cosponsorship',
  scholarship_review_assigned: 'scholarship_review_request',
  scholarship_awarded: 'scholarship_decision',
  scholarship_declined: 'scholarship_decision',
  scholarship_progress_reported: 'scholarship_progress',
};
