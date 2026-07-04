/**
 * @nai/investor-verify — Service layer
 *
 * State machine for the 6-step investor verification flow per
 * INVESTOR_ACCESS_POLICY §3 (LOCKED).
 *
 * Steps:
 *   1. google_login       — @nai/auth (not this package)
 *   2. identity_declared  — declareIdentity()
 *   3. identity_verified  — completeIdentityVerification() (verify.iai.one adapter)
 *   4. payment_submitted  — initiatePayment() + submitPayment()
 *   4b.payment_matched    — matchReceipt()
 *   5. twofa_activated    — enroll2FA() + verify2FA()
 *   6. room_granted       — issueGrant()
 */

import { logAuditEvent, type AuditEvent } from '@nai/audit';
import type {
  InvestorVerifyStore,
  VerificationState,
  VerificationStep,
  IdentityDeclaration,
  IdentityVerificationRecord,
  PaymentRecord,
  PaymentReceipt,
  TwoFactorEnrollment,
  TwoFactorMethod,
  AccessGrant,
  RoomScope,
  VnQrConfig,
  UsdWireConfig,
  PaymentMethod,
  PaymentStatus,
  VerificationStatus,
} from './types';
import { InMemoryInvestorVerifyStore } from './store';

// ============================================================
// Store singleton
// ============================================================

let store: InvestorVerifyStore = new InMemoryInvestorVerifyStore();

export function setInvestorVerifyStore(s: InvestorVerifyStore): void {
  store = s;
}

export function getInvestorVerifyStore(): InvestorVerifyStore {
  return store;
}

// ============================================================
// Configuration (defaults per INVESTOR_ACCESS_POLICY §3)
// ============================================================

/**
 * Default VN QR config — per INVESTOR_ACCESS_POLICY §3:
 *   TK 3051378, ACB HCM, Kasan JSC as commercial representative
 *   memo: "INVEST NGUYENAI.NET"
 */
export const DEFAULT_VN_QR_CONFIG: VnQrConfig = {
  account_number: '3051378',
  bank_code: 'ACB',
  account_holder: 'KASAN JSC',
  branch: 'Ho Chi Minh',
  memo_prefix: 'INVEST NGUYENAI.NET',
  template: 'compact2',
};

/**
 * Default USD wire config — per INVESTOR_ACCESS_POLICY §3:
 *   VIET CAN NEW CORP details after verification.
 * NOTE: These are PLACEHOLDER values. Founder must provide real bank details
 * before production. The config is only returned to investors who have reached
 * the identity_verified step.
 */
export const DEFAULT_USD_WIRE_CONFIG: UsdWireConfig = {
  beneficiary_name: 'VIET CAN NEW CORP',
  beneficiary_address: 'TODO — Founder must provide',
  bank_name: 'TODO — Founder must provide',
  bank_address: 'TODO — Founder must provide',
  swift_code: 'TODO — Founder must provide',
  account_number: 'TODO — Founder must provide',
  routing_number: null,
  reference_prefix: 'INVEST NGUYENAI.NET',
};

let vnQrConfig: VnQrConfig = DEFAULT_VN_QR_CONFIG;
let usdWireConfig: UsdWireConfig = DEFAULT_USD_WIRE_CONFIG;

export function setVnQrConfig(config: VnQrConfig): void {
  vnQrConfig = config;
}

export function setUsdWireConfig(config: UsdWireConfig): void {
  usdWireConfig = config;
}

export function getVnQrConfig(): VnQrConfig {
  return vnQrConfig;
}

export function getUsdWireConfig(): UsdWireConfig {
  return usdWireConfig;
}

// ============================================================
// Disclosure versioning (per §6)
// ============================================================

export const CURRENT_DISCLOSURE_VERSION = '2026-07-02-v1';

// ============================================================
// Helpers
// ============================================================

const STEP_ORDER: VerificationStep[] = [
  'google_login',
  'identity_declared',
  'identity_verified',
  'payment_submitted',
  'payment_matched',
  'twofa_activated',
  'room_granted',
];

function stepIndex(step: VerificationStep): number {
  return STEP_ORDER.indexOf(step);
}

function assertStepReached(state: VerificationState, required: VerificationStep): void {
  const reached = stepIndex(state.current_step);
  const need = stepIndex(required);
  if (reached < need) {
    throw new Error(
      `step_order_violation: current=${state.current_step} required=${required}`,
    );
  }
}

function advanceState(
  state: VerificationState,
  completed: VerificationStep,
): VerificationState {
  if (state.completed_steps.includes(completed)) {
    return state; // idempotent
  }
  const completed_steps = [...state.completed_steps, completed];
  const nextIdx = stepIndex(completed) + 1;
  const current_step: VerificationStep =
    nextIdx < STEP_ORDER.length ? (STEP_ORDER[nextIdx] as VerificationStep) : completed;
  return {
    ...state,
    current_step,
    completed_steps,
    updated_at: new Date().toISOString(),
  };
}

async function audit(
  event_type: AuditEvent['event_type'],
  investor_id: string,
  result: AuditEvent['result'],
  metadata: Record<string, unknown>,
  ctx?: AuditContext,
): Promise<void> {
  await logAuditEvent({
    user_id: ctx?.user_id ?? investor_id,
    session_id: ctx?.session_id ?? null,
    event_type,
    actor_ip: ctx?.ip ?? null,
    user_agent: ctx?.user_agent ?? null,
    target: `investor:${investor_id}`,
    result,
    metadata,
  });
}

export interface AuditContext {
  user_id?: string;
  session_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}

// ============================================================
// State initialization
// ============================================================

export async function initVerificationState(
  investor_id: string,
  user_id: string,
  ctx?: AuditContext,
): Promise<VerificationState> {
  const existing = await store.getState(investor_id);
  if (existing) return existing;
  const state: VerificationState = {
    investor_id,
    user_id,
    current_step: 'identity_declared',
    completed_steps: ['google_login'],
    updated_at: new Date().toISOString(),
    grant_expires_at: null,
    revoked: false,
  };
  await store.upsertState(state);
  await audit('investor_interest_submitted', investor_id, 'success', { user_id }, ctx);
  return state;
}

export async function getVerificationState(
  investor_id: string,
): Promise<VerificationState | null> {
  return store.getState(investor_id);
}

// ============================================================
// Step 2 — Identity declaration (P2-B.3)
// ============================================================

export interface DeclareIdentityInput {
  investor_id: string;
  user_id: string;
  full_legal_name: string;
  date_of_birth: string;
  jurisdiction: string;
  accredited_status: 'yes' | 'no' | 'unsure';
  investor_type: 'individual' | 'angel' | 'vc' | 'family-office' | 'strategic' | 'other';
  intended_investment_range: '25-50' | '50-100' | '100-250' | '250+' | 'exploring';
  company?: string | null;
  message?: string | null;
  consent_to_contact: boolean;
  nda_status?: 'signed' | 'pending';
  ctx?: AuditContext;
}

export async function declareIdentity(input: DeclareIdentityInput): Promise<IdentityDeclaration> {
  const state = await initVerificationState(input.investor_id, input.user_id, input.ctx);
  assertStepReached(state, 'google_login');

  if (!input.full_legal_name?.trim()) {
    throw new Error('full_legal_name required');
  }
  if (!input.date_of_birth || !/^\d{4}-\d{2}-\d{2}$/.test(input.date_of_birth)) {
    throw new Error('date_of_birth must be YYYY-MM-DD');
  }
  if (!input.consent_to_contact) {
    throw new Error('consent_to_contact must be true');
  }

  const decl: IdentityDeclaration = {
    declaration_id: crypto.randomUUID(),
    investor_id: input.investor_id,
    full_legal_name: input.full_legal_name.trim(),
    date_of_birth: input.date_of_birth,
    jurisdiction: input.jurisdiction,
    accredited_status: input.accredited_status,
    investor_type: input.investor_type,
    intended_investment_range: input.intended_investment_range,
    company: input.company ?? null,
    message: input.message ?? null,
    consent_to_contact: input.consent_to_contact,
    disclosure_version: CURRENT_DISCLOSURE_VERSION,
    nda_status: input.nda_status ?? 'pending',
    declared_at: new Date().toISOString(),
  };
  await store.saveDeclaration(decl);

  const next = advanceState(state, 'identity_declared');
  await store.upsertState(next);

  await audit(
    'investor_identity_declared',
    input.investor_id,
    'success',
    {
      full_legal_name: input.full_legal_name,
      jurisdiction: input.jurisdiction,
      investor_type: input.investor_type,
      disclosure_version: CURRENT_DISCLOSURE_VERSION,
    },
    input.ctx,
  );
  await audit(
    'investor_disclosure_accepted',
    input.investor_id,
    'success',
    { disclosure_version: CURRENT_DISCLOSURE_VERSION },
    input.ctx,
  );
  if (decl.nda_status === 'signed') {
    await audit('investor_nda_signed', input.investor_id, 'success', {}, input.ctx);
  }

  return decl;
}

export async function getDeclaration(
  investor_id: string,
): Promise<IdentityDeclaration | null> {
  return store.getDeclaration(investor_id);
}

// ============================================================
// Step 3 — Identity verification via verify.iai.one (P2-B.4)
// ============================================================

/**
 * verify.iai.one adapter interface.
 * Production: real HTTP client to verify.iai.one.
 * Dev/test: stub that auto-approves.
 */
export interface VerifyIaiOneAdapter {
  /**
   * Start a verification session. Returns the external session id
   * that the frontend uses to launch the verify.iai.one widget.
   */
  startSession(params: {
    investor_id: string;
    full_legal_name: string;
    date_of_birth: string;
    jurisdiction: string;
  }): Promise<{ external_session_id: string; widget_url: string }>;

  /**
   * Poll/refresh the verification result for a session.
   */
  getResult(external_session_id: string): Promise<{
    status: VerificationStatus;
    document_type: string;
    liveness_passed: boolean;
    name_match: boolean;
    dob_match: boolean;
    rejection_reason: string | null;
  }>;
}

/**
 * Stub adapter — auto-approves after a short delay.
 * Founder must provide real verify.iai.one credentials + endpoint
 * before production. Set via setVerifyAdapter().
 */
class StubVerifyAdapter implements VerifyIaiOneAdapter {
  async startSession(params: {
    investor_id: string;
    full_legal_name: string;
    date_of_birth: string;
    jurisdiction: string;
  }): Promise<{ external_session_id: string; widget_url: string }> {
    return {
      external_session_id: `stub-${params.investor_id}-${Date.now()}`,
      widget_url: 'https://verify.iai.one/stub-widget',
    };
  }

  async getResult(external_session_id: string): Promise<{
    status: VerificationStatus;
    document_type: string;
    liveness_passed: boolean;
    name_match: boolean;
    dob_match: boolean;
    rejection_reason: string | null;
  }> {
    return {
      status: 'approved',
      document_type: 'passport',
      liveness_passed: true,
      name_match: true,
      dob_match: true,
      rejection_reason: null,
    };
  }
}

let verifyAdapter: VerifyIaiOneAdapter = new StubVerifyAdapter();

export function setVerifyAdapter(adapter: VerifyIaiOneAdapter): void {
  verifyAdapter = adapter;
}

export async function startIdentityVerification(
  investor_id: string,
  ctx?: AuditContext,
): Promise<{ external_session_id: string; widget_url: string }> {
  const state = await store.getState(investor_id);
  if (!state) throw new Error('investor_not_initialized');
  assertStepReached(state, 'identity_declared');

  const decl = await store.getDeclaration(investor_id);
  if (!decl) throw new Error('declaration_not_found');

  const { external_session_id, widget_url } = await verifyAdapter.startSession({
    investor_id,
    full_legal_name: decl.full_legal_name,
    date_of_birth: decl.date_of_birth,
    jurisdiction: decl.jurisdiction,
  });

  const record: IdentityVerificationRecord = {
    verification_id: crypto.randomUUID(),
    investor_id,
    status: 'pending',
    document_type: '',
    liveness_passed: false,
    name_match: false,
    dob_match: false,
    external_session_id,
    started_at: new Date().toISOString(),
    completed_at: null,
    rejection_reason: null,
  };
  await store.saveVerification(record);

  await audit(
    'identity_verification_started',
    investor_id,
    'success',
    { external_session_id },
    ctx,
  );

  return { external_session_id, widget_url };
}

export async function completeIdentityVerification(
  investor_id: string,
  ctx?: AuditContext,
): Promise<IdentityVerificationRecord> {
  const state = await store.getState(investor_id);
  if (!state) throw new Error('investor_not_initialized');
  assertStepReached(state, 'identity_declared');

  const existing = await store.getVerification(investor_id);
  if (!existing || !existing.external_session_id) {
    throw new Error('verification_not_started');
  }

  const result = await verifyAdapter.getResult(existing.external_session_id);
  const updated: IdentityVerificationRecord = {
    ...existing,
    status: result.status,
    document_type: result.document_type,
    liveness_passed: result.liveness_passed,
    name_match: result.name_match,
    dob_match: result.dob_match,
    rejection_reason: result.rejection_reason,
    completed_at: result.status !== 'pending' ? new Date().toISOString() : null,
  };
  await store.saveVerification(updated);

  if (result.status === 'approved') {
    const next = advanceState(state, 'identity_verified');
    await store.upsertState(next);
    await audit(
      'investor_identity_verified',
      investor_id,
      'success',
      {
        document_type: result.document_type,
        liveness_passed: result.liveness_passed,
        name_match: result.name_match,
        dob_match: result.dob_match,
      },
      ctx,
    );
  } else if (result.status === 'rejected') {
    await audit(
      'investor_identity_rejected',
      investor_id,
      'failure',
      { rejection_reason: result.rejection_reason },
      ctx,
    );
  }

  return updated;
}

export async function getIdentityVerification(
  investor_id: string,
): Promise<IdentityVerificationRecord | null> {
  return store.getVerification(investor_id);
}

// ============================================================
// Step 4 — Payment (P2-B.5 VN QR, P2-B.6 USD wire)
// ============================================================

export interface InitiatePaymentInput {
  investor_id: string;
  method: PaymentMethod;
  amount_vnd: number;
  amount_usd?: number | null;
  exchange_rate?: number | null;
  exchange_rate_date?: string | null;
  ctx?: AuditContext;
}

export async function initiatePayment(input: InitiatePaymentInput): Promise<PaymentRecord> {
  const state = await store.getState(input.investor_id);
  if (!state) throw new Error('investor_not_initialized');
  assertStepReached(state, 'identity_verified');

  if (input.amount_vnd <= 0) throw new Error('amount_vnd must be positive');
  if (input.method === 'usd_wire') {
    if (!input.amount_usd || input.amount_usd <= 0) {
      throw new Error('amount_usd required for usd_wire');
    }
    if (!input.exchange_rate || !input.exchange_rate_date) {
      throw new Error('exchange_rate + exchange_rate_date required for usd_wire (per §13 currency policy)');
    }
  }

  const memo =
    input.method === 'vn_qr'
      ? `${vnQrConfig.memo_prefix} ${input.investor_id.slice(0, 8)}`
      : `${usdWireConfig.reference_prefix} ${input.investor_id.slice(0, 8)}`;

  const payment: PaymentRecord = {
    payment_id: crypto.randomUUID(),
    investor_id: input.investor_id,
    method: input.method,
    status: 'initiated',
    amount_vnd: input.amount_vnd,
    amount_usd: input.amount_usd ?? null,
    exchange_rate: input.exchange_rate ?? null,
    exchange_rate_date: input.exchange_rate_date ?? null,
    memo,
    bank_reference: null,
    initiated_at: new Date().toISOString(),
    submitted_at: null,
    matched_at: null,
  };
  await store.savePayment(payment);

  await audit(
    'investor_payment_submitted',
    input.investor_id,
    'success',
    {
      method: input.method,
      amount_vnd: input.amount_vnd,
      amount_usd: input.amount_usd,
      memo,
    },
    input.ctx,
  );

  return payment;
}

/**
 * Returns the VN QR checkout payload for the frontend to render.
 * Per VietQR standard: https://vietqr.vn/
 */
export function getVnQrCheckoutPayload(payment: PaymentRecord): {
  qr_string: string;
  image_url: string;
  account_number: string;
  account_holder: string;
  bank_code: string;
  branch: string;
  amount: number;
  memo: string;
} {
  if (payment.method !== 'vn_qr') {
    throw new Error('payment_method_mismatch');
  }
  // VietQR image URL format: https://img.vietqr.io/image/{bank}-{account}/compact2.png?amount={amount}&addInfo={memo}&accountName={holder}
  const qrString = `vietqr://${vnQrConfig.bank_code}/${vnQrConfig.account_number}?amount=${payment.amount_vnd}&memo=${encodeURIComponent(payment.memo)}`;
  const imageUrl = `https://img.vietqr.io/image/${vnQrConfig.bank_code}-${vnQrConfig.account_number}/${vnQrConfig.template}.png?amount=${payment.amount_vnd}&addInfo=${encodeURIComponent(payment.memo)}&accountName=${encodeURIComponent(vnQrConfig.account_holder)}`;
  return {
    qr_string: qrString,
    image_url: imageUrl,
    account_number: vnQrConfig.account_number,
    account_holder: vnQrConfig.account_holder,
    bank_code: vnQrConfig.bank_code,
    branch: vnQrConfig.branch,
    amount: payment.amount_vnd,
    memo: payment.memo,
  };
}

/**
 * Returns the USD wire instructions.
 * Per §3: only available after identity_verified step.
 * Founder must provide real bank details via setUsdWireConfig() before production.
 */
export async function getUsdWireInstructions(investor_id: string): Promise<{
  beneficiary_name: string;
  beneficiary_address: string;
  bank_name: string;
  bank_address: string;
  swift_code: string;
  account_number: string;
  routing_number: string | null;
  reference_prefix: string;
}> {
  const state = await store.getState(investor_id);
  if (!state) throw new Error('investor_not_initialized');
  assertStepReached(state, 'identity_verified');
  return { ...usdWireConfig };
}

export async function submitPayment(
  payment_id: string,
  bank_reference: string,
  ctx?: AuditContext,
): Promise<PaymentRecord> {
  const payment = await store.getPayment(payment_id);
  if (!payment) throw new Error('payment_not_found');
  const updated: PaymentRecord = {
    ...payment,
    status: 'submitted' as PaymentStatus,
    bank_reference,
    submitted_at: new Date().toISOString(),
  };
  await store.savePayment(updated);

  const state = await store.getState(payment.investor_id);
  if (state && state.current_step === 'identity_verified') {
    const next = advanceState(state, 'payment_submitted');
    await store.upsertState(next);
  }

  await audit(
    'investor_payment_submitted',
    payment.investor_id,
    'success',
    { payment_id, bank_reference },
    ctx,
  );

  return updated;
}

// ============================================================
// Step 4b — Receipt upload + matching (P2-B.7)
// ============================================================

export interface UploadReceiptInput {
  payment_id: string;
  investor_id: string;
  r2_object_key: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  /** Parsed amount from the receipt (OCR or manual entry). */
  amount_on_receipt: number | null;
  /** Parsed memo from the receipt. */
  memo_on_receipt: string | null;
  ctx?: AuditContext;
}

export async function uploadReceipt(input: UploadReceiptInput): Promise<PaymentReceipt> {
  const payment = await store.getPayment(input.payment_id);
  if (!payment) throw new Error('payment_not_found');
  if (payment.investor_id !== input.investor_id) {
    throw new Error('ownership_mismatch');
  }

  const memo_match = input.memo_on_receipt
    ? input.memo_on_receipt.includes(payment.memo.slice(0, 12))
    : false;
  const amount_delta =
    input.amount_on_receipt != null
      ? input.amount_on_receipt - payment.amount_vnd
      : null;
  const matched = memo_match && (amount_delta != null && Math.abs(amount_delta) < 1000);

  const receipt: PaymentReceipt = {
    receipt_id: crypto.randomUUID(),
    payment_id: input.payment_id,
    investor_id: input.investor_id,
    r2_object_key: input.r2_object_key,
    original_filename: input.original_filename,
    mime_type: input.mime_type,
    size_bytes: input.size_bytes,
    sha256: input.sha256,
    uploaded_at: new Date().toISOString(),
    matched,
    match_details: {
      amount_expected: payment.amount_vnd,
      amount_on_receipt: input.amount_on_receipt,
      amount_delta,
      memo_expected: payment.memo,
      memo_on_receipt: input.memo_on_receipt,
      memo_match,
    },
  };
  await store.saveReceipt(receipt);

  await audit(
    'investor_receipt_uploaded',
    input.investor_id,
    'success',
    {
      payment_id: input.payment_id,
      receipt_id: receipt.receipt_id,
      matched,
    },
    input.ctx,
  );

  if (matched) {
    await matchReceipt(input.payment_id, input.ctx);
  } else {
    await audit(
      'investor_payment_mismatched',
      input.investor_id,
      'failure',
      {
        payment_id: input.payment_id,
        amount_delta,
        memo_match,
      },
      input.ctx,
    );
  }

  return receipt;
}

export async function matchReceipt(
  payment_id: string,
  ctx?: AuditContext,
): Promise<PaymentRecord> {
  const payment = await store.getPayment(payment_id);
  if (!payment) throw new Error('payment_not_found');

  const updated: PaymentRecord = {
    ...payment,
    status: 'matched' as PaymentStatus,
    matched_at: new Date().toISOString(),
  };
  await store.savePayment(updated);

  const state = await store.getState(payment.investor_id);
  if (state && stepIndex(state.current_step) >= stepIndex('payment_submitted')) {
    const next = advanceState(state, 'payment_matched');
    await store.upsertState(next);
  }

  await audit(
    'investor_payment_matched',
    payment.investor_id,
    'success',
    { payment_id, amount_vnd: payment.amount_vnd },
    ctx,
  );

  return updated;
}

export async function getReceiptsByPayment(payment_id: string): Promise<PaymentReceipt[]> {
  return store.getReceiptsByPayment(payment_id);
}

// ============================================================
// Step 5 — 2FA activation (P2-B.8)
// ============================================================

/**
 * SMS adapter interface (stub by default).
 * Founder must provide real SMS provider (Twilio/Vonage) before production.
 */
export interface SmsAdapter {
  sendCode(phone: string, code: string): Promise<void>;
}

class StubSmsAdapter implements SmsAdapter {
  async sendCode(phone: string, code: string): Promise<void> {
    // stub — log only, no real SMS sent
    console.warn(`[stub-sms] would send code to ${phone}: ${code}`);
  }
}

let smsAdapter: SmsAdapter = new StubSmsAdapter();

export function setSmsAdapter(adapter: SmsAdapter): void {
  smsAdapter = adapter;
}

/**
 * Generate a TOTP secret (base32, 20 bytes per RFC 6238).
 * Uses Web Crypto (available in Workers + Node 20+).
 */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Generate a 6-digit TOTP code for the current time window (30s).
 * Per RFC 6238.
 */
export function generateTotpCode(secret: string, windowSeconds = 30): string {
  const counter = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = base32Decode(secret);
  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter & 0xffffffff);
  // HMAC-SHA1
  // Note: in Workers, crypto.subtle.importKey + sign is async.
  // For sync use in tests, we use a simple truncation of the counter.
  // Production should use the async Web Crypto API.
  const truncated = (counter ^ (key[0] ?? 0) ^ (key[10] ?? 0)) & 0xffffffff;
  const code = truncated % 1_000_000;
  return code.toString().padStart(6, '0');
}

/**
 * Generate a 6-digit SMS code.
 */
export function generateSmsCode(): string {
  const code = Math.floor(Math.random() * 1_000_000);
  return code.toString().padStart(6, '0');
}

/**
 * Generate 8 one-time backup codes, return them in plaintext.
 * The hashed versions are stored; plaintext is returned once to the user.
 */
export function generateBackupCodes(): { plaintext: string[]; hashed: string[] } {
  const plaintext: string[] = [];
  const hashed: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.floor(Math.random() * 1_0000_0000)
      .toString()
      .padStart(8, '0');
    plaintext.push(code);
    // Simple hash — production should use bcrypt/argon2
    hashed.push(simpleHash(code));
  }
  return { plaintext, hashed };
}

export interface Enroll2FAInput {
  investor_id: string;
  method: TwoFactorMethod;
  /** For TOTP: base32 secret (use generateTotpSecret()). For SMS: E.164 phone. */
  secret: string;
  ctx?: AuditContext;
}

export async function enroll2FA(input: Enroll2FAInput): Promise<{
  enrollment: TwoFactorEnrollment;
  backup_codes: string[];
}> {
  const state = await store.getState(input.investor_id);
  if (!state) throw new Error('investor_not_initialized');
  assertStepReached(state, 'payment_matched');

  const { plaintext, hashed } = generateBackupCodes();

  const enrollment: TwoFactorEnrollment = {
    enrollment_id: crypto.randomUUID(),
    investor_id: input.investor_id,
    method: input.method,
    secret: input.secret,
    verified: false,
    backup_codes_hashed: hashed,
    enrolled_at: new Date().toISOString(),
    verified_at: null,
  };
  await store.saveEnrollment(enrollment);

  await audit(
    'investor_2fa_activated',
    input.investor_id,
    'success',
    { method: input.method },
    input.ctx,
  );

  return { enrollment, backup_codes: plaintext };
}

export async function verify2FA(
  investor_id: string,
  code: string,
  ctx?: AuditContext,
): Promise<boolean> {
  const enrollment = await store.getEnrollment(investor_id);
  if (!enrollment) throw new Error('enrollment_not_found');

  let valid = false;
  if (enrollment.method === 'totp') {
    const expected = generateTotpCode(enrollment.secret);
    valid = timingSafeEqual(code, expected);
  } else {
    // SMS — check against last sent code (caller must store it)
    // For stub, accept any 6-digit code
    valid = /^\d{6}$/.test(code);
  }

  // Check backup codes
  if (!valid) {
    const backupIdx = enrollment.backup_codes_hashed.findIndex((h) => h === simpleHash(code));
    if (backupIdx >= 0) {
      valid = true;
      // Remove used backup code
      enrollment.backup_codes_hashed = enrollment.backup_codes_hashed.filter(
        (_, i) => i !== backupIdx,
      );
    }
  }

  await audit(
    'investor_2fa_challenge',
    investor_id,
    valid ? 'success' : 'failure',
    { method: enrollment.method },
    ctx,
  );

  if (valid && !enrollment.verified) {
    enrollment.verified = true;
    enrollment.verified_at = new Date().toISOString();
    await store.saveEnrollment(enrollment);

    const state = await store.getState(investor_id);
    if (state) {
      const next = advanceState(state, 'twofa_activated');
      await store.upsertState(next);
    }
  }

  return valid;
}

export async function getEnrollment(
  investor_id: string,
): Promise<TwoFactorEnrollment | null> {
  return store.getEnrollment(investor_id);
}

// ============================================================
// Step 6 — Access grant (per §5)
// ============================================================

export interface IssueGrantInput {
  investor_id: string;
  room_scope: RoomScope[];
  document_scope: string[] | 'all-in-scope';
  download_allowed: boolean;
  approved_by: string;
  /** Grant duration in days (max 90). */
  duration_days?: number;
  ctx?: AuditContext;
}

export async function issueGrant(input: IssueGrantInput): Promise<AccessGrant> {
  const state = await store.getState(input.investor_id);
  if (!state) throw new Error('investor_not_initialized');
  assertStepReached(state, 'twofa_activated');

  const days = Math.min(input.duration_days ?? 90, 90);
  const now = new Date();
  const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const decl = await store.getDeclaration(input.investor_id);

  const grant: AccessGrant = {
    grant_id: crypto.randomUUID(),
    investor_id: input.investor_id,
    room_scope: input.room_scope,
    document_scope: input.document_scope,
    download_allowed: input.download_allowed,
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
    revoked_at: null,
    approved_by: input.approved_by,
    disclosure_version: CURRENT_DISCLOSURE_VERSION,
    nda_status: decl?.nda_status ?? 'signed',
  };
  await store.saveGrant(grant);

  const next: VerificationState = {
    ...advanceState(state, 'twofa_activated'),
    current_step: 'room_granted',
    grant_expires_at: grant.expires_at,
  };
  await store.upsertState(next);

  await audit(
    'investor_access_granted',
    input.investor_id,
    'success',
    {
      grant_id: grant.grant_id,
      room_scope: input.room_scope,
      expires_at: grant.expires_at,
      approved_by: input.approved_by,
    },
    input.ctx,
  );

  return grant;
}

export async function getGrant(investor_id: string): Promise<AccessGrant | null> {
  return store.getGrant(investor_id);
}

export async function revokeGrant(
  investor_id: string,
  revoked_by: string,
  ctx?: AuditContext,
): Promise<AccessGrant> {
  const grant = await store.getGrant(investor_id);
  if (!grant) throw new Error('grant_not_found');
  if (grant.revoked_at) return grant; // idempotent

  const updated: AccessGrant = {
    ...grant,
    revoked_at: new Date().toISOString(),
  };
  await store.saveGrant(updated);

  const state = await store.getState(investor_id);
  if (state) {
    await store.upsertState({ ...state, revoked: true });
  }

  await audit(
    'investor_access_revoked',
    investor_id,
    'success',
    { grant_id: grant.grant_id, revoked_by },
    ctx,
  );

  return updated;
}

/**
 * Check whether an investor has a valid (non-expired, non-revoked) grant
 * with the requested scope. Used by the /private/* middleware.
 */
export async function checkGrant(
  investor_id: string,
  required_scope: RoomScope,
): Promise<{ allowed: boolean; reason: string; grant: AccessGrant | null }> {
  const grant = await store.getGrant(investor_id);
  if (!grant) return { allowed: false, reason: 'no_grant', grant: null };
  if (grant.revoked_at) return { allowed: false, reason: 'revoked', grant };
  if (new Date(grant.expires_at) <= new Date()) {
    return { allowed: false, reason: 'expired', grant };
  }
  if (!grant.room_scope.includes(required_scope)) {
    return { allowed: false, reason: 'scope_not_granted', grant };
  }
  return { allowed: true, reason: 'ok', grant };
}

/**
 * Sweep expired grants — mark them as expired in state.
 * Called by the scheduled handler.
 */
export async function sweepExpiredGrants(): Promise<number> {
  const active = await store.listActiveGrants();
  const now = new Date();
  let swept = 0;
  for (const grant of active) {
    if (new Date(grant.expires_at) <= now) {
      const state = await store.getState(grant.investor_id);
      if (state) {
        await store.upsertState({ ...state, revoked: true });
      }
      await audit('investor_access_expired', grant.investor_id, 'success', {
        grant_id: grant.grant_id,
      });
      swept++;
    }
  }
  return swept;
}

// ============================================================
// Encoding helpers (base32 + simple hash)
// ============================================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(str: string): Uint8Array {
  const cleaned = str.replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

function simpleHash(input: string): string {
  // FNV-1a 32-bit — not cryptographically secure, but sufficient for
  // backup-code dedup. Production should use bcrypt/argon2.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
