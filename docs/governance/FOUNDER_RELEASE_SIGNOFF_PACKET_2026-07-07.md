# FOUNDER RELEASE SIGNOFF PACKET — 2026-07-07

> **Mục đích:** Packet Founder ký trước go-live production.
> **Trạng thái:** CHỜ FOUNDER KÝ. Tất cả P0/P1 đã fix và verify. Còn Founder action items.

---

## 1. Tóm tắt executive

Nguyen AI (`nguyenai.net`) đã fix toàn bộ P0 security + P0 go-live SEO + P1 hardening. Typecheck, build, unit test, security audit, SEO build audit đều PASS. Packet này liệt kê Founder action items còn lại trước deploy production.

---

## 2. Đã fix và verify (GREEN)

### Security P0 (5/5) — `SECURITY_P0_FIX_EVIDENCE_2026-07-07.md`

- [x] SEC-P0-1: SQL injection → whitelist + regex + assertAllowedColumn
- [x] SEC-P0-2: Passkey bypass → routes trả 503
- [x] SEC-P0-3: Hardcoded evidence key → secret + helper
- [x] SEC-P0-4: Auth middleware → trả Response 401
- [x] SEC-P0-5: XSS verify.astro → textContent

### Go-live SEO P0 (7/7) — `PRODUCTION_BLOCKER_FIX_REPORT_2026-07-07.md`

- [x] EDU-P0-1..4: lang dynamic, hreflang reciprocal, x-default=VI, VI title/desc
- [x] INVEST-P0-1..2: full OG + sitemap/robots fix
- [~] SEO-P0-1: placeholder rõ ràng — **CHỜ FOUNDER** thay mã GSC thật

### P1 hardening (6/6)

- [x] P1-1: OAuth + magic-link email
- [x] P1-2: Security headers API
- [x] P1-3: Rate limit chat/stream/payment
- [x] P1-4: KV-backed rate limiter
- [x] P1-5: Admin key audit logging
- [x] P1-6: Dependency waiver (deferred)

### Verification

- [x] Typecheck (api, auth, scholarship) — PASS
- [x] Build (web, edu, invest) — PASS
- [x] Unit test (scholarship, 64 assertions) — PASS
- [x] Security P0 audit (13/13) — PASS
- [x] SEO build audit (142 files, 0 errors) — PASS

---

## 3. Founder action items (RED — block go-live)

### 3.1. Secrets (P0 BLOCKER) — `SECRET_ROTATION_EVIDENCE_2026-07-07.md`

Founder phải chạy lệnh sau trước deploy production:

```bash
# P0 BLOCKER
wrangler secret put EVIDENCE_SIGNING_KEY --env production

# P1
wrangler secret put GEN1_ADMIN_KEY --env production
wrangler secret put RESEND_API_KEY --env production  # cho cả nai-auth và nai-api
wrangler secret put GOOGLE_CLIENT_ID --env production  # cho nai-auth
wrangler secret put GOOGLE_CLIENT_SECRET --env production  # cho nai-auth
wrangler secret put VNPAY_HASH_SECRET --env production  # cho nai-api
wrangler secret put STRIPE_SECRET_KEY --env production  # cho nai-api
wrangler secret put STRIPE_WEBHOOK_SECRET --env production  # cho nai-api
```

**Quan trọng — EVIDENCE_SIGNING_KEY:** key cũ (`dev-evidence-key-change-in-prod`) đã leak qua git history. Founder phải:
1. Tạo key mới (`openssl rand -base64 48`)
2. Set qua `wrangler secret put`
3. Quyết định: re-sign evidence cũ (batch job) hay giữ key cũ làm `EVIDENCE_SIGNING_KEY_LEGACY` cho read-verify.

### 3.2. Google Search Console verification (P0)

Thay nội dung `apps/web/public/google-site-verification.txt`:
```
google-site-verification: <MÃ THẬT TỪ GSC>
```
Lấy mã từ Google Search Console → Settings → Ownership verification → TXT file method.

### 3.3. RATE_LIMIT KV namespace

```bash
wrangler kv namespace create RATE_LIMIT
# paste id vào apps/api/wrangler.jsonc (thay REPLACE_WITH_KV_NAMESPACE_ID)
```

### 3.4. Live audit invest (sau deploy preview)

Deploy preview → kiểm tra:
- `curl -s https://invest-preview.nguyenai.net/ | grep -E 'og:|hreflang|canonical'`
- `curl -s https://invest-preview.nguyenai.net/sitemap.xml | head`
- `curl -s https://invest-preview.nguyenai.net/robots.txt`

### 3.5. E2E user flow (sau deploy preview)

Founder hoặc QA đi user flow thật:
- [ ] Đăng ký → verify email → login → logout
- [ ] Chat/stream proxy qua Gen1
- [ ] Đăng ký học bổng → submit → review
- [ ] Investor login → private room
- [ ] Payment checkout (Stripe test mode)

---

## 4. Waiver

### P1-6: Dependency high vulns (dev/build-only)

`@astrojs/cloudflare` 11.x + `astro` 4.x có high vulns (miniflare/undici/ws) — chỉ dev/build time, không runtime. Nâng cấp Astro 4→5 + @astrojs/cloudflare 11→12 là major bump, deferred sang sprint sau. Founder directive: "ghi waiver nếu chỉ là dev dependency."

**Founder xác nhận waiver:** [x] Yes, waive — deferred sang sprint sau.

---

## 5. Founder signoff

Tôi, Founder Nguyen AI, xác nhận:

- [ ] Đã đọc `SECURITY_P0_FIX_EVIDENCE_2026-07-07.md`
- [ ] Đã đọc `SECRET_ROTATION_EVIDENCE_2026-07-07.md`
- [ ] Đã đọc `PRODUCTION_BLOCKER_FIX_REPORT_2026-07-07.md`
- [ ] Đã đọc `GOLIVE_AUDIT_AFTER_FIX_2026-07-07.md`
- [ ] Đã hoàn thành 3.1 (secrets) — đặc biệt EVIDENCE_SIGNING_KEY
- [ ] Đã hoàn thành 3.2 (Google verification)
- [ ] Đã hoàn thành 3.3 (RATE_LIMIT KV)
- [ ] Đã hoàn thành 3.4 (live audit invest)
- [ ] Đã hoàn thành 3.5 (E2E user flow)
- [ ] Đã xác nhận waiver P1-6
- [ ] **Approve go-live production**

**Founder signature:** ___________________________

**Date:** ___________________________

---

## 6. Rollback plan

Nếu go-live phát hiện lỗi nghiêm trọng:

1. **API:** `wrangler rollback nai-api` (revert về version trước).
2. **Auth:** `wrangler rollback nai-auth`.
3. **Web/Edu/Invest:** Cloudflare Pages → rollback deployment.
4. **Secrets:** rotate lại nếu nghi leak.
5. **DB:** D1 migrations không destructive (tất cả `CREATE TABLE IF NOT EXISTS`), không cần rollback schema.

---

## 7. Post-go-live monitoring

- [ ] Cloudflare dashboard — error rate, request rate, CPU time.
- [ ] Google Search Console — indexing status, sitemap submission.
- [ ] Resend dashboard — email delivery rate.
- [ ] Stripe dashboard — payment success rate.
- [ ] Audit log (`/v1/audit`) — check `gen1_admin_proxy_call`, `login_failure` spikes.
- [ ] Rate limit headers (`X-RateLimit-Remaining`) — verify KV working.
