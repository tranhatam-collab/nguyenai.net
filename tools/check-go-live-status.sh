#!/usr/bin/env bash
# Go-live status checker — uses qa-loop as source of truth for automated gates

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-62d57eaa548617aeecac766e5a1cb98e}"

echo "=== Nguyen AI Go-Live Status Check ==="
echo "Date: $(date -u +%Y-%m-%d)"
echo ""

echo "1. Automated QA Loop (typecheck → build → audit:all → seo-build → test)"
if bash tools/qa-loop.sh > /tmp/go-live-qa-loop.log 2>&1; then
  echo "   ✅ QA Loop ALL GREEN"
  rg "SUMMARY:" -A 8 /tmp/go-live-qa-loop.log | sed 's/^/   /'
else
  echo "   ❌ QA Loop HAS FAILURES"
  rg "SUMMARY:" -A 8 /tmp/go-live-qa-loop.log | sed 's/^/   /' || tail -20 /tmp/go-live-qa-loop.log | sed 's/^/   /'
  exit 1
fi

echo ""
echo "2. Session auth regression"
if npx tsx tools/session-auth-regression.ts > /dev/null 2>&1; then
  echo "   ✅ session-auth regression PASS"
else
  echo "   ❌ session-auth regression FAIL"
  exit 1
fi

echo ""
echo "3. Production smoke (HTTP)"
if bash tools/production-smoke.sh > /tmp/go-live-smoke.log 2>&1; then
  echo "   ✅ Production smoke PASS"
else
  echo "   ⚠️  Production smoke partial/fail"
fi
sed 's/^/   /' /tmp/go-live-smoke.log | head -12

echo ""
echo "4. Wrangler secrets (Founder — set via tools/set-wrangler-secrets.sh + OAuth/Stripe/Resend)"
if command -v wrangler >/dev/null 2>&1; then
  API_SECRETS=$(cd apps/api && wrangler secret list 2>/dev/null | rg -c '"name"' || echo "0")
  AUTH_SECRETS=$(cd apps/auth && wrangler secret list 2>/dev/null | rg -c '"name"' || echo "0")
  echo "   API worker secrets count: $API_SECRETS"
  echo "   Auth worker secrets count: $AUTH_SECRETS"
else
  echo "   ⚠️  wrangler not available"
fi

echo ""
echo "5. Deployment (account 62d57eaa548617aeecac766e5a1cb98e)"
echo "   pnpm deploy:all — web, edu, console, invest, api, auth"
echo ""

echo "6. Governance"
echo "   ⚠️  Sprint 0 governance lock — OPEN"
echo "   ⚠️  Production release — NOT APPROVED until Founder sign-off"
echo ""

echo "=== Summary ==="
echo "Repo automated gates: see qa-loop above"
echo "Production: run pnpm audit:production-smoke"
echo ""
echo "See: docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md"
echo "Evidence: docs/governance/QA_AUDIT_EVIDENCE_2026-07-10.md"
