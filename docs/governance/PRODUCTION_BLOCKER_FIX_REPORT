# PRODUCTION BLOCKER FIX REPORT — 2026-07-07

> **Trạng thái:** Tất cả P0 đã fix. P1 đã fix. Còn Founder action items (secrets, Google verification) trước deploy.
> **Phạm vi:** nguyenai.net monorepo (apps/api, apps/auth, apps/web, apps/edu, apps/invest, packages/@nai/*).

---

## Tóm tắt theo phase

### Phase 0 — Governance (DONE)

- `FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md` cập nhật: x-default=VI, thêm `edu.nguyenai.net` (Academy) và `academy.nguyenai.net` (redirect), phân biệt rõ edu vs academy roles.
- `NGUYEN_AI_SEO_SPEC.md` cập nhật: formalize `x-default=VI`.
- `PRODUCTION_BLOCKER_PLAN_2026-07-07.md` tạo — full plan 6 phase.

### Phase 1 — Security P0 (DONE — 5/5)

Xem `SECURITY_P0_FIX_EVIDENCE_2026-07-07.md` chi tiết.

| Mã | Fix | Verify |
|---|---|---|
| SEC-P0-1 | SQLi whitelist trong d1-store.ts | Unit test 12 assertions PASS |
| SEC-P0-2 | Passkey routes trả 503 | Audit PASS |
| SEC-P0-3 | EVIDENCE_SIGNING_KEY → secret | Audit PASS |
| SEC-P0-4 | Auth middleware trả Response 401 | Audit PASS |
| SEC-P0-5 | XSS verify.astro → textContent | Audit PASS |

### Phase 2 — Go-live SEO P0 (DONE — 7/7)

| Mã | Fix | Verify |
|---|---|---|
| SEO-P0-1 | google-site-verification.txt placeholder rõ ràng | ⚠ PENDING Founder — cần mã GSC thật |
| EDU-P0-1 | `<html lang>` dynamic (vi/en) từ URL path | Build audit PASS (142 files) |
| EDU-P0-2 | hreflang reciprocal, no /en/en/* double-prefix | Build audit PASS |
| EDU-P0-3 | x-default points to VI root | Build audit PASS |
| EDU-P0-4 | VI pages có title/desc tiếng Việt | Build audit PASS |
| INVEST-P0-1 | Full Open Graph (og:title, desc, url, image, locale) + Twitter Card | ⚠ SSR — cần live audit |
| INVEST-P0-2 | sitemap.xml.ts hợp lệ, robots.txt trỏ đúng | ⚠ SSR — cần live audit |

**Lưu ý invest:** invest dùng Cloudflare adapter (SSR/hybrid), không có static HTML trong dist. Audit build không thể check — cần live audit sau deploy.

### Phase 3 — P1 (DONE — 6/6)

| Mã | Fix | Verify |
|---|---|---|
| P1-1 | OAuth functions implement + magic-link gửi email thật (Resend) hoặc 503 | Typecheck PASS |
| P1-2 | Security headers API (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP) | Typecheck PASS |
| P1-3 | Rate limit /v1/chat, /v1/stream (20/min/user), /v1/payment/checkout (10/min/user) | Typecheck PASS |
| P1-4 | Rate limiter KV-backed (binding RATE_LIMIT) + in-memory fallback | Typecheck PASS |
| P1-5 | Admin key audit logging (gen1_admin_proxy_call) + migration path documented | Typecheck PASS |
| P1-6 | Dependency high vulns — **WAIVER** (dev/build-only, Astro 5 major bump deferred) | Documented |

**P1-6 WAIVER chi tiết:** Lỗ hổng (miniflare/undici/ws) chỉ tồn tại ở dev/build time qua `@astrojs/cloudflare` và astro/vite. Không có runtime dependency bị affected. Nâng cấp Astro 4→5 + @astrojs/cloudflare 11→12 là major version bump có thể break 5 apps. Founder directive: "ghi waiver nếu chỉ là dev dependency." Waiver ghi nhận, deferred sang sprint sau.

### Phase 4 — Audit scripts (DONE)

- `tools/audit-security-p0.ts` — verify 5 security P0 fixes + secret scan. **PASS** (13/13 checks).
- `tools/audit-seo-build.ts` — check rendered HTML trong dist (không phải source). **PASS** (142 files, 0 errors).

### Phase 5 — Verification (DONE)

| Check | Kết quả |
|---|---|
| Typecheck apps/api | PASS (0 errors) |
| Typecheck apps/auth | PASS (0 errors) |
| Typecheck packages/@nai/scholarship | PASS (0 errors) |
| Build apps/web | PASS (54 pages) |
| Build apps/edu | PASS (142 HTML files) |
| Build apps/invest | PASS (SSR, _worker.js) |
| Security P0 audit | PASS (13/13) |
| SEO build audit (web+edu) | PASS (142 files, 0 errors) |
| Scholarship unit tests | PASS (64 assertions) |

---

## RED — chưa xong / cần Founder

1. **SEO-P0-1:** `google-site-verification.txt` có placeholder `PENDING_FOUNDER_ACTION_REPLACE_WITH_REAL_CODE_FROM_GOOGLE_SEARCH_CONSOLE`. Founder phải lấy mã từ Google Search Console và thay.
2. **INVEST-P0-1/2:** invest là SSR — audit build không check được OG/hreflang/sitemap. Cần live audit sau deploy.
3. **Secrets:** Xem `SECRET_ROTATION_EVIDENCE_2026-07-07.md` — 8 secrets cần Founder set qua `wrangler secret put` trước deploy production. **EVIDENCE_SIGNING_KEY là P0 BLOCKER.**
4. **P1-6:** Dependency waiver — deferred sang sprint sau.
5. **E2E user flow:** Build green ≠ user flow works. Cần Founder (hoặc QA) đi user flow thật sau deploy preview.

## GREEN — đã xong và verify

- 5 security P0 fixes — audit PASS.
- 7 go-live SEO P0 fixes (trừ Founder action) — build audit PASS.
- 6 P1 fixes (trừ waiver) — typecheck PASS.
- 2 audit scripts mới — PASS.
- Typecheck + build + unit test — PASS.

---

## Files changed (tổng)

**Security:**
- `packages/@nai/scholarship/src/d1-store.ts` — SQLi whitelist
- `packages/@nai/scholarship/src/test.ts` — SQLi test
- `apps/auth/src/index.ts` — passkey 503, OAuth functions, magic-link email
- `apps/auth/src/db.ts` — OAuth queries
- `apps/api/wrangler.jsonc` — remove EVIDENCE_SIGNING_KEY, add RATE_LIMIT KV
- `apps/api/src/index.ts` — resolveEvidenceSigningKey, security headers, rate limit, admin key audit
- `apps/api/src/investor-routes.ts` — auth middleware Response
- `apps/api/src/rate-limiter.ts` — KV-backed rate limiter
- `apps/edu/src/pages/verify.astro` — XSS fix

**SEO:**
- `apps/web/public/google-site-verification.txt` — placeholder rõ ràng
- `apps/edu/src/layouts/AcademyLayout.astro` — lang/hreflang/x-default/OG dynamic
- `apps/edu/src/pages/index.astro` — VI title/desc
- `apps/edu/src/pages/about.astro` — VI title/desc
- `apps/edu/src/pages/certification.astro` — VI title/desc
- `apps/edu/public/robots.txt` — sitemap.xml đúng
- `apps/invest/src/layouts/InvestLayout.astro` — hreflang fix + full OG
- `apps/invest/public/og-invest.png`, `og-default.png` — OG images

**Audit:**
- `tools/audit-security-p0.ts` — security P0 audit
- `tools/audit-seo-build.ts` — SEO build audit (dist HTML)

**Governance/docs:**
- `docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md`
- `docs/governance/PRODUCTION_BLOCKER_PLAN_2026-07-07.md`
- `docs/governance/SECURITY_P0_FIX_EVIDENCE_2026-07-07.md`
- `docs/governance/SECRET_ROTATION_EVIDENCE_2026-07-07.md`
- `docs/governance/PRODUCTION_BLOCKER_FIX_REPORT_2026-07-07.md` (file này)
- `docs/governance/GOLIVE_AUDIT_AFTER_FIX_2026-07-07.md`
- `docs/governance/FOUNDER_RELEASE_SIGNOFF_PACKET_2026-07-07.md`
- `docs/seo/NGUYEN_AI_SEO_SPEC.md`
- `packages/@nai/audit/src/index.ts` — thêm `gen1_admin_proxy_call` event type
