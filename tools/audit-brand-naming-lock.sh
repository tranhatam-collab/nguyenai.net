#!/usr/bin/env bash
# ============================================================
# audit-brand-naming-lock.sh
# CI gate — fails build if banned brand names are found.
#
# Per docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md
#
# Usage:
#   ./tools/audit-brand-naming-lock.sh          # audit + exit 1 on violation
#   ./tools/audit-brand-naming-lock.sh --quiet  # only print violations
# ============================================================
set -eo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Banned patterns (regex, case-sensitive where it matters)
# Format: "pattern|description"
BANNED_PATTERNS=(
  "Nguyen Computer AI|Sai thứ tự — chuẩn: Nguyen AI Computer"
  "Nguyen Ai Computer|Sai hoa thường — chuẩn: Nguyen AI Computer"
  "NguyenAI|Dính liền — chuẩn: Nguyen AI (có khoảng trắng)"
  "Nguyễn\.AI|Dấu chấm giữa — không dùng"
  "Nguyên AI|Sai chính tả họ — phải là Nguyễn (có g)"
  "AI Nguyen|Đảo thứ tự — brand đứng trước"
  "AI Nguyễn|Đảo thứ tự — brand đứng trước"
  "Nguyen Artificial Intelligence|Quá dài — chuẩn: Nguyen AI"
  "NAI Edu|Code scope làm public brand — chuẩn: Nguyen AI Edu"
  "NAI Invest|Code scope làm public brand — chuẩn: Nguyen AI Invest"
  "NAI Computer|Code scope làm public brand — chuẩn: Nguyen AI Computer"
  "NAI Network|Không dùng làm brand"
  "NAI Operator|Code scope làm public brand — chuẩn: Nguyen AI Operator"
  "NAI Creator|Code scope làm public brand — chuẩn: Nguyen AI Creator"
  "NAI Code|Code scope làm public brand — chuẩn: Nguyen AI Code"
  "NAI Business|Code scope làm public brand — chuẩn: Nguyen AI Business"
  "NAI Founder|Code scope làm public brand — chuẩn: Nguyen AI Founder"
  "NAI Research|Code scope làm public brand — chuẩn: Nguyen AI Research"
  "NAI Career|Code scope làm public brand — chuẩn: Nguyen AI Career"
  "NAI Family|Code scope làm public brand — chuẩn: Nguyen AI Family"
  "NAI Community|Code scope làm public brand — chuẩn: Nguyen AI Community"
)

# Files/dirs to exclude
EXCLUDE_DIRS=(
  -path './.git' -prune -o
  -path './node_modules' -prune -o
  -path './.turbo' -prune -o
  -path './dist' -prune -o
  -path './.next' -prune -o
  -path './.astro' -prune -o
  -path './coverage' -prune -o
  -path './pnpm-lock.yaml' -prune -o
)

# Files to exclude (self-reference)
EXCLUDE_FILES=(
  './tools/audit-brand-naming-lock.sh'
  './docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md'
)

# File extensions to scan
SCAN_EXTENSIONS=(
  .ts .tsx .js .jsx .astro .md .json .jsonc .html .css .yml .yaml
  .sh .env .txt .mjs .cjs .vue .svelte
)

# Build find expression
EXT_EXPR=""
for ext in "${SCAN_EXTENSIONS[@]}"; do
  if [ -z "$EXT_EXPR" ]; then
    EXT_EXPR="-name *${ext}"
  else
    EXT_EXPR="${EXT_EXPR} -o -name *${ext}"
  fi
done

# Collect files
FILES=()
while IFS= read -r -d '' file; do
  # Check exclude files
  skip=false
  for excl in "${EXCLUDE_FILES[@]}"; do
    if [ "$file" = "$excl" ]; then
      skip=true
      break
    fi
  done
  if [ "$skip" = false ]; then
    FILES+=("$file")
  fi
done < <(find . "${EXCLUDE_DIRS[@]}" -type f \( $EXT_EXPR \) -print0 2>/dev/null)

AI_NGUYEN_ASSISTANT_IDENTITY_ALLOWLIST=(
  './docs/governance/MODEL_GATEWAY_IDENTITY_POLICY.md'
  './docs/governance/NGUYEN_AI_MODEL_AND_AGENT_TRAINING_CHARTER.md'
  './docs/governance/AI_AGENT_ETHICS_AND_SAFETY_POLICY.md'
  './docs/governance/INDEPENDENT_RUNTIME_FALLBACK_EXECUTION_PLAN_2026-07-07.md'
)

is_ai_nguyen_identity_allowlisted() {
  local file="$1"
  for allowed in "${AI_NGUYEN_ASSISTANT_IDENTITY_ALLOWLIST[@]}"; do
    if [ "$file" = "$allowed" ]; then
      return 0
    fi
  done
  return 1
}

# Scan
VIOLATIONS=0
for file in ${FILES[@]+"${FILES[@]}"}; do
  for pattern_desc in "${BANNED_PATTERNS[@]}"; do
    pattern="${pattern_desc%%|*}"
    desc="${pattern_desc##*|}"

    # Search for pattern (case-sensitive)
    matches=$(grep -n "$pattern" "$file" 2>/dev/null || true)

    if [ -n "$matches" ]; then
      while IFS= read -r line; do
        if { [ "$pattern" = "AI Nguyễn" ] || [ "$pattern" = "AI Nguyen" ]; } && is_ai_nguyen_identity_allowlisted "$file"; then
          continue
        fi
        echo -e "${RED}VIOLATION${NC}: ${file}:${line%%:*}"
        echo -e "  Pattern: ${YELLOW}${pattern}${NC}"
        echo -e "  Issue:   ${desc}"
        echo ""
        VIOLATIONS=$((VIOLATIONS + 1))
      done <<< "$matches"
    fi
  done
done

# Summary
if [ "$VIOLATIONS" -gt 0 ]; then
  echo -e "${RED}=== BRAND NAMING AUDIT FAILED ===${NC}"
  echo -e "${RED}Found ${VIOLATIONS} violation(s).${NC}"
  echo -e "Per docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md"
  echo -e "Fix all violations before merging."
  exit 1
else
  echo -e "${GREEN}=== BRAND NAMING AUDIT PASSED ===${NC}"
  echo -e "${GREEN}0 violations found. All naming follows FOUNDER_BRAND_NAMING_LOCK.${NC}"
  exit 0
fi
