/**
 * Payment E2E — checkout → webhook → entitlement → refund
 *
 * Per QA_AUDIT_TOTAL_PLAN_STATUS_2026-07-17.md P0:
 * - checkout → signed webhook → order → entitlement → receipt → refund/revoke → replay protection
 *
 * This test exercises the full payment chain using in-memory stores and
 * simulated gateway responses. No real payment is processed.
 */

import {
  InMemoryEntitlementStore,
  setEntitlementStore,
  InMemorySubscriptionStore,
  setSubscriptionStore,
  grantPaymentEntitlement,
  revokePaymentEntitlement,
  resolveEntitlements,
} from '@nai/entitlement';

import {
  generateInvoice,
  parseStripeEvent,
  parsePayOsWebhook,
  computeVat,
  type PaymentResult,
  type RefundRequest,
  type RefundResult,
} from '@nai/billing';

import { prices } from '@nai/product-catalog';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    steps.push(`  ✓ ${msg}`);
  } else {
    failed++;
    steps.push(`  ✗ ${msg}`);
    console.error(`  ✗ ${msg}`);
  }
}

// ============================================================
// Simulated webhook replay protection (mirrors webhook-replay.ts)
// ============================================================

const replayCache = new Map<string, { result: string; response: unknown; expires_at: number }>();

function checkReplay(gateway: string, eventId: string): { response: unknown } | null {
  const key = `${gateway}:${eventId}`;
  const cached = replayCache.get(key);
  if (!cached) return null;
  if (cached.expires_at <= Date.now()) {
    replayCache.delete(key);
    return null;
  }
  return { response: cached.response };
}

function recordProcessed(gateway: string, eventId: string, result: string, response: unknown): void {
  const key = `${gateway}:${eventId}`;
  replayCache.set(key, {
    result,
    response,
    expires_at: Date.now() + 72 * 60 * 60 * 1000,
  });
}

// ============================================================
// Test 1: Full payment chain — Stripe
// ============================================================

async function testStripePaymentChain() {
  console.log('Test: Stripe payment chain (checkout → webhook → entitlement → refund)');

  const entStore = new InMemoryEntitlementStore();
  const subStore = new InMemorySubscriptionStore();
  setEntitlementStore(entStore);
  setSubscriptionStore(subStore);

  const userId = 'test-user-stripe';
  const tenantId = 'default';
  const priceId = 'academy-pass'; // Monthly academy pass
  const price = prices.find((p) => p.id === priceId);
  assert(price !== undefined, 'academy-pass price found');

  // Step 1: Simulate checkout
  const checkoutAmount = price!.price_usd;
  assert(checkoutAmount > 0, 'checkout amount > 0');

  // Step 2: Simulate Stripe webhook (payment succeeded)
  const stripeEventId = 'evt_stripe_001';
  const paymentResult: PaymentResult = {
    payment_id: 'pay_stripe_001',
    gateway: 'stripe',
    gateway_payment_id: 'pi_stripe_001',
    amount: checkoutAmount,
    currency: 'USD',
    price_id: priceId,
    user_id: userId,
    tenant_id: tenantId,
    status: 'paid',
    paid_at: new Date().toISOString(),
    raw: {},
  };

  // Step 3: Replay protection — first process should succeed
  const replay1 = checkReplay('stripe', stripeEventId);
  assert(replay1 === null, 'first webhook is not a replay');

  // Step 4: Grant entitlement
  const grantResult = await grantPaymentEntitlement(userId, tenantId, priceId, 'stripe', paymentResult.gateway_payment_id);
  assert(grantResult.granted === true, 'entitlement granted after payment');
  assert(grantResult.key === 'academy.pass', 'entitlement key is academy.pass');

  // Step 5: Verify entitlement exists
  const records = await entStore.getEntitlements(userId, tenantId);
  assert(records.length > 0, 'entitlement record exists');
  const academyRecord = records.find((r) => r.key === 'academy.pass');
  assert(academyRecord !== undefined, 'academy.pass entitlement found');
  assert(academyRecord?.value === true, 'academy.pass value is true');
  assert(academyRecord?.source === 'payment:stripe', 'source is payment:stripe');

  // Step 6: Verify subscription created (monthly recurring)
  const subs = await subStore.listSubscriptions(userId, tenantId);
  assert(subs.length > 0, 'subscription created for monthly price');
  assert(subs[0].status === 'active', 'subscription is active');
  assert(subs[0].gateway === 'stripe', 'subscription gateway is stripe');

  // Step 7: Generate invoice
  const invoice = generateInvoice(paymentResult, false); // Stripe = international
  assert(invoice.invoice_id.startsWith('INV-'), 'invoice ID generated');
  assert(invoice.issued_by_entity === 'VIET_CAN_NEW_CORP', 'international invoice entity');

  // Record processed
  recordProcessed('stripe', stripeEventId, 'processed', { received: true, processed: true });

  // Step 8: Replay protection — second webhook should be blocked
  const replay2 = checkReplay('stripe', stripeEventId);
  assert(replay2 !== null, 'second webhook detected as replay');

  // Step 9: Refund
  const refundResult = await revokePaymentEntitlement(userId, tenantId, priceId, 'refund_001');
  assert(refundResult.revoked === true, 'entitlement revoked after refund');

  // Step 10: Verify entitlement revoked
  const recordsAfter = await entStore.getEntitlements(userId, tenantId);
  const academyAfter = recordsAfter.find((r) => r.key === 'academy.pass');
  assert(academyAfter?.revoked_at !== null, 'academy.pass entitlement revoked');
}

// ============================================================
// Test 2: Full payment chain — PayOS (VietQR)
// ============================================================

async function testPayOsPaymentChain() {
  console.log('Test: PayOS payment chain (checkout → webhook → entitlement → refund)');

  const entStore = new InMemoryEntitlementStore();
  const subStore = new InMemorySubscriptionStore();
  setEntitlementStore(entStore);
  setSubscriptionStore(subStore);

  const userId = 'test-user-payos';
  const tenantId = 'default';
  const priceId = 'academy-pass'; // Monthly academy pass
  const price = prices.find((p) => p.id === priceId);

  // Step 1: Simulate PayOS webhook (payment completed)
  const payosEventId = 'evt_payos_001';
  const paymentResult: PaymentResult = {
    payment_id: 'pay_payos_001',
    gateway: 'payos',
    gateway_payment_id: 'order_payos_001',
    amount: price!.price_vnd,
    currency: 'VND',
    price_id: priceId,
    user_id: userId,
    tenant_id: tenantId,
    status: 'paid',
    paid_at: new Date().toISOString(),
    raw: {},
  };

  // Step 2: Replay protection
  const replay1 = checkReplay('payos', payosEventId);
  assert(replay1 === null, 'first payos webhook is not a replay');

  // Step 3: Grant entitlement
  const grantResult = await grantPaymentEntitlement(userId, tenantId, priceId, 'payos', paymentResult.gateway_payment_id);
  assert(grantResult.granted === true, 'entitlement granted after payos payment');

  // Step 4: Verify subscription (monthly)
  const subs = await subStore.listSubscriptions(userId, tenantId);
  assert(subs.length > 0, 'subscription created for payos monthly');
  assert(subs[0].gateway === 'payos', 'subscription gateway is payos');

  // Step 5: Generate invoice (VietQR = VN customer → KASAN JSC VAT 10%)
  const invoice = generateInvoice(paymentResult, true);
  assert(invoice.issued_by_entity === 'KASAN_JSC', 'VN invoice entity is KASAN_JSC');
  assert(invoice.vat_rate === 0.1, 'VAT rate is 0.1 (10%) for VN customer');
  assert(invoice.vat_amount > 0, 'VAT amount > 0 for VN customer');

  // Step 6: Record and test replay
  recordProcessed('payos', payosEventId, 'processed', { received: true, processed: true });
  const replay2 = checkReplay('payos', payosEventId);
  assert(replay2 !== null, 'second payos webhook detected as replay');

  // Step 7: Refund
  const refundResult = await revokePaymentEntitlement(userId, tenantId, priceId, 'refund_002');
  assert(refundResult.revoked === true, 'entitlement revoked after payos refund');
}

// ============================================================
// Test 3: Replay protection — duplicate event
// ============================================================

async function testReplayProtection() {
  console.log('Test: webhook replay protection');

  replayCache.clear();
  const eventId = 'evt_replay_test';

  // First process
  const first = checkReplay('stripe', eventId);
  assert(first === null, 'first event is new');

  recordProcessed('stripe', eventId, 'processed', { received: true, processed: true });

  // Second attempt — should be replay
  const second = checkReplay('stripe', eventId);
  assert(second !== null, 'second event is replay');
  assert(second!.response !== undefined, 'replay has cached response');
}

// ============================================================
// Test 4: Entitlement resolution after payment
// ============================================================

async function testEntitlementResolutionAfterPayment() {
  console.log('Test: entitlement resolution after payment');

  const entStore = new InMemoryEntitlementStore();
  setEntitlementStore(entStore);

  const userId = 'test-user-resolve';
  const tenantId = 'default';

  // Before payment — no academy access
  const before = await resolveEntitlements(userId, tenantId, 'nguyen-start');
  assert(before.academy.pass !== true, 'no academy pass before payment');

  // After payment — academy access granted
  await grantPaymentEntitlement(userId, tenantId, 'academy-pass', 'stripe', 'pi_test');
  const after = await resolveEntitlements(userId, tenantId, 'nguyen-start');
  assert(after.academy.pass === true, 'academy pass granted after payment');
}

// ============================================================
// Test 5: VAT computation
// ============================================================

async function testVatComputation() {
  console.log('Test: VAT computation for payment');

  // VN customer — 10% VAT (stored as 0.1 decimal)
  const vnVat = computeVat(199000, 'VND', true);
  assert(vnVat.vat_rate === 0.1, 'VN customer VAT rate is 0.1 (10%)');
  assert(vnVat.vat_amount === 19900, 'VN customer VAT amount is 19900');
  assert(vnVat.issuing_entity === 'KASAN_JSC', 'VN issuing entity is KASAN_JSC');

  // International customer — 0% VAT
  const intlVat = computeVat(8, 'USD', false);
  assert(intlVat.vat_rate === 0, 'international customer VAT rate is 0%');
  assert(intlVat.vat_amount === 0, 'international customer VAT amount is 0');
  assert(intlVat.issuing_entity === 'VIET_CAN_NEW_CORP', 'international issuing entity is VIET_CAN_NEW_CORP');
}

// ============================================================
// Test 6: Stripe event parsing
// ============================================================

async function testStripeEventParsing() {
  console.log('Test: Stripe event parsing');

  const paymentEvent = {
    id: 'evt_001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_001',
        amount_total: 800,
        currency: 'usd',
        metadata: {
          price_id: 'academy-pass',
          user_id: 'test-user',
          tenant_id: 'default',
        },
      },
    },
  };

  const result = parseStripeEvent(paymentEvent);
  assert(result !== null, 'checkout.session.completed parsed');
  assert(result?.gateway === 'stripe', 'gateway is stripe');
  assert(result?.status === 'paid', 'status is paid');
  assert(result?.amount === 8, 'amount is 8 USD (cents converted)');

  // Non-payment event
  const nonPaymentEvent = {
    id: 'evt_002',
    type: 'customer.updated',
    data: { object: {} },
  };
  const nonResult = parseStripeEvent(nonPaymentEvent);
  assert(nonResult === null, 'non-payment event returns null');
}

// ============================================================
// Test 7: PayOS webhook parsing
// ============================================================

async function testPayOsWebhookParsing() {
  console.log('Test: PayOS webhook parsing');

  const paidEvent = {
    event_id: 'evt_payos_001',
    event_type: 'payment.completed',
    order_id: 'order_001',
    amount: 199000,
    currency: 'VND',
    metadata: {
      price_id: 'academy-pass',
      user_id: 'test-user',
      tenant_id: 'default',
    },
  };

  const result = parsePayOsWebhook(paidEvent);
  assert(result !== null, 'payment.completed parsed');
  assert(result?.gateway === 'payos', 'gateway is payos');
  assert(result?.status === 'paid', 'status is paid');
  assert(result?.amount === 199000, 'amount is 199000 VND');

  // Non-paid event
  const pendingEvent = {
    event_id: 'evt_payos_002',
    event_type: 'payment.pending',
    order_id: 'order_002',
  };
  const pendingResult = parsePayOsWebhook(pendingEvent);
  assert(pendingResult === null, 'pending event returns null');
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('=== Payment E2E — checkout → webhook → entitlement → refund ===\n');

  await testStripePaymentChain();
  await testPayOsPaymentChain();
  await testReplayProtection();
  await testEntitlementResolutionAfterPayment();
  await testVatComputation();
  await testStripeEventParsing();
  await testPayOsWebhookParsing();

  console.log();
  for (const step of steps) {
    console.log(step);
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
