#!/usr/bin/env bash
# tools/build-go-live.sh — Ordered repo build for go-live Phase 0
# sitemap → typecheck → build → audit:all → seo-build → test → session-auth regression
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Step 0: generate web sitemaps..."
pnpm run audit:generate-sitemaps

echo ""
echo "▶ Steps 1–5: QA loop (typecheck → build → audit:all → seo-build → test)..."
bash tools/qa-loop.sh

echo ""
echo "▶ Step 6: session-auth regression..."
npx tsx tools/session-auth-regression.ts

echo ""
echo "✅ build:go-live complete — run pnpm go-live:check for full gate"
