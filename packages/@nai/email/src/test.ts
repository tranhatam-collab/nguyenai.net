/**
 * @nai/email — Unit tests
 *
 * Verifies:
 * - 20 templates exist + render (VI + EN)
 * - MockEmailClient captures sends
 * - EmailService.sendTemplate renders + sends
 * - Audit event → template mapping covers 18/38 events
 * - HTML contains brand name + footer
 * - Text version contains key info
 */

import { TEMPLATES, renderTemplate, listTemplates, MockEmailClient, EmailService, AUDIT_EVENT_TO_TEMPLATE } from './index';
import type { EmailTemplateId, TemplateContext } from './types';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

const TEMPLATE_IDS = listTemplates();
console.log(`=== @nai/email unit tests ===\n`);
console.log(`Templates: ${TEMPLATE_IDS.length}`);

// Test 1: 25 templates exist (20 core + 5 scholarship)
assert(TEMPLATE_IDS.length === 25, `should have 25 templates, got ${TEMPLATE_IDS.length}`);
console.log(`✓ Test 1: 25 templates exist`);

// Test 2: Each template renders VI + EN with subject, html, text
let renderCount = 0;
for (const id of TEMPLATE_IDS) {
  for (const locale of ['vi', 'en'] as const) {
    const ctx: TemplateContext = {
      locale,
      user_email: 'test@example.com',
      user_name: 'Test User',
      verification_token: 'test-token-123',
      ip: '127.0.0.1',
      user_agent: 'Test Browser',
      timestamp: new Date().toISOString(),
      device_name: 'Test Device',
      method: 'TOTP',
      key_id: 'key_123',
      old_role: 'USER',
      new_role: 'ADMIN',
      changed_by: 'admin@example.com',
      org_name: 'Test Org',
      role: 'MEMBER',
      action: 'memory:delete',
      requested_by: 'user@example.com',
      request_id: 'req_123',
      approved_by: 'approver@example.com',
      denied_by: 'denier@example.com',
      reason: 'Test reason',
      entitlement_key: 'machine.plan',
      value: 'founder',
      source: 'plan',
      revoked_by: 'admin@example.com',
      expired_at: new Date().toISOString(),
      amount: '1999000',
      currency: 'VND',
      plan_name: 'Nguyen Founder',
      invoice_id: 'inv_123',
      payment_date: new Date().toISOString(),
      program_id: 'OPR',
      attempt_id: 'att_123',
      certificate_id: 'NGAI-OPR-2026-000001-8F2C',
      reference_code: 'DEL-REF-123',
      room_id: 'invest',
      access_expires: '2026-12-31',
    };
    const rendered = renderTemplate(id, ctx);
    assert(rendered.subject.length > 0, `${id} ${locale}: subject should not be empty`);
    assert(rendered.html.length > 100, `${id} ${locale}: html should be substantial (>100 chars), got ${rendered.html.length}`);
    assert(rendered.text.length > 20, `${id} ${locale}: text should not be empty, got ${rendered.text.length}`);
    assert(rendered.html.includes('Nguyễn AI') || rendered.html.includes('Nguyen AI'), `${id} ${locale}: html should contain brand name`);
    assert(rendered.html.includes('nguyenai.net'), `${id} ${locale}: html should contain domain`);
    renderCount++;
  }
}
console.log(`✓ Test 2: ${renderCount} template renders (25 templates × 2 locales) all valid`);

// Test 3: MockEmailClient captures sends
const mock = new MockEmailClient();
assert(mock.sent.length === 0, 'mock should start empty');
const service = new EmailService({
  from: { email: 'hello@nguyenai.net', name: 'Nguyen AI' },
  client: mock,
});
await service.sendTemplate('welcome', {
  locale: 'vi',
  user_email: 'user@example.com',
  user_name: 'Nguyen Van A',
  verification_token: 'tok123',
});
assert(mock.sent.length === 1, 'mock should have 1 sent email');
assert(mock.sent[0].template_id === 'welcome', 'sent email should have template_id=welcome');
assert(mock.sent[0].to === 'user@example.com', 'sent email should go to user@example.com');
assert(mock.sent[0].subject.includes('Chào mừng'), 'VI welcome subject should contain "Chào mừng"');
assert(mock.sent[0].html.includes('Nguyễn AI'), 'html should contain brand');
assert(mock.sent[0].text.includes('Chào mừng'), 'text should contain greeting');
console.log(`✓ Test 3: MockEmailClient captures sends`);

// Test 4: EN template renders English
mock.clear();
await service.sendTemplate('welcome', {
  locale: 'en',
  user_email: 'user@example.com',
  user_name: 'John Nguyen',
  verification_token: 'tok456',
});
assert(mock.sent[0].subject.includes('Welcome'), 'EN welcome subject should contain "Welcome"');
assert(mock.sent[0].text.includes('Welcome'), 'EN text should contain "Welcome"');
console.log(`✓ Test 4: EN template renders English`);

// Test 5: Audit event → template mapping
const mappedEvents = Object.keys(AUDIT_EVENT_TO_TEMPLATE);
assert(mappedEvents.length === 24, `should map 24 audit events, got ${mappedEvents.length}`);
assert(AUDIT_EVENT_TO_TEMPLATE['login_success'] === 'login_alert', 'login_success → login_alert');
assert(AUDIT_EVENT_TO_TEMPLATE['approval_requested'] === 'approval_requested', 'approval_requested → approval_requested');
assert(AUDIT_EVENT_TO_TEMPLATE['certificate_issued'] === 'certificate_issued', 'certificate_issued → certificate_issued');
assert(AUDIT_EVENT_TO_TEMPLATE['payment_received'] === 'payment_received', 'payment_received → payment_received');
assert(AUDIT_EVENT_TO_TEMPLATE['account_deletion_requested'] === 'account_deletion_requested', 'account_deletion → account_deletion_requested');
console.log(`✓ Test 5: Audit event mapping covers ${mappedEvents.length} events`);

// Test 6: Template categories
const categories = new Set(Object.values(TEMPLATES).map((t) => t.category));
assert(categories.has('identity'), 'should have identity category');
assert(categories.has('authorization'), 'should have authorization category');
assert(categories.has('approval'), 'should have approval category');
assert(categories.has('entitlement'), 'should have entitlement category');
assert(categories.has('billing'), 'should have billing category');
assert(categories.has('academy'), 'should have academy category');
assert(categories.has('investor'), 'should have investor category');
assert(categories.has('security'), 'should have security category');
console.log(`✓ Test 6: All 8 categories present`);

// Test 7: createEmailService without API key uses MockEmailClient
import { createEmailService } from './service';
const devService = createEmailService({ ENVIRONMENT: 'development' });
assert(devService.getClient() instanceof MockEmailClient, 'dev service should use MockEmailClient');
console.log(`✓ Test 7: Dev service uses MockEmailClient`);

// Test 8: Certificate ID format in template
mock.clear();
await service.sendTemplate('certificate_issued', {
  locale: 'vi',
  user_email: 'user@example.com',
  certificate_id: 'NGAI-OPR-2026-000001-8F2C',
  program_id: 'OPR',
});
assert(mock.sent[0].html.includes('NGAI-OPR-2026-000001-8F2C'), 'certificate email should contain certificate ID');
assert(mock.sent[0].html.includes('/certificates/NGAI-OPR-2026-000001-8F2C'), 'certificate email should contain verify link');
console.log(`✓ Test 8: Certificate ID format in template`);

// Test 9: Account deletion reference code
mock.clear();
await service.sendTemplate('account_deletion_requested', {
  locale: 'vi',
  user_email: 'user@example.com',
  reference_code: 'DEL-REF-789',
});
assert(mock.sent[0].html.includes('DEL-REF-789'), 'deletion email should contain reference code');
assert(mock.sent[0].html.includes('30 ngày'), 'VI deletion email should mention 30 days');
console.log(`✓ Test 9: Account deletion reference code`);

// Test 10: HTML email has proper structure
mock.clear();
await service.sendTemplate('payment_received', {
  locale: 'en',
  user_email: 'user@example.com',
  amount: '1999000',
  currency: 'VND',
  plan_name: 'Nguyen Founder',
  invoice_id: 'INV-2026-001',
  payment_date: '2026-07-03',
});
const html = mock.sent[0].html;
assert(html.includes('<!DOCTYPE html>'), 'html should start with DOCTYPE');
assert(html.includes('<html'), 'html should have <html> tag');
assert(html.includes('</html>'), 'html should end with </html>');
assert(html.includes('Nguyen AI'), 'html should contain brand name');
assert(html.includes('nguyenai.net'), 'html should contain domain');
assert(html.includes('Do not reply') || html.includes('automated'), 'html should mention automated');
console.log(`✓ Test 10: HTML email has proper structure`);

console.log(`\n=== ALL EMAIL TESTS PASSED ===`);
console.log(`Templates: ${TEMPLATE_IDS.length}`);
console.log(`Renders tested: ${renderCount}`);
console.log(`Audit event mappings: ${mappedEvents.length}`);
