/**
 * @nai/email — Type definitions
 *
 * Per ENTITLEMENT_API_RFC.md, PROOF_AND_CERTIFICATION_RFC.md,
 * IDENTITY_AND_TENANCY_RFC.md, AUDIT_EVENT_REGISTRY.md.
 */

export type Locale = 'vi' | 'en';

export type EmailTemplateId =
  | 'welcome'
  | 'email_verification'
  | 'login_alert'
  | 'passkey_registered'
  | 'mfa_enrolled'
  | 'api_key_created'
  | 'role_changed'
  | 'org_member_added'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied'
  | 'entitlement_granted'
  | 'entitlement_revoked'
  | 'entitlement_expired'
  | 'payment_received'
  | 'proof_submitted'
  | 'certificate_issued'
  | 'certificate_revoked'
  | 'account_deletion_requested'
  | 'investor_access_granted'
  // Scholarship (5) — Section XXVII
  | 'scholarship_application_submitted'
  | 'scholarship_cosponsorship'
  | 'scholarship_review_request'
  | 'scholarship_decision'
  | 'scholarship_progress';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: string | EmailAddress | (string | EmailAddress)[];
  from: EmailAddress;
  reply_to?: EmailAddress;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: string[];
  template_id?: EmailTemplateId;
  template_data?: Record<string, unknown>;
}

export interface EmailSendResult {
  id: string;
  to: string[];
  status: 'sent' | 'queued' | 'bounced';
  error?: string;
}

export interface EmailClient {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export interface TemplateContext {
  locale: Locale;
  user_name?: string;
  user_email: string;
  [key: string]: unknown;
}

export interface EmailTemplate {
  id: EmailTemplateId;
  subject: (ctx: TemplateContext) => string;
  html: (ctx: TemplateContext) => string;
  text: (ctx: TemplateContext) => string;
  category: 'identity' | 'authorization' | 'approval' | 'entitlement' | 'billing' | 'academy' | 'investor' | 'security' | 'scholarship';
}
