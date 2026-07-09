#!/usr/bin/env bash
# Independence audit gate — ensures nguyenai.net runs independently from Gen1/Gen2.
# See: docs/governance/NGUYENAI_NET_FULL_INDEPENDENCE_EXECUTION_PLAN_2026-07-08.md
# Usage: bash tools/audit-independence.sh
#
# Checks:
#   1. No aiagent.iai.one / computer.iai.one in runtime config (wrangler.jsonc, .dev.vars)
#   2. No maytinhai.org / api.maytinhai.org fetch calls in source code
#   3. GEN1_GATEWAY_URL must NOT be in wrangler.jsonc vars (only via secret)
#   4. LEGACY_BRIDGE_ENABLED must NOT be 'true' in wrangler.jsonc vars
#   5. No Gen1/Gen2 references in public-facing content (apps/web, apps/edu, apps/invest, apps/console)
#   6. proxyToGen1 must be gated by LEGACY_BRIDGE_ENABLED check

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VIOLATIONS=0

echo "==> Independence audit — nguyenai.net must not depend on Gen1/Gen2 at runtime"
echo

# ── Check 1: No Gen1 upstream URLs in runtime config ──
echo "    [1/6] Checking runtime config for Gen1 upstream URLs..."
GEN1_URLS="aiagent.iai.one\|computer.iai.one"
for f in apps/api/wrangler.jsonc apps/auth/wrangler.jsonc apps/api/.dev.vars apps/auth/.dev.vars; do
  if [ -f "$f" ]; then
    matches=$(grep -n "$GEN1_URLS" "$f" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "FAIL: Gen1 URL found in $f:"
      echo "  $matches"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done
echo "    Done."

# ── Check 2: No Gen2 fetch calls in source code ──
echo "    [2/6] Checking source code for Gen2 fetch calls..."
GEN2_PATTERNS="maytinhai\.org\|api\.maytinhai\.org"
SRC_DIRS="apps/api/src apps/auth/src apps/web/src apps/edu/src apps/invest/src apps/console/src apps/admin/src packages/@nai"
for dir in $SRC_DIRS; do
  if [ -d "$dir" ]; then
    matches=$(find "$dir" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.astro' \) ! -path '*/node_modules/*' ! -name '*.test.*' -print0 2>/dev/null | xargs -0 grep -n "$GEN2_PATTERNS" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "FAIL: Gen2 reference found in $dir:"
      echo "$matches"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done
echo "    Done."

# ── Check 3: GEN1_GATEWAY_URL must NOT be in wrangler.jsonc vars ──
echo "    [3/6] Checking GEN1_GATEWAY_URL not in wrangler.jsonc vars..."
for f in apps/api/wrangler.jsonc apps/auth/wrangler.jsonc; do
  if [ -f "$f" ]; then
    # Check if GEN1_GATEWAY_URL appears as a var (not in a comment)
    matches=$(grep -n '"GEN1_GATEWAY_URL"' "$f" 2>/dev/null | grep -v '//' || true)
    if [ -n "$matches" ]; then
      echo "FAIL: GEN1_GATEWAY_URL found as var in $f (should be secret only):"
      echo "  $matches"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done
echo "    Done."

# ── Check 4: LEGACY_BRIDGE_ENABLED must NOT be 'true' in wrangler.jsonc ──
echo "    [4/6] Checking LEGACY_BRIDGE_ENABLED not set to 'true' in wrangler.jsonc..."
for f in apps/api/wrangler.jsonc apps/auth/wrangler.jsonc; do
  if [ -f "$f" ]; then
    matches=$(grep -n '"LEGACY_BRIDGE_ENABLED".*"true"' "$f" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "FAIL: LEGACY_BRIDGE_ENABLED set to 'true' in $f:"
      echo "  $matches"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done
echo "    Done."

# ── Check 5: No Gen1/Gen2 in public-facing content ──
echo "    [5/6] Checking public-facing content for Gen1/Gen2 references..."
PUBLIC_DIRS="apps/web/src apps/edu/src apps/invest/src apps/console/src"
GEN_PATTERNS="Gen1\|Gen 1\|Gen2\|Gen 2\|computer\.iai\.one\|maytinhai\.org"
for dir in $PUBLIC_DIRS; do
  if [ -d "$dir" ]; then
    matches=$(find "$dir" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.astro' -o -name '*.mdx' -o -name '*.md' \) ! -path '*/node_modules/*' ! -path '*/private/*' -print0 2>/dev/null | xargs -0 grep -n "$GEN_PATTERNS" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "FAIL: Gen1/Gen2 reference found in public content $dir:"
      echo "$matches"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done
echo "    Done."

# ── Check 6: proxyToGen1 must be gated by LEGACY_BRIDGE_ENABLED ──
echo "    [6/6] Checking proxyToGen1 is gated by LEGACY_BRIDGE_ENABLED..."
if [ -f "apps/api/src/index.ts" ]; then
  # Check that proxyToGen1 function contains LEGACY_BRIDGE_ENABLED check
  if ! grep -q "LEGACY_BRIDGE_ENABLED" apps/api/src/index.ts; then
    echo "FAIL: proxyToGen1 in apps/api/src/index.ts is NOT gated by LEGACY_BRIDGE_ENABLED"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
  # Check that /v1/chat does NOT call proxyToGen1 directly
  if grep -q "app\.post.*'/v1/chat'.*proxyToGen1" apps/api/src/index.ts; then
    echo "FAIL: /v1/chat still calls proxyToGen1 directly (should use local provider)"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi
echo "    Done."

echo
if [ "$VIOLATIONS" -gt 0 ]; then
  echo "FAIL: $VIOLATIONS independence violation(s). nguyenai.net is NOT fully independent."
  echo "      Fix before merge. See: docs/governance/NGUYENAI_NET_FULL_INDEPENDENCE_EXECUTION_PLAN_2026-07-08.md"
  exit 1
fi

echo "PASS: 0 independence violations. nguyenai.net is fully independent from Gen1/Gen2."
