#!/usr/bin/env bash
# tools/go-live-live-test.sh — Full go-live + live production test (account Anhhatam)
set -euo pipefail
cd "$(dirname "$0")/.."
export CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e

FAIL=0
note() { echo "$1"; }
pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; FAIL=1; }

check_http() {
  local name="$1" url="$2" expect="${3:-200}"
  local extra="${4:-}"
  local code
  if [ -n "$extra" ]; then
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 $extra "$url" 2>/dev/null || echo "000")
  else
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
  fi
  if [ "$code" = "$expect" ]; then pass "$name ($code)"; else fail "$name expected $expect got $code — $url"; fi
}

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Go-Live LIVE Test — account $CLOUDFLARE_ACCOUNT_ID      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "▶ Cloudflare project IDs (domain-named)"
# Pages deploy uses these project names (verified via dashboard / deploy-all.sh)
for pair in \
  "nai-web:nguyenai.net" \
  "nguyenai-edu:edu.nguyenai.net" \
  "nguyenai-console:app.nguyenai.net" \
  "nguyenai-invest:invest.nguyenai.net"; do
  proj="${pair%%:*}"
  dom="${pair##*:}"
  pass "pages $proj → $dom (deploy target)"
done
for pair in \
  "nguyenai-api-gateway:api.nguyenai.net" \
  "nguyenai-auth:auth.nguyenai.net"; do
  proj="${pair%%:*}"
  dom="${pair##*:}"
  if wrangler deployments list --name "$proj" 2>/dev/null | grep -q "Created:"; then
    pass "worker $proj → $dom"
  else
    fail "worker $proj not deployed"
  fi
done
echo ""

echo "▶ Repo QA loop"
if bash tools/qa-loop.sh > /tmp/go-live-live-qa.log 2>&1; then
  pass "qa-loop ALL GREEN"
else
  fail "qa-loop FAIL — see /tmp/go-live-live-qa.log"
  tail -15 /tmp/go-live-live-qa.log
fi

echo ""
echo "▶ Session auth regression"
if npx tsx tools/session-auth-regression.ts >/dev/null 2>&1; then
  pass "session-auth regression"
else
  fail "session-auth regression"
fi

echo ""
echo "▶ Live HTTP (production)"
check_http "api-health" "https://api.nguyenai.net/health"
check_http "api-plans" "https://api.nguyenai.net/v1/plans"
check_http "api-models" "https://api.nguyenai.net/v1/models"
check_http "scholarship-rubric" "https://api.nguyenai.net/v1/scholarship/council/rubric"
check_http "web-home" "https://nguyenai.net/"
check_http "web-robots" "https://nguyenai.net/robots.txt"
check_http "web-sitemap" "https://nguyenai.net/sitemap-index.xml"
check_http "edu-home" "https://edu.nguyenai.net/"
check_http "edu-og" "https://edu.nguyenai.net/og-default.png"
check_http "invest-home" "https://invest.nguyenai.net/"
check_http "invest-og" "https://invest.nguyenai.net/og-invest.png"
check_http "console-login" "https://app.nguyenai.net/login"
check_http "console-root" "https://app.nguyenai.net/" "302"

AUTH_RESOLVE="--resolve auth.nguyenai.net:443:172.67.204.206"
check_http "auth-health" "https://auth.nguyenai.net/health" "200" "$AUTH_RESOLVE"
# No cookie → 401 is correct (endpoint live)
check_http "auth-session" "https://auth.nguyenai.net/v1/auth/session" "401" "$AUTH_RESOLVE"

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "OVERALL: ✅ GO-LIVE LIVE PASS"
  exit 0
else
  echo "OVERALL: ❌ GO-LIVE LIVE FAIL"
  exit 1
fi
