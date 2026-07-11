# QA Audit Evidence — nguyenai.net — 2026-07-10

> Báo cáo chỉ ghi kết quả kiểm chứng thực tế. Cập nhật sau deploy + D1 + persistence pass.

## Tóm tắt điều hành

| Hạng mục | Kết quả |
|----------|---------|
| **QA Loop** | **✅ ALL GREEN** (sau fix typecheck scholarship D1) |
| **Production smoke** | **✅ 8/8** (`pnpm audit:production-smoke`) |
| **D1 nguyenai-identity** | **✅ 4/4 migrations** applied remote |
| **Deploy surfaces** | **✅ 6/6** deployed account Anhhatam (session trước) |
| **Go-Live LIVE (`pnpm go-live:live`)** | **✅ PASS** (phiên 2026-07-10) |
| **Báo cáo Founder** | `docs/governance/QA_AUDIT_GO_LIVE_REPORT_2026-07-10_FINAL.md` |
| **Production release** | **NOT APPROVED** — E2E auth/payment + Sprint 0 |
| **10/10 score** | **~8/10** |

## Go-Live 10/10 (2026-07-10 evening)

| # | Tiêu chí | Status |
|---|----------|--------|
| 1 | Repo QA gate | ✅ |
| 2 | Security P0 | ✅ |
| 3 | Independence | ✅ |
| 4 | Product surfaces | ✅ |
| 5 | SEO & brand | ✅ |
| 6 | Accessibility | ✅ |
| 7 | Production runtime | ✅ api/edu/web/console/invest; auth via CF |
| 8 | Persistence | ⚠️ D1 identity + scholarship core; entitlement InMemory |
| 9 | Founder external | ⚠️ secrets script ready; OAuth/Stripe/Resend pending |
| 10 | Governance | ❌ OPEN |

## Bằng chứng lệnh (verified)

```text
bash tools/qa-loop.sh                 → ALL GREEN
bash tools/production-smoke.sh        → 8/8 PASS
bash tools/session-auth-regression.ts → PASS
wrangler d1 migrations apply nguyenai-identity --remote → 4/4 ✅
pnpm deploy:all                       → (manual) web/edu/console/invest/api/auth
```

## Production smoke (2026-07-10 deploy)

| URL | HTTP |
|-----|------|
| api.nguyenai.net/health | 200 |
| api.nguyenai.net/v1/plans | 200 |
| nguyenai.net | 200 |
| edu.nguyenai.net | 200 |
| edu.nguyenai.net/og-default.png | 200 |
| app.nguyenai.net | 302 → login |
| invest.nguyenai.net | 200 |
| auth.nguyenai.net/health | 200 (CF edge) |

## Infrastructure changes (session)

| Item | Action |
|------|--------|
| D1 `nguyenai-identity` | Created `704f85cb-0fa2-4d56-8659-cda65cc4d4e4` |
| Migrations | `migrations/d1/` — identity, email, magic-link, scholarship core |
| wrangler.jsonc | API/auth → nguyenai-identity; bundle enabled; custom domains |
| API routes | Removed corrupt extensionless route files |
| Scholarship | `D1ScholarshipStore` when `env.DB` present |
| Workers | `nguyenai-api-gateway`, `nguyenai-auth` deployed |
| Pages | nai-web, nguyenai-edu, nguyenai-console, nguyenai-invest |
| Tools | `deploy-all.sh`, `production-smoke.sh`, `qa-evidence-update.sh`, `set-wrangler-secrets.sh` |

## Còn lại — Founder

1. `pnpm secrets:wrangler` + `GOOGLE_CLIENT_*`, `STRIPE_*`, `RESEND_API_KEY`
2. `pnpm deploy:all` sau mỗi code change
3. Scholarship full schema (28 tables) — hiện core applications only
4. Entitlement InMemory → D1
5. Sprint 0 governance lock + sign-off

## QA automation

```bash
pnpm go-live:check           # qa-loop + regression + smoke + secret counts
pnpm audit:production-smoke  # HTTP smoke only
pnpm qa:evidence             # qa-loop + append this file
```
