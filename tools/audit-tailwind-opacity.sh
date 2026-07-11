#!/usr/bin/env bash
# tools/audit-tailwind-opacity.sh — Fail on non-standard Tailwind opacity in class attrs.
# Invalid steps (e.g. bg-bg/96, text-white/78) silently drop styles → invisible UI.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ALLOWED='0|5|10|20|25|30|40|50|60|70|75|80|90|95|100'
FAIL=0

echo "=== Tailwind opacity audit (class attributes) ==="
# Only scan class="..." / className="..." / class={`...`} style tokens
while IFS= read -r hit; do
  file="${hit%%:*}"
  rest="${hit#*:}"
  line="${rest%%:*}"
  text="${rest#*:}"
  # Pull utility/opacity tokens from the line
  bad=$(echo "$text" | grep -oE '(bg|text|border|ring|from|via|to|outline|divide|placeholder|accent|caret|fill|stroke|decoration|shadow)-[a-zA-Z0-9_-]+/[0-9]{1,3}' | while read -r tok; do
    op="${tok##*/}"
    if ! echo "$op" | grep -Eq "^(${ALLOWED})$"; then
      echo "$tok"
    fi
  done | sort -u | tr '\n' ' ')
  if [ -n "${bad// /}" ]; then
    echo "FAIL $file:$line — $bad"
    FAIL=1
  fi
done < <(rg -n --glob '*.{astro,tsx,jsx,vue,html}' \
  -e 'class(Name)?=.*"([^"]*/[0-9]{1,3}[^"]*)"' \
  -e "class(Name)?=.*'([^']*/[0-9]{1,3}[^']*)'" \
  -e 'class(Name)?=\{`([^`]*\/[0-9]{1,3}[^`]*)`' \
  "$ROOT/apps/invest/src" "$ROOT/apps/edu/src" "$ROOT/apps/web/src" "$ROOT/apps/console/src" 2>/dev/null || true)

if [ "$FAIL" -eq 0 ]; then
  echo "PASS — no invalid Tailwind opacity utilities in class attributes"
  exit 0
fi
echo "HINT: use /5,/10,/20,/25,/30,/40,/50,/60,/70,/75,/80,/90,/95,/100 (or arbitrary values like bg-[#7A2212])."
exit 1
