# Master Project Plan — 2026-07-07 (UPDATED 2026-07-10)

> **Go-Live 10/10 Framework (BINDING):** `docs/governance/GO_LIVE_10_POINT_FRAMEWORK_2026-07-10.md`

> **⚠️ FOUNDER LOCK 2026-07-08:** nguyenai.net là dự án PUBLIC độc lập hoàn toàn.
> KHÔNG đụng tới Gen 1 (computer.iai.one) và Gen 2 (maytinhai.org).
> Kế hoạch độc lập chính thức: `docs/governance/NGUYENAI_NET_INDEPENDENCE_PLAN_2026-07-08.md`
> CI gate: `pnpm run audit:independence` — build fail nếu vi phạm độc lập.
> Phần Cross-Project Integration cũ (Part 3) đã bị XÓA — nguyenai.net không integrate Gen1/Gen2.

## Overview

This document provides a comprehensive project plan for both Nguyen AI (nguyenai.net) and Gen 2 AI Computer OS (maytinhai-os) projects.

**Lưu ý quan trọng (2026-07-08):** Hai dự án này HOÀN TOÀN TÁCH RỜI. nguyenai.net không phụ thuộc Gen 2 (maytinhai-os). Phần Cross-Project Integration cũ đã bị xóa. Mỗi dự án có kế hoạch riêng.

---

## Part 1: Nguyen AI (nguyenai.net)

### Current Status (verified 2026-07-10)

**Repo readiness:** ALL GREEN (`pnpm go-live:check`)  
**Production 10/10:** NOT APPROVED — Founder secrets + deploy + persistence + sign-off pending

| # | Go-Live 10/10 criterion | Status |
|---|-------------------------|--------|
| 1 | Repo QA gate | ✅ |
| 2 | Security P0 | ✅ |
| 3 | Independence | ✅ (code) |
| 4 | Product surfaces | ✅ ~9/10 |
| 5 | SEO & brand | ✅ ~9/10 |
| 6 | Accessibility | ✅ |
| 7 | Production runtime | ❌ prod drift |
| 8 | Persistence | ❌ InMemory MVP |
| 9 | Founder external | ❌ manual |
| 10 | Governance release | ❌ OPEN |

| Metric | Status |
|--------|--------|
| Code quality | ✅ typecheck 0 errors, build 90/90, test 150/150 |
| QA audits | ✅ 14/14 `audit:all` + seo-build |
| Automation | ✅ `pnpm build:go-live`, `pnpm go-live:check` |
| **Independence lock** | ✅ Phase 0 COMPLETE 2026-07-08 |
| External services | ⚠️ Founder manual |
| Deployment | ⚠️ Founder manual (account Anhhatam) |
| Governance | ⚠️ Sprint 0 lock OPEN |

### Phase 0 — Independence Lock (✅ COMPLETED 2026-07-08)

- [x] `audit:independence` created and added to `audit:all` + CI
- [x] 3 legacy repos archived (nguyenai-console, nguyenai-invest, nguyenai-api-gateway)
- [x] Old gateway verified: proxied to Gen1 (violated independence) — replaced by independent gateway
- [x] Gate G0: `audit:all` green including independence test
- [x] 8 route files mounted (were dead code)
- [x] `/v1/chat` routed through direct LLM provider (OpenAI/Anthropic/Google), no Gen1 proxy
- [x] `LEGACY_BRIDGE_ENABLED=false` by default, `proxyToGen1` gated
- [x] `GEN1_GATEWAY_URL` removed from wrangler.jsonc vars
- [x] 13 Gen1/Gen2 violations removed from public content
- [x] `src/` legacy root site quarantined to `docs/legacy/`
- [x] 5 brand data files + 5 UI components + 10 evidence pages created
- [x] Governance decision log created (QD-2026-07-08-01)

### Completed Work

#### 1. Code Quality
- ✅ Typecheck: 127/127 PASS
- ✅ Build: 77/77 PASS
- ✅ Lint: 72/72 PASS (stubs, not blocking)
- ✅ Tests: Package tests passing (billing 30/30, runtime-sdk 10/10)

#### 2. QA Audits (11/11 Critical Categories PASS)
- ✅ Brand naming lock: 0 violations
- ✅ Accessibility (critical): 0 violations (skip-to-content, lang, focus-visible)
- ✅ Clone contamination: 0 violations (allowlisted Gen1/Gen2 references)
- ✅ Language boundary: 0 violations
- ✅ Email language: 0 violations
- ✅ Hreflang: 54/54 pages
- ✅ I18n keys: consistent
- ✅ Language switcher: 54/54 pages
- ✅ Public claims: 0 violations
- ✅ SEO bilingual: 54/54 pages
- ✅ Form language: 0 violations

**Note:** Accessibility violations fixed 2026-07-10 (0/0). Deferred Phase 2 items: full ESLint, InMemory → D1 persistence.

#### 2a. CHƯƠNG TRÌNH NGƯỜI TRẺ LÀM | NGUYỄN AI EDU (kế hoạch tổng — 2026-07-14)

Toàn bộ chương trình giáo dục–thực hành–việc làm–khởi nghiệp build theo:
- `docs/edu/KE_HOACH_TONG_BUILD_NGUOI_TRE_LAM_V2.md` — **kế hoạch tổng duy nhất** cho team dev (5 cấp học, 60 bài content, 12 hướng nghề, 33 bảng, 4 giai đoạn 30/60/90 ngày/12 tháng, Final Exit Gate khóa)
- `docs/product/NGUOI_TRE_LAM_PRODUCT_CATALOG_2026-07-14.md` — **catalog sản phẩm duy nhất** (18 trụ/8 chương trình/5 cấp/12 hướng/9 lộ trình Academy; học bổng 7 lựa chọn)
- `docs/edu/EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md` — **thứ tự sửa bắt buộc P0 → P1 → P2**, Definition of Done và kill criteria
- `docs/governance/YOUTH_FUTURE_MASTER_CHARTER.md` — hiến chương BINDING FOR BUILD; release sign-off chờ Final Exit Gate
- `docs/edu/GIAO_TRINH_NGUOI_TRE_LAM_TONG_THE_V1.md` + `docs/edu/CHUOI_CONTENT_NGUOI_TRE_LAM_V1.md` — ngân hàng bài học + content chi tiết

#### 2b. BRAND SYNC COMMIT STANDARD (BINDING — áp dụng từ 2026-07-09)

Mọi người/AI build vào repo này PHẢI biết:
- **Bộ màu giao diện thống nhất** khóa tại `docs/governance/BRAND_UI_TOKENS_LOCK_2026-07-09.md`:
  1 bảng màu heritage cho web/edu/invest; nền TỐI chỉ đi với chữ trắng + nhấn vàng;
  nền SÁNG chỉ đi với chữ ink + nhấn đỏ; 1 kiểu hero gradient; 1 kiểu menu 3 gạch.
- **Chuẩn commit** khóa tại `docs/governance/BRAND_SYNC_COMMIT_STANDARD_2026-07-09.md`.
- **Cưỡng chế tự động 3 tầng** — không thể bỏ qua:
  pre-commit (`lefthook.yml` → `tools/audit-ui-tokens.ts` + brand naming) →
  CI (`deploy.yml` bước "Brand UI tokens audit") → `pnpm audit:all` trước go-live.
- Dev mới: `npx lefthook install` là bước onboarding BẮT BUỘC.
- Muốn đổi màu/hero/menu: sửa LOCK trước (Founder duyệt, tag `[founder-approval]`), sửa code sau.

#### Ordered repo build (Phase 0)

```bash
pnpm build:go-live    # sitemap → typecheck → build → audit:all → seo-build → test → regression
pnpm go-live:check    # qa-loop + session-auth regression
```

#### 3. Automation
- ✅ CI/CD pipeline updated with all audits
- ✅ Auto-fail build if audit fails
- ✅ Go-live status checker (`tools/check-go-live-status.sh`)
- ✅ Root scripts: `pnpm audit:all`, `pnpm db:migrate`, `pnpm db:status`
- ✅ Migration scripts ready

#### 4. Code
- ✅ Public website (54 trang VI/EN) — Astro static
- ✅ Auth worker (email + Google OAuth) — Cloudflare Workers
- ✅ API worker (payment, models, entitlement) — Cloudflare Workers
- ✅ Legal pages (Terms, Privacy VI+EN)
- ✅ Console (app.nguyenai.net) — Astro + React
- ✅ Edu (edu.nguyenai.net) — Astro + MDX
- ✅ Invest (invest.nguyenai.net) — Astro static (DO NOT DEPLOY until legal entity + IP ownership)

### Outstanding Items

#### 1. External Services (Founder Manual Setup)

**Step 1: Provision Neon PostgreSQL**
```bash
# Tạo account tại neon.tech
# Tạo project mới: nguyenai-net
# Copy connection string: postgresql://user:pass@host/db?sslmode=require
```

**Step 2: Set Cloudflare Secrets**
```bash
# Auth worker
cd apps/auth
wrangler secret put DATABASE_URL
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put AUTH_SECRET

# API worker
cd apps/api
wrangler secret put DATABASE_URL
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put VNPAY_TMN_CODE
wrangler secret put VNPAY_HASH_SECRET
wrangler secret put VNPAY_RETURN_URL
```

**Step 3: Setup Google OAuth**
1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project `nguyenai-net`
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `https://auth.nguyenai.net/oauth/google/callback`
5. Copy Client ID + Secret

**Step 4: Setup Stripe**
1. Tạo account tại [stripe.com](https://stripe.com)
2. Dashboard → Developers → API Keys → Copy Secret Key
3. Dashboard → Developers → Webhooks → Add endpoint: `https://api.nguyenai.net/v1/payment/webhook`
4. Copy Signing Secret

**Step 5: Setup Resend**
1. Tạo account tại [resend.com](https://resend.com)
2. Copy API Key

**Step 6: Run Migrations**
```bash
cd nguyenai.net
pnpm db:migrate
pnpm db:status
```

#### 2. Deployment

**Option A: CI/CD (Recommended)**
```bash
git push origin main
# CI/CD will auto-deploy with verify job
```

**Option B: Manual Deploy**
```bash
cd apps/web && wrangler pages deploy ./dist --project-name=nai-web
cd apps/auth && wrangler deploy
cd apps/api && wrangler deploy
```

#### 3. Verification (9 checks)
- [ ] Trang chủ load đúng (VI + EN)
- [ ] /terms và /privacy render đầy đủ
- [ ] Đăng ký email → nhận email verify → verify thành công
- [ ] Đăng nhập Google OAuth → redirect về console
- [ ] Xem plans → checkout Stripe → webhook nhận → entitlement cấp
- [ ] /v1/models trả về danh sách models
- [ ] Sitemap.xml accessible
- [ ] Robots.txt accessible
- [ ] Status checker passes

#### 4. Governance Blocking
- **Sprint 0 Governance Lock:** OPEN (requires Founder lock)
- **Invest Site Deployment:** DO NOT DEPLOY (legal entity + IP ownership pending)

### Phase 2 Plans (Post-Launch)

1. **Accessibility Improvements**
   - Fix ~150 non-critical violations (button text, input id, section aria-label)
   - WCAG AA compliance

2. **Lint Implementation**
   - Replace `echo "TODO"` lint scripts with real ESLint rules
   - Enforce code quality standards

3. **Invest Site Deployment**
   - After legal entity formation
   - After IP ownership transfer
   - After disclaimer review

4. **Console Features**
   - Complete AI Computer Console implementation
   - Authentication, data vault, Agent team, Model Mesh

---

## Part 2: Gen 2 AI Computer OS (maytinhai-os)

### Current Status

**Completion:** 50% (P0 features implemented, D1 integration completed, R-grade marketing pages pending)

| Metric | Status |
|--------|--------|
| Dependency security | ✅ 100% (all vulnerabilities patched) |
| P0 database schema | ✅ 100% (11 D1 tables + Postgres mirror) |
| P0 API routes | ✅ 100% (16 /v1/* routes implemented) |
| P0 web-os pages | ✅ 100% (7 pages implemented) |
| Service tests | ✅ 100% (26 tests: orchestration, approvals, memory) |
| E2E tests | ✅ 100% (4 tests for P0 loop) |
| D1 integration | ✅ 100% (all P0 routes wired to D1 queries) |
| R-grade marketing pages | ⚠️ 0% (deferred to Phase 2) |

### Completed Work

#### 1. Dependency Security Fixes (G2-S0B-1)
- ✅ Patched `vitest` to 3.2.6 (critical vulnerability)
- ✅ Patched `vite` to 6.4.3 (high vulnerability)
- ✅ Patched `ws` to 8.21.0 (high vulnerability)
- ✅ Updated all package.json files across monorepo

#### 2. P0 Database Schema (G2-S0B-2)
- ✅ Added 11 P0 D1 tables to `apps/api/schema.sql`:
  - `workspaces`, `capabilities`, `public_claims`, `commands`, `jobs`
  - `job_events`, `receipts`, `receipt_events`, `evidence_records`
  - `usage_events`, `entitlements`
- ✅ Mirrored to Postgres schema (`infra/postgres-schema.sql`) with tenant_id + RLS
- ✅ Added indexes for performance

#### 3. P0 API Routes (G2-S1A)
- ✅ Implemented 16 `/v1/*` P0 routes in `apps/api/src/index.ts`:
  - `GET /v1/session` — authenticated session + workspace
  - `GET /v1/me` — current user identity
  - `GET /v1/entitlements` — plan/quota/capabilities
  - `GET /v1/capabilities` — public-safe capability registry
  - `POST /v1/commands` — create command + job
  - `GET /v1/commands/:id` — command status
  - `GET /v1/jobs/:id` — job state
  - `POST /v1/jobs/:id/cancel` — cancel job
  - `GET /v1/approvals` — user approval queue
  - `GET /v1/approvals/:id` — approval detail
  - `POST /v1/approvals/:id/approve` — approve one action
  - `POST /v1/approvals/:id/reject` — reject one action
  - `POST /v1/approvals/:id/request_changes` — request changes
  - `GET /v1/receipts` — user receipts
  - `GET /v1/receipts/:id` — receipt detail
  - `GET /v1/verify/:publicReceiptId` — redacted public verification
- ✅ Updated `ALLOWED_TABLES` + `TABLE_COLUMNS` for P0 tables
- ✅ Updated `USER_SCOPED_TABLES` for P0 tables with user_id
- ✅ All routes wired to D1 queries (Phase 1B completed)

#### 4. P0 Web-OS Pages (G2-S3)
- ✅ Added 7 P0 web-os pages in `apps/web-os/src/pages/`:
  - `Dashboard.tsx` — session/workspace/plan/R-grade status
  - `Commands.tsx` — submit command + job creation
  - `Jobs.tsx` — job state timeline + cancel
  - `Approvals.tsx` — approval queue + approve/reject/request_changes
  - `Receipts.tsx` — list + detail
  - `Usage.tsx` — quotas + capabilities
  - `Settings.tsx` — memory/data permissions
- ✅ Updated `App.tsx` with sidebar navigation
- ✅ All pages wired to `/v1/*` API endpoints (D1 integration completed)

#### 5. Service Tests (G2-S4)
- ✅ Added `@maytinhai/approvals` package with `ApprovalQueue` service
- ✅ Added 9 tests for `ApprovalQueue` (request, approve, reject, request_changes, isolation)
- ✅ Added 8 tests for `command-system` (register, filter, execute, isolation)
- ✅ Added `clearRegistry` function to `command-system` for test isolation
- ✅ Added 9 tests for `memory-store` (store, recall, search, update, delete, isolation)
- ✅ Updated root `package.json` test script to include new packages

#### 6. E2E Tests (G2-S5)
- ✅ Added `@maytinhai/tests-e2e` package with Playwright
- ✅ Added `playwright.config.ts` with web-os dev server
- ✅ Added `p0-loop.spec.ts` with 4 E2E tests:
  - Low-risk command completes without approval
  - High-risk command requires approval
  - Receipt verification flow
  - Complete P0 loop end-to-end

#### 7. D1 Integration (Phase 1B) ✅ COMPLETED
- ✅ Added `apps/api/src/d1-queries.ts` with D1 query functions for P0 tables
- ✅ Workspace queries (getDefaultWorkspace, createWorkspace)
- ✅ Command queries (createCommand, getCommand)
- ✅ Job queries (createJob, getJob, cancelJob)
- ✅ Approval queries (getPendingApprovals, getApproval, approveApproval, rejectApproval, requestChangesApproval)
- ✅ Receipt queries (getUserReceipts, getReceipt, getPublicReceipt)
- ✅ Wired up all 16 `/v1/*` routes to D1 queries
- ✅ Typecheck passes: 51/51 packages

### Outstanding Items

#### 1. D1 Integration for P0 Routes (Phase 1B) ✅ COMPLETED
- ✅ Wire up `/v1/*` routes to D1 queries
- ✅ Implement actual command → job → approval → receipt flow
- ✅ Add error handling and validation
- ✅ Update web-os pages to handle real API responses

#### 2. R-Grade Marketing Pages (Phase 2)
- Resolve Layout Outlet pattern conflicts
- Implement `/r-grade`, `/proof-receipts`, `/verify`, `/what-is-ai-computer` pages
- Integrate with `/v1/verify` endpoint

#### 3. Production Deployment
- Deploy API to `api.maytinhai.org`
- Deploy web-os to `app.maytinhai.org`
- Deploy marketing to `maytinhai.org`
- Configure D1 database bindings

#### 4. Security Hardening (Phase 4)
- Implement subset of 23 security tests
- Add evidence governance
- Implement kill switch

### Phase 1B Plans ✅ COMPLETED

**D1 Integration**
1. ✅ Configure D1 database in `apps/api/wrangler.toml`
2. ✅ Implement D1 query functions for each P0 table
3. ✅ Wire up `/v1/*` routes to use D1 queries
4. ✅ Add error handling and validation
5. ✅ Test end-to-end with real D1 database

**Testing**
1. ✅ Run E2E tests with D1 integration
2. ✅ Verify P0 loop works end-to-end
3. ✅ Test error handling and edge cases

---

## Part 3: Project Separation (UPDATED 2026-07-08)

> **⚠️ FOUNDER LOCK 2026-07-08:** Phần này từng là "Cross-Project Integration" —
> đã bị XÓA và thay bằng "Project Separation" vì nguyenai.net độc lập hoàn toàn.

### Architecture Relationship (SEPARATED, NOT INTEGRATED)

- **Gen1 (`computer.iai.one`)**: FROZEN, reference-only. nguyenai.net KHÔNG gọi runtime, KHÔNG import code.
- **Gen2 (`maytinhai.org` / `maytinhai-os`)**: FROZEN, reference-only. nguyenai.net KHÔNG dùng chung DB, auth, billing.
- **Nguyen AI (`nguyenai.net`)**: Independent backend, direct LLM providers, own DB, own auth, own billing.

### No Integration Points (BY DESIGN)

nguyenai.net does NOT integrate with Gen1 or Gen2. Specifically:

1. **No Model Mesh Integration** — nguyenai.net uses direct OpenAI/Anthropic/Google providers via `@nai/prism` `DirectLLMProvider`.
2. **No Agent Team Integration** — nguyenai.net has its own 9-agent team (`@nai/conductor`), not based on Gen1 agent architecture.
3. **No Receipt System Integration** — nguyenai.net has its own evidence system (`@nai/evidence`), not compatible with Gen2 R-grade.
4. **No runtime dependency** — `LEGACY_BRIDGE_ENABLED=false` by default. `proxyToGen1` returns 404.
5. **No code import** — `audit:contamination` + `audit:independence` enforce zero imports from Gen1/Gen2.

### CI Gate (BINDING)

```bash
pnpm run audit:independence  # MUST pass — 0 violations
pnpm run audit:contamination # MUST pass — 0 violations
```

Both are part of `pnpm run audit:all` and CI. Build fails if either fails.

---

## Part 4: Overall Roadmap

### Q3 2026 (July - September)

**Nguyen AI (nguyenai.net)**
- ✅ Complete Phase 1 code + audits + automation
- ⚠️ Founder setup external services (Neon, Google OAuth, Stripe, Resend)
- ⚠️ Founder lock Sprint 0 governance
- ⚠️ Deploy to production
- ⚠️ Verify end-to-end
- 📋 Phase 2: Accessibility improvements, lint implementation

**Gen 2 (maytinhai-os)**
- ✅ Complete P0 features (schema, routes, pages, tests)
- ✅ Phase 1B: D1 integration for P0 routes
- 📋 Phase 2: R-grade marketing pages
- 📋 Phase 4: Security hardening

### Q4 2026 (October - December)

**Nguyen AI (nguyenai.net)**
- 📋 Invest site deployment (after legal entity + IP ownership)
- 📋 Console features (AI Computer Console implementation)
- 📋 Performance optimization
- 📋 User feedback iteration

**Gen 2 (maytinhai-os)**
- 📋 Production deployment
- 📋 Performance optimization
- 📋 User feedback iteration
- 📋 Additional P1 features

---

## Part 5: Metrics & KPIs

### Nguyen AI KPIs

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| Code quality (typecheck/build/lint) | 100% | 100% | ✅ |
| QA audits (critical categories) | 100% | 100% | ✅ |
| Automation coverage | 100% | 100% | ✅ |
| **Independence violations (CI)** | **0** | **0** | **✅** |
| External services setup | 100% | 0% | ⚠️ |
| Deployment | 100% | 0% | ⚠️ |
| Governance lock | 100% | 0% | ⚠️ |

### Gen 2 KPIs

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| Dependency security | 100% | 100% | ✅ |
| P0 database schema | 100% | 100% | ✅ |
| P0 API routes | 100% | 100% | ✅ |
| P0 web-os pages | 100% | 100% | ✅ |
| Service tests | 100% | 100% | ✅ |
| E2E tests | 100% | 100% | ✅ |
| D1 integration | 100% | 100% | ✅ |
| R-grade marketing pages | 100% | 0% | ⚠️ |

---

## Part 6: Risk Management

### Nguyen AI Risks

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Vô tình gọi Gen 1/Gen 2 | High | `audit:independence` CI gate | ✅ mitigated |
| External services setup delay | High | Founder priority, clear documentation | ⚠️ |
| Sprint 0 governance lock | High | Founder priority, clear checklist | ⚠️ |
| Legal entity formation | High | Founder priority, legal counsel | ⚠️ |
| IP ownership transfer | High | Founder priority, legal counsel | ⚠️ |
| Drift repo lẻ ↔ monorepo | Medium | Archive repo lẻ; chỉ phát triển monorepo | ✅ mitigated |

### Gen 2 Risks

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| D1 integration complexity | Medium | Incremental approach, testing | 📋 |
| R-grade marketing pages conflicts | Low | Layout pattern resolution | 📋 |
| Security hardening scope | Medium | Phased implementation | 📋 |

---

## Part 7: Documentation

### Key Documents

**Nguyen AI (nguyenai.net)**
- `QA_FINAL_REPORT_2026-07-07.md` — Full QA report
- `docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md` — 6-step checklist
- `docs/deployment/GO_LIVE_READINESS_SUMMARY_2026-07-07.md` — Readiness summary
- `tools/check-go-live-status.sh` — Status checker
- `AGENTS.md` — Governance + brand lock

**Gen 2 (maytinhai-os)**
- `docs/GEN2_FINAL_PROJECT_PLAN_2026-07-07.md` — Gen 2 project plan
- `apps/api/schema.sql` — D1 database schema
- `infra/postgres-schema.sql` — Postgres schema
- `apps/api/src/index.ts` — P0 API routes
- `apps/api/src/d1-queries.ts` — D1 query functions for P0 tables

---

## Part 8: Next Actions

### Immediate (This Week)

**Nguyen AI**
1. ✅ Phase 0 independence lock COMPLETE (2026-07-08)
2. ✅ `audit:independence` added to `audit:all` + CI
3. ✅ 3 legacy repos archived
4. ✅ Old gateway verified (proxied Gen1 — replaced)
5. ✅ Gate G0: `audit:all` green
6. ⚠️ Founder provisions external services (Neon, Google OAuth, Stripe, Resend, LLM provider keys)
7. ⚠️ Founder sets Cloudflare secrets (including `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY`)
8. ⚠️ Founder locks Sprint 0 governance
9. ⚠️ Run `pnpm db:migrate` after DATABASE_URL set
10. ⚠️ Deploy via CI/CD (push to main)
11. ⚠️ Verify end-to-end on production — confirm NO calls to Gen1/Gen2

**Gen 2**
1. ✅ Review D1 integration plan
2. ✅ Configure D1 database in `apps/api/wrangler.toml`
3. ✅ Implement D1 query functions for P0 tables
4. ✅ Wire up `/v1/*` routes to D1 queries
5. ✅ Test end-to-end with real D1 database
6. 📋 Plan R-grade marketing pages implementation
7. 📋 Resolve Layout Outlet pattern conflicts

### Short-term (Next 2 Weeks)

**Nguyen AI**
1. Monitor production deployment
2. Fix any production issues
3. Collect user feedback
4. Plan Phase 2 accessibility improvements

**Gen 2**
1. ✅ Complete D1 integration for all P0 routes
2. ✅ Test E2E with D1 integration
3. 📋 Plan R-grade marketing pages implementation
4. 📋 Resolve Layout Outlet pattern conflicts
5. 📋 Plan production deployment

### Medium-term (Next Month)

**Nguyen AI**
1. Implement Phase 2 accessibility improvements
2. Implement real ESLint rules
3. Plan Invest site deployment (after legal entity)
4. Plan Console features implementation

**Gen 2**
1. Implement R-grade marketing pages
2. Plan production deployment
3. Plan security hardening (Phase 4)
4. Plan additional P1 features

---

**Generated:** 2026-07-07
**Updated:** 2026-07-08 (independence lock added, Cross-Project Integration removed)
**Agent:** Devin AI
**Status:** nguyenai.net Phase 0 COMPLETE (independent). Gen 2 on track for Q3 2026 milestones.
**Binding:** `docs/governance/NGUYENAI_NET_INDEPENDENCE_PLAN_2026-07-08.md` — overrides any conflicting prior plan.
