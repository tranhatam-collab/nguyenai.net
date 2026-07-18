# Cross-Repo Audit — aiagent.iai.one ↔ nguyenai.net (2026-07-18)

## SOURCE_VERIFICATION

```text
=== aiagent.iai.one ===
repo_root:     /Users/tranhatam/Documents/Devnewproject (AI.OMDALA.COM)
remote:        git@github.com:tranhatam-collab/AI.OMDALA.COM.git
branch:        OMCODE/upload-bien-tap-sach-2026-06-20
head:          80607bd5372a2e80d291032c11ac3485fcc41ed7
working_tree:  dirty — apps/agent-api/wrangler.toml modified; aiagent.iai.one untracked in parent
project_root:  /Users/tranhatam/Documents/Devnewproject/aiagent.iai.one
canonical_api: https://api.aiagent.iai.one
deployment:    Worker aiagent-iai-one-api-prod (account f3f9, modified 2026-07-16)
checked_at:    2026-07-18

=== nguyenai.net ===
repo_root:     /Users/tranhatam/Documents/Devnewproject/nguyenai.net
remote:        git@github.com:tranhatam-collab/nguyenai.net.git
branch:        main
head:          0bad2ad688b5473de4a3a4ee6d6c1058fa230e46
working_tree:  clean (2 untracked docs)
deployment:    Worker nguyenai-api-gateway (account 62d57, modified 2026-07-11)
               Worker nguyenai-auth (account 62d57, modified 2026-07-11)
checked_at:    2026-07-18
```

---

## 1. Claim ledger — đối chiếu QA_AUDIT_2026-07-18.md (aiagent.iai.one)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | Typecheck PASS | `VERIFIED_CURRENT` | `npm run typecheck` exit 0 |
| 2 | Test 9/9 PASS, hẹp, không E2E | `VERIFIED_CURRENT` | 9 pass / 0 fail; chỉ model-id + service-key-auth-guard |
| 3 | `/v1/models` trả 200 | `VERIFIED_CURRENT` | `curl https://api.aiagent.iai.one/v1/models` → 200, JSON, 3 model free-tier |
| 4 | Canonical API là `api.aiagent.iai.one` | `VERIFIED_CURRENT` | CF route `api.aiagent.iai.one/*` → `aiagent-iai-one-api-prod`; `aiagent.iai.one` là Pages (text/html) |
| 5 | Có `/v1/chat`, `/v1/stream`, `/v1/models`, `/v1/quota` | `VERIFIED_CURRENT` | index.ts lines 1297, 1318, 1334, 1303 |
| 6 | Không có `/v1/chat/completions`, `/v1/usage`, `/v1/agents/run` | `VERIFIED_CURRENT` | Tất cả trả 400 từ session middleware (không phải route); grep chỉ thấy làm provider upstream URL suffix |
| 7 | Chưa có tenant `nguyenai-net` và `hamicodeviet-com` | `VERIFIED_CURRENT` | tenants.ts chỉ có 3: aiagent, computer-iai, maytinhai |
| 8 | Không có model `orion-research` | `VERIFIED_CURRENT` | grep `orion` → 0 match; families: iris, pulse, echo, nova, spectra |
| 9 | Quota 9/33 | `VERIFIED_CURRENT` | quota.ts: ANON_QUOTA_LIMIT=9, USER_FREE_QUOTA_LIMIT=33 |
| 10 | `createRunObject` chưa gọi | `VERIFIED_CURRENT` | import line 117, 0 call site trong index.ts |
| 11 | Chưa có deploy gateway cho api.nguyenai.net / api.hamicodeviet.com | `PARTIALLY_CONTRADICTED` | api.nguyenai.net đã live (worker khác); api.hamicodeviet.com chưa deploy |

---

## 2. Phát hiện mới (ĐỎ trước XANH)

### P0 — Blocker

| # | Finding | Evidence | Action type |
|---|---------|----------|-------------|
| **P0-A** | **`AI_PROVIDER_GATEWAY_URL` sai** — trỏ tới `https://aiagent.iai.one` (Pages, text/html) thay vì `https://api.aiagent.iai.one` (API Worker, JSON) | `apps/api/wrangler.jsonc` line 29; curl `aiagent.iai.one/v1/models` → content-type: text/html; curl `api.aiagent.iai.one/v1/models` → application/json | **FIXED** trong commit này |
| **P0-B** | **`nguyenai-auth` worker không có route** — `auth.nguyenai.net` trả 404, auth worker deployed nhưng không accessible | CF API: `nguyenai-auth` routes = [] trên cả 2 account; `curl auth.nguyenai.net/v1/health` → 404; DNS: auth.nguyenai.net → AAAA 100:: proxied nhưng không có worker route | Founder/CF dashboard |
| **P0-C** | **`MODEL_GATEWAY_SIGNING_KEY` thiếu** — receipt signing fail-closed sẽ throw error trong production | CF API: nguyenai-api-gateway secrets không có `MODEL_GATEWAY_SIGNING_KEY`; code: D1ModelGatewayStore constructor throw nếu thiếu | Founder/CF dashboard |
| **P0-D** | **Unicode U+2028 trong secret names** — 4 secret bị nhiễm | CF API char-by-char: `AI_GATEWAY_ID\u2028`, `SERPAPI_API_KEY\u2028` (aiagent worker f3f9); `AUTH_SECRET\u2028\u2028`, `EVIDENCE_SIGNING_KEY\u2028` (nguyenai-api-gateway 62d57) | Founder/CF dashboard (xóa + nhập lại tay) |
| **P0-E** | **Không có tenant `nguyenai-net`** — mọi call từ nguyenai.net tới aiagent.iai.one sẽ default vào tenant `aiagent`, không có isolation | tenants.ts: chỉ 3 tenant; không có service key cho nguyenai-net | Code fix (aiagent.iai.one) — chờ Founder cho phép |
| **P0-F** | **`createRunObject` chưa wire** — không có run object persistence cho billing/observability | index.ts line 117 import, 0 call site; run-object.ts có definition + persistRun/fetchRun/listRuns | Code fix (aiagent.iai.one) — chờ Founder cho phép |

### P1 — High

| # | Finding | Evidence |
|---|---------|----------|
| P1-A | `LUMA_API_KEY` thiếu trên aiagent worker | Secret list: không có |
| P1-B | `AGENT_API_KEY` thiếu trên GitHub secrets | Founder action |
| P1-C | `PAY_NAI_HMAC` có trên account f3f9 nhưng thiếu trên account 62d57 (nguyenai-api-gateway) | CF API: 62d57 secrets không có PAY_NAI_HMAC |
| P1-D | Duplicate secrets (clean + U+2028) — code đọc `AUTH_SECRET` sẽ tìm thấy cả 2, behavior không xác định | CF API: cả `AUTH_SECRET` và `AUTH_SECRET\u2028\u2028` tồn tại |
| P1-E | Test coverage hẹp — 9 test chỉ cover model-id + service-key-auth-guard, không có route/tenant/quota/E2E test | `npm test` → 2 file, 9 case |
| P1-F | `aiagent.iai.one` subdirectory untracked trong parent repo `AI.OMDALA.COM` — không có git history riêng | `git status` trong parent: `?? aiagent.iai.one/` |

### Hamicodeviet.com — CONFIRMED không hoạt động

```text
DNS:     api.hamicodeviet.com → AAAA 100:: (placeholder, proxied)
         ai.hamicodeviet.com → KHÔNG có DNS record
Route:   ai.hamicodeviet.com/* → hamicodeviet-api-gateway-v2 (DANGLING — script không tồn tại)
         api.hamicodeviet.com/* → KHÔNG có route
Live:    api.hamicodeviet.com/v1/models → 404
Worker:  hamicodeviet-api-gateway-v2 → không tồn tại trên account
```

---

## 3. Trạng thái nguyenai.net (HEAD `0bad2ad`)

| Hạng mục | Trạng thái | Evidence |
|----------|-----------|----------|
| typecheck | PASS | QA Loop #32: 0 errors |
| build | PASS | 91/91 tasks |
| audit:all | PASS | 19/19 |
| test | PASS | 152/152 |
| CI Security | PASS | commit 0bad2ad |
| CI Deploy | PASS | commit 0bad2ad |
| Academy entitlement | `academy.pass=false` ALL plans | entitlements.json; Enterprise/Sovereign = "custom" (standalone paid OK) |
| ModelProvider | `'ai-provider-gateway'` only | model-gateway/src/index.ts |
| allowedProviders | `['ai-provider-gateway']` | model-gateway/src/index.ts |
| Webhook replay | Atomic claim-before-side-effect | webhook-replay.ts: claimReplay() |
| MFA | Consume-after-success | auth/src/index.ts: TOTP verify → atomic UPDATE WHERE used_at IS NULL |
| Output guard | Block → empty string, không fallback original | training-gateway/src/index.ts |
| Model gateway invoke | Internal trusted callback, reject client-declared provider/tokens/cost | model-gateway.ts route |
| Receipt lookup | user_id + tenant_id ownership check | model-gateway.ts route |

---

## 4. CF Deployment topology

| Worker | Account | Route | Modified | Status |
|--------|---------|-------|----------|--------|
| `aiagent-iai-one-api-prod` | f3f9 | `api.aiagent.iai.one/*` | 2026-07-16 | LIVE |
| `nguyenai-api-gateway` | 62d57 | `api.nguyenai.net/*` | 2026-07-11 | LIVE |
| `nguyenai-auth` | 62d57 | **KHÔNG CÓ ROUTE** | 2026-07-11 | DEPLOYED BUT UNREACHABLE |
| `hamicodeviet-api-gateway-v2` | — | `ai.hamicodeviet.com/*` (dangling) | — | KHÔNG TỒN TẠI |

### Secret inventory

**aiagent-iai-one-api-prod (f3f9):**
- 44 secrets total
- 2 bị U+2028: `AI_GATEWAY_ID\u2028`, `SERPAPI_API_KEY\u2028`
- Missing: `LUMA_API_KEY`
- Có đầy đủ vendor keys (OPENAI, ANTHROPIC, GEMINI, etc.) — đúng cho AI Provider Gateway

**nguyenai-api-gateway (62d57):**
- 7 secrets (5 clean + 2 U+2028 duplicate)
- Clean: `AI_PROVIDER_API_KEY`, `AUTH_SECRET`, `EVIDENCE_SIGNING_KEY`, `JWT_SECRET`, `RESEND_API_KEY`
- U+2028: `AUTH_SECRET\u2028\u2028`, `EVIDENCE_SIGNING_KEY\u2028`
- Missing: `MODEL_GATEWAY_SIGNING_KEY`, `PAY_NAI_HMAC`

**nguyenai-auth (62d57):**
- 5 secrets, all clean
- `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `RESEND_API_KEY`

---

## 5. Phương án tối ưu — 3 phase, 7 bước

### Nguyên tắc

1. **Không gộp code** — nguyenai.net và aiagent.iai.one giữ codebase độc lập
2. **Contract-first** — tenant + service key + API key trước, rồi mới wire flow
3. **Fail-closed** — mọi gap phải có error rõ ràng, không silent fallback
4. **Hamicodeviet sau cùng** — chỉ sau khi contract nguyenai-net hoạt động E2E

### Phase 1 — Sửa P0 code + Founder manual (song song)

| Bước | Việc | Ai làm | Repo | Trạng thái |
|------|------|--------|------|-----------|
| **1.1** | Sửa `AI_PROVIDER_GATEWAY_URL` → `https://api.aiagent.iai.one` | Code | nguyenai.net | **DONE** (commit này) |
| **1.2** | Thêm tenant `nguyenai-net` vào tenant registry | Code | aiagent.iai.one | Chờ Founder cho phép |
| **1.3** | Wire `createRunObject` vào chat flow | Code | aiagent.iai.one | Chờ Founder cho phép |
| **1.4** | Xóa 4 secret có U+2028 + nhập lại tay | Founder | CF dashboard | Pending |
| **1.5** | Set `MODEL_GATEWAY_SIGNING_KEY` secret | Founder | CF dashboard | Pending |
| **1.6** | Tạo route `auth.nguyenai.net/*` → `nguyenai-auth` | Founder | CF dashboard | Pending |
| **1.7** | Set `PAY_NAI_HMAC` trên account 62d57 | Founder | CF dashboard | Pending |

### Phase 2 — Contract + E2E (sau Phase 1)

| Bước | Việc | Ai làm | Repo |
|------|------|--------|------|
| **2.1** | Tạo service key cho tenant `nguyenai-net` qua admin API | Code/Founder | aiagent.iai.one |
| **2.2** | Set service key làm `AI_PROVIDER_API_KEY` trên nguyenai-api-gateway (nếu cần đổi) | Founder | CF dashboard |
| **2.3** | Thêm `orion-research` model vào agent-models.ts (map sang Claude Sonnet) | Code | aiagent.iai.one |
| **2.4** | E2E test: nguyenai.net → api.aiagent.iai.one `/v1/chat` authenticated | Code | nguyenai.net |
| **2.5** | E2E test: receipt creation + verification + ownership check | Code | nguyenai.net |
| **2.6** | Deploy aiagent.iai.one (sau code change 1.2, 1.3, 2.3) | Founder | wrangler deploy |

### Phase 3 — Hamicodeviet (sau Phase 2 E2E xanh)

| Bước | Việc | Điều kiện |
|------|------|-----------|
| **3.1** | Thêm tenant `hamicodeviet-com` vào aiagent.iai.one | Phase 2 E2E xanh |
| **3.2** | Tạo service key cho `hamicodeviet-com` | Tenant tồn tại |
| **3.3** | Deploy worker cho `api.hamicodeviet.com` | Auth + quota + pricing ready |
| **3.4** | Tạo route `api.hamicodeviet.com/*` → worker | Worker deployed |
| **3.5** | Sửa DNS `api.hamicodeviet.com` → real record (không 100::) | Route tồn tại |
| **3.6** | Xóa dangling route `ai.hamicodeviet.com/*` | Cleanup |
| **3.7** | E2E test: hamicodeviet → aiagent.iai.one | DNS + route + auth ready |

---

## 6. Founder decisions (đã xác nhận)

1. **`api.nguyenai.net`**: Giữ `nguyenai-api-gateway` độc lập, bắt buộc gọi `aiagent.iai.one` qua tenant/service contract chung. Không gộp code.
2. **`api.hamicodeviet.com`**: Deploy sau khi có tenant, auth, quota, pricing, E2E và DNS/route receipt.
3. **Model `iai-one/orion-research`**: Map sang Claude Sonnet (sẽ implement trong Phase 2 bước 2.3).
4. **Báo cáo audit**: Commit vào nguyenai.net/docs/governance/.

---

**FINAL AUDIT VERDICT:** 10/11 claim của báo cáo aiagent.iai.one `VERIFIED_CURRENT`, 1 `PARTIALLY_CONTRADICTED`. 6 P0 mới phát hiện (P0-A đã fix, P0-B/C/D là Founder manual, P0-E/F chờ Founder cho phép code aiagent.iai.one). Hamicodeviet confirmed không hoạt động. Commercial release vẫn **HOLD** cho đến khi Phase 1 + Phase 2 hoàn tất.
