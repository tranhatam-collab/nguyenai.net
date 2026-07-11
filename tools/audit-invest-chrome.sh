#!/usr/bin/env bash
# tools/audit-invest-chrome.sh — Structural chrome checks for invest (nav/footer/mobile)
set -euo pipefail
URL="${1:-https://invest.nguyenai.net/team}"
HTML=$(curl -sS -L -H 'Cache-Control: no-cache' --max-time 20 "$URL")
FAIL=0

pass() { echo "PASS $1"; }
fail() { echo "FAIL $1"; FAIL=1; }

echo "=== Invest chrome audit — $URL ==="
echo "$HTML" | grep -q 'class="skip-link"' && pass "skip-link" || fail "skip-link"
echo "$HTML" | grep -q 'invest-header' && pass "header-solid-class" || fail "header-solid-class"
echo "$HTML" | grep -q 'id="menu-toggle"' && pass "mobile-toggle-id" || fail "mobile-toggle-id"
echo "$HTML" | grep -q 'invest-mobile-toggle' && pass "mobile-toggle-style" || fail "mobile-toggle-style"
echo "$HTML" | grep -q 'id="mobile-menu"' && pass "mobile-menu" || fail "mobile-menu"
echo "$HTML" | grep -qE 'Liên kết|>Links<' && pass "footer-links" || fail "footer-links"
echo "$HTML" | grep -qE 'Pháp lý|>Legal<' && pass "footer-legal" || fail "footer-legal"
echo "$HTML" | grep -q 'nguyenai.net —' && pass "footer-site-link" || fail "footer-site-link"
echo "$HTML" | grep -q 'bg-bg/96' && fail "banned bg-bg/96 still present" || pass "no bg-bg/96"
echo "$HTML" | grep -qE 'text-white/(78|82)' && fail "banned text-white/78|82 still present" || pass "no text-white/78|82"

if [ "$FAIL" -eq 0 ]; then
  echo "OVERALL: PASS"
  exit 0
fi
echo "OVERALL: FAIL"
exit 1
