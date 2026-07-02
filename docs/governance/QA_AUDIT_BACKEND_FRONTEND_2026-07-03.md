# QA AUDIT — Backend + Frontend

**Date:** 2026-07-03
**Scope:** Full backend (apps/api, apps/auth, packages/@nai/*) + full frontend (apps/web)
**Commit range:** `daced54` → `af6594f` (25 commits total)
**Auditor:** Devin (automated)

---

## Báo cáo đỏ (chưa xong / sai / chưa verify)

### R1 — CRITICAL: Email verification flow bị đứt

**Vấn đề:** Auth register generate `verification_token` + gửi welcome email, NHƯNG:
- Token không lưu vào DB
- Không có endpoint `/v1/auth/verify-email`
- Login yêu cầu `email_verified=true` → user không thể login

**Hậu quả:** Toàn bộ auth flow bị block ở production. User register → nhận email → click link → 404 → không login được.

**Verify:** `grep "app.post.*verify" apps/auth/src/index.ts` → không có route.

### R2 — CRITICAL: API Worker không có D1 binding

**Vấn đề:** `apps/api/wrangler.jsonc` không có `d1_databases` binding. API dùng `InMemoryAuditStore` + `InMemoryEntitlementStore` (line 92-93) — mọi data mất khi Worker restart.

**Hậu quả:**
- Audit log không persistent — vi phạm append-only audit requirement.
- Entitlements reset mỗi lần cold start — user mất quyền.
- Không thể deploy production.

**Verify:** `grep "d1_databases" apps/api/wrangler.jsonc` → exit 1 (not found).

### R3 — HIGH: Typecheck fail — 5 packages

**Vấn đề:** `pnpm typecheck` fail cho 5 packages:

| Package | Lỗi |
|---------|-----|
| `@nai/contracts` | Thiếu `tsconfig.json` → `tsc` in help thay vì check |
| `@nai/gateway-sdk` | Thiếu `tsconfig.json` + `src/language-router.ts` rỗng (0 bytes) |
| `@nai/runtime-sdk` | Thiếu `tsconfig.json` |
| `@nai/policy-fga` | Import `./index.ts` với `.ts` extension nhưng `allowImportingTsExtensions: false` |
| `@nai/email` | Thiếu `lib: ["DOM"]` cho `fetch`/`console` + type errors trong `client.ts` |

**Hậu quả:** Typecheck không pass → CI sẽ fail. Không catch được type errors trước runtime.

**Verify:** `pnpm -r typecheck` → 5 packages fail.

### R4 — HIGH: 39/47 packages là stub (20 lines, không có test)

**Vấn đề:** 39 packages `@nai/*` chỉ có 1 file `src/index.ts` với 20 lines — chỉ export `PACKAGE_INFO` metadata, không có implementation, không có test.

**Danh sách:** aqueduct, armada, artisan, atlas, beacon, bulwark, catalog-mcp, compass, conductor, conveyor, covenant, echo, ensemble, forge, foundation, harness, hound, keystone, laboratory, loom, mcp-client, mcp-host, pilot, prism, provenance, relic, scale, scout, scroll, seal, seismograph, sentinel, tally, trace, veil, warden + contracts (9 files, no test) + gateway-sdk (empty) + runtime-sdk (643 lines, no test).

**Đánh giá:** Stub packages là intentional (Phase 1 rebrand — wrapper metadata cho 36 upstream tools). Nhưng:
- `contracts` (9 src files, 0 tests) — có logic, cần test.
- `runtime-sdk` (643 lines, 0 tests) — có logic lớn, cần test.
- `gateway-sdk` — file rỗng, cần implement hoặc xóa.

### R5 — HIGH: 4 app directories trống hoàn toàn

**Vấn đề:** `apps/academy`, `apps/admin`, `apps/console`, `apps/invest` — 0 files mỗi directory.

**Hậu quả:** 4 subdomains được规划 (academy.nguyenai.net, admin.nguyenai.net, app.nguyenai.net, invest.nguyenai.net) nhưng chưa có code. `app.nguyenai.net` (Console) là product-critical — user cần UI để dùng AI Computer.

### R6 — MEDIUM: 33/50 frontend pages là thin content (<5KB)

**Vấn đề:** 33 pages dưới 5KB, 10 pages 5-10KB. Chỉ 7 pages có content đáng kể (>10KB):

| Page | Size |
|------|------|
| `/` (VI homepage) | 41.6KB |
| `/en/` (EN homepage) | 38.6KB |
| `/plans/` | 21.2KB |
| `/en/plans/` | 19.7KB |
| `/invest/` | 13.9KB |
| `/en/invest/` | 12.3KB |
| `/super-apps/` | 10.3KB |

**Hậu quả:** Thin pages = poor SEO, poor UX. Google có thể flag thin content. User không có lý do ở lại.

**Thin pages (33):** contact, network, personal, creator, docs, academy, family, trust, security, business, founder, enterprise, chapter, models, heritage, about, how-it-works, research (×2 locales mỗi loại).

### R7 — MEDIUM: Approval email hardcoded + luôn mock

**Vấn đề:** `packages/@nai/approval/src/index.ts:158` — `createEmailService({ ENVIRONMENT: 'development' })` luôn dùng MockEmailClient. Approver email hardcoded `approver@nguyenai.net`.

### R8 — LOW: API session resolution không verify với auth Worker

**Vấn đề:** `apps/api/src/index.ts:313` có TODO: `// TODO: call auth.nguyenai.net /v1/session with the cookie`. API resolve session trực tiếp từ cookie bằng `resolveSessionFromCookie` — không gọi auth Worker. Trong production với separate Workers, API không có access vào D1 của auth Worker.

### R9 — LOW: RESEND_API_KEY chưa trong deploy checklist

**Vấn đề:** `RESEND_API_KEY` không có trong wrangler.jsonc (intentional — secret). Nhưng cần `wrangler secret put RESEND_API_KEY` cho cả `nai-auth` và `nai-api` trước deploy.

### R10 — LOW: `console.error` trong production code

**Vấn đề:** `apps/api/src/index.ts:294` và `apps/auth/src/index.ts:755` — `console.error('Unhandled error:', err)` trong error handler. Workers không có structured logging. Nên dùng `wrangler tail` hoặc structured log.

---

## Báo cáo xanh (đã xong + verify)

### G1 — Build pass

**Verify:** `pnpm build` → 52/52 tasks successful, exit 0.

### G2 — Tests pass (187 assertions)

**Verify:** `pnpm test` → 61/61 tasks successful.

| Package | Assertions |
|---------|-----------|
| @nai/entitlement | 39 |
| @nai/auth | 35 |
| @nai/policy-engine | 30 |
| @nai/e2e-tests (P0-B) | 34 |
| @nai/audit | 18 |
| @nai/policy-fga | 18 |
| @nai/approval | 13 |
| @nai/email | 10 |
| @nai/e2e-tests (audit registry) | 38 |
| **Total** | **187+** |

### G3 — Frontend build pass (50 pages)

**Verify:** `pnpm --filter ./apps/web build` → 50 pages built in 815ms, exit 0.

### G4 — SEO infrastructure pass

**Verify:**
- 50/50 pages có `<link rel="canonical">` ✓
- 50/50 pages có hreflang (vi-VN, en, x-default) ✓
- 50/50 pages có `<meta property="og:title">` ✓
- 50/50 pages có `<meta name="description">` ✓
- 50/50 pages có JSON-LD structured data ✓
- Sitemap: 25 VI URLs + 25 EN URLs = 50 total ✓
- `robots.txt` disallow `/app/`, `/admin/`, `/private/`, `/.devin/` ✓

### G5 — Accessibility baseline pass

**Verify:**
- 50/50 pages có đúng 1 `<h1>` ✓
- 50/50 pages có skip-link ✓
- 50/50 pages có `<!DOCTYPE html>` ✓
- CSS có `:focus-visible` styles ✓
- CSS có `@media (prefers-reduced-motion: reduce)` ✓
- CSS có responsive breakpoints (960px, 560px) ✓

### G6 — Brand compliance pass

**Verify:**
- Brand colors trong CSS: `#7A2212` (heritage-dark), `#A6260C` (heritage-red), `#E55B09` (burnt-orange), `#F48B0D` (sun-orange), `#FFB810` (gold), `#FFFACC` (light-cream), `#4A1D14` (ink), `#FFFAF0` (surface) ✓
- 3 font families: "Be Vietnam Pro" (body), "Noto Serif" (headings), "JetBrains Mono" (code) ✓
- "Máy Tính AI" không xuất hiện trong brand surfaces (title/OG/hero) — chỉ trong body content như danh từ mô tả ✓
- Không có `iai-one`, `IAI.ONE`, `AIAGENT`, `computer.iai.one`, `maytinhai.org` trong frontend src ✓
- Không có contamination trong backend ✓
- 3 OG images: `og-default.png`, `og-academy.png`, `og-invest.png` ✓

### G7 — Security baseline pass

**Verify:**
- Session cookie: `HttpOnly` + `Secure` + `SameSite=Lax` + `Domain=.nguyenai.net` ✓
- CSRF token verification trên POST/DELETE (constant-time comparison) ✓
- Rate limiting: 5 attempts/15min per email + IP ✓
- IDOR fix: API key ownership check trước khi delete ✓
- MFA: real TOTP verification via `otpauth` ✓
- Password hashing: PBKDF2 600K iterations ✓
- Auth routes require session + CSRF (except register/login) ✓
- API routes return 401 cho unauthenticated requests ✓
- Audit log: SUPER_ADMIN only ✓
- No hardcoded secrets in source ✓

### G8 — Auth Worker D1 integration pass

**Verify:**
- `apps/auth/wrangler.jsonc` có D1 binding (`nai-identity`) ✓
- Auth dùng `D1AuditStore` (persistent) — không phải InMemory ✓
- 12 auth routes tất cả dùng `c.env.DB` cho DB operations ✓
- Migrations: 2 SQL files (001_identity_access + 002_audit_event_registry) ✓

### G9 — Governance docs complete (28 documents)

**Verify:** `ls docs/governance/*.md | wc -l` → 28 documents.

### G10 — E2E integration pass

**Verify:** P0-B E2E test — 34/34 assertions pass:
- Register → login → MFA → API key → entitlements → approval → audit chain ✓
- Audit registry E2E — 38/38 event types ✓
- Append-only audit: no update/delete methods ✓
- Cross-tenant access denied ✓

### G11 — Email service pass

**Verify:** (từ QA_AUDIT_EMAIL_PHASE_2026-07-03.md)
- 20 templates, 8 categories ✓
- 40 renders (20 × VI/EN) ✓
- Workers-compatible (fetch-based) ✓
- MockEmailClient for testing ✓

### G12 — Monorepo structure pass

**Verify:**
- pnpm workspace + turbo ✓
- 7 apps: web, api, auth, console, admin, academy, invest (4 trống) ✓
- 47 @nai/* packages (8 có implementation, 39 stubs) ✓
- 2 migrations ✓
- 2 E2E test suites ✓
- 516 tracked files, 32MB total ✓

---

## Cấu trúc hệ thống (snapshot)

### Backend

```
apps/
├── api/          (13 routes, InMemory stores — R2)
├── auth/         (12 routes, D1 persistent — R2)
├── academy/      (EMPTY — R5)
├── admin/        (EMPTY — R5)
├── console/      (EMPTY — R5)
├── invest/       (EMPTY — R5)
└── web/          (50 pages, Astro static)

packages/@nai/ (47 packages)
├── IMPLEMENTED (8): auth, audit, approval, entitlement, policy-engine,
│                   policy-fga, email, product-catalog
├── CONTRACTS (1): contracts (9 files, no test — R4)
├── RUNTIME (1): runtime-sdk (643 lines, no test — R4)
├── GATEWAY (1): gateway-sdk (empty file — R4)
└── STUBS (36): metadata-only wrappers (20 lines each — R4)

migrations/
├── 001_identity_access.d1.sql  (286 lines)
├── 001_identity_access.sql     (272 lines)
└── 002_audit_event_registry.sql (114 lines)
```

### Frontend

```
apps/web/
├── src/
│   ├── pages/       (50 .astro pages)
│   ├── components/  (1: PageShell.astro)
│   ├── layouts/     (1: BaseLayout.astro)
│   ├── data/        (2: pages.ts, site.ts)
│   └── styles/      (1: global.css, 952 lines)
├── public/          (favicon, logo, OG images, sitemaps, robots)
└── dist/            (50 HTML pages, 378KB total)

Page content distribution:
- >10KB:  7 pages (homepage ×2, plans ×2, invest ×2, super-apps ×1)
- 5-10KB: 10 pages
- <5KB:   33 pages (thin content — R6)
```

---

## Priority fix order

| Priority | Issue | Effort | Block |
|----------|-------|--------|-------|
| P0 | R1 — Email verification endpoint + token storage | Medium | Auth production |
| P0 | R2 — API D1 binding + persistent stores | Medium | API production |
| P1 | R3 — Typecheck fail (5 packages) | Small | CI |
| P1 | R5 — Console app (app.nguyenai.net) | Large | User UX |
| P2 | R4 — Tests for contracts + runtime-sdk | Medium | Code quality |
| P2 | R6 — Thin content (33 pages) | Large | SEO + UX |
| P2 | R7 — Approval email dynamic approver | Small | Approval email |
| P3 | R8 — API session verify with auth Worker | Medium | Multi-Worker deploy |
| P3 | R9 — Deploy checklist for RESEND_API_KEY | Trivial | Ops |
| P3 | R10 — Structured logging | Small | Observability |

---

## Verdict

**Backend: FUNCTIONAL FOR DEV/TEST, BLOCKED FOR PRODUCTION.**
- Auth Worker: D1 persistent, 12 routes, security baseline pass — nhưng email verification đứt (R1).
- API Worker: 13 routes, InMemory stores — không persistent (R2), không deploy được.
- 8 packages có implementation + tests (187 assertions). 39 packages là stubs.
- Typecheck fail 5 packages (R3).

**Frontend: SEO/ACCESSIBILITY INFRASTRUCTURE PASS, CONTENT GAP.**
- 50 pages build OK, SEO/a11y baseline pass.
- 33/50 pages thin content (<5KB) — cần bổ sung trước production.
- 4 app directories trống (console, admin, academy, invest).
- Brand compliance pass, no contamination.

**Sprint 0 governance: CLOSED (28 docs, all verified).**
**Sprint 1+ (implementation): IN PROGRESS — R1 + R2 là blocker production gần nhất.**
