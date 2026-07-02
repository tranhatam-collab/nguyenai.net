#!/usr/bin/env bash
# Clone contamination audit gate
# Fails build if forbidden brand names appear in user-facing files.
# See: docs/governance/NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md Phase 1.5
# Usage: bash tools/audit-clone-contamination.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Forbidden tokens in user-facing surfaces (lowercase match)
# Note: "Máy Tính AI" is an APPROVED product category per FOUNDER_VERDICT §3.1
# and BRAND_SURFACE_MATRIX. It is only forbidden as a STANDALONE brand name.
# We do NOT include it in the forbidden list. Reviewers must check manually
# that "Máy Tính AI" is always paired with "Nguyen AI Computer" context.
FORBIDDEN=(
  "maytinhai"
  "computer.iai.one"
  "iai.one"
)

# Scan targets (user-facing only)
SCAN_DIRS=(
  "apps/web/src"
  "apps/web/public"
  "apps/console/src"
  "apps/invest/src"
  "apps/academy/src"
  "apps/admin/src"
  "content"
  "public"
  "src"
)

# Exempt files (governance audit docs, LICENSE/NOTICE)
EXCLUDE_PATTERNS=(
  "docs/governance/"
  "docs/architecture/"
  "NOTICE.nai.md"
  "LICENSE"
)

# Build exclude grep flags
EXCLUDE_GREP=""
for p in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_GREP="$EXCLUDE_GREP --exclude-dir=$(basename "$p" .md) --exclude=$p"
done

echo "==> Clone contamination audit"
echo "    Root: $ROOT"
echo "    Forbidden tokens: ${FORBIDDEN[*]}"
echo "    Scan dirs: ${SCAN_DIRS[*]}"
echo

VIOLATIONS=0
for tok in "${FORBIDDEN[@]}"; do
  for dir in "${SCAN_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
      continue
    fi
    # case-insensitive, binary skip, print matches
    matches=$(grep -rIl --include='*.astro' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.json' --include='*.md' --include='*.html' --include='*.css' --include='*.txt' --include='*.xml' -i -- "$tok" "$dir" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      while IFS= read -r f; do
        # skip exempt
        skip=0
        for ex in "${EXCLUDE_PATTERNS[@]}"; do
          case "$f" in
            *"$ex"*) skip=1; break ;;
          esac
        done
        if [ "$skip" -eq 0 ]; then
          echo "FAIL: '$tok' found in $f"
          VIOLATIONS=$((VIOLATIONS + 1))
        fi
      done <<< "$matches"
    fi
  done
done

echo
if [ "$VIOLATIONS" -gt 0 ]; then
  echo "FAIL: $VIOLATIONS contamination violation(s). Fix before merge."
  exit 1
fi

echo "PASS: 0 contamination violations in user-facing surfaces."
