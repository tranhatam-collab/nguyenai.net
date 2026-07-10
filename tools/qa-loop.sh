#!/usr/bin/env bash
# tools/qa-loop.sh — Continuous QA Loop
# Runs: typecheck → build → audit:all → audit-seo-build → test
# Logs results to QA_LOOP_LOG.md
# Exit code: 0 = all green, 1 = any failure

set -euo pipefail
cd "$(dirname "$0")/.."

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOOP_NUM=$(grep -c "^## QA Loop" QA_LOOP_LOG.md 2>/dev/null || echo "0")
LOOP_NUM=$((LOOP_NUM + 1))

AUDIT_COUNT=$(node -e "console.log(require('./package.json').scripts['audit:all'].split('&&').length)")

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  QA Loop #${LOOP_NUM} — ${TIMESTAMP}                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

TYPECHECK_RESULT="❌ FAIL"
BUILD_RESULT="❌ FAIL"
AUDIT_RESULT="❌ FAIL"
SEO_BUILD_RESULT="❌ FAIL"
TEST_RESULT="❌ FAIL"
TYPECHECK_DETAIL=""
BUILD_DETAIL=""
AUDIT_DETAIL=""
SEO_BUILD_DETAIL=""
TEST_DETAIL=""

# Step 1: typecheck
echo "▶ Step 1/5: typecheck..."
if pnpm run typecheck > /tmp/qa-typecheck.log 2>&1; then
  TYPECHECK_RESULT="✅ PASS"
  TYPECHECK_DETAIL="0 errors"
  echo "  ✅ typecheck PASS"
else
  TYPECHECK_DETAIL=$(grep -E "error TS" /tmp/qa-typecheck.log | head -5 | tr '\n' '; ')
  echo "  ❌ typecheck FAIL"
fi
echo ""

# Step 2: build
echo "▶ Step 2/5: build..."
if pnpm run build > /tmp/qa-build.log 2>&1; then
  BUILD_RESULT="✅ PASS"
  BUILD_DETAIL=$(grep "Tasks:" /tmp/qa-build.log | tail -1 | tr -d ' ')
  echo "  ✅ build PASS"
else
  BUILD_DETAIL=$(grep -E "FAIL|error" /tmp/qa-build.log | head -5 | tr '\n' '; ')
  echo "  ❌ build FAIL"
fi
echo ""

# Step 3: audit:all (includes dist-dependent checks after build)
echo "▶ Step 3/5: audit:all..."
if pnpm run audit:all > /tmp/qa-audit.log 2>&1; then
  AUDIT_RESULT="✅ PASS"
  AUDIT_DETAIL="${AUDIT_COUNT}/${AUDIT_COUNT} audits passed"
  echo "  ✅ audit:all PASS"
else
  AUDIT_DETAIL=$(grep -E "FAIL|violation|ERROR" /tmp/qa-audit.log | head -5 | tr '\n' '; ')
  echo "  ❌ audit:all FAIL"
fi
echo ""

# Step 4: rendered HTML SEO audit
echo "▶ Step 4/5: audit-seo-build..."
if npx tsx tools/audit-seo-build.ts > /tmp/qa-seo-build.log 2>&1; then
  SEO_BUILD_RESULT="✅ PASS"
  SEO_BUILD_DETAIL=$(grep -E "files checked|BUILD AUDIT" /tmp/qa-seo-build.log | tail -1 | tr -d ' ')
  echo "  ✅ audit-seo-build PASS"
else
  SEO_BUILD_DETAIL=$(grep -E "FAIL|error" /tmp/qa-seo-build.log | head -5 | tr '\n' '; ')
  echo "  ❌ audit-seo-build FAIL"
fi
echo ""

# Step 5: test
echo "▶ Step 5/5: test..."
if pnpm run test > /tmp/qa-test.log 2>&1; then
  TEST_RESULT="✅ PASS"
  TEST_DETAIL=$(grep "Tasks:" /tmp/qa-test.log | tail -1 | tr -d ' ')
  echo "  ✅ test PASS"
else
  TEST_DETAIL=$(grep -E "FAIL|failed|❌" /tmp/qa-test.log | head -10 | tr '\n' '; ')
  echo "  ❌ test FAIL"
fi
echo ""

ALL_GREEN="true"
[ "$TYPECHECK_RESULT" = "❌ FAIL" ] && ALL_GREEN="false"
[ "$BUILD_RESULT" = "❌ FAIL" ] && ALL_GREEN="false"
[ "$AUDIT_RESULT" = "❌ FAIL" ] && ALL_GREEN="false"
[ "$SEO_BUILD_RESULT" = "❌ FAIL" ] && ALL_GREEN="false"
[ "$TEST_RESULT" = "❌ FAIL" ] && ALL_GREEN="false"

echo "═══════════════════════════════════════════════════════════"
echo "  SUMMARY:"
echo "    typecheck:       $TYPECHECK_RESULT ($TYPECHECK_DETAIL)"
echo "    build:           $BUILD_RESULT ($BUILD_DETAIL)"
echo "    audit:all:       $AUDIT_RESULT ($AUDIT_DETAIL)"
echo "    audit-seo-build: $SEO_BUILD_RESULT ($SEO_BUILD_DETAIL)"
echo "    test:            $TEST_RESULT ($TEST_DETAIL)"
if [ "$ALL_GREEN" = "true" ]; then
  echo "    OVERALL:         ✅ ALL GREEN"
else
  echo "    OVERALL:         ❌ HAS FAILURES"
fi
echo "═══════════════════════════════════════════════════════════"

{
  echo ""
  echo "## QA Loop #${LOOP_NUM} — ${TIMESTAMP}"
  echo ""
  echo "| Step | Result | Detail |"
  echo "|------|--------|--------|"
  echo "| typecheck | $TYPECHECK_RESULT | $TYPECHECK_DETAIL |"
  echo "| build | $BUILD_RESULT | $BUILD_DETAIL |"
  echo "| audit:all | $AUDIT_RESULT | $AUDIT_DETAIL |"
  echo "| audit-seo-build | $SEO_BUILD_RESULT | $SEO_BUILD_DETAIL |"
  echo "| test | $TEST_RESULT | $TEST_DETAIL |"
  echo ""
  if [ "$ALL_GREEN" = "true" ]; then
    echo "**OVERALL: ✅ ALL GREEN**"
  else
    echo "**OVERALL: ❌ HAS FAILURES**"
  fi
  echo ""
  echo "---"
} >> QA_LOOP_LOG.md

if [ "$ALL_GREEN" = "true" ]; then
  exit 0
else
  exit 1
fi
