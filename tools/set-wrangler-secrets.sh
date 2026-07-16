#!/usr/bin/env bash
# tools/set-wrangler-secrets.sh — Set generated secrets on production workers (no third-party keys)
set -euo pipefail
export CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

EVIDENCE_KEY="$(openssl rand -hex 32)"
AUTH_SECRET="$(openssl rand -hex 32)"

echo "▶ Setting EVIDENCE_SIGNING_KEY on nguyenai-api-gateway..."
printf '%s' "$EVIDENCE_KEY" | (cd "$ROOT/apps/api" && wrangler secret put EVIDENCE_SIGNING_KEY)

echo "▶ Setting AUTH_SECRET on nguyenai-auth (session cookie HMAC)..."
printf '%s' "$AUTH_SECRET" | (cd "$ROOT/apps/auth" && wrangler secret put AUTH_SECRET)

echo "▶ Setting AUTH_SECRET on nguyenai-api-gateway (same value — verify cookies)..."
printf '%s' "$AUTH_SECRET" | (cd "$ROOT/apps/api" && wrangler secret put AUTH_SECRET)

echo "✅ Generated secrets set (values not printed)."
echo "   AUTH_SECRET is shared by auth + api for signed nguyenai_session cookies."
echo "   Still need Founder (account 62d57):"
echo "     AI_PROVIDER_API_KEY (api) — gateway credential from Team A (aiagent.iai.one)"
echo "     MAIL_IAI_ONE_API_KEY (auth + api) — primary email via mail.iai.one"
echo "     RESEND_API_KEY (auth + api) — temporary fallback only (when MAIL key absent)"
echo "     GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (auth)"
echo "     STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (api)"
echo "     VNPAY_TMN_CODE / VNPAY_HASH_SECRET (api)"
echo "   NOTE: Direct vendor keys are BANNED per AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16."
echo "         All AI calls go through aiagent.iai.one via AI_PROVIDER_API_KEY."
echo ""
echo "   CLEANUP: Remove stale secrets from production workers:"
echo "     wrangler secret delete JWT_SECRET --name nguyenai-auth"
echo "     wrangler secret delete JWT_SECRET --name nguyenai-api-gateway"
echo "     (JWT_SECRET has no runtime consumer — auth uses AUTH_SECRET HMAC cookie)"
echo "   Rotate: re-run this script (invalidates signed cookies; legacy UUID cookies still work until logout)."
