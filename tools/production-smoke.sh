#!/usr/bin/env bash
# tools/production-smoke.sh — HTTP smoke checks for production surfaces
set -euo pipefail

FAIL=0
check() {
  local name="$1" url="$2" expect="${3:-200}"
  local extra="${4:-}"
  local code
  if [ -n "$extra" ]; then
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 $extra "$url" 2>/dev/null || echo "000")
  else
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
  fi
  if [ "$code" = "$expect" ]; then
    echo "✅ $name ($code)"
  else
    echo "❌ $name (expected $expect, got $code) — $url"
    FAIL=1
  fi
}

echo "=== Production Smoke — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
check "api-health" "https://api.nguyenai.net/health"
check "api-plans" "https://api.nguyenai.net/v1/plans"
check "api-rubric" "https://api.nguyenai.net/v1/scholarship/council/rubric"
check "web-robots" "https://nguyenai.net/robots.txt"
check "web-home" "https://nguyenai.net/"
check "edu-home" "https://edu.nguyenai.net/"
check "edu-og" "https://edu.nguyenai.net/og-default.png"
check "console" "https://app.nguyenai.net/" "302"
check "invest" "https://invest.nguyenai.net/"
AUTH_RESOLVE="--resolve auth.nguyenai.net:443:172.67.204.206"
check "auth-health" "https://auth.nguyenai.net/health" "200" "$AUTH_RESOLVE"
check "auth-session-anon" "https://auth.nguyenai.net/v1/auth/session" "401" "$AUTH_RESOLVE"

if [ "$FAIL" -eq 0 ]; then
  echo "OVERALL: ✅ PASS"
  exit 0
else
  echo "OVERALL: ❌ FAIL"
  exit 1
fi
