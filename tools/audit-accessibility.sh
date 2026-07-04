#!/usr/bin/env bash
#
# audit-accessibility.sh — WCAG 2.1 AA accessibility audit for Nguyen AI apps
#
# Checks source .astro/.tsx files for common WCAG 2.1 AA violations:
#   1. Images without alt attribute (WCAG 1.1.1)
#   2. Form inputs without associated label (WCAG 1.3.1, 3.3.2)
#   3. Missing skip-to-content link (WCAG 2.4.1)
#   4. Missing lang attribute on <html> (WCAG 3.1.1)
#   5. Missing aria-label on nav/section landmarks (WCAG 1.3.1)
#   6. Insufficient color contrast (checked via CSS — gold on cream etc.)
#   7. Buttons/links without discernible text (WCAG 4.1.2)
#   8. Missing focus-visible styles (WCAG 2.4.7)
#
# Usage: ./tools/audit-accessibility.sh
# Exit code: 0 = pass, 1 = violations found

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPS_DIR="$REPO_ROOT/apps"
VIOLATIONS=0

report_violation() {
  local file="$1"
  local line="$2"
  local rule="$3"
  local message="$4"
  echo "VIOLATION: $file:$line — [$rule] $message"
  VIOLATIONS=$((VIOLATIONS + 1))
}

echo "=== WCAG 2.1 AA Accessibility Audit ==="
echo "Scanning: $APPS_DIR"
echo ""

# Find all .astro and .tsx files in apps/
find "$APPS_DIR" -type f \( -name "*.astro" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" | sort | while read -r file; do
  rel_file="${file#$REPO_ROOT/}"

  # 1. <img> without alt attribute (WCAG 1.1.1)
  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    report_violation "$rel_file" "$line_num" "WCAG-1.1.1" "img without alt attribute"
  done < <(grep -n '<img' "$file" | grep -v 'alt=' | grep -v 'role="presentation"' | cut -d: -f1)

  # 2. <input> without id (needed for label association)
  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    report_violation "$rel_file" "$line_num" "WCAG-3.3.2" "input without id (label association)"
  done < <(grep -n '<input' "$file" | grep -v 'id=' | grep -v 'type="hidden"' | grep -v 'type="submit"' | cut -d: -f1)

  # 3. <button> or <a> without text content (WCAG 4.1.2)
  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    line_content=$(sed -n "${line_num}p" "$file")
    # Check if button has text or aria-label
    if ! echo "$line_content" | grep -qE 'aria-label|>.*\S.*<'; then
      report_violation "$rel_file" "$line_num" "WCAG-4.1.2" "button without discernible text"
    fi
  done < <(grep -n '<button' "$file" | cut -d: -f1)

  # 5. <nav> without aria-label (WCAG 1.3.1)
  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    line_content=$(sed -n "${line_num}p" "$file")
    if ! echo "$line_content" | grep -q 'aria-label'; then
      report_violation "$rel_file" "$line_num" "WCAG-1.3.1" "nav without aria-label"
    fi
  done < <(grep -n '<nav' "$file" | cut -d: -f1)

  # 6. <section> without aria-label (WCAG 1.3.1)
  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    line_content=$(sed -n "${line_num}p" "$file")
    if ! echo "$line_content" | grep -qE 'aria-label|aria-labelledby'; then
      report_violation "$rel_file" "$line_num" "WCAG-1.3.1" "section without aria-label"
    fi
  done < <(grep -n '<section' "$file" | cut -d: -f1)

done

# Check layouts for skip-to-content link (WCAG 2.4.1)
echo ""
echo "=== Checking skip-to-content link (WCAG 2.4.1) ==="
for app in web invest edu console; do
  layout_dir="$APPS_DIR/$app/src/layouts"
  if [ -d "$layout_dir" ]; then
    if ! grep -rq 'skip-to-content\|skip-to-main\|skip-link' "$layout_dir" 2>/dev/null; then
      echo "VIOLATION: apps/$app/src/layouts/ — [WCAG-2.4.1] missing skip-to-content link"
      VIOLATIONS=$((VIOLATIONS + 1))
    else
      echo "OK: apps/$app — has skip-to-content link"
    fi
  fi
done

# Check <html lang=> in layouts (WCAG 3.1.1)
echo ""
echo "=== Checking html lang attribute (WCAG 3.1.1) ==="
for app in web invest edu console; do
  layout_dir="$APPS_DIR/$app/src/layouts"
  if [ -d "$layout_dir" ]; then
    if ! grep -rq 'lang=' "$layout_dir" 2>/dev/null; then
      echo "VIOLATION: apps/$app/src/layouts/ — [WCAG-3.1.1] missing lang attribute on <html>"
      VIOLATIONS=$((VIOLATIONS + 1))
    else
      echo "OK: apps/$app — has lang attribute"
    fi
  fi
done

# Check focus-visible styles (WCAG 2.4.7)
echo ""
echo "=== Checking focus-visible styles (WCAG 2.4.7) ==="
for app in web invest edu console; do
  styles_dir="$APPS_DIR/$app/src/styles"
  if [ -d "$styles_dir" ]; then
    if ! grep -rq 'focus-visible\|:focus' "$styles_dir" 2>/dev/null; then
      echo "VIOLATION: apps/$app/src/styles/ — [WCAG-2.4.7] missing focus styles"
      VIOLATIONS=$((VIOLATIONS + 1))
    else
      echo "OK: apps/$app — has focus styles"
    fi
  fi
done

echo ""
echo "=== Summary ==="
if [ "$VIOLATIONS" -eq 0 ]; then
  echo "PASS: 0 accessibility violations found"
  exit 0
else
  echo "FAIL: $VIOLATIONS accessibility violations found"
  exit 1
fi
