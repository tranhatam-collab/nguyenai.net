# Execution status — steps 1–6 (2026-07-11)

Account production: **62d57eaa548617aeecac766e5a1cb98e** (Anhhatam).

| Step | Status | Evidence |
|------|--------|----------|
| 1. Fix wrangler → 62d57 | ✅ DONE | auth+api → D1 `nguyenai-identity` `704f85cb…`; API RATE_LIMIT `2e76b2d1…` |
| 2. Backup D1 + schema gap | ✅ DONE | Backup `.audit-evidence/d1-backup-2026-07-11/nguyenai-identity-pre-migrate.sql`; `migrations/d1/0005_*.sql` → **53 tables** |
| 3. Deploy auth+api + MAIL/Resend | ✅ Resend fallback live | `RESEND_API_KEY` set on auth+api (62d57). `MAIL_IAI_ONE_API_KEY` still optional primary. |
| 4. Google / Stripe / VNPay / LLM | ❌ BLOCKED | No secret values from Founder |
| 5. E2E 5 flows + evidence | ⚠️ PARTIAL | register→verify→login **PASS**. Invest `/private/` **PASS** với `QUALIFIED_INVESTOR` (`tools/grant-qualified-investor.sh`). OAuth → **503** đến khi set Google secrets. Chat auth **responds** (guard/mock; cần LLM keys cho provider thật). Payment → cần Stripe/VNPay |
| 6. Sprint 0 + Founder sign-off | ❌ Founder only | Governance OPEN |

## Engineering fixes closed 2026-07-11 (evening)

- PBKDF2: Workers cap **100k** (was 600k → register 500)
- `audit_log` CHECK: migration `0006` allows `email_verified` (was verify-email 500)
- Resend temporary fallback: `ResendClient` when only `RESEND_API_KEY`
- Probe send `hello@nguyenai.net` → Resend **200**
- OAuth begin: **503** when Google secrets missing (no `client_id=undefined`)
- OAuth callback: browser redirect + roles `USER` (was lowercase `user`)
- Invest private: grant script + live **200** with session cookie

## Founder commands (step 3–4)

```bash
export CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e

# Email (required for verify-email E2E)
cd apps/auth && pnpm exec wrangler secret put MAIL_IAI_ONE_API_KEY
cd apps/api  && pnpm exec wrangler secret put MAIL_IAI_ONE_API_KEY

# Google OAuth
cd apps/auth && pnpm exec wrangler secret put GOOGLE_CLIENT_ID
cd apps/auth && pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
# Redirect URI: https://auth.nguyenai.net/v1/auth/oauth/google/callback

# Payments
cd apps/api && pnpm exec wrangler secret put STRIPE_SECRET_KEY
cd apps/api && pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET
cd apps/api && pnpm exec wrangler secret put VNPAY_TMN_CODE
cd apps/api && pnpm exec wrangler secret put VNPAY_HASH_SECRET

# LLM
cd apps/api && pnpm exec wrangler secret put OPENAI_API_KEY
# optional: ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY
```

## After secrets — E2E checklist (step 5)

1. Register → email verify (mail.iai.one) → login → `app.nguyenai.net`
2. Google OAuth → console
3. Invest `/private/` with grant `invest:private-read`
4. Checkout → webhook → entitlement
5. Authenticated `POST /v1/chat`

## Step 6

Founder: lock Sprint 0 + sign production release in `GOVERNANCE_DECISION_LOG.md`.
