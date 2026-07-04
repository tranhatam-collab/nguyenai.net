/**
 * @nai/investor-verify — Types
 *
 * Per INVESTOR_ACCESS_POLICY §3 (LOCKED) — 6-step investor verification flow:
 *   1. Google Login (OAuth) — handled by @nai/auth
 *   2. Identity declaration (full legal name + date of birth)
 *   3. Identity verification via verify.iai.one (document + liveness + name/DOB match)
 *   4. Investment payment (VN QR / USD wire)
 *   5. 2FA activation (TOTP or SMS)
 *   6. Scoped private-room session (90-day expiry, revocable, 2FA gate)
 */

// ============================================================
// Verification state machine
// ============================================================

/**
 * The 6 steps of the investor verification flow.
 * An investor advances through these in order. Steps 1 (Google Login)
 * is handled by @nai/auth; this package owns steps 2–6.
 */
export type VerificationStep =
  | 'google_login'      // step 1 — @nai/auth
  | 'identity_declared' // step 2 — P2-B.3
  | 'identity_verified' // step 3 — P2-B.4 (verify.iai.one)
  | 'payment_submitted' // step 4 — P2-B.5/B.6
  | 'payment_matched'   // step 4b — P2-B.7
  | 'twofa_activated'   // step 5 — P2-B.8
  | 'room_granted';     // step 6 — access grant issued

/**
 * The investor's current position in the verification flow.
 * `current_step` is the step the investor must complete next.
 */
export interface VerificationState {
  investor_id: string;
  user_id: string;
  current_step: VerificationStep;
  completed_steps: VerificationStep[];
  /** ISO timestamp of last state transition. */
  updated_at: string;
  /** ISO timestamp of grant expiry (set when room_granted). */
  grant_expires_at: string | null;
  /** Whether the grant has been revoked. */
  revoked: boolean;
}

// ============================================================
// Step 2 — Identity declaration (P2-B.3)
// ============================================================

export interface IdentityDeclaration {
  declaration_id: string;
  investor_id: string;
  /** Full legal name as it appears on government ID. */
  full_legal_name: string;
  /** Date of birth (ISO date YYYY-MM-DD). */
  date_of_birth: string;
  /** Jurisdiction for KYC (Vietnam / Singapore / US / other). */
  jurisdiction: string;
  /** Self-attested accredited-investor status. */
  accredited_status: 'yes' | 'no' | 'unsure';
  /** Investor type. */
  investor_type: 'individual' | 'angel' | 'vc' | 'family-office' | 'strategic' | 'other';
  /** Intended investment size range. */
  intended_investment_range: '25-50' | '50-100' | '100-250' | '250+' | 'exploring';
  /** Optional company name. */
  company: string | null;
  /** Optional message. */
  message: string | null;
  /** Consent to contact. */
  consent_to_contact: boolean;
  /** Disclosure version accepted (per §6). */
  disclosure_version: string;
  /** NDA acceptance status. */
  nda_status: 'signed' | 'pending';
  /** ISO timestamp. */
  declared_at: string;
}

// ============================================================
// Step 3 — Identity verification via verify.iai.one (P2-B.4)
// ============================================================

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface IdentityVerificationRecord {
  verification_id: string;
  investor_id: string;
  /** Status of the verification. */
  status: VerificationStatus;
  /** Document type submitted (passport / national_id / driver_license). */
  document_type: string;
  /** Whether liveness check passed. */
  liveness_passed: boolean;
  /** Whether name on document matches declared name. */
  name_match: boolean;
  /** Whether DOB on document matches declared DOB. */
  dob_match: boolean;
  /** verify.iai.one session id (external reference). */
  external_session_id: string | null;
  /** ISO timestamp verification was started. */
  started_at: string;
  /** ISO timestamp verification was completed. */
  completed_at: string | null;
  /** Rejection reason if status = rejected. */
  rejection_reason: string | null;
}

// ============================================================
// Step 4 — Payment (P2-B.5 VN QR, P2-B.6 USD wire)
// ============================================================

export type PaymentMethod = 'vn_qr' | 'usd_wire';
export type PaymentStatus = 'initiated' | 'submitted' | 'matched' | 'mismatched' | 'expired' | 'refunded';

export interface PaymentRecord {
  payment_id: string;
  investor_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  /** Amount in VND (functional currency). */
  amount_vnd: number;
  /** Amount in USD (reporting currency, for USD wire). */
  amount_usd: number | null;
  /** Exchange rate assumption (USD→VND) if USD wire. */
  exchange_rate: number | null;
  /** Source date of the exchange rate. */
  exchange_rate_date: string | null;
  /** Bank memo / reference text. */
  memo: string;
  /** For VN QR: VietQR transfer code. For USD wire: bank reference. */
  bank_reference: string | null;
  /** ISO timestamp payment was initiated. */
  initiated_at: string;
  /** ISO timestamp payment was submitted (user uploaded receipt). */
  submitted_at: string | null;
  /** ISO timestamp payment was matched to bank confirmation. */
  matched_at: string | null;
}

// ============================================================
// Step 4b — Receipt upload + matching (P2-B.7)
// ============================================================

export interface PaymentReceipt {
  receipt_id: string;
  payment_id: string;
  investor_id: string;
  /** R2 object key where the receipt file is stored. */
  r2_object_key: string;
  /** Original filename. */
  original_filename: string;
  /** MIME type. */
  mime_type: string;
  /** File size in bytes. */
  size_bytes: number;
  /** SHA-256 hash of the file (dedup + integrity). */
  sha256: string;
  /** ISO timestamp uploaded. */
  uploaded_at: string;
  /** Whether the receipt matched the expected amount + memo. */
  matched: boolean;
  /** Match details (amount delta, memo substring match). */
  match_details: {
    amount_expected: number;
    amount_on_receipt: number | null;
    amount_delta: number | null;
    memo_expected: string;
    memo_on_receipt: string | null;
    memo_match: boolean;
  } | null;
}

// ============================================================
// Step 5 — 2FA activation (P2-B.8)
// ============================================================

export type TwoFactorMethod = 'totp' | 'sms';

export interface TwoFactorEnrollment {
  enrollment_id: string;
  investor_id: string;
  method: TwoFactorMethod;
  /** For TOTP: base32-encoded secret. For SMS: phone number (E.164). */
  secret: string;
  /** Whether the enrollment has been verified (user entered a valid code). */
  verified: boolean;
  /** Backup codes (one-time use, hashed). */
  backup_codes_hashed: string[];
  /** ISO timestamp enrolled. */
  enrolled_at: string;
  /** ISO timestamp verified. */
  verified_at: string | null;
}

// ============================================================
// Step 6 — Access grant (per §5)
// ============================================================

export type RoomScope = 'cap-table' | 'financial-model' | 'data-room' | 'contracts' | 'ip' | 'product-demo' | 'qualification' | 'security' | 'technical-audit';

export interface AccessGrant {
  grant_id: string;
  investor_id: string;
  /** List of private room scopes the investor may access. */
  room_scope: RoomScope[];
  /** Document ids or "all-in-scope". */
  document_scope: string[] | 'all-in-scope';
  /** Whether downloads are allowed. */
  download_allowed: boolean;
  /** ISO timestamp issued. */
  issued_at: string;
  /** ISO timestamp expires (max 90 days from issue). */
  expires_at: string;
  /** ISO timestamp revoked (null until revoked). */
  revoked_at: string | null;
  /** Who approved the grant. */
  approved_by: string;
  /** Disclosure version accepted at grant time. */
  disclosure_version: string;
  /** NDA status at grant time. */
  nda_status: 'signed' | 'pending';
}

// ============================================================
// Configuration — VN QR + USD wire (per §3)
// ============================================================

/**
 * VN QR checkout configuration.
 * Per INVESTOR_ACCESS_POLICY §3:
 *   TK 3051378, ACB HCM, Kasan JSC as commercial representative
 *   memo: "INVEST NGUYENAI.NET"
 *
 * VietQR standard: https://vietqr.vn/
 */
export interface VnQrConfig {
  /** Bank account number. */
  account_number: string;
  /** Bank code (ACB = Asia Commercial Bank). */
  bank_code: string;
  /** Account holder name. */
  account_holder: string;
  /** Bank branch. */
  branch: string;
  /** Default memo prefix. */
  memo_prefix: string;
  /** VietQR image template id. */
  template: string;
}

/**
 * USD wire configuration.
 * Per INVESTOR_ACCESS_POLICY §3: VIET CAN NEW CORP details after verification.
 * Details are NOT exposed until identity_verified step is reached.
 */
export interface UsdWireConfig {
  beneficiary_name: string;
  beneficiary_address: string;
  bank_name: string;
  bank_address: string;
  swift_code: string;
  account_number: string;
  routing_number: string | null;
  reference_prefix: string;
}

// ============================================================
// Store interface
// ============================================================

export interface InvestorVerifyStore {
  // Verification state
  getState(investor_id: string): Promise<VerificationState | null>;
  upsertState(state: VerificationState): Promise<void>;

  // Identity declaration
  getDeclaration(investor_id: string): Promise<IdentityDeclaration | null>;
  saveDeclaration(decl: IdentityDeclaration): Promise<void>;

  // Identity verification
  getVerification(investor_id: string): Promise<IdentityVerificationRecord | null>;
  saveVerification(record: IdentityVerificationRecord): Promise<void>;

  // Payment
  getPayment(payment_id: string): Promise<PaymentRecord | null>;
  getPaymentByInvestor(investor_id: string): Promise<PaymentRecord | null>;
  savePayment(payment: PaymentRecord): Promise<void>;

  // Receipt
  getReceipt(receipt_id: string): Promise<PaymentReceipt | null>;
  getReceiptsByPayment(payment_id: string): Promise<PaymentReceipt[]>;
  saveReceipt(receipt: PaymentReceipt): Promise<void>;

  // 2FA
  getEnrollment(investor_id: string): Promise<TwoFactorEnrollment | null>;
  saveEnrollment(enrollment: TwoFactorEnrollment): Promise<void>;

  // Grant
  getGrant(investor_id: string): Promise<AccessGrant | null>;
  saveGrant(grant: AccessGrant): Promise<void>;
  listActiveGrants(): Promise<AccessGrant[]>;

  // Cleanup
  deleteInvestorData(investor_id: string): Promise<void>;
}
