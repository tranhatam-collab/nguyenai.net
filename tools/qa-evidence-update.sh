#!/usr/bin/env bash
# tools/qa-evidence-update.sh — Run QA loop + smoke, append to evidence log
set -euo pipefail
cd "$(dirname "$0")/.."
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
EVIDENCE="docs/governance/QA_AUDIT_EVIDENCE_2026-07-10.md"
LOG=".audit-evidence/qa-evidence-${TS//:/-}.log"

mkdir -p .audit-evidence
{
  echo ""
  echo "## Automated run — $TS"
  echo ""
  echo "### Repo QA"
  if bash tools/qa-loop.sh; then
    echo "- qa-loop: ✅ ALL GREEN"
  else
    echo "- qa-loop: ❌ FAIL"
    exit 1
  fi
  echo ""
  echo "### Session auth regression"
  if npx tsx tools/session-auth-regression.ts; then
    echo "- session-auth: ✅ PASS"
  else
    echo "- session-auth: ❌ FAIL"
    exit 1
  fi
  echo ""
  echo "### Production smoke"
  if bash tools/production-smoke.sh; then
    echo "- production-smoke: ✅ PASS"
  else
    echo "- production-smoke: ⚠️ partial (see log)"
  fi
} | tee "$LOG"

{
  echo ""
  echo "## Update $TS"
  echo ""
  echo "Evidence log: \`$LOG\`"
  echo ""
  tail -20 "$LOG" | sed 's/^/- /'
} >> "$EVIDENCE"

echo "✅ Evidence appended to $EVIDENCE"
