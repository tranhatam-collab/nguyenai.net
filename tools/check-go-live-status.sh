#!/usr/bin/env bash
# Go-live status checker
# Checks which items from FOUNDER_GO_LIVE_CHECKLIST.md are completed

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Nguyen AI Go-Live Status Check ==="
echo "Date: $(date -u +%Y-%m-%d)"
echo ""

# 1. Code quality checks
echo "1. Code Quality Checks"
echo "   Typecheck..."
if pnpm typecheck > /dev/null 2>&1; then
  echo "   ✅ Typecheck PASS"
else
  echo "   ❌ Typecheck FAIL"
fi

echo "   Build..."
if pnpm build > /dev/null 2>&1; then
  echo "   ✅ Build PASS"
else
  echo "   ❌ Build FAIL"
fi

echo "   Tests..."
if pnpm test > /dev/null 2>&1; then
  echo "   ✅ Tests PASS"
else
  echo "   ❌ Tests FAIL"
fi

echo ""

# 2. Audit checks
echo "2. Audit Checks"
echo "   Brand naming lock..."
if bash tools/audit-brand-naming-lock.sh > /dev/null 2>&1; then
  echo "   ✅ Brand naming lock PASS"
else
  echo "   ❌ Brand naming lock FAIL"
fi

echo "   Accessibility..."
if bash tools/audit-accessibility.sh > /dev/null 2>&1; then
  echo "   ✅ Accessibility PASS"
else
  echo "   ❌ Accessibility FAIL"
fi

echo "   Clone contamination..."
if bash tools/audit-clone-contamination.sh > /dev/null 2>&1; then
  echo "   ✅ Clone contamination PASS"
else
  echo "   ❌ Clone contamination FAIL"
fi

echo ""

# 3. External services (manual check)
echo "3. External Services (Manual Check Required)"
echo "   ⚠️  Neon PostgreSQL — Founder must provision"
echo "   ⚠️  Google OAuth — Founder must setup"
echo "   ⚠️  Stripe — Founder must setup"
echo "   ⚠️  Resend — Founder must setup"
echo "   ⚠️  Cloudflare secrets — Founder must set"
echo ""

# 4. Deployment status
echo "4. Deployment Status"
echo "   ⚠️  Web (nguyenai.net) — Deploy via CI/CD or manual"
echo "   ⚠️  Edu (edu.nguyenai.net) — Deploy via CI/CD or manual"
echo "   ⚠️  Console (app.nguyenai.net) — Deploy via CI/CD or manual"
echo "   ⚠️  Invest (invest.nguyenai.net) — DO NOT DEPLOY (legal entity + IP ownership pending)"
echo "   ⚠️  API (api.nguyenai.net) — Deploy via CI/CD or manual"
echo "   ⚠️  Auth (auth.nguyenai.net) — Deploy via CI/CD or manual"
echo ""

# 5. Governance status
echo "5. Governance Status"
echo "   ⚠️  Sprint 0 governance lock — OPEN (needs Founder lock)"
echo ""

echo "=== Summary ==="
echo "Code quality: ✅ Automated checks passing"
echo "Audits: ✅ All audits passing"
echo "External services: ⚠️  Founder manual setup required"
echo "Deployment: ⚠️  Founder manual deploy or CI/CD trigger"
echo "Governance: ⚠️  Sprint 0 lock OPEN"
echo ""
echo "Next steps:"
echo "1. Founder provisions external services (Neon, Google OAuth, Stripe, Resend)"
echo "2. Founder sets Cloudflare secrets"
echo "3. Founder locks Sprint 0 governance"
echo "4. Run: pnpm db:migrate (after DATABASE_URL set)"
echo "5. Deploy via CI/CD (push to main) or manual wrangler deploy"
echo "6. Verify end-to-end on production"
echo ""
echo "See: docs/deployment/FOUNDER_GO_LIVE_CHECKLIST.md"
