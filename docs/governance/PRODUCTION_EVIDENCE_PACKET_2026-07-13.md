# Production Evidence Packet — 2026-07-13

> **HISTORICAL EVIDENCE:** Chỉ gắn với deployment commit `d7a9c67`. Không được dùng packet này để duyệt worktree hoặc release mới. `JWT_SECRET` được liệt kê nhưng không có runtime consumer; current A-to-Z verdict là **HOLD** theo `JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md`.

## Deployment Record

| Field | Value |
|-------|-------|
| Date | 2026-07-13T10:41:04Z |
| Commit SHA | `d7a9c67` |
| Branch | `main` |
| CI Run | https://github.com/tranhatam-collab/nguyenai.net/actions/runs/29243604362 |
| Cloudflare Account | 62d57eaa548617aeecac766e5a1cb98e |
| Operator | Founder (tranhatam) |

## CI/CD Jobs

| Job | Status | Duration | ID |
|-----|--------|----------|-----|
| Build + Test + Typecheck | ✅ PASS | 5m18s | 86795171750 |
| Deploy Web | ✅ PASS | 36s | 86796157593 |
| Deploy Edu | ✅ PASS | 50s | 86796157560 |
| Deploy Console | ✅ PASS | 46s | 86796157569 |
| Deploy Invest | ✅ PASS | 42s | 86796157577 |
| Deploy API Worker | ✅ PASS | 42s | 86796157523 |
| Deploy Auth Worker | ✅ PASS | 34s | 86796157565 |

## Live HTTP Probes (2026-07-13T12:17Z)

| URL | HTTP Status | Response Size | Notes |
|-----|-------------|---------------|-------|
| `https://nguyenai.net/` | 200 | 45,116 bytes | Web homepage |
| `https://edu.nguyenai.net/` | 200 | 26,139 bytes | Edu homepage |
| `https://app.nguyenai.net/` | 302 | — | Redirect to /login (correct) |
| `https://invest.nguyenai.net/` | 200 | 15,610 bytes | Invest homepage |
| `https://api.nguyenai.net/health` | 200 | JSON | `{"status":"ok","service":"nai-api","environment":"production"}` |
| `https://auth.nguyenai.net/auth` | 200 | — | Auth login page |
| `https://auth.nguyenai.net/v1/auth/oauth/google/begin` | 200 | JSON | redirect_uri: `https://auth.nguyenai.net/oauth/google/callback` |
| `https://nguyenai.net/verify` | 308 | — | Trailing slash redirect (Cloudflare Pages) |

## Security Headers (auth.nguyenai.net)

| Header | Value |
|--------|-------|
| x-robots-tag | noindex, nofollow, noarchive |

## Worker Secrets (Auth)

| Secret | Set Date | Notes |
|--------|----------|-------|
| JWT_SECRET | 2026-07-13 | 64-byte random, rotated |
| AUTH_SECRET | pre-existing | Session signing |
| GOOGLE_CLIENT_ID | 2026-07-13 | OAuth client ID |
| GOOGLE_CLIENT_SECRET | 2026-07-13 | OAuth client secret |
| RESEND_API_KEY | pre-existing | Email fallback |

## Audit Results (20 gates)

All 20 CI audit gates PASS:
1. Brand naming lock ✅
2. Brand UI tokens ✅
3. Accessibility ✅
4. Clone contamination ✅
5. Language boundary ✅
6. Email language ✅
7. Hreflang ✅ (66/66 pages)
8. I18n keys ✅
9. Language switcher ✅ (66/66 pages)
10. Public claims ✅
11. SEO bilingual ✅
12. Form language ✅
13. Independence ✅
14. Security P0 ✅
15. Typecheck ✅
16. Build ✅
17. SEO build (rendered HTML) ✅ (66 files, 0 errors)
18. Vietnamese purity build ✅
19. Test ✅
20. Self-upgrade report ✅

## Known Limitations

1. Payment flow not live (provider accounts pending)
2. Certificate verify product is placeholder (Phase 2)
3. LLM chat not live (provider keys pending)
4. MAIL_GATEWAY_API_KEY not set (using Resend fallback)
5. No live monitoring/alerting configured
6. No backup/restore test performed (D1 SQLite)

## Rollback Plan

1. `git revert d7a9c67` → push → CI auto-deploys previous version
2. Cloudflare Pages: each project has deployment history → rollback via dashboard
3. Workers: `wrangler deployments rollback --name nguyenai-auth`
4. D1: point-in-time recovery via Cloudflare dashboard
