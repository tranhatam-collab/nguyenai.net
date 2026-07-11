#!/usr/bin/env bash
# tools/deploy-all.sh — Deploy all Nguyen AI surfaces (account Anhhatam)
set -euo pipefail
cd "$(dirname "$0")/.."
export CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e

echo "▶ Phase 0: build"
pnpm build:go-live

echo "▶ Phase 1: workers"
(cd apps/api && wrangler deploy)
(cd apps/auth && wrangler deploy || true)  # cron schedule may warn

echo "▶ Phase 2: pages"
(cd apps/web && wrangler pages deploy dist --project-name=nai-web --branch=main --commit-dirty=true)
(cd apps/edu && wrangler pages deploy dist --project-name=nguyenai-edu --branch=main --commit-dirty=true)
(cd apps/console && wrangler pages deploy dist --project-name=nguyenai-console --branch=main --commit-dirty=true)
(cd apps/invest && wrangler pages deploy dist --project-name=nguyenai-invest --branch=main --commit-dirty=true)

echo "▶ Phase 3: smoke + live test"
bash tools/go-live-live-test.sh
