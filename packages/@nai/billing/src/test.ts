/**
 * @nai/billing — Test suite
 *
 * Tests: VAT computation, invoice generation, webhook parsing.
 * Gateway integration (Stripe/VNPay) requires live API keys — tested via tools/test-models.mjs pattern.
 */

import { computeVat, generateInvoice, parseStripeEvent, parseVnPayReturn, type PaymentResult } from './index';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

// ============================================================
// VAT computation
// ============================================================

console.log('\n=== VAT Computation ===');

const vatVn = computeVat(199000, 'VND', true);
assert(vatVn.vat_amount === 19900, 'VND Vietnam customer: 10% VAT = 19900');
assert(vatVn.vat_rate === 0.10, 'VND Vietnam customer: rate = 0.10');
assert(vatVn.issuing_entity === 'KASAN_JSC', 'VND Vietnam customer: Kasan JSC issues');

const vatUsd = computeVat(8, 'USD', false);
assert(vatUsd.vat_amount === 0, 'USD international customer: 0 VAT');
assert(vatUsd.vat_rate === 0, 'USD international customer: rate = 0');
assert(vatUsd.issuing_entity === 'VIET_CAN_NEW_CORP', 'USD international customer: VIET CAN NEW CORP issues');

const vatVndInternational = computeVat(199000, 'VND', false);
assert(vatVndInternational.issuing_entity === 'KASAN_JSC', 'VND always Kasan JSC regardless of customer location');

// ============================================================
// Invoice generation
// ============================================================

console.log('\n=== Invoice Generation ===');

const mockPayment: PaymentResult = {
  payment_id: 'test-123',
  gateway: 'stripe',
  gateway_payment_id: 'cs_test_123',
  amount: 8,
  currency: 'USD',
  price_id: 'academy-pass',
  user_id: 'user-1',
  tenant_id: 'tenant-1',
  status: 'paid',
  paid_at: '2026-07-03T00:00:00Z',
  raw: {},
};

const invoice = generateInvoice(mockPayment, false);
assert(invoice.invoice_id.startsWith('INV-'), 'Invoice ID starts with INV-');
assert(invoice.payment_id === 'test-123', 'Invoice links to payment');
assert(invoice.amount === 8, 'Invoice amount = 8 USD');
assert(invoice.currency === 'USD', 'Invoice currency = USD');
assert(invoice.vat_amount === 0, 'USD invoice: 0 VAT');
assert(invoice.issued_by_entity === 'VIET_CAN_NEW_CORP', 'USD invoice: VIET CAN NEW CORP');
assert(invoice.status === 'issued', 'Invoice status = issued');

const invoiceVn = generateInvoice({ ...mockPayment, currency: 'VND', amount: 199000 }, true);
assert(invoiceVn.vat_amount === 19900, 'VND invoice: 19900 VAT');
assert(invoiceVn.issued_by_entity === 'KASAN_JSC', 'VND invoice: Kasan JSC');

// ============================================================
// Stripe event parsing
// ============================================================

console.log('\n=== Stripe Event Parsing ===');

const checkoutEvent = {
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123',
      amount_total: 800,
      currency: 'usd',
      metadata: { user_id: 'user-1', tenant_id: 'tenant-1', price_id: 'academy-pass' },
    },
  },
};

const result = parseStripeEvent(checkoutEvent);
assert(result !== null, 'checkout.session.completed parsed');
assert(result?.gateway === 'stripe', 'Parsed: gateway = stripe');
assert(result?.amount === 8, 'Parsed: amount = 8 (800/100)');
assert(result?.currency === 'USD', 'Parsed: currency = USD');
assert(result?.user_id === 'user-1', 'Parsed: user_id from metadata');
assert(result?.price_id === 'academy-pass', 'Parsed: price_id from metadata');
assert(result?.status === 'paid', 'Parsed: status = paid');

const irrelevantEvent = { type: 'customer.updated', data: { object: {} } };
assert(parseStripeEvent(irrelevantEvent) === null, 'Irrelevant event returns null');

// ============================================================
// VNPay return parsing
// ============================================================

console.log('\n=== VNPay Return Parsing ===');

const vnpayParams: Record<string, string> = {
  vnp_Amount: '19900000',
  vnp_ResponseCode: '00',
  vnp_TxnRef: 'test123',
  vnp_SecureHash: 'abc',
};

const vnpayResult = parseVnPayReturn(vnpayParams);
assert(vnpayResult.gateway === 'vnpay', 'VNPay: gateway = vnpay');
assert(vnpayResult.amount === 199000, 'VNPay: amount = 199000 (19900000/100)');
assert(vnpayResult.currency === 'VND', 'VNPay: currency = VND');
assert(vnpayResult.status === 'paid', 'VNPay: status = paid (code 00)');
assert(vnpayResult.gateway_payment_id === 'test123', 'VNPay: txnRef captured');

const vnpayFailed = parseVnPayReturn({ ...vnpayParams, vnp_ResponseCode: '99' });
assert(vnpayFailed.status === 'failed', 'VNPay: failed response code = failed status');

// ============================================================
// Summary
// ============================================================

console.log(`\n=== BILLING TEST SUMMARY ===`);
console.log(`Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error('❌ BILLING TESTS FAILED');
  process.exit(1);
} else {
  console.log('✅ ALL BILLING TESTS PASSED');
}
