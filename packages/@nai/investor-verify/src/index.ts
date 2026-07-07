/**
 * @nai/investor-verify — Public API
 *
 * Investor verification flow for invest.nguyenai.net private data room.
 * Per INVESTOR_ACCESS_POLICY §3 (LOCKED).
 *
 * NOTE: Type re-exports are intentionally omitted from this barrel file
 * because the Cloudflare Workers bundler (esbuild) misparses
 * `export type { ... }` re-exports when inlining workspace packages.
 * Consumers should import types directly from '@nai/investor-verify/src/types'
 * or use inline type annotations.
 */

export { InMemoryInvestorVerifyStore } from './store';

export {
  setInvestorVerifyStore,
  getInvestorVerifyStore,
  setVnQrConfig,
  setUsdWireConfig,
  getVnQrConfig,
  getUsdWireConfig,
  DEFAULT_VN_QR_CONFIG,
  DEFAULT_USD_WIRE_CONFIG,
  CURRENT_DISCLOSURE_VERSION,
  initVerificationState,
  getVerificationState,
  declareIdentity,
  getDeclaration,
  setVerifyAdapter,
  startIdentityVerification,
  completeIdentityVerification,
  getIdentityVerification,
  initiatePayment,
  getVnQrCheckoutPayload,
  getUsdWireInstructions,
  submitPayment,
  uploadReceipt,
  matchReceipt,
  getReceiptsByPayment,
  setSmsAdapter,
  generateTotpSecret,
  generateTotpCode,
  generateSmsCode,
  generateBackupCodes,
  enroll2FA,
  verify2FA,
  getEnrollment,
  issueGrant,
  getGrant,
  revokeGrant,
  checkGrant,
  sweepExpiredGrants,
} from './service';

export type { VerifyIaiOneAdapter, SmsAdapter, AuditContext, DeclareIdentityInput, InitiatePaymentInput, UploadReceiptInput, Enroll2FAInput, IssueGrantInput } from './service';
export type { RoomScope } from './types';
