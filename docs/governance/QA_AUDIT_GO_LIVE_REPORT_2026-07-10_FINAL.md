# QA Audit Go-Live — Báo cáo trung thực (Founder review)

**Ngày:** 2026-07-10 (tối, UTC+7)  
**Phương pháp:** Lệnh thật + HTTP production — không dựa báo cáo cũ  
**Kế hoạch tham chiếu:** `GO_LIVE_10_POINT_FRAMEWORK_2026-07-10.md`, `FOUNDER_GO_LIVE_CHECKLIST.md`

---

## 1. Kết luận điều hành (sự thật)

| Câu hỏi | Trả lời trung thực |
|---------|-------------------|
| Repo sẵn sàng deploy? | **Có** — QA Loop #20 ALL GREEN (2026-07-10 ~18:12 UTC+7) |
| Production đang chạy? | **Có** — 6 surfaces deploy account `62d57eaa548617aeecac766e5a1cb98e` |
| Go-live 10/10? | **Không** — ~**8/10** |
| Production release approved? | **Không** — Sprint 0 OPEN, E2E auth/payment chưa verify |

**Verdict:** Có thể **tiếp tục vận hành staging/production kỹ thuật** (trang + API health). **Chưa** được coi là go-live thương mại đầy đủ.

---

## 2. Bằng chứng đã chạy hôm nay

### 2.1 Repo (Phase 0)

| Lệnh | Kết quả | Ghi chú |
|------|---------|---------|
| `QA_LOOP_LOG.md` #20 | ✅ ALL GREEN | typecheck 0, build 90/90, audit 14/14, test 150/150 |
| `bash tools/production-smoke.sh` | ✅ 11/11 | 2026-07-10T13:38:44Z |
| `pnpm go-live:live` (phiên trước) | ✅ PASS | 15 HTTP checks + QA loop |

*Lưu ý:* QA Loop #21 bắt đầu 13:24 UTC chưa ghi xong log khi audit chạy — dùng #20 làm bằng chứng ổn định gần nhất.

### 2.2 Production HTTP (live)

| Endpoint | HTTP | Ý nghĩa |
|----------|------|---------|
| `api.nguyenai.net/health` | 200 | API worker live |
| `api.nguyenai.net/v1/plans` | 200 | Catalog OK |
| `api.nguyenai.net/v1/scholarship/council/rubric` | 200 | Scholarship routes mounted |
| `nguyenai.net/`, robots, sitemap | 200 | Web SEO OK |
| `edu.nguyenai.net/og-default.png` | 200 | OG mặc định (script test) |
| `edu.nguyenai.net/og-academy.png` | **404** | Không có file; không trong layout — **ngoài scope script** |
| `edu.nguyenai.net/favicon.ico` | **404** | Layout dùng `/favicon.svg` (200); browser probe `/favicon.ico` |
| `invest.nguyenai.net/og-invest.png` | 200 | Invest OG OK |
| `app.nguyenai.net/` | 302 | Console gate OK |
| `auth.nguyenai.net/health` | 200 | Auth worker live |
| `auth.nguyenai.net/v1/auth/session` (no cookie) | 401 | Đúng — chưa đăng nhập |

### 2.3 Cloudflare (account Anhhatam)

| Worker/Pages | Tên project | Domain |
|--------------|-------------|--------|
| API | `nguyenai-api-gateway` | api.nguyenai.net |
| Auth | `nguyenai-auth` | auth.nguyenai.net |
| Web | `nai-web` | nguyenai.net |
| Edu | `nguyenai-edu` | edu.nguyenai.net |
| Console | `nguyenai-console` | app.nguyenai.net |
| Invest | `nguyenai-invest` | invest.nguyenai.net |

**D1:** `nguyenai-identity` (`704f85cb-...`) — migrations **4/4** applied:
`0001_identity_access`, `0002_email_verification`, `0003_magic_links_passkeys`, `0004_scholarship_core`

**Secrets trên Workers (tên only, verify 2026-07-10 tối):**

| Worker | Đã set | Chưa set |
|--------|--------|----------|
| `nguyenai-api-gateway` | `EVIDENCE_SIGNING_KEY` | `STRIPE_*`, `VNPAY_*`, `RESEND_API_KEY`, LLM keys |
| `nguyenai-auth` | `AUTH_SECRET` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY` |

---

## 3. Thang 10/10 (đối chiếu tổng kế hoạch)

| # | Tiêu chí | Điểm | Bằng chứng |
|---|----------|------|------------|
| 1 | Repo QA | **10/10** | QA Loop #20 green |
| 2 | Security P0 | **10/10** | Trong `audit:all` 14/14 |
| 3 | Independence | **10/10** | `audit:independence` trong gate |
| 4 | Product surfaces | **9/10** | Build + deploy; E2E user flows chưa đủ |
| 5 | SEO & brand | **9/10** | seo-build 154 HTML, sitemap 32×2 |
| 6 | Accessibility | **10/10** | 0 violations |
| 7 | Production runtime | **9/10** | `pnpm go-live:live` 21/21 (Founder verify 2026-07-10) |
| 8 | Persistence | **5/10** | D1 identity + scholarship core; entitlement InMemory; scholarship 28 bảng chưa đủ |
| 9 | Founder external | **4/10** | 2/7 secret nhóm; OAuth/payment/email chưa |
| 10 | Governance | **2/10** | Sprint 0 OPEN; không có Founder sign-off |

**Tổng:** ~**8/10**

---

## 4. Đã fix trong chuỗi audit (có bằng chứng)

- API `/health`, scholarship routes, session-auth regression
- Deploy 6 projects đúng account ID
- D1 `nguyenai-identity` tách khỏi `nguyenai-owner-db` (schema owner cũ không tương thích)
- OG edu/invest, web sitemap generator, accessibility 0
- `pnpm go-live:live` — QA + live HTTP một lệnh
- Secrets generate: `EVIDENCE_SIGNING_KEY`, `AUTH_SECRET`

---

## 5. Chưa PASS — còn gì trước go-live thật?

### P0 — Blocker vận hành người dùng

| # | Việc | Ai | Verify |
|---|------|-----|--------|
| 1 | **Google OAuth** — `GOOGLE_CLIENT_ID/SECRET` trên `nguyenai-auth` | Founder | Login Google → `app.nguyenai.net` |
| 2 | **Resend** — `RESEND_API_KEY` auth + api | Founder | Register email → nhận mail verify |
| 3 | **E2E register/login** | Dev + Founder | Một lần probe `POST /v1/auth/register` trả **500** — **chưa verify lại**, cần test thủ công sau Resend/D1 |
| 4 | **Stripe/VNPay** secrets + webhook | Founder | Checkout test → entitlement grant |
| 5 | **LLM keys** (`OPENAI/ANTHROPIC/GOOGLE_AI`) | Founder | `POST /v1/chat` authenticated → response thật (hiện 401 khi chưa auth — đúng) |

### P1 — Engineering

| # | Việc |
|---|------|
| 6 | Scholarship D1 full schema (28 entities) — hiện chỉ `scholarship_applications` core |
| 7 | Entitlement / approval InMemory → D1 |
| 8 | Payment webhook → grant entitlement (chưa E2E) |
| 9 | Idempotency middleware mount trên API production |
| 10 | Neon `DATABASE_URL` nếu cần Postgres (D1 đủ cho auth MVP) |

### P2 — Governance & pháp lý

| # | Việc |
|---|------|
| 11 | **Sprint 0 governance lock** |
| 12 | **Founder production sign-off** (`FOUNDER_RELEASE_SIGNOFF_PACKET`) |
| 13 | **invest.nguyenai.net** — governance nói chờ legal entity; site đã deploy (cần Founder quyết định) |
| 14 | `DEV_EXECUTION_CHECKLIST.md` — **469/469** item vẫn `[ ]` (kế hoạch chiến lược chưa lock) |

---

## 6. E2E chưa chạy (không khẳng định PASS)

Theo `FOUNDER_GO_LIVE_CHECKLIST.md` bước 6 — **chưa verify:**

- [ ] Đăng ký email → verify → login
- [ ] Google OAuth → console
- [ ] Plans → Stripe → webhook → entitlement
- [ ] Chat có response từ LLM provider
- [ ] Scholarship apply end-to-end trên production

---

## 7. Lệnh Founder tự kiểm duyệt

```bash
# Repo
pnpm go-live:check

# Live production
pnpm go-live:live

# Chỉ HTTP
pnpm audit:production-smoke

# Secrets (generate 2 key) rồi set OAuth/Stripe/Resend thủ công
pnpm secrets:wrangler
```

Log: `.audit-evidence/qa-audit-final-20260710.log`, `QA_LOOP_LOG.md` #20

---

## 8. Khuyến nghị thứ tự làm tiếp

1. Set `GOOGLE_CLIENT_*` + `RESEND_API_KEY` → test register/login E2E
2. Set `STRIPE_*` (test mode) → test checkout
3. Set LLM keys → test chat từ console
4. Founder sign-off + Sprint 0 lock
5. Mới gọi **PRODUCTION 10/10 APPROVED**

**Claim "Edu/Invest OG assets → 200":** **Partial** — đúng theo script (`og-default` + `og-invest`); `og-academy.png` và `favicon.ico` trên edu vẫn 404 (không blocker go-live live script).

---

## 9. Founder independent verification (2026-07-10 tối)

| Finding | Status |
|---------|--------|
| 15/15 HTTP live checks | ✅ PASS (sau fix script) |
| 6/6 project ID checks | ✅ PASS |
| QA loop + session-auth regression | ✅ PASS |
| **Bug:** `go-live-live-test.sh` dùng `rg` — không có trên macOS PATH | ✅ Fixed → `grep -q` (commit `b5fc94e`) |
| Workers `nguyenai-api-gateway`, `nguyenai-auth` | ✅ Deployed (wrangler) |

**Go-live live score (Founder verify):** **9/10** — pass thật 21/21 checks; trừ 1 điểm bug script `rg` (đã fix).

**Còn lại Founder:** `GOOGLE_CLIENT_*`, `STRIPE_*`, `RESEND_API_KEY`, Sprint 0 sign-off.
