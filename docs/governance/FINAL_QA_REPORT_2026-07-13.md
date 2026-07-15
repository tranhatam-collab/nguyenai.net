# Final QA Report — 2026-07-13

> **HISTORICAL SNAPSHOT ONLY:** Báo cáo này chỉ áp dụng cho commit `d7a9c67`. Probe OAuth ở đây chỉ xác minh redirect URI, không phải repeated-login/account-link E2E. Current verdict nằm tại `JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md` và là **HOLD**.

## Summary

| Item | Status |
|------|--------|
| CI/CD pipeline | ✅ ALL GREEN (20 audits + typecheck + build + test) |
| Deploy Web → nguyenai.net | ✅ Live (HTTP 200) |
| Deploy Edu → edu.nguyenai.net | ✅ Live (HTTP 200) |
| Deploy Console → app.nguyenai.net | ✅ Live (HTTP 302 → /login) |
| Deploy Invest → invest.nguyenai.net | ✅ Live (HTTP 200) |
| Deploy API Worker → api.nguyenai.net | ✅ Live (health OK) |
| Deploy Auth Worker → auth.nguyenai.net | ✅ Live (HTTP 200) |
| Google OAuth flow | ✅ Fixed (redirect_uri matches Google Console) |
| Email verify flow | ✅ Live (path-based URL, SHA-256 hashed tokens) |
| JWT_SECRET | ✅ Set (64-byte random, rotated) |
| GOOGLE_CLIENT_ID/SECRET | ✅ Set |

## What was built

1. **OAuth fix** — `GOOGLE_REDIRECT_URI` corrected to `https://auth.nguyenai.net/oauth/google/callback` (matches Google Console URI 17)
2. **Verify page** — `auth.nguyenai.net/verify/:token` (path-based, no `=` in URL, prevents MIME mangling)
3. **PayOS gateway** — `pay-gateway.nguyenai.net` integration (VND, merchant of record: KASAN JSC)
4. **Email templates** — verify URL points to `auth.nguyenai.net/verify/:token`
5. **Token hashing** — SHA-256 hash at rest (not plaintext)
6. **Security headers** — noindex, no-referrer, no-store on verify page
7. **Bilingual verify pages** — `/verify` (vi) + `/en/verify` (en) with hreflang + canonical + language switcher

## What was tested

| Test | Result |
|------|--------|
| Brand naming lock audit | ✅ PASS |
| Brand UI tokens audit | ✅ PASS |
| Accessibility audit | ✅ PASS |
| Clone contamination audit | ✅ PASS |
| Language boundary audit | ✅ PASS |
| Email language audit | ✅ PASS |
| Hreflang audit | ✅ PASS (66/66 pages) |
| I18n keys audit | ✅ PASS |
| Language switcher audit | ✅ PASS (66/66 pages) |
| Public claims audit | ✅ PASS |
| SEO bilingual audit | ✅ PASS |
| Form language audit | ✅ PASS |
| Independence audit | ✅ PASS |
| Security P0 audit | ✅ PASS |
| Typecheck | ✅ PASS |
| Build (web/edu/console/invest) | ✅ PASS |
| SEO build audit (rendered HTML) | ✅ PASS (66 files, 0 errors) |
| Vietnamese purity build audit | ✅ PASS |
| Test | ✅ PASS |
| Live HTTP probes (6 sites) | ✅ ALL responding |
| OAuth begin endpoint | ✅ Returns correct redirect_uri |

## What is NOT included (Phase 2)

1. **Payment provider accounts** — KASAN JSC bank verification + PayOS merchant + Stripe account
2. **Certificate verify product** — `edu.nguyenai.net/verify` is placeholder
3. **LLM provider keys** — OpenAI/Anthropic/Google API keys for `/v1/chat`
4. **MAIL_GATEWAY_API_KEY** — using RESEND_API_KEY fallback
5. **Live E2E user journey** — signup → OAuth → payment → entitlement → product (needs payment + LLM)
6. **Monitoring/observability** — not yet configured (Cloudflare Analytics + error tracking)

## Known risks

1. Email verify tokens are URL-borne by design (email links) — mitigated with short TTL + hash at rest + strip after load
2. Resend fallback for email (MAIL_GATEWAY_API_KEY not set) — functional but not the canonical mail gateway
3. Payment flow code is implemented but not live (needs provider accounts)
4. No live monitoring/alerting configured yet

## Commit SHA

`d7a9c67` — main branch, 2026-07-13

## Deployment

- CI run: https://github.com/tranhatam-collab/nguyenai.net/actions/runs/29243604362
- All 7 jobs PASS
- Cloudflare account: 62d57eaa548617aeecac766e5a1cb98e

## Verdict

**PARTIAL GO-LIVE ACHIEVED** — CI/CD + 6 sites + OAuth + email verify = live.
Phase 2: payment, certificate verify, LLM keys, monitoring.
