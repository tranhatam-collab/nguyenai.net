# Changelog

All notable changes to the nguyenai.net monorepo are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- `tools/qa-loop.sh` — Continuous QA loop script (audit:all + typecheck + build + test)
- `tools/self-upgrade-report.sh` — Self-upgrade report generator with git log analysis
- `CHANGELOG.md` — Monorepo changelog
- `docs/governance/SELF_UPGRADE_HISTORY.md` — Append-only upgrade history
- `audit:security-p0` script added to package.json and CI
- `audit:independence` added to CI deploy.yml
- `audit:seo-build` added to CI deploy.yml (post-build rendered HTML check)
- 15/15 audits now in CI (was 12/15)

### Fixed
- `@nai/email`: test updated for 25 templates (was 20) and 24 audit event mappings (was 18)
- `@nai/migrations`: 10 migration files (005-014) wrapped in BEGIN/COMMIT transactions
- `@nai/approval`: removed duplicate code (lines 233-268) causing syntax error
- `@nai/entitlement`: removed duplicate code (696 lines) causing syntax error
- `@nai/e2e`: fixed 3 integration test failures:
  - Workflow approval gate: fixed API call signature (tenantId as 3rd param)
  - Browser denylist: implemented `isUrlAllowed` check in `fetchPage` (@nai/scout)
  - Pipeline stages: fixed `addStage` return value not being assigned + dependency IDs

### Changed
- `.github/workflows/deploy.yml`: added 3 new audit steps (independence, security-p0, seo-build)
- `packages/@nai/scout/src/index.ts`: `fetchPage` now checks allowlist/denylist before fetching

## [0.1.0] - 2026-07-08

### Phase 0 — Independence Lock
- nguyenai.net fully independent from Gen1/Gen2
- `GEN1_GATEWAY_URL` removed from wrangler.jsonc vars
- `LLM_PROVIDER_MODE` changed from 'gen1' to 'auto'
- 10 bilingual evidence pages (/proof, /status, /claims, /receipts, /demo)
- `tools/audit-independence.sh` created
- Legacy repos archived (nguyenai-api-gateway, nguyenai-console, nguyenai-invest)
- 12 audits passing, 88/88 build tasks, full independence verified
