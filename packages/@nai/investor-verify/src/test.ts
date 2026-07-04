/**
 * @nai/investor-verify — Tests
 *
 * E2E test of the 6-step investor verification flow:
 *   1. init state
 *   2. declare identity
 *   3. verify identity (stub adapter auto-approves)
 *   4. initiate + submit payment
 *   4b. upload receipt → match
 *   5. enroll + verify 2FA
 *   6. issue grant + check grant
 *
 * Run: pnpm --filter @nai/investor-verify test
 */

import assert from 'node:assert/strict';
import {
  InMemoryInvestorVerifyStore,
  setInvestorVerifyStore,
  initVerificationState,
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
  checkGrant,
  revokeGrant,
  sweepExpiredGrants,
  generateTotpSecret,
  generateTotpCode,
  getVerificationState,
} from './index';

const INVESTOR_ID = 'inv-test-001';
const USER_ID = 'user-test-001';

async function run(): Promise<void> {
  // Reset store
  setInvestorVerifyStore(new InMemoryInvestorVerifyStore());

  // Step 1 — init state
  const state1 = await initVerificationState(INVESTOR_ID, USER_ID);
  assert.equal(state1.current_step, 'identity_declared');
  assert.deepEqual(state1.completed_steps, ['google_login']);
  console.log('✓ Step 1: init state');

  // Step 2 — declare identity
  const decl = await declareIdentity({
    investor_id: INVESTOR_ID,
    user_id: USER_ID,
    full_legal_name: 'Nguyen Van A',
    date_of_birth: '1990-01-15',
    jurisdiction: 'Vietnam',
    accredited_status: 'yes',
    investor_type: 'individual',
    intended_investment_range: '50-100',
    consent_to_contact: true,
    nda_status: 'signed',
  });
  assert.equal(decl.full_legal_name, 'Nguyen Van A');
  const state2 = await getVerificationState(INVESTOR_ID);
  assert.equal(state2?.current_step, 'identity_verified');
  assert.ok(state2?.completed_steps.includes('identity_declared'));
  console.log('✓ Step 2: declare identity');

  // Step 3 — identity verification (stub auto-approves)
  const { external_session_id, widget_url } = await startIdentityVerification(INVESTOR_ID);
  assert.ok(external_session_id);
  assert.ok(widget_url);
  const verif = await completeIdentityVerification(INVESTOR_ID);
  assert.equal(verif.status, 'approved');
  assert.equal(verif.liveness_passed, true);
  assert.equal(verif.name_match, true);
  const state3 = await getVerificationState(INVESTOR_ID);
  assert.equal(state3?.current_step, 'payment_submitted');
  console.log('✓ Step 3: identity verification (stub)');

  // Step 4 — initiate VN QR payment
  const payment = await initiatePayment({
    investor_id: INVESTOR_ID,
    method: 'vn_qr',
    amount_vnd: 50_000_000,
  });
  assert.equal(payment.method, 'vn_qr');
  assert.equal(payment.status, 'initiated');
  assert.ok(payment.memo.includes('INVEST NGUYENAI.NET'));

  const qr = getVnQrCheckoutPayload(payment);
  assert.ok(qr.image_url.includes('ACB-3051378'));
  assert.ok(qr.qr_string.includes('vietqr://ACB/3051378'));
  console.log('✓ Step 4a: initiate VN QR payment');

  // USD wire instructions (only available after identity_verified)
  const wire = await getUsdWireInstructions(INVESTOR_ID);
  assert.equal(wire.beneficiary_name, 'VIET CAN NEW CORP');
  console.log('✓ Step 4b: USD wire instructions accessible');

  // Submit payment
  const submitted = await submitPayment(payment.payment_id, 'BANK-REF-001');
  assert.equal(submitted.status, 'submitted');
  assert.equal(submitted.bank_reference, 'BANK-REF-001');
  console.log('✓ Step 4c: submit payment');

  // Step 4b — upload receipt (matched)
  const receipt = await uploadReceipt({
    payment_id: payment.payment_id,
    investor_id: INVESTOR_ID,
    r2_object_key: 'receipts/test-receipt.pdf',
    original_filename: 'transfer-receipt.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    sha256: 'abc123',
    amount_on_receipt: 50_000_000,
    memo_on_receipt: payment.memo,
  });
  assert.equal(receipt.matched, true);
  assert.equal(receipt.match_details?.memo_match, true);
  assert.equal(receipt.match_details?.amount_delta, 0);

  const updatedPayment = await initiatePayment({
    investor_id: INVESTOR_ID,
    method: 'vn_qr',
    amount_vnd: 1,
  }).catch(() => null);
  // state should have advanced to payment_matched
  const state4 = await getVerificationState(INVESTOR_ID);
  assert.equal(state4?.current_step, 'twofa_activated');
  console.log('✓ Step 4d: receipt upload + match');

  // Step 5 — 2FA (TOTP)
  const secret = generateTotpSecret();
  assert.ok(secret.length >= 32);
  const { enrollment, backup_codes } = await enroll2FA({
    investor_id: INVESTOR_ID,
    method: 'totp',
    secret,
  });
  assert.equal(enrollment.method, 'totp');
  assert.equal(enrollment.verified, false);
  assert.equal(backup_codes.length, 8);

  // Verify with correct code
  const code = generateTotpCode(secret);
  const verified = await verify2FA(INVESTOR_ID, code);
  assert.equal(verified, true);
  const state5 = await getVerificationState(INVESTOR_ID);
  assert.equal(state5?.current_step, 'room_granted');
  console.log('✓ Step 5: 2FA TOTP enrollment + verify');

  // Step 6 — issue grant
  const grant = await issueGrant({
    investor_id: INVESTOR_ID,
    room_scope: ['cap-table', 'financial-model', 'data-room'],
    document_scope: 'all-in-scope',
    download_allowed: true,
    approved_by: 'admin-001',
    duration_days: 90,
  });
  assert.equal(grant.room_scope.length, 3);
  assert.equal(grant.revoked_at, null);
  assert.ok(new Date(grant.expires_at) > new Date());

  const fetched = await getGrant(INVESTOR_ID);
  assert.equal(fetched?.grant_id, grant.grant_id);
  console.log('✓ Step 6: issue grant');

  // Check grant — allowed
  const check1 = await checkGrant(INVESTOR_ID, 'cap-table');
  assert.equal(check1.allowed, true);
  assert.equal(check1.reason, 'ok');

  // Check grant — scope not granted
  const check2 = await checkGrant(INVESTOR_ID, 'ip');
  assert.equal(check2.allowed, false);
  assert.equal(check2.reason, 'scope_not_granted');
  console.log('✓ Grant check (allowed + scope denied)');

  // Revoke grant
  const revoked = await revokeGrant(INVESTOR_ID, 'admin-001');
  assert.ok(revoked.revoked_at);
  const check3 = await checkGrant(INVESTOR_ID, 'cap-table');
  assert.equal(check3.allowed, false);
  assert.equal(check3.reason, 'revoked');
  console.log('✓ Grant revoke');

  // Sweep expired grants — none expired yet
  const swept = await sweepExpiredGrants();
  assert.equal(swept, 0);
  console.log('✓ Sweep expired grants (0)');

  // Test step order violation
  setInvestorVerifyStore(new InMemoryInvestorVerifyStore());
  await initVerificationState('inv-002', 'user-002');
  await assert.rejects(
    initiatePayment({ investor_id: 'inv-002', method: 'vn_qr', amount_vnd: 1000 }),
    /step_order_violation/,
  );
  console.log('✓ Step order violation rejected');

  // Test identity declaration validation
  await assert.rejects(
    declareIdentity({
      investor_id: 'inv-003',
      user_id: 'user-003',
      full_legal_name: '',
      date_of_birth: '1990-01-15',
      jurisdiction: 'Vietnam',
      accredited_status: 'yes',
      investor_type: 'individual',
      intended_investment_range: '50-100',
      consent_to_contact: true,
    }),
    /full_legal_name required/,
  );
  console.log('✓ Identity declaration validation');

  console.log('\nAll @nai/investor-verify tests passed.');
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
