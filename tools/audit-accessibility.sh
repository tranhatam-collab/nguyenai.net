#!/usr/bin/env bash
#
# audit-accessibility.sh — WCAG 2.1 AA accessibility audit for Nguyen AI apps
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

snippet_from_line() {
  local file="$1"
  local line_num="$2"
  local span="${3:-8}"
  sed -n "${line_num},$((line_num + span))p" "$file"
}

input_has_id() {
  local snippet="$1"
  echo "$snippet" | grep -qE '\bid='
}

button_has_name() {
  local snippet="$1"
  if echo "$snippet" | grep -qE 'aria-label=|aria-labelledby='; then
    return 0
  fi
  if echo "$snippet" | grep -qE '<button[^>]*>[^<[:space:]]'; then
    return 0
  fi
  local inner
  inner=$(echo "$snippet" | tr '\n' ' ' | sed -n 's/.*<button[^>]*>\(.*\)<\/button>.*/\1/p' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  [ -n "$inner" ] && return 0
  return 1
}

input_is_wrapped_in_label() {
  local file="$1"
  local line_num="$2"
  local start=$((line_num > 4 ? line_num - 4 : 1))
  sed -n "${start},${line_num}p" "$file" | grep -q '<label'
}

echo "=== WCAG 2.1 AA Accessibility Audit ==="
echo "Scanning: $APPS_DIR"
echo ""

while IFS= read -r file; do
  rel_file="${file#$REPO_ROOT/}"

  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    snippet=$(snippet_from_line "$file" "$line_num" 10)
    if echo "$snippet" | grep -qE 'role="presentation"'; then
      continue
    fi
    if ! echo "$snippet" | grep -qE '\balt='; then
      report_violation "$rel_file" "$line_num" "WCAG-1.1.1" "img without alt attribute"
    fi
  done < <(grep -n '<img' "$file" | cut -d: -f1)

  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    snippet=$(snippet_from_line "$file" "$line_num" 10)
    if echo "$snippet" | grep -qE 'type="hidden"|type="submit"'; then
      continue
    fi
    if echo "$snippet" | grep -qE 'aria-label='; then
      continue
    fi
    if input_is_wrapped_in_label "$file" "$line_num"; then
      continue
    fi
    if ! input_has_id "$snippet"; then
      report_violation "$rel_file" "$line_num" "WCAG-3.3.2" "input without id (label association)"
    fi
  done < <(grep -n '<input' "$file" | cut -d: -f1)

  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    snippet=$(snippet_from_line "$file" "$line_num" 12)
    if ! button_has_name "$snippet"; then
      report_violation "$rel_file" "$line_num" "WCAG-4.1.2" "button without discernible text"
    fi
  done < <(grep -n '<button' "$file" | cut -d: -f1)

  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    snippet=$(snippet_from_line "$file" "$line_num" 4)
    if ! echo "$snippet" | grep -q 'aria-label'; then
      report_violation "$rel_file" "$line_num" "WCAG-1.3.1" "nav without aria-label"
    fi
  done < <(grep -n '<nav' "$file" | cut -d: -f1)

  while IFS= read -r line_num; do
    [ -z "$line_num" ] && continue
    snippet=$(snippet_from_line "$file" "$line_num" 4)
    if ! echo "$snippet" | grep -qE 'aria-label|aria-labelledby'; then
      report_violation "$rel_file" "$line_num" "WCAG-1.3.1" "section without aria-label"
    fi
  done < <(grep -n '<section' "$file" | cut -d: -f1)

done < <(find "$APPS_DIR" -type f \( -name "*.astro" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" | sort)

echo ""
echo "=== Checking skip-to-content link (WCAG 2.4.1) ==="
for app in web invest edu console; do
  layout_dir="$APPS_DIR/$app/src/layouts"
  if [ -d "$layout_dir" ]; then
    if ! grep -rq 'skip-to-content\|skip-to-main\|skip-link\|Bỏ qua đến nội dung\|Skip to content' "$layout_dir" 2>/dev/null; then
      echo "VIOLATION: apps/$app/src/layouts/ — [WCAG-2.4.1] missing skip-to-content link"
      VIOLATIONS=$((VIOLATIONS + 1))
    else
      echo "OK: apps/$app — has skip-to-content link"
    fi
  fi
done

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
