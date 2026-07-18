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
  "packages/@nai"
)

# Exempt files (governance audit docs, LICENSE/NOTICE)
EXCLUDE_PATTERNS=(
  "docs/governance/"
  "docs/architecture/"
  "docs/legacy/"
  "NOTICE.nai.md"
  "LICENSE"
  "LICENSE.md"
  "node_modules"
  ".git"
)

# Allowlist patterns (intentional references per independence plan)
# These are NOT violations because they serve specific purposes:
# - Gen1 adapter code in packages/@nai/prism/ (gated by LEGACY_BRIDGE_ENABLED, disabled by default)
# - verify.iai.one adapter in packages/@nai/investor-verify/ (identity verification gateway)
ALLOWLIST_PATTERNS=(
  "packages/@nai/prism/"                             # Gen1 adapter (gated, disabled by default)
  "packages/@nai/gateway-sdk/"                      # Gen1 adapter (not imported, dead code)
  "packages/@nai/investor-verify/"                  # verify.iai.one adapter
  "packages/@nai/ai-provider-client/"               # AI Provider Gateway client (aiagent.iai.one per AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16)
  "packages/@nai/contracts/"                        # Tool definitions reference aiagent.iai.one gateway URLs
  "packages/@nai/model-gateway/"                    # Model gateway contract references aiagent.iai.one per AI_PROVIDER_SINGLE_SOURCE_DECISION
  "packages/@nai/training-gateway/"                 # Training gateway references ai-provider-gateway per AI_PROVIDER_SINGLE_SOURCE_DECISION
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
        # skip allowlist (intentional references)
        if [ "$skip" -eq 0 ]; then
          for al in "${ALLOWLIST_PATTERNS[@]}"; do
            case "$f" in
              *"$al"*) skip=1; break ;;
            esac
          done
        fi
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
