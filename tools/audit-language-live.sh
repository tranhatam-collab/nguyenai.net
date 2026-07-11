#!/usr/bin/env bash
# tools/audit-language-live.sh — Live language boundary check on production surfaces
set -euo pipefail

FAIL=0
pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; FAIL=1; }
warn() { echo "⚠️  $1"; }

fetch() {
  local url="$1"
  curl -sS --max-time 20 -L "$url" 2>/dev/null || echo ""
}

check_page() {
  local name="$1" url="$2" expect_lang="$3" # vi|en
  local html
  html=$(fetch "$url")
  if [ -z "$html" ]; then
    fail "$name — empty/unreachable: $url"
    return
  fi

  local lang
  lang=$(echo "$html" | grep -oiE '<html[^>]*lang=["'\''][^"'\'']+["'\'']' | head -1 | sed -E 's/.*lang=["'\'']([^"'\'']+)["'\''].*/\1/i')
  if [ -z "$lang" ]; then
    fail "$name — missing html lang — $url"
  elif echo "$lang" | grep -qi "^${expect_lang}"; then
    pass "$name — lang=$lang"
  else
    fail "$name — expected lang=$expect_lang got lang=$lang — $url"
  fi

  # hreflang presence
  if echo "$html" | grep -qi 'hreflang='; then
    pass "$name — hreflang present"
  else
    warn "$name — no hreflang in HTML (may be SPA/console)"
  fi

  # Content language heuristics on visible-ish text (title + h1)
  local title h1
  title=$(echo "$html" | grep -oiE '<title>[^<]+</title>' | head -1 | sed -E 's/<\/?title>//gi' || true)
  h1=$(echo "$html" | grep -oiE '<h1[^>]*>[^<]{0,200}</h1>' | head -1 | sed -E 's/<[^>]+>//g' || true)
  title="${title:-}"
  h1="${h1:-}"

  if [ "$expect_lang" = "vi" ]; then
    # VI pages should not have English-only UI chrome like "Sign in" / "Free AI learning" as primary title
    if echo "$title $h1" | grep -qiE '\b(Sign in|Free AI learning|Get started|Learn more)\b'; then
      fail "$name — English UI phrase in VI title/h1: $title | $h1"
    else
      pass "$name — title/h1 no banned EN UI phrases"
    fi
    # Expect some Vietnamese diacritics OR brand Nguyễn/Nguyen in VI surface
    if echo "$title $h1" | grep -qE '[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]|Nguyễn|Nguyen'; then
      pass "$name — VI/brand markers in title/h1"
    else
      warn "$name — few VI markers in title/h1: $title"
    fi
  else
    # EN pages should not have common Vietnamese function words in title/h1
    if echo "$title $h1" | grep -qiE '\b(là|của|để|với|không|được|những|các)\b'; then
      fail "$name — Vietnamese words in EN title/h1: $title | $h1"
    else
      pass "$name — title/h1 no VI function words"
    fi
  fi
}

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Live Language Boundary Audit — production               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "▶ nguyenai.net (web) — homepage + key routes"
check_page "web-vi-home" "https://nguyenai.net/" "vi"
check_page "web-en-home" "https://nguyenai.net/en/" "en"
check_page "web-vi-plans" "https://nguyenai.net/plans/" "vi"
check_page "web-en-plans" "https://nguyenai.net/en/plans/" "en"
check_page "web-vi-about" "https://nguyenai.net/about/" "vi"
check_page "web-en-about" "https://nguyenai.net/en/about/" "en"
check_page "web-vi-privacy" "https://nguyenai.net/privacy/" "vi"
check_page "web-en-privacy" "https://nguyenai.net/en/privacy/" "en"
check_page "web-vi-terms" "https://nguyenai.net/terms/" "vi"
check_page "web-en-terms" "https://nguyenai.net/en/terms/" "en"
check_page "web-vi-contact" "https://nguyenai.net/contact/" "vi"
check_page "web-en-contact" "https://nguyenai.net/en/contact/" "en"

echo ""
echo "▶ edu.nguyenai.net"
check_page "edu-vi-home" "https://edu.nguyenai.net/" "vi"
check_page "edu-en-home" "https://edu.nguyenai.net/en/" "en"
check_page "edu-vi-scholarship" "https://edu.nguyenai.net/scholarship/" "vi"
check_page "edu-en-scholarship" "https://edu.nguyenai.net/en/scholarship/" "en"
check_page "edu-vi-apply" "https://edu.nguyenai.net/apply/" "vi"
check_page "edu-en-apply" "https://edu.nguyenai.net/en/apply/" "en"

echo ""
echo "▶ invest.nguyenai.net"
check_page "invest-vi-home" "https://invest.nguyenai.net/" "vi"
check_page "invest-en-home" "https://invest.nguyenai.net/en/" "en"
check_page "invest-vi-market" "https://invest.nguyenai.net/market/" "vi"
check_page "invest-en-market" "https://invest.nguyenai.net/en/market/" "en"

echo ""
echo "▶ app.nguyenai.net (console — often single-locale UI)"
check_page "console-login" "https://app.nguyenai.net/login" "vi"

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "OVERALL: ✅ LANGUAGE LIVE PASS"
  exit 0
else
  echo "OVERALL: ❌ LANGUAGE LIVE FAIL ($FAIL issues)"
  exit 1
fi
