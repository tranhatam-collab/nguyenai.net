# QA VERIFICATION — Go-Live Readiness (4 fronts)

> **Auditor:** AI QA Specialist — Chief Inspector (36+ năm, khó tính nhất)
> **Ngày:** 2026-07-03
> **Báo cáo được verify:** Go-live readiness report (commit `1e6ff74`)
> **Phương pháp:** Verify độc lập từng front + security audit sâu

---

## TÓM TẮT

| Front | Claim | Verify | Verdict |
|---|---|---|---|
| Pháp lý | Terms + Privacy + footer | ✅ All verified | ✅ PASS |
| Google OAuth | 2 routes + db functions | ✅ Exists + functional structure | ⚠️ **P0 CSRF** |
| Payment | @nai/billing + 4 routes | ✅ Real Stripe API + webhook sig | ⚠️ **P0 open redirect + double audit** |
| Deployment | wrangler + CI/CD + guide | ✅ All exists | ✅ PASS |
| Build 54 pages | PASS | ✅ Verified 54 pages | ✅ |
| Tests 63/63 | PASS | ✅ Verified 63/63 FULL TURBO | ✅ |

**Phát hiện 4 NEW security issues không trong báo cáo.**

---

## ✅ VERIFIED PASS

### Pháp lý — PASS
- Terms VI: 8791 B, H1 "Điều khoản dịch vụ Nguyen AI Computer", lang="vi" ✅
- Privacy VI: 8924 B ✅
- Terms EN: 7754 B, H1 "Nguyen AI Computer Terms of Service", lang="en" ✅
- Privacy EN: 8302 B ✅
- Footer: `/terms`, `/privacy`, "VIET CAN", "Kasan", "footer-legal" — all present ✅

### Deployment — PASS
- `apps/web/wrangler.jsonc` exists with `pages_build_output_dir: "./dist"` ✅
- `.github/workflows/deploy.yml` exists: verify → deploy-web → deploy-api → deploy-auth ✅
- CI: typecheck → build → test → upload artifact → deploy ✅

### Build + Test — PASS
- Build: 53/53 tasks (cached) ✅
- Test: 63/63 tasks (cached) ✅
- 54 HTML pages ✅

---

## 🔴 NEW P0 — Security issues không trong báo cáo

### NEW-P0-1: OAuth state parameter KHÔNG được verify — CSRF vulnerability

**Mức:** P0 Security — OAuth CSRF
**File:** `apps/auth/src/index.ts:816-835` (begin), `836-870` (callback)

**Vấn đề:**
- `begin` route generate `state` token → trả về trong JSON response
- `callback` route nhận `state` từ query param → **KHÔNG compare với state gốc**
- State không được lưu trong cookie, DB, hoặc anywhere

**Tấn công (OAuth CSRF):**
1. Attacker bắt đầu OAuth flow với Google account của attacker → nhận `state` + `authorize_url`
2. Attacker gửi `authorize_url` cho nạn nhân (nhưng dùng account của attacker)
3. Nạn nhân click → Google redirect callback với code + state của attacker
4. Worker exchange code → tạo session cho **account của attacker** (không phải nạn nhân)
5. Nếu auto-create user + auto-link OAuth → nạn nhân login vào account của attacker

**Fix:** Lưu state trong HttpOnly cookie ở `begin`, verify ở `callback`:
```typescript
// begin
c.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

// callback
const expectedState = parseCookie(c.req.header('Cookie') ?? '', 'oauth_state');
if (state !== expectedState) {
  return c.json({ error: 'state mismatch — possible CSRF' }, 400);
}
```

---

### NEW-P0-2: Open redirect qua success_url/cancel_url

**Mức:** P0 Security — Open redirect
**File:** `apps/api/src/index.ts:437-438`

```typescript
success_url: success_url ?? `https://app.nguyenai.net/payment/success`,
cancel_url: cancel_url ?? `https://app.nguyenai.net/payment/cancel`,
```

**Vấn đề:** User cung cấp `success_url` arbitrary — không validate domain. Stripe redirect user đến URL này sau khi thanh toán.

**Tấn công:**
1. Attacker tạo checkout với `success_url: "https://evil.com/phishing"`
2. User thanh toán legit trên Stripe
3. Stripe redirect user đến `evil.com` → phishing

**Fix:** Validate success_url/cancel_url phải thuộc `*.nguyenai.net`:
```typescript
function isAllowedRedirect(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith('.nguyenai.net') || u.hostname === 'nguyenai.net';
  } catch { return false; }
}
if (!isAllowedRedirect(success_url)) return c.json({ error: 'invalid success_url' }, 400);
```

---

### NEW-P0-3: payment_received audit logged TRƯỚC khi payment confirmed

**Mức:** P0 Logic — False audit trail
**File:** `apps/api/src/index.ts:452-457` (checkout), `558` (webhook)

```typescript
// Checkout route — logs payment_received khi tạo session, CHƯA thanh toán
await logAuditEvent({
  event_type: 'payment_received',  // ← SAI: payment chưa received, chỉ created
  result: 'success',
  ...
});

// Webhook route — logs AGAIN khi Stripe confirm
await logAuditEvent({
  event_type: 'payment_received',  // ← duplicate
  ...
});
```

**Hậu quả:**
- Audit log có `payment_received` cho payment chưa hoàn thành → false financial record
- Double logging: 1 checkout + 1 webhook = 2 events cho 1 payment
- Compliance issue: audit log phải reflect reality, không phải intent

**Fix:**
- Checkout route: log `payment_checkout_created` (not `payment_received`)
- Webhook route: log `payment_received` (chỉ khi Stripe confirm)
- Add `payment_event_type` to audit schema: `checkout_created`, `payment_received`, `payment_failed`

---

### NEW-P1-1: VNPay return là GET — replay attack possible

**Mức:** P1 Security — Replay
**File:** `apps/api/src/index.ts:493`

VNPay return URL nhận params qua GET. User có thể bookmark/share URL → replay. Signature verify giúp (HMAC-SHA512) nhưng:
- VNPay return URL chứa `vnp_SecureHash` — nếu leaked, attacker có thể replay
- GET params logged trong access logs, browser history, CDN logs

**Fix:** Sau khi verify + process, redirect user đến app page (302) thay vì trả JSON trực tiếp. Hoặc dùng one-time nonce.

---

## 🟡 P1 — Carried over / underreported

### P1-1: Checkout email = empty string

**File:** `apps/api/src/index.ts:434`

```typescript
email: '', // would fetch from auth service
```

Stripe checkout tạo session không có customer email → Stripe không gửi receipt, không link customer. Comment nói "would fetch from auth service" — nhưng API Worker session resolver là stub (luôn null), nên không bao giờ fetch được.

**Fix:** Khi API Worker có real session, fetch user email từ auth service trước khi tạo checkout.

---

### P1-2: @nai/billing 0 test files

**File:** `packages/@nai/billing/` — 416 dòng code, 0 test

Package xử lý tiền thật (Stripe API, VNPay, webhook verification, invoice generation) nhưng không có 1 test nào. Webhook signature verification đặc biệt critical — bug ở đây = accept fake payment.

**Fix:** Viết test cho:
- `verifyStripeWebhook` — valid/invalid signature
- `verifyVnPayReturn` — valid/invalid signature
- `createStripeCheckout` — mock Stripe API
- `createVnPayCheckout` — URL generation + signing
- `generateInvoice` — VAT calculation

---

### P1-3: 5 cảnh báo đỏ từ báo cáo gốc — confirmed nhưng chưa fix

Báo cáo gốc list 5 cảnh báo đỏ, tất cả confirmed:
1. ✅ VIET CAN NEW CORP chưa form — disclaimer "formation in progress" verified
2. ✅ IP agreement chưa execute
3. ✅ verify.iai.one chưa integrate
4. ✅ Subscription state management chưa có — chỉ log audit, không có subscriptions table
5. ✅ 32/50 pages thin content (báo cáo nói 32, audit trước verify 33)

---

## VERDICT TỔNG

| Front | Báo cáo gốc | Verify độc lập |
|---|---|---|
| Pháp lý | Built | ✅ PASS — Terms + Privacy + footer verified |
| Google OAuth | Built | ⚠️ **P0 CSRF** — state không verify |
| Payment | Built | ⚠️ **P0 open redirect + P0 false audit + P1 0 test** |
| Deployment | Built | ✅ PASS — wrangler + CI/CD + guide |
| Build 54 pages | PASS | ✅ Verified |
| Tests 63/63 | PASS | ✅ Verified |

**Tổng issues:**
- 3 P0 mới (CSRF, open redirect, false audit)
- 2 P1 mới (empty email, 0 test billing)
- 5 cảnh báo đỏ confirmed (chưa fix)

**Verdict:** ⚠️ **4 fronts built nhưng 3 P0 security phải fix trước go-live. OAuth CSRF + open redirect là critical. Payment audit false là compliance issue.**

---

**Auditor:** AI QA Specialist — Chief Inspector
**Ngày:** 2026-07-03
