#!/usr/bin/env node
/**
 * Production durability audit — CI gate.
 * Fails if production code paths use in-memory stores, simulated success,
 * or silent fallback where correctness depends on persistence.
 *
 * Per FULL_SCOPE_FAST_OPERATION_EXECUTION_PLAN_2026-07-17 OP-P0-04.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => { try { return fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { return ''; } };
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

// ============================================================
// 1. Webhook replay must use D1, not in-memory Map in production
// ============================================================
const webhookReplay = read('apps/api/src/webhook-replay.ts');
check(/D1ReplayStore|createD1ReplayStore/.test(webhookReplay), 'Webhook replay must have D1-backed store');
check(/setReplayStore\(createD1ReplayStore/.test(read('apps/api/src/index.ts')), 'API must init D1 replay store when DB available');

// ============================================================
// 2. Subscription store must have D1 persistence
// ============================================================
const entitlement = read('packages/@nai/entitlement/src/index.ts');
check(/D1SubscriptionStore/.test(entitlement), 'Entitlement must have D1SubscriptionStore');
check(/setSubscriptionStore\(new D1SubscriptionStore/.test(read('apps/api/src/index.ts')), 'API must init D1 subscription store when DB available');

// ============================================================
// 3. Refund functions must NOT return fake 'refunded' success
// ============================================================
const billing = read('packages/@nai/billing/src/index.ts');

// VNPay refund: must check credentials and return 'failed' if missing
check(/VNPAY_TMN_CODE.*VNPAY_HASH_SECRET/.test(billing) && /status: 'failed'/.test(billing), 'VNPay refund must fail-closed when credentials missing');

// PayOS refund: must NOT have simulated fallback that returns 'refunded'
const payosSection = billing.slice(billing.indexOf('createPayOsRefund'), billing.indexOf('parseStripeRefundEvent'));
check(!/Simulated response/.test(payosSection), 'PayOS refund must NOT have simulated response fallback');
check(/status: 'failed'/.test(payosSection), 'PayOS refund must return failed on error, not fake success');

// ============================================================
// 4. API must block mock provider in production
// ============================================================
const api = read('apps/api/src/index.ts');
check(/isProduction[\s\S]*mock/.test(api) && /BANNED[\s\S]*mock[\s\S]*production/.test(api), 'API must block mock provider in production');
check(/AI_PROVIDER_API_KEY.*503/.test(api), 'API must return 503 when production gateway key missing');

// ============================================================
// 5. No in-memory Map for production-critical state in apps/
// ============================================================
check(!/new Map\(\).*processedEvents/.test(webhookReplay.replace(/\/\/.*$/gm, '')), 'Webhook replay must not rely on in-memory Map for production');

// ============================================================
// Report
// ============================================================
if (failures.length) {
  console.error('PRODUCTION DURABILITY AUDIT FAILED');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log('PRODUCTION DURABILITY AUDIT PASSED');
console.log('  Checks: D1 replay store, D1 subscription store, refund fail-closed,');
console.log('          mock blocked in production, no in-memory critical state');
