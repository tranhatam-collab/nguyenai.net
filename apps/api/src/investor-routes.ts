/**
 * Investor verification routes — mounted at /v1/investor/*
 *
 * Per INVESTOR_ACCESS_POLICY §3 (LOCKED) — 6-step verification flow:
 *   1. Google Login — @nai/auth (not here)
 *   2. POST /v1/investor/identity — declare identity (P2-B.3)
 *   3. POST /v1/investor/identity/verify/start — start verify.iai.one (P2-B.4)
 *      POST /v1/investor/identity/verify/complete — poll result
 *   4. POST /v1/investor/payment — initiate payment (P2-B.5/B.6)
 *      GET  /v1/investor/payment/qr — get VN QR checkout payload
 *      GET  /v1/investor/payment/wire — get USD wire instructions
 *      POST /v1/investor/payment/:id/submit — submit bank reference
 *   4b. POST /v1/investor/payment/:id/receipt — upload receipt (P2-B.7)
 *   5. POST /v1/investor/2fa/enroll — enroll 2FA (P2-B.8)
 *      POST /v1/investor/2fa/verify — verify 2FA code
 *   6. POST /v1/investor/grant — issue access grant (admin only)
 *      GET  /v1/investor/grant — check current grant
 *      POST /v1/investor/grant/revoke — revoke grant (admin only)
 *      GET  /v1/investor/state — get current verification state
 */

import { Hono } from 'hono';
import {
  declareIdentity,
  startIdentityVerification,
  completeIdentityVerification,
  initiatePayment,
  getVnQrCheckoutPayload,
  getUsdWireInstructions,
  submitPayment,
  uploadReceipt,
  enroll2FA,
  verify2FA,
  issueGrant,
  getGrant,
  revokeGrant,
  checkGrant,
  getVerificationState,
  getDeclaration,
  getIdentityVerification,
  getReceiptsByPayment,
  getEnrollment,
  type RoomScope,
} from '@nai/investor-verify';
import { logAuditEvent } from '@nai/audit';
import {
  requireAdminSession,
  requireAuthSession,
  type ApiSession,
} from './session-auth';

export interface InvestorEnv {
  Variables: {
    session: ApiSession | null;
  };
}

export const investorRoutes = new Hono<InvestorEnv>();

// ============================================================
// Auth middleware — all routes require authenticated session
// SEC-P0-4: requireAuth/requireAdmin return a Hono Response on failure.
// Callers MUST return that Response so the handler stops executing.
// Previously requireAuth() called c.json() but discarded the return
// value, so the 401 was never sent and the handler kept running.
// ============================================================

function requireAuth(c: any): ApiSession | Response {
  return requireAuthSession(c);
}

function requireAdmin(c: any): ApiSession | Response {
  return requireAdminSession(c);
}

function auditCtx(c: any) {
  return {
    user_id: c.get('session')?.user_id,
    session_id: null,
    ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
  };
}

// investor_id is derived from user_id for simplicity in MVP.
// In production, a user may have multiple investor profiles.
function investorIdFromSession(session: { user_id: string }): string {
  return `inv-${session.user_id}`;
}

// ============================================================
// Step 2 — Identity declaration (P2-B.3)
// ============================================================

// GET /v1/investor/state — current verification state
investorRoutes.get('/state', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const state = await getVerificationState(investor_id);
  return c.json({ investor_id, state });
});

// POST /v1/investor/identity — declare identity
investorRoutes.post('/identity', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const body = await c.req.json().catch(() => ({}));
  const {
    full_legal_name,
    date_of_birth,
    jurisdiction,
    accredited_status,
    investor_type,
    intended_investment_range,
    company,
    message,
    consent_to_contact,
    nda_status,
  } = body ?? {};

  if (!full_legal_name || !date_of_birth || !jurisdiction || !accredited_status || !investor_type || !intended_investment_range) {
    return c.json({ error: 'full_legal_name, date_of_birth, jurisdiction, accredited_status, investor_type, intended_investment_range required' }, 400);
  }
  if (!consent_to_contact) {
    return c.json({ error: 'consent_to_contact must be true' }, 400);
  }

  try {
    const decl = await declareIdentity({
      investor_id,
      user_id: session.user_id,
      full_legal_name,
      date_of_birth,
      jurisdiction,
      accredited_status,
      investor_type,
      intended_investment_range,
      company: company ?? null,
      message: message ?? null,
      consent_to_contact,
      nda_status: nda_status ?? 'pending',
      ctx: auditCtx(c),
    });
    return c.json({ declaration_id: decl.declaration_id, status: 'declared', next_step: 'identity_verification' }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// GET /v1/investor/identity — get declaration
investorRoutes.get('/identity', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const decl = await getDeclaration(investor_id);
  if (!decl) return c.json({ error: 'not_found' }, 404);
  // Strip DOB for privacy — only return whether declared
  return c.json({
    declaration_id: decl.declaration_id,
    full_legal_name: decl.full_legal_name,
    jurisdiction: decl.jurisdiction,
    investor_type: decl.investor_type,
    accredited_status: decl.accredited_status,
    intended_investment_range: decl.intended_investment_range,
    disclosure_version: decl.disclosure_version,
    nda_status: decl.nda_status,
    declared_at: decl.declared_at,
  });
});

// ============================================================
// Step 3 — Identity verification via verify.iai.one (P2-B.4)
// ============================================================

// POST /v1/investor/identity/verify/start
investorRoutes.post('/identity/verify/start', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  try {
    const { external_session_id, widget_url } = await startIdentityVerification(investor_id, auditCtx(c));
    return c.json({ external_session_id, widget_url });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// POST /v1/investor/identity/verify/complete
investorRoutes.post('/identity/verify/complete', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  try {
    const record = await completeIdentityVerification(investor_id, auditCtx(c));
    return c.json({
      status: record.status,
      liveness_passed: record.liveness_passed,
      name_match: record.name_match,
      dob_match: record.dob_match,
      completed_at: record.completed_at,
      rejection_reason: record.rejection_reason,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// GET /v1/investor/identity/verify — get verification status
investorRoutes.get('/identity/verify', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const record = await getIdentityVerification(investor_id);
  if (!record) return c.json({ error: 'not_started' }, 404);
  return c.json({
    status: record.status,
    liveness_passed: record.liveness_passed,
    name_match: record.name_match,
    dob_match: record.dob_match,
    started_at: record.started_at,
    completed_at: record.completed_at,
    rejection_reason: record.rejection_reason,
  });
});

// ============================================================
// Step 4 — Payment (P2-B.5 VN QR, P2-B.6 USD wire)
// ============================================================

// POST /v1/investor/payment — initiate payment
investorRoutes.post('/payment', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const body = await c.req.json().catch(() => ({}));
  const { method, amount_vnd, amount_usd, exchange_rate, exchange_rate_date } = body ?? {};

  if (!method || !amount_vnd) {
    return c.json({ error: 'method, amount_vnd required' }, 400);
  }
  if (method !== 'vn_qr' && method !== 'usd_wire') {
    return c.json({ error: 'method must be vn_qr or usd_wire' }, 400);
  }

  try {
    const payment = await initiatePayment({
      investor_id,
      method,
      amount_vnd: Number(amount_vnd),
      amount_usd: amount_usd ? Number(amount_usd) : null,
      exchange_rate: exchange_rate ? Number(exchange_rate) : null,
      exchange_rate_date: exchange_rate_date ?? null,
      ctx: auditCtx(c),
    });
    return c.json({ payment_id: payment.payment_id, status: payment.status, memo: payment.memo }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// GET /v1/investor/payment/qr — get VN QR checkout payload
investorRoutes.get('/payment/qr', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const payment_id = c.req.query('payment_id');
  if (!payment_id) return c.json({ error: 'payment_id required' }, 400);

  // We need to fetch the payment — but the service doesn't expose getPayment.
  // The frontend should have the payment_id from initiatePayment response.
  // For now, re-derive the QR from config + query params.
  const amount = Number(c.req.query('amount') ?? '0');
  const memo = c.req.query('memo') ?? '';
  if (!amount) return c.json({ error: 'amount required' }, 400);

  // Use the service's getVnQrCheckoutPayload with a minimal payment object
  const { getVnQrConfig } = await import('@nai/investor-verify');
  const cfg = getVnQrConfig();
  const qrString = `vietqr://${cfg.bank_code}/${cfg.account_number}?amount=${amount}&memo=${encodeURIComponent(memo)}`;
  const imageUrl = `https://img.vietqr.io/image/${cfg.bank_code}-${cfg.account_number}/${cfg.template}.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(cfg.account_holder)}`;
  return c.json({
    qr_string: qrString,
    image_url: imageUrl,
    account_number: cfg.account_number,
    account_holder: cfg.account_holder,
    bank_code: cfg.bank_code,
    branch: cfg.branch,
    amount,
    memo,
  });
});

// GET /v1/investor/payment/wire — get USD wire instructions
investorRoutes.get('/payment/wire', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  try {
    const instructions = await getUsdWireInstructions(investor_id);
    return c.json(instructions);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// POST /v1/investor/payment/:id/submit — submit bank reference
investorRoutes.post('/payment/:id/submit', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const payment_id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { bank_reference } = body ?? {};
  if (!bank_reference) return c.json({ error: 'bank_reference required' }, 400);

  try {
    const payment = await submitPayment(payment_id, bank_reference, auditCtx(c));
    return c.json({ payment_id: payment.payment_id, status: payment.status });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// ============================================================
// Step 4b — Receipt upload (P2-B.7)
// ============================================================

// POST /v1/investor/payment/:id/receipt — upload receipt
investorRoutes.post('/payment/:id/receipt', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const payment_id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const {
    r2_object_key,
    original_filename,
    mime_type,
    size_bytes,
    sha256,
    amount_on_receipt,
    memo_on_receipt,
  } = body ?? {};

  if (!r2_object_key || !original_filename || !mime_type || !size_bytes || !sha256) {
    return c.json({ error: 'r2_object_key, original_filename, mime_type, size_bytes, sha256 required' }, 400);
  }

  try {
    const receipt = await uploadReceipt({
      payment_id,
      investor_id,
      r2_object_key,
      original_filename,
      mime_type,
      size_bytes: Number(size_bytes),
      sha256,
      amount_on_receipt: amount_on_receipt ? Number(amount_on_receipt) : null,
      memo_on_receipt: memo_on_receipt ?? null,
      ctx: auditCtx(c),
    });
    return c.json({
      receipt_id: receipt.receipt_id,
      matched: receipt.matched,
      match_details: receipt.match_details,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// GET /v1/investor/payment/:id/receipts — list receipts for a payment
investorRoutes.get('/payment/:id/receipts', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const payment_id = c.req.param('id');
  const receipts = await getReceiptsByPayment(payment_id);
  return c.json({ receipts });
});

// ============================================================
// Step 5 — 2FA activation (P2-B.8)
// ============================================================

// POST /v1/investor/2fa/enroll
investorRoutes.post('/2fa/enroll', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const body = await c.req.json().catch(() => ({}));
  const { method, secret, phone } = body ?? {};

  if (!method) return c.json({ error: 'method required (totp or sms)' }, 400);
  if (method === 'totp' && !secret) {
    return c.json({ error: 'secret required for totp' }, 400);
  }
  if (method === 'sms' && !phone) {
    return c.json({ error: 'phone required for sms' }, 400);
  }

  try {
    const { enrollment, backup_codes } = await enroll2FA({
      investor_id,
      method,
      secret: method === 'totp' ? secret : phone,
      ctx: auditCtx(c),
    });
    // Only return backup_codes once — user must save them
    return c.json({
      enrollment_id: enrollment.enrollment_id,
      method: enrollment.method,
      verified: enrollment.verified,
      backup_codes,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// POST /v1/investor/2fa/verify
investorRoutes.post('/2fa/verify', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const body = await c.req.json().catch(() => ({}));
  const { code } = body ?? {};
  if (!code) return c.json({ error: 'code required' }, 400);

  try {
    const valid = await verify2FA(investor_id, code, auditCtx(c));
    return c.json({ valid });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// GET /v1/investor/2fa — get enrollment status
investorRoutes.get('/2fa', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const enrollment = await getEnrollment(investor_id);
  if (!enrollment) return c.json({ error: 'not_enrolled' }, 404);
  return c.json({
    method: enrollment.method,
    verified: enrollment.verified,
    enrolled_at: enrollment.enrolled_at,
    verified_at: enrollment.verified_at,
  });
});

// ============================================================
// Step 6 — Access grant
// ============================================================

// POST /v1/investor/grant — issue grant (admin only)
investorRoutes.post('/grant', async (c) => {
  const session = requireAdmin(c);
  if (session instanceof Response) return session;
  const body = await c.req.json().catch(() => ({}));
  const { investor_id, room_scope, document_scope, download_allowed, duration_days } = body ?? {};

  if (!investor_id || !room_scope || !Array.isArray(room_scope)) {
    return c.json({ error: 'investor_id, room_scope[] required' }, 400);
  }

  try {
    const grant = await issueGrant({
      investor_id,
      room_scope: room_scope as any[],
      document_scope: document_scope ?? 'all-in-scope',
      download_allowed: Boolean(download_allowed),
      approved_by: session.user_id,
      duration_days: duration_days ? Number(duration_days) : 90,
      ctx: auditCtx(c),
    });
    return c.json({
      grant_id: grant.grant_id,
      expires_at: grant.expires_at,
      room_scope: grant.room_scope,
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// GET /v1/investor/grant — check current grant
investorRoutes.get('/grant', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const grant = await getGrant(investor_id);
  if (!grant) return c.json({ error: 'no_grant' }, 404);
  return c.json({
    grant_id: grant.grant_id,
    room_scope: grant.room_scope,
    download_allowed: grant.download_allowed,
    issued_at: grant.issued_at,
    expires_at: grant.expires_at,
    revoked_at: grant.revoked_at,
  });
});

// POST /v1/investor/grant/check — check grant for a scope
investorRoutes.post('/grant/check', async (c) => {
  const session = requireAuth(c);
  if (session instanceof Response) return session;
  const investor_id = investorIdFromSession(session);
  const body = await c.req.json().catch(() => ({}));
  const { scope } = body ?? {};
  if (!scope) return c.json({ error: 'scope required' }, 400);

  const result = await checkGrant(investor_id, scope as any);
  return c.json(result);
});

// POST /v1/investor/grant/revoke — revoke grant (admin only)
investorRoutes.post('/grant/revoke', async (c) => {
  const session = requireAdmin(c);
  if (session instanceof Response) return session;
  const body = await c.req.json().catch(() => ({}));
  const { investor_id } = body ?? {};
  if (!investor_id) return c.json({ error: 'investor_id required' }, 400);

  try {
    const grant = await revokeGrant(investor_id, session.user_id, auditCtx(c));
    return c.json({ grant_id: grant.grant_id, revoked_at: grant.revoked_at });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

export default investorRoutes;
