#!/usr/bin/env bash
# tools/grant-qualified-investor.sh — promote a user to QUALIFIED_INVESTOR (D1)
# Usage: bash tools/grant-qualified-investor.sh user@example.com
set -euo pipefail
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-62d57eaa548617aeecac766e5a1cb98e}"
EMAIL="${1:-}"
if [[ -z "$EMAIL" ]]; then
  echo "Usage: $0 <email>" >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/auth"

# Escape single quotes for SQL
SAFE_EMAIL="${EMAIL//\'/\'\'}"

echo "▶ Promote $EMAIL → QUALIFIED_INVESTOR on nguyenai-identity"
pnpm exec wrangler d1 execute nguyenai-identity --remote --command \
  "UPDATE memberships SET role = 'QUALIFIED_INVESTOR', updated_at = datetime('now')
   WHERE user_id = (SELECT user_id FROM users WHERE email = '${SAFE_EMAIL}' LIMIT 1);"

pnpm exec wrangler d1 execute nguyenai-identity --remote --command \
  "SELECT u.email, m.role, m.org_id FROM users u
   JOIN memberships m ON m.user_id = u.user_id
   WHERE u.email = '${SAFE_EMAIL}';"

echo "✅ Done. User must log out/in so session picks up invest:private-read."
