# Final Go-Live Baseline — 2026-07-11 (Updated 2026-07-13)

**Verdict at update:** **PARTIAL GO-LIVE** — CI/CD + 6 sites live + OAuth flow fixed.  
**Remaining blockers:** Payment provider accounts (KASAN/PayOS/Stripe), certificate verify product (Phase 2), LLM provider keys.

## Git freeze snapshot (2026-07-13)

| Field | Value |
|-------|--------|
| Branch | `main` |
| HEAD | `d7a9c67` |
| Remote | `github.com:tranhatam-collab/nguyenai.net.git` |
| Repo status | Clean (all pending changes committed) |

### Recent commits (2026-07-13)

```
d7a9c67 fix(audit): add meta description to verify pages — pass SEO build audit
51464d2 fix(audit): add language switcher to verify pages — pass all audits
3275d49 fix(audit): add en/verify.astro — pass i18n + hreflang + language boundary
3f7cb66 fix(audit): add hreflang to verify.astro — pass hreflang audit
4b36025 fix(audit): translate verify.astro comments to Vietnamese
3be44cf feat(go-live): OAuth fix + PayOS gateway + verify page + email templates
```

### Previously uncommitted — NOW COMMITTED

| Path | Status |
|------|--------|
| `apps/auth/src/index.ts`, `db.ts`, `verify-page.ts` | ✅ Committed (3be44cf) |
| `apps/api/src/index.ts`, `investor-routes.ts`, `wrangler.jsonc` | ✅ Committed (3be44cf) |
| `packages/@nai/email/src/templates.ts` | ✅ Committed (3be44cf) |
| `packages/@nai/billing/src/index.ts` | ✅ Committed (3be44cf) — PayOS gateway |
| `apps/web/src/pages/verify.astro` + `en/verify.astro` | ✅ Committed (3be44cf + audit fixes) |
| `tools/grant-qualified-investor.sh` | ✅ Committed (3be44cf) |
| `docs/architecture/NGUYEN_AI_PAYMENT_KASAN_VIETQR_BUILD_SPEC.md` | ✅ Committed (3be44cf) |

## Independence vs user reality

| Claim | Status |
|-------|--------|
| Independence lock (no Gen1/Gen2 default) | ✅ Architecture code + CI gate |
| Email welcome via Resend fallback | ✅ Live (RESEND_API_KEY set) |
| Email verify API | ✅ Works; token one-time; SHA-256 hashed |
| `auth.nguyenai.net/verify/:token` as verify landing | ✅ Live (path-based, no `=` in URL) |
| Google OAuth flow | ✅ Live (redirect_uri matches Google Console URI 17) |
| Full product E2E (pay/chat/OAuth) | ⚠️ OAuth works; payment + chat need provider keys |
| Go-live CI/CD + 6 sites | ✅ ALL GREEN |

## CI/CD status (2026-07-13)

| Job | Status | Duration |
|-----|--------|----------|
| Build + Test + Typecheck (20 audits) | ✅ PASS | 5m18s |
| Deploy Web → nguyenai.net | ✅ PASS | 36s |
| Deploy Edu → edu.nguyenai.net | ✅ PASS | 50s |
| Deploy Console → app.nguyenai.net | ✅ PASS | 46s |
| Deploy Invest → invest.nguyenai.net | ✅ PASS | 42s |
| Deploy API Worker → api.nguyenai.net | ✅ PASS | 42s |
| Deploy Auth Worker → auth.nguyenai.net | ✅ PASS | 34s |

## Live probes (2026-07-13)

| Check | Result |
|-------|--------|
| `nguyenai.net/` | HTTP 200, 45KB |
| `edu.nguyenai.net/` | HTTP 200, 26KB |
| `app.nguyenai.net/` | HTTP 302 → /login (correct for unauthenticated) |
| `invest.nguyenai.net/` | HTTP 200, 15KB |
| `api.nguyenai.net/health` | `{"status":"ok","service":"nai-api","environment":"production"}` |
| `auth.nguyenai.net/auth` | HTTP 200 |
| OAuth begin | redirect_uri: `https://auth.nguyenai.net/oauth/google/callback` ✅ |
| `nguyenai.net/verify` | HTTP 308 (trailing slash redirect, Cloudflare Pages) |
| Security headers (auth) | x-robots-tag: noindex, nofollow, noarchive ✅ |

## Worker secrets (Auth)

| Secret | Status |
|--------|--------|
| JWT_SECRET | ✅ Set (64-byte random, rotated 2026-07-13) |
| AUTH_SECRET | ✅ Set (pre-existing) |
| GOOGLE_CLIENT_ID | ✅ Set (2026-07-13) |
| GOOGLE_CLIENT_SECRET | ✅ Set (2026-07-13) |
| RESEND_API_KEY | ✅ Set (pre-existing, email fallback) |
| MAIL_GATEWAY_API_KEY | ⚠️ Not set — using RESEND_API_KEY fallback |

## Remaining blockers (Phase 2)

1. **Payment provider accounts** — KASAN JSC bank account verification + PayOS merchant setup + Stripe account
2. **Certificate verify product** — `edu.nguyenai.net/verify` is placeholder
3. **LLM provider keys** — OpenAI/Anthropic/Google API keys for `/v1/chat`
4. **MAIL_GATEWAY_API_KEY** — mail gateway setup (currently using Resend fallback)
5. **Live E2E user journey** — signup → login → OAuth → payment → entitlement → product access (needs payment + LLM)

## Exit

CI/CD + 6 sites + OAuth flow = **PARTIAL GO-LIVE ACHIEVED**.
Phase 2 blockers: payment, certificate verify, LLM keys.
