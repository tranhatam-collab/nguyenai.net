# Team 2 Completion Report — Payment E2E Chain (P0)

**Date:** 2026-07-17
**Team:** Team 2 — Product & Billing
**Scope:** P0 payment items from QA audit 2026-07-17
**Commit:** 27ef277
**Status:** ✅ CODE-LEVEL COMPLETE

---

## Executive Summary

Team 2 đã hoàn thành toàn bộ P0 payment items từ QA audit 2026-07-17:
- Webhook replay protection (event_id tracking, 72h TTL)
- Entitlement grant sau payment confirmation
- Refund flow với entitlement revocation
- Payment E2E test (47/47 pass)
- Commerce secret inventory update

**Total:** 137 tests pass (30 billing + 60 entitlement + 47 E2E), 0 failures.

---

## P0-PAY-1: Webhook Replay Protection ✅

**File:** `apps/api/src/webhook-replay.ts` (new)

**Implementation:**
- `checkReplay(gateway, eventId)` — kiểm tra event đã xử lý chưa
- `recordProcessed(gateway, eventId, result, response)` — ghi nhận event đã xử lý
- TTL 72 giờ, in-memory Map (production: KV with 72h TTL)
- Key format: `${gateway}:${eventId}`

**Integration:**
- Stripe webhook: check `event.id` → fallback `result.gateway_payment_id`
- PayOS webhook: check `body.event_id` → fallback `body.order_id` → `result.gateway_payment_id`
- Duplicate events return cached response with `replayed: true` flag

**Security impact:**
- Ngăn xử lý trùng event → tránh double-grant entitlement
- Ngăn double-refund
- Idempotent webhook processing

---

## P0-PAY-2: Entitlement Grant After Payment ✅

**File:** `packages/@nai/entitlement/src/index.ts` (updated)

**New functions:**
- `grantPaymentEntitlement(userId, tenantId, priceId, gateway, paymentId)` — grant entitlement + create subscription
- `revokePaymentEntitlement(userId, tenantId, priceId, refundId)` — revoke entitlement + cancel subscription

**Integration:**
- Stripe webhook → `grantPaymentEntitlement()` → audit event `entitlement_granted`
- PayOS webhook → `grantPaymentEntitlement()` → audit event `entitlement_granted`
- Refund → `revokePaymentEntitlement()` → audit event `entitlement_revoked`

**Subscription lifecycle:**
- Monthly/yearly prices → create subscription record
- Refund → cancel subscription (status = 'canceled')
- `listSubscriptions()` added to SubscriptionStore interface + InMemorySubscriptionStore

**Entitlement tracking:**
- Source: `payment:${gateway}` (e.g., `payment:stripe`, `payment:payos`)
- Granted by: `webhook:${gateway}`
- No expiry for MVP — subscription lifecycle handles revocation

---

## P0-PAY-3: Refund Flow ✅

**File:** `packages/@nai/billing/src/index.ts` (updated)

**New functions:**
- `createStripeRefund(env, req)` — Stripe Refunds API
- `createVnPayRefund(env, req)` — VNPay refund (simplified for MVP)
- `createPayOsRefund(env, req)` — PayOS refund via pay-gateway
- `parseStripeRefundEvent(event)` — parse `charge.refunded` webhook

**New types:**
- `RefundRequest` — refund request payload
- `RefundResult` — refund response with status (refunded/partial/failed)

**API routes:**
- `POST /v1/payment/refund` — admin only, requires reason
- `POST /v1/payment/webhook/stripe/refund` — Stripe refund webhook with replay protection

**Entitlement revocation:**
- After refund → `revokePaymentEntitlement()` → entitlement revoked + subscription canceled
- Audit events: `payment_refunded`, `entitlement_revoked`

---

## P0-PAY-4: Payment E2E Test ✅

**File:** `tests/e2e/payment-entitlement-refund-e2e.ts` (new)

**Tests:** 47/47 pass

| Test | Description | Assertions |
|------|-------------|------------|
| Stripe payment chain | checkout → webhook → entitlement → subscription → invoice → refund → revoke | 18 |
| PayOS payment chain | checkout → webhook → entitlement → subscription → invoice → refund → revoke | 10 |
| Replay protection | duplicate event detection | 3 |
| Entitlement resolution | before/after payment | 2 |
| VAT computation | VN (10%) vs international (0%) | 6 |
| Stripe event parsing | checkout.session.completed | 5 |
| PayOS webhook parsing | payment.completed vs pending | 4 |

**Coverage:**
- Full chain: checkout → signed webhook → entitlement → subscription → invoice → refund → revoke
- Replay protection: duplicate event returns cached response
- VAT: VN customer (KASAN JSC, 10%) vs international (VIET CAN NEW CORP, 0%)
- Gateway: Stripe (USD) + PayOS (VND)
- Entitlement: grant + revoke + resolve
- Subscription: create + cancel

---

## P0-PAY-5: Commerce Secret Inventory ✅

**File:** `config/secret-governance.json` (updated)

**Changes:**
- Updated PayOS group: added `PAY_GATEWAY_BASE_URL`, `PAY_GATEWAY_TENANT_CODE`, `PAY_GATEWAY_SITE_CODE`
- Added `commerceGroupLabels` — human-readable labels for each gateway group
- Added `commerceNote` — documentation on which group to set
- Updated timestamp to 2026-07-17

**Commerce groups (at least one required):**
1. PayOS/VietQR: `PAY_GATEWAY_API_KEY`, `PAY_NAI_HMAC`, `PAY_GATEWAY_BASE_URL`, `PAY_GATEWAY_TENANT_CODE`, `PAY_GATEWAY_SITE_CODE`
2. Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. VNPay: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`

**Note:** Setting actual secret values is Founder/Ops task. Code-side inventory is complete.

---

## Test Results

| Category | Tests | Status |
|----------|-------|--------|
| @nai/billing unit tests | 30/30 | ✅ PASS |
| @nai/entitlement unit tests | 60/60 | ✅ PASS |
| Payment E2E | 47/47 | ✅ PASS |
| **Total** | **137/137** | **✅ 100%** |

## Build Status

| Check | Result |
|-------|--------|
| apps/api build (wrangler deploy --dry-run) | ✅ PASS |
| Brand naming audit | ✅ PASS (0 violations) |

---

## Git Commit

| Commit | Description |
|--------|-------------|
| 27ef277 | P0-PAY: Payment E2E chain — replay protection, entitlement grant, refund |

**Files changed:** 6 files, 1039 insertions, 6 deletions

---

## What's Still Blocked (Founder/Ops)

| Item | Why blocked | Who |
|------|-------------|-----|
| Set actual commerce secret values | Merchant account + legal | Founder/Ops |
| Stripe merchant account | Legal entity + bank | Founder/Legal |
| PayOS/KASAN JSC merchant | Vietnam entity | Founder/Legal |
| VNPay merchant | Vietnam entity | Founder/Legal |
| Remove JWT_SECRET | wrangler secret delete | Founder/Ops |
| Production webhook URL config | Gateway dashboard | Founder/Ops |

---

## Next Steps for Team 2

1. **Integration test with real gateway** — khi Founder set commerce secrets, chạy production webhook test
2. **Payment UI** — checkout page, success/cancel pages, refund admin UI
3. **Subscription renewal** — automatic renewal + dunning
4. **Payment reconciliation** — daily reconciliation between gateway + entitlement records
5. **Invoice PDF** — generate PDF invoice with VAT breakdown

---

## Verdict

**Code-Level Status:** ✅ COMPLETE

- Payment E2E chain implemented: checkout → webhook → entitlement → refund → revoke
- Replay protection prevents double-processing
- Entitlement grant/revoke automated
- Refund flow with admin endpoint + webhook
- 137/137 tests pass
- Build pass

**Production Status:** 🔴 BLOCKED (Founder/Ops)

- Commerce secret values not set (requires merchant account)
- JWT_SECRET not removed (requires wrangler secret delete)
- Production webhook URLs not configured

**Team 2 P0 Payment Items: COMPLETE** ✅
