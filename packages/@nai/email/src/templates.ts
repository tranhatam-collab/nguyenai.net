/**
 * @nai/email — Email templates (20 templates)
 *
 * Mapped to AUDIT_EVENT_REGISTRY.md event types + transactional flows.
 * Each template has VI + EN variants, HTML + text versions.
 *
 * Templates:
 *  1. welcome              — account created
 *  2. email_verification   — verify email address
 *  3. login_alert          — login from new device/IP
 *  4. passkey_registered   — passkey added
 *  5. mfa_enrolled         — MFA enrolled
 *  6. api_key_created      — API key created
 *  7. role_changed         — role changed
 *  8. org_member_added     — added to org/tenant
 *  9. approval_requested   — approval needed
 * 10. approval_granted     — approval approved
 * 11. approval_denied      — approval denied
 * 12. entitlement_granted  — entitlement granted
 * 13. entitlement_revoked  — entitlement revoked
 * 14. entitlement_expired  — entitlement expired
 * 15. payment_received     — payment confirmed
 * 16. proof_submitted      — proof/cert attempt submitted
 * 17. certificate_issued   — certificate issued
 * 18. certificate_revoked  — certificate revoked
 * 19. account_deletion_requested — deletion requested
 * 20. investor_access_granted — investor room access
 */

import type { EmailTemplate, EmailTemplateId, TemplateContext } from './types';

// ============================================================
// Helpers
// ============================================================

const BRAND_NAME = 'Nguyen AI';
const BRAND_DOMAIN = 'nguyenai.net';
const SUPPORT_EMAIL = 'hello@nguyenai.net';

function baseHtml(opts: {
  locale: 'vi' | 'en';
  title: string;
  preheader: string;
  bodyHtml: string;
}): string {
  const dir = 'ltr';
  return `<!DOCTYPE html>
<html lang="${opts.locale === 'vi' ? 'vi' : 'en'}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(opts.title)}</title>
  <style>
    :root { color-scheme: light; }
    body { margin:0; padding:0; background:#FFFAF0; font-family:"Be Vietnam Pro",Inter,system-ui,-apple-system,sans-serif; color:#4A1D14; line-height:1.65; }
    .wrap { max-width:560px; margin:0 auto; padding:24px 20px; }
    .header { text-align:center; padding:28px 0 20px; border-bottom:2px solid #FFB810; }
    .header strong { font-size:22px; color:#7A2212; }
    .header small { display:block; font-size:13px; color:#8A6B5E; margin-top:4px; }
    .preheader { display:none; }
    .content { padding:28px 0; }
    .content h1 { font-size:20px; color:#7A2212; margin:0 0 16px; }
    .content h2 { font-size:17px; color:#A6260C; margin:24px 0 12px; }
    .content p { margin:0 0 14px; font-size:15px; }
    .btn { display:inline-block; padding:12px 28px; background:#A6260C; color:#FFFFFF; text-decoration:none; border-radius:999px; font-weight:700; font-size:15px; }
    .btn:hover { background:#E55B09; }
    .info-box { background:#FFFACC; border:1px solid #FFB810; border-radius:12px; padding:16px 20px; margin:20px 0; }
    .info-box p { margin:0; font-size:14px; }
    .meta { font-size:13px; color:#8A6B5E; margin:20px 0; padding:12px 16px; background:#FFFFFF; border:1px solid rgba(74,29,20,0.12); border-radius:8px; }
    .meta strong { color:#4A1D14; }
    .footer { border-top:1px solid rgba(74,29,20,0.12); padding:20px 0; text-align:center; font-size:13px; color:#8A6B5E; }
    .footer a { color:#A6260C; text-decoration:none; }
    @media (max-width:480px) { .wrap { padding:16px 12px; } .content h1 { font-size:18px; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <strong>Nguyễn AI</strong>
      <small>Nguyen AI Computer</small>
    </div>
    <div class="preheader">${escapeHtml(opts.preheader)}</div>
    <div class="content">
      ${opts.bodyHtml}
    </div>
    <div class="footer">
      <p>© 2026 ${BRAND_NAME} — <a href="https://${BRAND_DOMAIN}">${BRAND_DOMAIN}</a></p>
      <p>${opts.locale === 'vi' ? 'Email này được gửi tự động. Không trả lời.' : 'This is an automated email. Do not reply.'}</p>
      <p>${opts.locale === 'vi' ? 'Cần hỗ trợ?' : 'Need help?'} <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ctaButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" class="btn">${escapeHtml(label)}</a>`;
}

function infoBox(text: string): string {
  return `<div class="info-box"><p>${escapeHtml(text)}</p></div>`;
}

function metaRow(label: string, value: string): string {
  return `<div class="meta"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`;
}

// ============================================================
// Templates registry
// ============================================================

export const TEMPLATES: Record<EmailTemplateId, EmailTemplate> = {

  // ── Identity (7) ──────────────────────────────────────────

  welcome: {
    id: 'welcome',
    category: 'identity',
    subject: (ctx) => ctx.locale === 'vi' ? 'Chào mừng bạn đến Nguyen AI Computer' : 'Welcome to Nguyen AI Computer',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Chào mừng' : 'Welcome',
      preheader: ctx.locale === 'vi' ? 'Tài khoản Nguyen AI đã được tạo' : 'Your Nguyen AI account is ready',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Chào mừng' : 'Welcome'}, ${escapeHtml(ctx.user_name ?? ctx.user_email)}!</h1>
        <p>${ctx.locale === 'vi'
          ? 'Tài khoản Nguyen AI Computer của bạn đã được tạo thành công. Bạn sở hữu một AI Computer riêng trên đám mây với đội ngũ 9 Agent, bộ nhớ dài hạn, kho dữ liệu và 7 Super App di sản.'
          : 'Your Nguyen AI Computer account has been created. You now own a private AI Computer on the cloud with a team of 9 Agents, long-term memory, data vault, and 7 heritage Super Apps.'}</p>
        ${infoBox(ctx.locale === 'vi' ? 'Bước tiếp theo: xác minh email của bạn để kích hoạt tài khoản.' : 'Next step: verify your email to activate your account.')}
        ${ctaButton(`https://${BRAND_DOMAIN}/verify?token=${ctx.verification_token ?? ''}`, ctx.locale === 'vi' ? 'Xác minh email' : 'Verify email')}
        ${metaRow(ctx.locale === 'vi' ? 'Email' : 'Email', ctx.user_email)}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Chào mừng ${ctx.user_name ?? ctx.user_email}!\n\nTài khoản Nguyen AI Computer đã được tạo. Xác minh email tại: https://${BRAND_DOMAIN}/verify?token=${ctx.verification_token ?? ''}\n\n— ${BRAND_NAME}`
      : `Welcome ${ctx.user_name ?? ctx.user_email}!\n\nYour Nguyen AI Computer account is ready. Verify your email at: https://${BRAND_DOMAIN}/verify?token=${ctx.verification_token ?? ''}\n\n— ${BRAND_NAME}`,
  },

  email_verification: {
    id: 'email_verification',
    category: 'identity',
    subject: (ctx) => ctx.locale === 'vi' ? 'Xác minh email — Nguyen AI' : 'Verify your email — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Xác minh email' : 'Email verification',
      preheader: ctx.locale === 'vi' ? 'Xác minh email để kích hoạt tài khoản' : 'Verify your email to activate your account',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Xác minh email' : 'Verify your email'}</h1>
        <p>${ctx.locale === 'vi' ? 'Nhấn nút bên dưới để xác minh email và kích hoạt tài khoản.' : 'Click the button below to verify your email and activate your account.'}</p>
        ${ctaButton(`https://${BRAND_DOMAIN}/verify?token=${ctx.verification_token ?? ''}`, ctx.locale === 'vi' ? 'Xác minh ngay' : 'Verify now')}
        ${infoBox(ctx.locale === 'vi' ? 'Link hết hạn sau 24 giờ. Nếu không phải bạn yêu cầu, bỏ qua email này.' : 'Link expires in 24 hours. If you did not request this, ignore this email.')}
        ${metaRow(ctx.locale === 'vi' ? 'Email' : 'Email', ctx.user_email)}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Xác minh email\n\nNhấn link: https://${BRAND_DOMAIN}/verify?token=${ctx.verification_token ?? ''}\n\nLink hết hạn sau 24 giờ.\n\n— ${BRAND_NAME}`
      : `Verify your email\n\nClick: https://${BRAND_DOMAIN}/verify?token=${ctx.verification_token ?? ''}\n\nLink expires in 24 hours.\n\n— ${BRAND_NAME}`,
  },

  login_alert: {
    id: 'login_alert',
    category: 'security',
    subject: (ctx) => ctx.locale === 'vi' ? 'Đăng nhập mới — Nguyen AI' : 'New login — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Đăng nhập mới' : 'New login',
      preheader: ctx.locale === 'vi' ? 'Phát hiện đăng nhập vào tài khoản' : 'A new login to your account was detected',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Đăng nhập mới được phát hiện' : 'New login detected'}</h1>
        <p>${ctx.locale === 'vi' ? 'Tài khoản của bạn vừa được đăng nhập.' : 'Your account was just accessed.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'IP' : 'IP', String(ctx.ip ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Thiết bị' : 'Device', String(ctx.user_agent ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Thời gian' : 'Time', String(ctx.timestamp ?? new Date().toISOString()))}
        ${infoBox(ctx.locale === 'vi' ? 'Nếu không phải bạn, hãy đổi mật khẩu và thu hồi session ngay.' : 'If this was not you, change your password and revoke sessions immediately.')}
        ${ctaButton(`https://${BRAND_DOMAIN}/settings/security`, ctx.locale === 'vi' ? 'Xem bảo mật' : 'Review security')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Đăng nhập mới\n\nIP: ${ctx.ip ?? 'unknown'}\nThiết bị: ${ctx.user_agent ?? 'unknown'}\nThời gian: ${ctx.timestamp ?? new Date().toISOString()}\n\nNếu không phải bạn, đổi mật khẩu tại: https://${BRAND_DOMAIN}/settings/security\n\n— ${BRAND_NAME}`
      : `New login\n\nIP: ${ctx.ip ?? 'unknown'}\nDevice: ${ctx.user_agent ?? 'unknown'}\nTime: ${ctx.timestamp ?? new Date().toISOString()}\n\nIf not you, change password at: https://${BRAND_DOMAIN}/settings/security\n\n— ${BRAND_NAME}`,
  },

  passkey_registered: {
    id: 'passkey_registered',
    category: 'identity',
    subject: (ctx) => ctx.locale === 'vi' ? 'Passkey đã thêm — Nguyen AI' : 'Passkey added — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Passkey mới' : 'New passkey',
      preheader: ctx.locale === 'vi' ? 'Một passkey mới đã được thêm' : 'A new passkey was added to your account',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Passkey đã được thêm' : 'Passkey added'}</h1>
        <p>${ctx.locale === 'vi' ? 'Một passkey mới đã được đăng ký cho tài khoản của bạn.' : 'A new passkey has been registered for your account.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Tên thiết bị' : 'Device name', String(ctx.device_name ?? 'unknown'))}
        ${infoBox(ctx.locale === 'vi' ? 'Nếu không phải bạn, thu hồi passkey ngay.' : 'If this was not you, revoke this passkey immediately.')}
        ${ctaButton(`https://${BRAND_DOMAIN}/settings/security`, ctx.locale === 'vi' ? 'Quản lý passkey' : 'Manage passkeys')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Passkey mới đã thêm\nThiết bị: ${ctx.device_name ?? 'unknown'}\n\nQuản lý tại: https://${BRAND_DOMAIN}/settings/security\n\n— ${BRAND_NAME}`
      : `New passkey added\nDevice: ${ctx.device_name ?? 'unknown'}\n\nManage at: https://${BRAND_DOMAIN}/settings/security\n\n— ${BRAND_NAME}`,
  },

  mfa_enrolled: {
    id: 'mfa_enrolled',
    category: 'identity',
    subject: (ctx) => ctx.locale === 'vi' ? 'MFA đã kích hoạt — Nguyen AI' : 'MFA enabled — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'MFA kích hoạt' : 'MFA enabled',
      preheader: ctx.locale === 'vi' ? 'Xác thực 2 bước đã được kích hoạt' : 'Two-factor authentication has been enabled',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'MFA đã được kích hoạt' : 'MFA has been enabled'}</h1>
        <p>${ctx.locale === 'vi' ? 'Xác thực 2 bước (TOTP) đã được kích hoạt cho tài khoản.' : 'Two-factor authentication (TOTP) has been enabled for your account.'}</p>
        ${infoBox(ctx.locale === 'vi' ? 'Lưu mã dự phòng ở nơi an toàn. Nếu mất thiết bị, bạn cần mã dự phòng để truy cập.' : 'Save your backup codes in a safe place. If you lose your device, you will need backup codes to access your account.')}
        ${metaRow(ctx.locale === 'vi' ? 'Phương thức' : 'Method', String(ctx.method ?? 'TOTP'))}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `MFA đã kích hoạt\nPhương thức: ${ctx.method ?? 'TOTP'}\n\nLưu mã dự phòng ở nơi an toàn.\n\n— ${BRAND_NAME}`
      : `MFA enabled\nMethod: ${ctx.method ?? 'TOTP'}\n\nSave your backup codes safely.\n\n— ${BRAND_NAME}`,
  },

  api_key_created: {
    id: 'api_key_created',
    category: 'identity',
    subject: (ctx) => ctx.locale === 'vi' ? 'API Key mới — Nguyen AI' : 'New API Key — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'API Key mới' : 'New API Key',
      preheader: ctx.locale === 'vi' ? 'Một API key mới đã được tạo' : 'A new API key was created',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'API Key đã được tạo' : 'API Key created'}</h1>
        <p>${ctx.locale === 'vi' ? 'Một API key mới đã được tạo cho tài khoản.' : 'A new API key has been created for your account.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Key ID' : 'Key ID', String(ctx.key_id ?? 'unknown'))}
        ${infoBox(ctx.locale === 'vi' ? 'API key chỉ hiển thị một lần. Lưu ở nơi an toàn.' : 'API key is shown only once. Store it securely.')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `API Key mới\nKey ID: ${ctx.key_id ?? 'unknown'}\n\nLưu key ở nơi an toàn.\n\n— ${BRAND_NAME}`
      : `New API Key\nKey ID: ${ctx.key_id ?? 'unknown'}\n\nStore securely.\n\n— ${BRAND_NAME}`,
  },

  // ── Authorization (2) ─────────────────────────────────────

  role_changed: {
    id: 'role_changed',
    category: 'authorization',
    subject: (ctx) => ctx.locale === 'vi' ? 'Vai trò đã thay đổi — Nguyen AI' : 'Role changed — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Thay đổi vai trò' : 'Role change',
      preheader: ctx.locale === 'vi' ? 'Vai trò của bạn đã được cập nhật' : 'Your role has been updated',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Vai trò đã thay đổi' : 'Role changed'}</h1>
        <p>${ctx.locale === 'vi' ? 'Vai trò của bạn trong tổ chức đã được cập nhật.' : 'Your role in the organization has been updated.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Vai trò cũ' : 'Old role', String(ctx.old_role ?? '—'))}
        ${metaRow(ctx.locale === 'vi' ? 'Vai trò mới' : 'New role', String(ctx.new_role ?? '—'))}
        ${metaRow(ctx.locale === 'vi' ? 'Thay đổi bởi' : 'Changed by', String(ctx.changed_by ?? 'admin'))}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Vai trò thay đổi\nCũ: ${ctx.old_role ?? '—'}\nMới: ${ctx.new_role ?? '—'}\nBởi: ${ctx.changed_by ?? 'admin'}\n\n— ${BRAND_NAME}`
      : `Role changed\nOld: ${ctx.old_role ?? '—'}\nNew: ${ctx.new_role ?? '—'}\nBy: ${ctx.changed_by ?? 'admin'}\n\n— ${BRAND_NAME}`,
  },

  org_member_added: {
    id: 'org_member_added',
    category: 'authorization',
    subject: (ctx) => ctx.locale === 'vi' ? 'Bạn được thêm vào tổ chức — Nguyen AI' : 'Added to organization — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Thêm vào tổ chức' : 'Added to organization',
      preheader: ctx.locale === 'vi' ? 'Bạn đã được thêm vào một tổ chức' : 'You have been added to an organization',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Bạn đã được thêm vào tổ chức' : 'You have been added to an organization'}</h1>
        <p>${ctx.locale === 'vi' ? 'Bạn đã được thêm làm thành viên của tổ chức.' : 'You have been added as a member of an organization.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Tổ chức' : 'Organization', String(ctx.org_name ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Vai trò' : 'Role', String(ctx.role ?? 'MEMBER'))}
        ${ctaButton(`https://${BRAND_DOMAIN}/console`, ctx.locale === 'vi' ? 'Mở Console' : 'Open Console')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Bạn được thêm vào tổ chức ${ctx.org_name ?? 'unknown'}\nVai trò: ${ctx.role ?? 'MEMBER'}\n\nMở Console: https://${BRAND_DOMAIN}/console\n\n— ${BRAND_NAME}`
      : `Added to organization ${ctx.org_name ?? 'unknown'}\nRole: ${ctx.role ?? 'MEMBER'}\n\nOpen Console: https://${BRAND_DOMAIN}/console\n\n— ${BRAND_NAME}`,
  },

  // ── Approval (3) ──────────────────────────────────────────

  approval_requested: {
    id: 'approval_requested',
    category: 'approval',
    subject: (ctx) => ctx.locale === 'vi' ? 'Cần phê duyệt — Nguyen AI' : 'Approval needed — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Yêu cầu phê duyệt' : 'Approval request',
      preheader: ctx.locale === 'vi' ? 'Một hành động nhạy cảm cần phê duyệt' : 'A sensitive action needs your approval',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Yêu cầu phê duyệt' : 'Approval requested'}</h1>
        <p>${ctx.locale === 'vi' ? 'Một hành động nhạy cảm cần phê duyệt của bạn.' : 'A sensitive action requires your approval.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Hành động' : 'Action', String(ctx.action ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Người yêu cầu' : 'Requested by', String(ctx.requested_by ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Request ID' : 'Request ID', String(ctx.request_id ?? 'unknown'))}
        ${ctaButton(`https://${BRAND_DOMAIN}/console/approvals/${ctx.request_id ?? ''}`, ctx.locale === 'vi' ? 'Phê duyệt hoặc từ chối' : 'Approve or deny')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Cần phê duyệt\nHành động: ${ctx.action ?? 'unknown'}\nNgười yêu cầu: ${ctx.requested_by ?? 'unknown'}\nRequest ID: ${ctx.request_id ?? 'unknown'}\n\nPhê duyệt tại: https://${BRAND_DOMAIN}/console/approvals/${ctx.request_id ?? ''}\n\n— ${BRAND_NAME}`
      : `Approval needed\nAction: ${ctx.action ?? 'unknown'}\nBy: ${ctx.requested_by ?? 'unknown'}\nRequest ID: ${ctx.request_id ?? 'unknown'}\n\nApprove at: https://${BRAND_DOMAIN}/console/approvals/${ctx.request_id ?? ''}\n\n— ${BRAND_NAME}`,
  },

  approval_granted: {
    id: 'approval_granted',
    category: 'approval',
    subject: (ctx) => ctx.locale === 'vi' ? 'Đã phê duyệt — Nguyen AI' : 'Approved — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Đã phê duyệt' : 'Approved',
      preheader: ctx.locale === 'vi' ? 'Yêu cầu của bạn đã được phê duyệt' : 'Your request has been approved',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Yêu cầu đã được phê duyệt' : 'Request approved'}</h1>
        <p>${ctx.locale === 'vi' ? 'Hành động nhạy cảm của bạn đã được phê duyệt.' : 'Your sensitive action has been approved.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Hành động' : 'Action', String(ctx.action ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Phê duyệt bởi' : 'Approved by', String(ctx.approved_by ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Request ID' : 'Request ID', String(ctx.request_id ?? 'unknown'))}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Đã phê duyệt\nHành động: ${ctx.action ?? 'unknown'}\nBởi: ${ctx.approved_by ?? 'unknown'}\nID: ${ctx.request_id ?? 'unknown'}\n\n— ${BRAND_NAME}`
      : `Approved\nAction: ${ctx.action ?? 'unknown'}\nBy: ${ctx.approved_by ?? 'unknown'}\nID: ${ctx.request_id ?? 'unknown'}\n\n— ${BRAND_NAME}`,
  },

  approval_denied: {
    id: 'approval_denied',
    category: 'approval',
    subject: (ctx) => ctx.locale === 'vi' ? 'Bị từ chối — Nguyen AI' : 'Denied — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Bị từ chối' : 'Denied',
      preheader: ctx.locale === 'vi' ? 'Yêu cầu của bạn bị từ chối' : 'Your request was denied',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Yêu cầu bị từ chối' : 'Request denied'}</h1>
        <p>${ctx.locale === 'vi' ? 'Hành động nhạy cảm của bạn bị từ chối.' : 'Your sensitive action has been denied.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Hành động' : 'Action', String(ctx.action ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Từ chối bởi' : 'Denied by', String(ctx.denied_by ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Lý do' : 'Reason', String(ctx.reason ?? 'not specified'))}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Bị từ chối\nHành động: ${ctx.action ?? 'unknown'}\nBởi: ${ctx.denied_by ?? 'unknown'}\nLý do: ${ctx.reason ?? 'not specified'}\n\n— ${BRAND_NAME}`
      : `Denied\nAction: ${ctx.action ?? 'unknown'}\nBy: ${ctx.denied_by ?? 'unknown'}\nReason: ${ctx.reason ?? 'not specified'}\n\n— ${BRAND_NAME}`,
  },

  // ── Entitlement (3) ───────────────────────────────────────

  entitlement_granted: {
    id: 'entitlement_granted',
    category: 'entitlement',
    subject: (ctx) => ctx.locale === 'vi' ? 'Quyền mới được cấp — Nguyen AI' : 'Entitlement granted — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Quyền mới' : 'New entitlement',
      preheader: ctx.locale === 'vi' ? 'Bạn đã được cấp quyền mới' : 'A new entitlement has been granted',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Quyền đã được cấp' : 'Entitlement granted'}</h1>
        <p>${ctx.locale === 'vi' ? 'Một quyền mới đã được cấp cho tài khoản của bạn.' : 'A new entitlement has been granted to your account.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Quyền' : 'Entitlement', String(ctx.entitlement_key ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Giá trị' : 'Value', String(ctx.value ?? 'true'))}
        ${metaRow(ctx.locale === 'vi' ? 'Nguồn' : 'Source', String(ctx.source ?? 'plan'))}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Quyền mới\n${ctx.entitlement_key ?? 'unknown'}: ${ctx.value ?? 'true'}\nNguồn: ${ctx.source ?? 'plan'}\n\n— ${BRAND_NAME}`
      : `Entitlement granted\n${ctx.entitlement_key ?? 'unknown'}: ${ctx.value ?? 'true'}\nSource: ${ctx.source ?? 'plan'}\n\n— ${BRAND_NAME}`,
  },

  entitlement_revoked: {
    id: 'entitlement_revoked',
    category: 'entitlement',
    subject: (ctx) => ctx.locale === 'vi' ? 'Quyền bị thu hồi — Nguyen AI' : 'Entitlement revoked — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Quyền thu hồi' : 'Entitlement revoked',
      preheader: ctx.locale === 'vi' ? 'Một quyền đã bị thu hồi' : 'An entitlement has been revoked',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Quyền đã bị thu hồi' : 'Entitlement revoked'}</h1>
        <p>${ctx.locale === 'vi' ? 'Một quyền đã bị thu hồi khỏi tài khoản.' : 'An entitlement has been revoked from your account.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Quyền' : 'Entitlement', String(ctx.entitlement_key ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Thu hồi bởi' : 'Revoked by', String(ctx.revoked_by ?? 'system'))}
        ${metaRow(ctx.locale === 'vi' ? 'Lý do' : 'Reason', String(ctx.reason ?? 'not specified'))}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Quyền thu hồi\n${ctx.entitlement_key ?? 'unknown'}\nBởi: ${ctx.revoked_by ?? 'system'}\nLý do: ${ctx.reason ?? 'not specified'}\n\n— ${BRAND_NAME}`
      : `Entitlement revoked\n${ctx.entitlement_key ?? 'unknown'}\nBy: ${ctx.revoked_by ?? 'system'}\nReason: ${ctx.reason ?? 'not specified'}\n\n— ${BRAND_NAME}`,
  },

  entitlement_expired: {
    id: 'entitlement_expired',
    category: 'entitlement',
    subject: (ctx) => ctx.locale === 'vi' ? 'Quyền hết hạn — Nguyen AI' : 'Entitlement expired — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Quyền hết hạn' : 'Entitlement expired',
      preheader: ctx.locale === 'vi' ? 'Một quyền đã hết hạn' : 'An entitlement has expired',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Quyền đã hết hạn' : 'Entitlement expired'}</h1>
        <p>${ctx.locale === 'vi' ? 'Một quyền đã hết hạn tự nhiên.' : 'An entitlement has expired naturally.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Quyền' : 'Entitlement', String(ctx.entitlement_key ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Hết hạn lúc' : 'Expired at', String(ctx.expired_at ?? new Date().toISOString()))}
        ${ctaButton(`https://${BRAND_DOMAIN}/plans`, ctx.locale === 'vi' ? 'Gia hạn' : 'Renew')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Quyền hết hạn\n${ctx.entitlement_key ?? 'unknown'}\nLúc: ${ctx.expired_at ?? new Date().toISOString()}\n\nGia hạn: https://${BRAND_DOMAIN}/plans\n\n— ${BRAND_NAME}`
      : `Entitlement expired\n${ctx.entitlement_key ?? 'unknown'}\nAt: ${ctx.expired_at ?? new Date().toISOString()}\n\nRenew: https://${BRAND_DOMAIN}/plans\n\n— ${BRAND_NAME}`,
  },

  // ── Billing (1) ───────────────────────────────────────────

  payment_received: {
    id: 'payment_received',
    category: 'billing',
    subject: (ctx) => ctx.locale === 'vi' ? 'Thanh toán thành công — Nguyen AI' : 'Payment received — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Thanh toán thành công' : 'Payment received',
      preheader: ctx.locale === 'vi' ? 'Cảm ơn bạn đã thanh toán' : 'Thank you for your payment',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Thanh toán thành công' : 'Payment received'}</h1>
        <p>${ctx.locale === 'vi' ? 'Cảm ơn bạn! Thanh toán của bạn đã được xác nhận.' : 'Thank you! Your payment has been confirmed.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Số tiền' : 'Amount', String(ctx.amount ?? '0') + ' ' + String(ctx.currency ?? 'VND'))}
        ${metaRow(ctx.locale === 'vi' ? 'Gói' : 'Plan', String(ctx.plan_name ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Hóa đơn' : 'Invoice', String(ctx.invoice_id ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Ngày' : 'Date', String(ctx.payment_date ?? new Date().toISOString()))}
        ${ctaButton(`https://${BRAND_DOMAIN}/console/billing`, ctx.locale === 'vi' ? 'Xem hóa đơn' : 'View invoice')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Thanh toán thành công\nSố tiền: ${ctx.amount ?? '0'} ${ctx.currency ?? 'VND'}\nGói: ${ctx.plan_name ?? 'unknown'}\nHóa đơn: ${ctx.invoice_id ?? 'unknown'}\nNgày: ${ctx.payment_date ?? new Date().toISOString()}\n\n— ${BRAND_NAME}`
      : `Payment received\nAmount: ${ctx.amount ?? '0'} ${ctx.currency ?? 'VND'}\nPlan: ${ctx.plan_name ?? 'unknown'}\nInvoice: ${ctx.invoice_id ?? 'unknown'}\nDate: ${ctx.payment_date ?? new Date().toISOString()}\n\n— ${BRAND_NAME}`,
  },

  // ── Academy / Certification (3) ───────────────────────────

  proof_submitted: {
    id: 'proof_submitted',
    category: 'academy',
    subject: (ctx) => ctx.locale === 'vi' ? 'Proof đã nộp — Nguyen AI Academy' : 'Proof submitted — Nguyen AI Academy',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Proof đã nộp' : 'Proof submitted',
      preheader: ctx.locale === 'vi' ? 'Bài nộp của bạn đang được xem xét' : 'Your submission is under review',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Proof đã được nộp' : 'Proof submitted'}</h1>
        <p>${ctx.locale === 'vi' ? 'Bài nộp certification của bạn đã được ghi nhận và đang chờ xem xét.' : 'Your certification submission has been received and is under review.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Chương trình' : 'Program', String(ctx.program_id ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Attempt' : 'Attempt', String(ctx.attempt_id ?? 'unknown'))}
        ${infoBox(ctx.locale === 'vi' ? 'Quá trình xem xét gồm AI review + human review. Bạn sẽ nhận email khi có kết quả.' : 'Review includes AI review + human review. You will be emailed when results are ready.')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Proof đã nộp\nChương trình: ${ctx.program_id ?? 'unknown'}\nAttempt: ${ctx.attempt_id ?? 'unknown'}\n\nĐang xem xét. Sẽ email khi có kết quả.\n\n— ${BRAND_NAME}`
      : `Proof submitted\nProgram: ${ctx.program_id ?? 'unknown'}\nAttempt: ${ctx.attempt_id ?? 'unknown'}\n\nUnder review. You will be emailed with results.\n\n— ${BRAND_NAME}`,
  },

  certificate_issued: {
    id: 'certificate_issued',
    category: 'academy',
    subject: (ctx) => ctx.locale === 'vi' ? 'Chứng chỉ đã cấp — Nguyen AI' : 'Certificate issued — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Chứng chỉ mới' : 'New certificate',
      preheader: ctx.locale === 'vi' ? 'Chúc mừng! Chứng chỉ của bạn đã được cấp' : 'Congratulations! Your certificate has been issued',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Chúc mừng! 🎉' : 'Congratulations! 🎉'}</h1>
        <p>${ctx.locale === 'vi' ? 'Chứng chỉ của bạn đã được cấp sau khi xem xét.' : 'Your certificate has been issued after review.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Certificate ID' : 'Certificate ID', String(ctx.certificate_id ?? 'NGAI-XXX-2026-000001-XXXX'))}
        ${metaRow(ctx.locale === 'vi' ? 'Chương trình' : 'Program', String(ctx.program_id ?? 'unknown'))}
        ${ctaButton(`https://${BRAND_DOMAIN}/certificates/${ctx.certificate_id ?? ''}`, ctx.locale === 'vi' ? 'Xem chứng chỉ' : 'View certificate')}
        ${infoBox(ctx.locale === 'vi' ? 'Chứng chỉ có thể xác minh công khai. Chia sẻ với nhà tuyển dụng hoặc đối tác.' : 'Certificate is publicly verifiable. Share with employers or partners.')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Chứng chỉ đã cấp!\nID: ${ctx.certificate_id ?? 'NGAI-XXX-2026-000001-XXXX'}\nChương trình: ${ctx.program_id ?? 'unknown'}\n\nXem: https://${BRAND_DOMAIN}/certificates/${ctx.certificate_id ?? ''}\n\n— ${BRAND_NAME}`
      : `Certificate issued!\nID: ${ctx.certificate_id ?? 'NGAI-XXX-2026-000001-XXXX'}\nProgram: ${ctx.program_id ?? 'unknown'}\n\nView: https://${BRAND_DOMAIN}/certificates/${ctx.certificate_id ?? ''}\n\n— ${BRAND_NAME}`,
  },

  certificate_revoked: {
    id: 'certificate_revoked',
    category: 'academy',
    subject: (ctx) => ctx.locale === 'vi' ? 'Chứng chỉ bị thu hồi — Nguyen AI' : 'Certificate revoked — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Chứng chỉ thu hồi' : 'Certificate revoked',
      preheader: ctx.locale === 'vi' ? 'Chứng chỉ của bạn đã bị thu hồi' : 'Your certificate has been revoked',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Chứng chỉ đã bị thu hồi' : 'Certificate revoked'}</h1>
        <p>${ctx.locale === 'vi' ? 'Chứng chỉ của bạn đã bị thu hồi.' : 'Your certificate has been revoked.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Certificate ID' : 'Certificate ID', String(ctx.certificate_id ?? 'unknown'))}
        ${metaRow(ctx.locale === 'vi' ? 'Lý do' : 'Reason', String(ctx.reason ?? 'not specified'))}
        ${metaRow(ctx.locale === 'vi' ? 'Thu hồi bởi' : 'Revoked by', String(ctx.revoked_by ?? 'admin'))}
        ${infoBox(ctx.locale === 'vi' ? 'Nếu bạn cho rằng đây là nhầm lẫn, liên hệ hello@nguyenai.net.' : 'If you believe this is an error, contact hello@nguyenai.net.')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Chứng chỉ thu hồi\nID: ${ctx.certificate_id ?? 'unknown'}\nLý do: ${ctx.reason ?? 'not specified'}\nBởi: ${ctx.revoked_by ?? 'admin'}\n\n— ${BRAND_NAME}`
      : `Certificate revoked\nID: ${ctx.certificate_id ?? 'unknown'}\nReason: ${ctx.reason ?? 'not specified'}\nBy: ${ctx.revoked_by ?? 'admin'}\n\n— ${BRAND_NAME}`,
  },

  // ── Security / Account (1) ────────────────────────────────

  account_deletion_requested: {
    id: 'account_deletion_requested',
    category: 'security',
    subject: (ctx) => ctx.locale === 'vi' ? 'Xác nhận xóa tài khoản — Nguyen AI' : 'Confirm account deletion — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Xác nhận xóa' : 'Confirm deletion',
      preheader: ctx.locale === 'vi' ? 'Bạn đã yêu cầu xóa tài khoản' : 'You requested account deletion',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Xác nhận xóa tài khoản' : 'Confirm account deletion'}</h1>
        <p>${ctx.locale === 'vi' ? 'Bạn đã yêu cầu xóa tài khoản Nguyen AI. Hành động này không thể hoàn tác.' : 'You have requested to delete your Nguyen AI account. This action is irreversible.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Mã tham chiếu' : 'Reference code', String(ctx.reference_code ?? 'unknown'))}
        ${infoBox(ctx.locale === 'vi'
          ? 'Tài khoản sẽ bị xóa sau 30 ngày. Trong thời gian này, bạn có thể hủy yêu cầu bằng mã tham chiếu. Sau khi xóa: không gửi nội dung nhạy cảm, chỉ lưu receipt tối thiểu theo chính sách pháp lý.'
          : 'Account will be deleted after 30 days. During this period, you can cancel using the reference code. After deletion: no sensitive content sent, only minimal receipt retained per legal policy.')}
        ${ctaButton(`https://${BRAND_DOMAIN}/settings/account`, ctx.locale === 'vi' ? 'Hủy yêu cầu xóa' : 'Cancel deletion')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Xác nhận xóa tài khoản\nMã tham chiếu: ${ctx.reference_code ?? 'unknown'}\n\nTài khoản bị xóa sau 30 ngày. Hủy tại: https://${BRAND_DOMAIN}/settings/account\n\n— ${BRAND_NAME}`
      : `Confirm account deletion\nReference: ${ctx.reference_code ?? 'unknown'}\n\nAccount deleted after 30 days. Cancel at: https://${BRAND_DOMAIN}/settings/account\n\n— ${BRAND_NAME}`,
  },

  // ── Investor (1) ──────────────────────────────────────────

  investor_access_granted: {
    id: 'investor_access_granted',
    category: 'investor',
    subject: (ctx) => ctx.locale === 'vi' ? 'Truy cập phòng đầu tư — Nguyen AI' : 'Investor room access — Nguyen AI',
    html: (ctx) => baseHtml({
      locale: ctx.locale,
      title: ctx.locale === 'vi' ? 'Truy cập phòng đầu tư' : 'Investor room access',
      preheader: ctx.locale === 'vi' ? 'Bạn đã được cấp truy cập phòng đầu tư' : 'You have been granted investor room access',
      bodyHtml: `
        <h1>${ctx.locale === 'vi' ? 'Truy cập phòng đầu tư đã được cấp' : 'Investor room access granted'}</h1>
        <p>${ctx.locale === 'vi' ? 'Bạn đã được cấp truy cập vào phòng đầu tư riêng.' : 'You have been granted access to the private investor room.'}</p>
        ${metaRow(ctx.locale === 'vi' ? 'Phòng' : 'Room', String(ctx.room_id ?? 'invest'))}
        ${metaRow(ctx.locale === 'vi' ? 'Hết hạn' : 'Expires', String(ctx.access_expires ?? 'unknown'))}
        ${infoBox(ctx.locale === 'vi' ? 'Mọi truy cập phòng đầu tư được audit log. Không chia sẻ link với người khác.' : 'All investor room access is audit logged. Do not share the link with others.')}
        ${ctaButton(`https://${BRAND_DOMAIN}/invest/room`, ctx.locale === 'vi' ? 'Vào phòng đầu tư' : 'Enter investor room')}
      `,
    }),
    text: (ctx) => ctx.locale === 'vi'
      ? `Truy cập phòng đầu tư\nPhòng: ${ctx.room_id ?? 'invest'}\nHết hạn: ${ctx.access_expires ?? 'unknown'}\n\nVào: https://${BRAND_DOMAIN}/invest/room\n\n— ${BRAND_NAME}`
      : `Investor room access\nRoom: ${ctx.room_id ?? 'invest'}\nExpires: ${ctx.access_expires ?? 'unknown'}\n\nEnter: https://${BRAND_DOMAIN}/invest/room\n\n— ${BRAND_NAME}`,
  },
};

// ============================================================
// Template helpers
// ============================================================

export function getTemplate(id: EmailTemplateId): EmailTemplate {
  const template = TEMPLATES[id];
  if (!template) throw new Error(`Email template not found: ${id}`);
  return template;
}

export function listTemplates(): EmailTemplateId[] {
  return Object.keys(TEMPLATES) as EmailTemplateId[];
}

export function renderTemplate(id: EmailTemplateId, ctx: TemplateContext): {
  subject: string;
  html: string;
  text: string;
} {
  const template = getTemplate(id);
  return {
    subject: template.subject(ctx),
    html: template.html(ctx),
    text: template.text(ctx),
  };
}
