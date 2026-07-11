# JWT_SECRET & A-to-Z Release Framework — áp dụng nguyenai.net

**Ngày:** 2026-07-11  
**Phạm vi:** `nguyenai.net` monorepo (web / edu / invest / console / api / auth)  
**Nguyên tắc:** Giải thích JWT đúng chuẩn + map **thật** vào kiến trúc hiện tại — không claim JWT nếu hệ đang dùng session cookie.

---

## 1. JWT_SECRET là gì? (chuẩn chung)

`JWT_SECRET` là chuỗi bí mật dùng để **ký và kiểm tra chữ ký** JWT (JSON Web Token), thường với thuật toán kiểu HS256.

JWT dạng: `header.payload.signature`

- Payload chứa claims (`sub`, `role`, `exp`, …) — thường chỉ Base64URL, **không** tự mã hóa.
- Signature chứng minh token do hệ phát hành và chưa bị sửa.
- Nếu `JWT_SECRET` lộ → kẻ tấn có thể **tự tạo token giả** (user/admin/founder).

**Quy tắc:** secret cấp cao — không Git, không chat, không hard-code, không log; lưu secret manager; có rotation.

Tạo secret:

```bash
openssl rand -base64 64
# hoặc
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
```

---

## 2. Map sang nguyenai.net — sự thật kỹ thuật

### 2.1 nguyenai.net **không** dùng JWT làm session chính

| Thành phần | Thực tế trong repo |
|------------|-------------------|
| Auth model | **Opaque session ID** lưu **D1** (`sessions` table) |
| Cookie | `nguyenai_session` — HttpOnly cookie (`@nai/auth` `SESSION_COOKIE_NAME`) |
| Verify | `findSessionById(DB, cookie)` trên `auth.nguyenai.net` / API resolve session |
| JWT trong code | **Không** JWT login — có HMAC cookie signing qua `AUTH_SECRET` |
| `AUTH_SECRET` | ✅ Wired: ký `session_id.hmac` trên auth; API verify cùng secret |

**Kết luận:** Với nguyenai.net hiện tại, analog của “chìa khóa session” là:

1. **Session row trong D1** (source of truth revoke/expiry)  
2. **Cookie `nguyenai_session`** (chỉ mang session_id)  
3. **`AUTH_SECRET`** — HMAC ký cookie session (không phải JWT); bắt buộc trên auth + api

Không được gọi hệ thống này là “JWT auth” cho đến khi implement JWT thật.

### 2.2 Bảng secret nguyenai.net (không nhầm lẫn)

| Secret | Worker / nơi | Mục đích | Trạng thái 2026-07-11 |
|--------|--------------|----------|------------------------|
| `AUTH_SECRET` | `nguyenai-auth` + `nguyenai-api-gateway` | HMAC ký/verify cookie `nguyenai_session` | ✅ Wired + rotated 2026-07-11 |
| `EVIDENCE_SIGNING_KEY` | `nguyenai-api-gateway` | Ký evidence/receipt | ✅ Đã set (rotated cùng ngày) |
| `GOOGLE_CLIENT_ID/SECRET` | auth | OAuth Google | ❌ Chưa set (Founder) |
| `RESEND_API_KEY` | auth + api | Email verify / transactional | ❌ Chưa set (Founder) |
| `STRIPE_SECRET_KEY` | api | Checkout | ❌ Chưa set (Founder) |
| `STRIPE_WEBHOOK_SECRET` | api | Verify webhook Stripe | ❌ Chưa set (Founder) |
| `VNPAY_*` | api | VNPay | ❌ Chưa set (Founder) |
| `OPENAI/ANTHROPIC/GOOGLE_AI` | api | LLM providers | ❌ Chưa set (Founder) |
| `DATABASE_URL` (Neon) | optional | Postgres — hiện dùng **D1** `nguyenai-identity` | D1 ✅ / Neon ❌ |

**Không** dùng chung một secret cho JWT + webhook + OAuth + encryption.

### 2.3 Auth flow thực tế (nguyenai.net)

```
Register/Login (email hoặc Google OAuth)
  → auth worker verify credentials (D1)
  → createSession(...) → session_id trong D1
  → Set-Cookie: nguyenai_session=<session_id>; HttpOnly; Secure; Domain=.nguyenai.net
  → API/console đọc cookie → resolve session → roles[] / tenant_id
```

Surfaces:

| Surface | Domain | Auth liên quan |
|---------|--------|----------------|
| Web | nguyenai.net | Public; CTA → console/auth |
| Console | app.nguyenai.net | Login → auth worker |
| Edu | edu.nguyenai.net | Login link; scholarship API cần session |
| Invest | invest.nguyenai.net | Public + private room (policy) |
| API | api.nguyenai.net | Session cookie / guards |
| Auth | auth.nguyenai.net | Source of truth sessions |

### 2.4 Nếu sau này thêm JWT

Khi (và chỉ khi) chuyển Bearer JWT:

1. Tạo `JWT_SECRET` riêng (hoặc rename rõ `AUTH_JWT_SECRET`) — **không** tái dùng Stripe/Resend  
2. Claims tối thiểu: `sub`, `tenant_id`, `roles`, `iss=auth.nguyenai.net`, `aud`, `exp` ngắn  
3. Refresh + revoke list (hoặc giữ session server-side)  
4. Rotation plan + audit  
5. Không tin `role` từ client — server verify signature + DB nếu cần

---

## 3. A-to-Z Release Framework — trạng thái nguyenai.net

> Định nghĩa “xong”: P0/P1 đóng trong scope release, gates PASS, live verified, monitoring/rollback, evidence + Founder sign-off.  
> **Không** nói “không còn lỗi vĩnh viễn”.

| Giai đoạn | Yêu cầu | nguyenai.net (2026-07-11) |
|-----------|---------|---------------------------|
| **0 Source of Truth** | AGENTS.md, governance locks, brand, independence | ✅ Có (AGENTS.md, independence lock, brand V3) |
| **1 Product Scope** | PRD, AC, non-goals | ⚠️ Docs nhiều; `DEV_EXECUTION_CHECKLIST` 469 `[ ]` chưa lock |
| **2 Architecture** | Diagram, subdomain mesh | ✅ Unified subdomain + Workers/Pages |
| **3 Security Design** | Threat model, SEC-P0 | ✅ `audit:security-p0` PASS; secrets policy documented |
| **4 Data Model** | Migrations | ✅ D1 `nguyenai-identity` 4 migrations; scholarship core only |
| **5 Auth & Secret** | Login, session, OAuth, rotate | ⚠️ Session cookie HMAC + D1 OK; OAuth/Resend secrets thiếu; E2E register→verify chờ Resend |
| **6 Core Backend** | API contracts | ⚠️ Routes mounted; entitlement+approval **D1**; payment webhook chưa E2E |
| **7 Frontend** | States, a11y, bilingual | ✅ Web + Edu/Invest layout + invest VI body P2 deployed |
| **8 Payment & Entitlement** | Checkout → webhook → grant | ❌ Stripe/VNPay secrets + E2E chưa (entitlement store D1 ✅) |
| **9 Email** | Verify, receipt | ❌ `RESEND_API_KEY` chưa |
| **10 AI Runtime** | Gateway, guard, receipt | ⚠️ Code có; LLM keys chưa → chat live mock |
| **11 Testing** | Unit/E2E/security | ⚠️ Package tests + smoke PASS; E2E payment/auth live chưa đủ |
| **12 QA Audit** | Language, SEO, go-live | ✅ Language invest VI body live PASS; production smoke PASS |
| **13 Pre-deploy Gate** | typecheck/build/audit | ✅ |
| **14 Deployment** | Account Anhhatam | ✅ 6 surfaces; auth/api/invest redeployed 2026-07-11 |
| **15 Live Verification** | Smoke + journeys | ⚠️ Smoke PASS; critical journey (register→pay→chat) **chưa** |
| **16 Observability** | Errors, uptime, cost | ❌ Chưa chứng minh production monitoring |
| **17 Backup/Rollback** | Restore drill | ❌ Chưa verify restore D1/R2 |
| **18 Documentation** | Runbooks | ⚠️ + `SECRET_ROTATION_RUNBOOK` + `KNOWN_LIMITATIONS` |
| **19 Evidence Packet** | FINAL QA + SHA | ⚠️ Có QA reports; thiếu Founder sign-off |
| **20 Sign-off** | Founder | ❌ Sprint 0 OPEN |

**Điểm tổng (honest) 2026-07-11 sau pass A-to-Z eng:** ~**8–8.5/10** kỹ thuật; **chưa** commercial 10/10 (Founder secrets + E2E + sign-off).

---

## 3b. Execution log 2026-07-11 (agent)

| Bước | Kết quả |
|------|---------|
| Wire `AUTH_SECRET` HMAC cookie | ✅ `@nai/auth` sign/parse; auth+api deploy; health `auth_secret_configured:true` |
| Rotate AUTH + EVIDENCE | ✅ `tools/set-wrangler-secrets.sh` (cùng AUTH trên auth+api) |
| Entitlement/Approval → D1 | ✅ `D1EntitlementStore` + `D1ApprovalStore` khi `env.DB` |
| Deploy invest VI body P2 | ✅ Live `/why-now` = `Vì sao ngay bây giờ`; `/risks` = `Sổ rủi ro` |
| Production smoke | ✅ PASS (11 checks) |
| Founder secrets Google/Resend/Stripe/LLM | ❌ Blocked — không có giá trị trong môi trường agent |
| E2E register→pay→chat | ❌ Blocked bởi secrets trên |
| Founder sign-off | ❌ |

---

## 4. Checklist bắt buộc còn lại (nguyenai.net)

### P0 — Auth / Secret / Journey

- [x] Wire hoặc document rõ: `AUTH_SECRET` dùng để làm gì (HMAC session cookie)
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` trên `nguyenai-auth`
- [ ] `RESEND_API_KEY` trên auth + api
- [ ] E2E: register → verify email → login → console
- [ ] E2E: Google OAuth → console
- [ ] Fix register 500 nếu còn (verify lại sau Resend/D1)

### P0 — Payment / Entitlement

- [ ] `STRIPE_*` (+ webhook signature verify)
- [ ] Checkout → webhook → entitlement grant (không tin client return URL)
- [ ] Refund → revoke entitlement
- [x] Entitlement store D1 (API có `env.DB`)

### P0 — AI

- [ ] LLM provider keys
- [ ] Authenticated `/v1/chat` live response
- [x] Không claim “AI runtime ready” trước evidence

### P1 — Persistence / Ops

- [x] Entitlement/approval off InMemory → D1
- [ ] Scholarship full schema (28 tables) nếu cần production scholarship
- [ ] Monitoring + backup restore drill
- [x] Secret rotation runbook (AUTH / EVIDENCE / Stripe) — `docs/deployment/SECRET_ROTATION_RUNBOOK.md`

### P2 — Governance

- [ ] Sprint 0 lock
- [x] `KNOWN_LIMITATIONS.md` — `docs/governance/KNOWN_LIMITATIONS_2026-07-11.md`
- [ ] Founder sign-off
- [ ] Invest legal gate (site đã deploy — Founder quyết định)

---

## 5. Lệnh vận hành liên quan secret & go-live

```bash
# Generate + set AUTH_SECRET / EVIDENCE_SIGNING_KEY (không in giá trị)
pnpm secrets:wrangler

# Set thủ công (Founder)
cd apps/auth && wrangler secret put GOOGLE_CLIENT_ID
cd apps/auth && wrangler secret put GOOGLE_CLIENT_SECRET
cd apps/auth && wrangler secret put RESEND_API_KEY
cd apps/api  && wrangler secret put RESEND_API_KEY
cd apps/api  && wrangler secret put STRIPE_SECRET_KEY
cd apps/api  && wrangler secret put STRIPE_WEBHOOK_SECRET

# Gates
pnpm go-live:check
pnpm go-live:live
pnpm audit:language:live
```

Account production: `CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e`

---

## 6. Câu kết luận đúng cho nguyenai.net

**Được nói:**

> nguyenai.net đã deploy 6 surfaces; auth dùng **session cookie HMAC + D1** (không JWT). `AUTH_SECRET` wired trên auth+api; entitlement/approval D1; invest VI body P2 live. OAuth/Stripe/Resend/LLM chưa. P0 journey (register→pay→chat) chưa E2E. Production commercial **chưa** Founder-approved.

**Không được nói:**

> JWT auth production-ready · không thể bị hack · 100% không còn lỗi · AI Owner OS runtime-ready.

---

## 7. Liên kết

- `docs/governance/GO_LIVE_10_POINT_FRAMEWORK_2026-07-10.md`
- `docs/governance/QA_AUDIT_GO_LIVE_REPORT_2026-07-10_FINAL.md`
- `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md`
- `docs/deployment/SECRET_ROTATION_RUNBOOK.md`
- `docs/governance/KNOWN_LIMITATIONS_2026-07-11.md`
- `packages/@nai/auth` — `SESSION_COOKIE_NAME`, `signSessionCookieValue`, `parseSessionCookieValue`
- `apps/auth` — D1 sessions + HMAC cookies
- `apps/api` — `D1EntitlementStore`, `D1ApprovalStore`
- `tools/set-wrangler-secrets.sh`
