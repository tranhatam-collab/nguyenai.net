# QA AUDIT FINAL — nguyenai.net (2026-07-19)

## SOURCE_VERIFICATION

```text
repo_root:     /Users/tranhatam/Documents/Devnewproject/nguyenai.net
remote:        git@github.com:tranhatam-collab/nguyenai.net.git
branch:        main
head:          e33df92 fix(p0): AI provider gateway URL fallback + tenantId + E2E test
working_tree:  CLEAN (0 modified, 0 untracked code files)
remote_sync:   HEAD = origin/main (pushed)
checked_at:    2026-07-19T01:15Z
```

---

## 1. Code gates — ALL GREEN

| Gate | Kết quả | Evidence |
|------|---------|----------|
| typecheck | PASS | QA Loop #36: 0 errors, 182/182 tasks |
| build | PASS | 91/91 tasks successful |
| audit:all | PASS | 19/19 audits passed |
| audit-seo-build | PASS | BUILDAUDITPASSED |
| test | PASS | 152/152 tasks successful |
| audit:independence | PASS | 0 violations (Gen1/Gen2 free) |
| audit:ai-provider | PASS | AI PROVIDER SOURCE AUDIT PASSED |
| CI Security | PASS | commit e33df92 (sau retry — EADDRINUSE transient) |
| CI Deploy | PASS | commit e33df92 |

---

## 2. Live API verification

| Endpoint | HTTP | Content-Type | Verdict |
|----------|------|-------------|---------|
| `api.nguyenai.net/v1/models` | **200** | application/json | VERIFIED — 18 models trả về |
| `api.nguyenai.net/v1/chat` (no auth) | **401** | — | VERIFIED — auth required (đúng) |
| `api.nguyenai.net/v1/health` | **404** | — | P1 — chưa có health endpoint |
| `auth.nguyenai.net/` | **302** → `/auth` | — | VERIFIED — P0-B FIXED, auth worker LIVE |
| `auth.nguyenai.net/v1/auth/session` | **401** | — | VERIFIED — no session (đúng) |
| `api.aiagent.iai.one/v1/models` | **200** | application/json | VERIFIED — 3 models (iris-3, pulse-3, echo-mini) |
| `api.aiagent.iai.one/v1/health` | **200** | — | VERIFIED |
| `nguyenai.net/` | **200** | — | VERIFIED — web app |
| `app.nguyenai.net/` | **302** | — | VERIFIED — console redirect |
| `edu.nguyenai.net/` | **200** | — | VERIFIED — edu app |
| `invest.nguyenai.net/` | **200** | — | VERIFIED — invest app |

---

## 3. P0 BLOCKERS — còn lại cho 100% vận hành thật

### P0-MIG: 7 migrations chưa apply lên remote D1

```text
Migrations pending (remote D1 nguyenai-identity):
  0006_audit_log_relax_event_type.sql       — DROP+RECREATE audit_log (data-preserving)
  0007_edu_learner_m1.sql                   — 15 bảng edu learner
  0008_edu_seed_level0_level1.sql           — seed data edu
  0009_webhook_replay_and_subscriptions.sql — webhook_replay + webhook_subscriptions
  0010_mfa_challenge.sql                    — mfa_challenges
  0011_payment_ledger.sql                   — payment_ledger
  0012_model_gateway.sql                    — model_receipts (model_invocations đã có)

Tables MISSING in remote D1:
  ❌ mfa_challenges          — MFA flow sẽ FAIL
  ❌ webhook_replay          — webhook replay protection sẽ FAIL
  ❌ webhook_subscriptions   — subscription store sẽ FAIL
  ❌ payment_ledger          — payment tracking sẽ FAIL
  ❌ model_receipts          — receipt creation sẽ FAIL
  ❌ edu_learners (15 bảng)  — education features sẽ FAIL

Tables present but migration not tracked:
  ⚠️ audit_log              — tồn tại nhưng 0006 chưa tracked (cần apply cho CHECK relax)
  ⚠️ model_invocations      — tồn tại với đầy đủ cột 0012, nhưng model_receipts thiếu
```

**Impact**: Không thể vận hành thật cho MFA, webhook, payment, receipt, education.
**Fix**: `wrangler d1 migrations apply nguyenai-identity --remote` (cần Founder confirm — migration 0006 có DROP TABLE audit_log, nhưng data-preserving qua INSERT...SELECT trước khi DROP).

### P0-MODEL: Model ID mismatch giữa nguyenai.net và aiagent.iai.one

```text
nguyenai.net model catalog (packages/product-catalog/models.json):
  nguyen-iris-3    → provider: cloudflare-workers-ai
  nguyen-iris-7    → provider: groq
  nguyen-echo-mini → provider: google
  nguyen-pulse-3   → provider: cerebras
  nguyen-nova-9    → provider: anthropic
  nguyen-spectra-xl → provider: openai
  ... (18 models total, ALL với direct vendor providers)

aiagent.iai.one model catalog (live /v1/models):
  iai-one/iris-3
  iai-one/pulse-3
  iai-one/echo-mini

Contract gap:
  - GatewayLLMProvider.chat() gửi model.id ("nguyen-iris-3") tới api.aiagent.iai.one
  - aiagent.iai.one không nhận diện "nguyen-iris-3" — chỉ nhận "iai-one/iris-3"
  - KHÔNG có model ID mapping trong ai-provider-client hoặc training-gateway
  - /v1/models endpoint leak direct vendor provider info (openai, anthropic, google...)
```

**Impact**: Khi user gọi `/v1/chat` với model `nguyen-iris-3`, gateway sẽ nhận `model: "nguyen-iris-3"` và không nhận diện → error hoặc default.
**Fix cần**:
1. Thêm model ID mapping trong `GatewayLLMProvider` hoặc `AIProviderClient`: `nguyen-iris-3` → `iai-one/iris-3`
2. Cập nhật `models.json`: thay `provider` thành `ai-provider-gateway`, ẩn `providerModel` hoặc map sang `iai-one/*`
3. HOẶC: cập nhật aiagent.iai.one để nhận diện cả `nguyen-*` IDs (cần Team A)

### P0-C: MODEL_GATEWAY_SIGNING_KEY secret thiếu

```text
nguyenai-api-gateway secrets (account 62d57):
  ✅ AI_PROVIDER_API_KEY
  ✅ AUTH_SECRET
  ❌ AUTH_SECRET\u2028\u2028          — U+2028 duplicate (P0-D)
  ✅ EVIDENCE_SIGNING_KEY
  ❌ EVIDENCE_SIGNING_KEY\u2028      — U+2028 duplicate (P0-D)
  ✅ JWT_SECRET
  ✅ RESEND_API_KEY
  ❌ MODEL_GATEWAY_SIGNING_KEY       — MISSING (P0-C)
  ❌ PAY_NAI_HMAC                    — MISSING (P1-C)
```

**Impact**: `D1ModelGatewayStore` constructor throw nếu thiếu key → model gateway invoke sẽ FAIL.
**Fix**: Founder set `wrangler secret put MODEL_GATEWAY_SIGNING_KEY` trên nguyenai-api-gateway.

### P0-D: Unicode U+2028 secrets vẫn tồn tại

```text
Secrets bị nhiễm U+2028 (vẫn chưa xóa):
  ❌ AUTH_SECRET\u2028\u2028           (2x U+2028)
  ❌ EVIDENCE_SIGNING_KEY\u2028        (1x U+2028)
```

**Impact**: Code đọc `AUTH_SECRET` có thể tìm thấy cả 2 version, behavior không xác định.
**Fix**: Founder xóa 2 secret có U+2028 trong CF dashboard, giữ lại bản clean.

---

## 4. P1 — High (không block nhưng cần fix)

| # | Finding | Impact | Fix |
|---|---------|--------|-----|
| P1-C | `PAY_NAI_HMAC` thiếu trên account 62d57 | Payment webhook HMAC verification fail | Founder set secret |
| P1-HEALTH | `/v1/health` trả 404 | Không có health check endpoint | Thêm route |
| P1-DEPLOY | aiagent.iai.one 4 commit chưa push+deploy | Tenant nguyenai-net + run object chưa live | Founder push + wrangler deploy |
| P1-GIT | aiagent.iai.one packfile hỏng | `git fetch` fail | Founder `git gc --prune=now` hoặc re-clone |

---

## 5. Trạng thái đã FIXED (xác nhận live)

| # | Item | Evidence |
|---|------|----------|
| P0-A | `AI_PROVIDER_GATEWAY_URL` đúng `api.aiagent.iai.one` | wrangler dry-run hiển thị đúng URL; code fallback cũng đúng |
| P0-B | `auth.nguyenai.net` route LIVE | HTTP 302 → /auth, /v1/auth/session trả 401 (đúng) |
| P0-E | Tenant `nguyenai-net` trong aiagent.iai.one | Commit 6a467abb (chưa deploy) |
| P0-F | `createRunObject` wire vào handleChat | Commit 6a467abb (chưa deploy) |
| E2E | 44/44 assertions PASS | ai-provider-authenticated-journey-e2e.ts |

---

## 6. Checklist cuối cùng cho 100% vận hành thật

### Code (tôi có thể làm)

| # | Việc | Status | Cần gì |
|---|------|--------|--------|
| C1 | Thêm model ID mapping `nguyen-*` → `iai-one/*` | **CHƯA LÀM** | Quyết định Founder: map trong code hay update aiagent.iai.one |
| C2 | Cập nhật `/v1/models` ẩn vendor provider info | **CHƯA LÀM** | Cần C1 trước |
| C3 | Thêm `/v1/health` endpoint | **CHƯA LÀM** | Simple route |
| C4 | Apply 7 migrations lên remote D1 | **CHƯA LÀM** | Founder confirm (0006 có DROP TABLE) |

### Founder manual (tôi không thể làm)

| # | Việc | Status | Cách |
|---|------|--------|------|
| F1 | Set `MODEL_GATEWAY_SIGNING_KEY` secret | **PENDING** | `wrangler secret put MODEL_GATEWAY_SIGNING_KEY` |
| F2 | Xóa 2 secret U+2028 (`AUTH_SECRET\u2028\u2028`, `EVIDENCE_SIGNING_KEY\u2028`) | **PENDING** | CF dashboard → xóa tay |
| F3 | Set `PAY_NAI_HMAC` trên account 62d57 | **PENDING** | `wrangler secret put PAY_NAI_HMAC` |
| F4 | Push + deploy aiagent.iai.one (4 commit) | **PENDING** | `git push` + `wrangler deploy --env production` |
| F5 | Fix aiagent.iai.one packfile hỏng | **PENDING** | `git gc --prune=now` hoặc re-clone |
| F6 | Verify `AI_PROVIDER_API_KEY` value hợp lệ trên CF | **PENDING** | Test call api.aiagent.iai.one với key |
| F7 | Deploy nguyenai-api-gateway sau khi C1-C4 xong | **PENDING** | `wrangler deploy` |

### Sequence yêu cầu

```text
1. F5 (fix git) → F4 (push+deploy aiagent.iai.one)
2. C1 (model mapping) → C2 (hide vendor) → C3 (health)
3. C4 (apply migrations) — cần Founder confirm
4. F1 (MODEL_GATEWAY_SIGNING_KEY) → F2 (xóa U+2028) → F3 (PAY_NAI_HMAC)
5. F6 (verify API key)
6. F7 (deploy nguyenai-api-gateway)
7. E2E live test: register → login → /v1/chat → receipt → audit
```

---

## 7. Verdict

```text
CONDITIONAL_HOLD — code gates ALL GREEN nhưng 4 P0 blockers còn lại:

  P0-MIG:    7 migrations chưa apply (MFA/webhook/payment/receipt/edu FAIL)
  P0-MODEL:  model ID mismatch (chat call sẽ FAIL khi gateway không nhận diện)
  P0-C:      MODEL_GATEWAY_SIGNING_KEY thiếu (receipt signing FAIL)
  P0-D:      2 Unicode U+2028 secrets vẫn tồn tại (auth behavior unstable)

Không thể vận hành thật 100% cho đến khi 4 P0 này đóng.
```
