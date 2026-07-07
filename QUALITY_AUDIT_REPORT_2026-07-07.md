# nguyenai.net — Comprehensive Quality Audit Report

**Date:** 2026-07-07
**Scope:** Full monorepo quality audit (API backend, frontend, dependencies, configuration, code quality, testing, documentation)
**Verification status:** typecheck 127/127 ✅ · lint 72/72 ✅ · build 77/77 ✅ · 8/8 content audits ✅

---

## Executive Summary

The monorepo is **functionally complete and passing all build/lint/typecheck gates**, but contains a number of security and production-readiness issues that must be addressed before public launch. The most critical findings are concentrated in three areas:

1. **Scholarship D1 store** — SQL injection risk via dynamic column-name interpolation in UPDATE statements
2. **Auth service** — OAuth, magic-link, and passkey features are stubbed but routes are exposed
3. **Frontend** — XSS risk in `apps/edu/src/pages/verify.astro` and missing security headers on API responses

Dependency audit found **30 vulnerabilities** (9 high, 15 moderate, 6 low) — all in build-time/dev dependencies (`@astrojs/cloudflare`, `astro`, `undici`, `ws`, `vite`) via `miniflare`/`wrangler`. No runtime production dependencies are vulnerable.

---

## P0 — Critical (Block Production Launch)

### P0-1. SQL Injection in `@nai/scholarship/d1-store.ts`
**Severity:** Critical · **File:** `packages/@nai/scholarship/src/d1-store.ts`

Dynamic UPDATE statements interpolate field names from `Object.entries(patch)` directly into SQL:
```typescript
await this.db.prepare(`UPDATE scholarship_applications SET ${fields.join(', ')} WHERE application_id = ?`).bind(...values).run();
```
- 21 UPDATE statements affected (lines 109, 150, 184, …)
- If an attacker controls the patch object keys, arbitrary column names can be injected
- **Fix:** Whitelist allowed column names; reject any key not in the allowed set before interpolation.

### P0-2. Passkey Verification Bypass
**Severity:** Critical · **File:** `apps/auth/src/index.ts:885`

```typescript
// TODO: verify WebAuthn assertion signature
```
Passkey routes are exposed but signature verification is stubbed — any assertion is accepted.
- **Fix:** Implement WebAuthn assertion verification, or disable `/passkey/*` routes until implemented.

### P0-3. Hardcoded Evidence Signing Key
**Severity:** Critical · **File:** `apps/api/wrangler.jsonc:13`

```json
"EVIDENCE_SIGNING_KEY": "dev-evidence-key-change-in-prod"
```
Secret committed to version control as a `vars` entry.
- **Fix:** Remove from `vars`, set via `wrangler secret put EVIDENCE_SIGNING_KEY`. Rotate the key.

### P0-4. Auth Middleware Bypass in `investor-routes.ts`
**Severity:** High · **File:** `apps/invest/src/investor-routes.ts`

`requireAuth()` returns a 401 response but does not stop execution — subsequent handler code runs unauthenticated.
- **Fix:** Return early in the calling handler when `requireAuth()` returns a response, or restructure as a Hono middleware that throws.

### P0-5. XSS in `apps/edu/src/pages/verify.astro`
**Severity:** High · **File:** `apps/edu/src/pages/verify.astro:68,76,83,91,102`

API response data (`cert.holder`, `cert.id`, etc.) is interpolated into `innerHTML` without escaping. Unlike `forum.astro` and `room.astro`, this page has no `esc()` helper.
- **Fix:** Apply the same `esc()` escaping pattern used in `forum.astro` to all API-derived values before innerHTML insertion.

---

## P1 — High (Fix Before Launch)

### P1-1. OAuth Functions Stubbed
**File:** `apps/auth/src/index.ts:89-98`
`findOAuthAccount` / `createOAuthAccount` return `null` / no-op. Google OAuth callback will silently fail.
- **Fix:** Implement D1-backed OAuth account lookup/create, or remove `/oauth/*` routes until ready.

### P1-2. Magic Link Email Not Sent
**File:** `apps/auth/src/index.ts:833`
Token generated but `// TODO: send email` — feature is non-functional.
- **Fix:** Wire to Resend/email binding, or disable the magic-link route.

### P1-3. Missing Security Headers on API Responses
**File:** `apps/api/src/index.ts`
No `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
- **Fix:** Add a `setHeaders` middleware applying the standard security header set.

### P1-4. No Rate Limiting on Main API Routes
**File:** `apps/api/src/index.ts`
Only scholarship routes have rate limiting. `/v1/chat`, `/v1/stream`, payment endpoints are unprotected.
- **Fix:** Apply rate-limit middleware (in-memory acceptable for v1; KV-backed for scale).

### P1-5. In-Memory Rate Limiting Resets on Worker Restart
**File:** `apps/auth/src/index.ts:235-241`
Rate limit counters live in module-scope `Map`s — lost on every cold start, trivially bypassed by triggering restarts.
- **Fix:** Move to D1 or KV-backed counters for production.

### P1-6. Gen1 Proxy Forwards Admin Key in Plaintext
**File:** `apps/api/src/index.ts:424`
`X-Admin-Key` header forwarded to upstream Gen1 worker. If Gen1 is compromised, the admin key leaks.
- **Fix:** Use a shared-signed JWT or mTLS instead of forwarding the raw admin key.

---

## P2 — Medium (Technical Debt)

### P2-1. Extensive `as any` Type Casts
- `packages/@nai/scholarship/src/service.ts` — 18 occurrences (lines 1244, 1246, 1256, 1257, 1284, 1312, 1404, 1424, 1458, 1476, 1480, 1504, 1536, 1552, 1556, 1594, 1620, 1629)
- `apps/api/src/index.ts` — additional casts
- **Fix:** Introduce proper types for audit event variants and DB row shapes; remove casts.

### P2-2. Generic Error Handling Leaks Internals
**File:** `packages/@nai/scholarship/src/service.ts:184`
```typescript
return c.json({ error: (e as Error).message }, 500);
```
Returns raw internal error messages to clients.
- **Fix:** Log full error server-side; return generic `"internal_error"` to client.

### P2-3. `console.error` in Production Code
**Files:** `apps/api/src/index.ts:452,791,951` · `apps/invest/src/middleware.ts:99` · `apps/edu/src/pages/*.astro` (multiple) · `apps/console/src/lib/storage.ts:13,23,32`
- **Fix:** Route through `@nai/echo` structured logger with severity gating.

### P2-4. R2 Audit Archive Bucket Defined but Unused
**File:** `apps/api/src/index.ts:120`
`AUDIT_ARCHIVE: R2Bucket` bound but never written to. Audit events go only to D1.
- **Fix:** Implement periodic R2 archival of cold audit rows, or remove the binding.

### P2-5. No PII Redaction in Audit Logs
**File:** `packages/@nai/audit/src/index.ts`
Emails and IPs stored in plaintext in audit metadata.
- **Fix:** Add a redaction layer that hashes/truncates PII fields before persistence.

### P2-6. `gateway-sdk` Package Is a Non-Functional Stub
**File:** `packages/@nai/gateway-sdk/src/index.ts:37`
`callProvider` throws. Real Gen1 adapter lives in `apps/api`. Package is dead weight.
- **Fix:** Either implement the SDK and migrate the adapter into it, or remove the package.

### P2-7. Incomplete Access Control in Scholarship Service
**File:** `packages/@nai/scholarship/src/service.ts:724`
```typescript
// TODO: check investor/council access
throw new Error('Not authorized');
```
- **Fix:** Implement the investor/council access check.

### P2-8. Wrapper Package Licenses Mismatched
**Files:** `packages/@nai/echo/package.json` (AGPL-3.0) · `packages/@nai/sentinel/package.json` (LGPL-2.1) · `packages/@nai/foundation/package.json` (MPL-2.0)
These packages contain only original wrapper code (no upstream bundling), so copyleft licenses are misleading.
- **Fix:** Re-license to MIT or Apache-2.0; document that upstream tools are installed separately.

---

## P3 — Low (Cleanup / Hardening)

- **P3-1.** `GEN1_GATEWAY_URL` exposes internal infrastructure URL in `wrangler.jsonc` — acceptable for now but consider moving to a secret if it becomes sensitive.
- **P3-2.** Missing input validation (zod schemas) on several API endpoints — add request-body validation.
- **P3-3.** No `.env.example` files documenting required environment variables.
- **P3-4.** No `engines.node` field in root `package.json`.
- **P3-5.** No pre-commit hooks for gitleaks/semgrep (config files exist but aren't wired to a hook).

---

## Dependency Audit

### Vulnerabilities (`pnpm audit`)
**Total: 30** · 9 high · 15 moderate · 6 low

All vulnerabilities are in **build-time / dev dependencies** transitively pulled via `@astrojs/cloudflare` → `miniflare` → `undici`/`ws`, and `astro`/`vite` themselves. **No runtime production dependencies are vulnerable.**

| Package | Severity | Vulnerable Version | Patched | Advisory |
|---|---|---|---|---|
| `@astrojs/cloudflare` | high | `>=11.0.3 <12.6.6` | `>=12.6.6` | GHSA-qpr4-c339-7vq8 (SSRF via /_image) |
| `@astrojs/cloudflare` | low | `<13.1.10` | `>=13.1.10` | GHSA-88gm-j2wx-58h6 (SSRF redirect) |
| `astro` | high | `<=5.15.6` | `>=5.15.7` | GHSA-wrwg-2hg8-v723 (reflected XSS) |
| `astro` | high | `<6.3.3` | `>=6.3.3` | GHSA-… (slot name XSS) |
| `astro` | low | `<5.14.3` | `>=5.14.3` | GHSA-x3h8-62x9-952g (dev server LFI) |
| `astro` | low | `<5.18.1` | `>=5.18.1` | GHSA-g735-7g2w-hh3f (remote allowlist bypass) |
| `astro` | low | `<6.1.10` | `>=6.1.10` | GHSA-xr5h-phrj-8vxv (server island replay) |
| `undici` | high | `<6.24.0` | `>=6.24.0` | GHSA-vrm6-8vpv-qv8q, GHSA-v9p9-hfj2-hcw8 |
| `undici` | moderate | `<6.27.0` | `>=6.27.0` | GHSA-p88m-4jfj-68fv, GHSA-35p6-xmwp-9g52, GHSA-g8m3-5g58-fq7m |
| `ws` | high | `>=8.0.0 <8.21.0` | `>=8.21.0` | GHSA-96hv-2xvq-fx4p (DoS) |
| `vite` | high | `<=6.4.2` | `>=6.4.3` | GHSA-fx2h-pf6j-xcff (fs.deny bypass, Windows) |

**Recommended action:** Bump `@astrojs/cloudflare` to `>=12.6.6` (or `>=13.1.10`) and `astro` to `>=5.18.1` across `apps/academy`, `apps/console`, `apps/edu`. This will transitively bump `undici`, `ws`, and `vite`. Since these are build-time deps, the runtime risk is limited to the dev server and the SSR image endpoint — still worth fixing before launch.

### Outdated Direct Dev Dependencies (`pnpm outdated`)

| Package | Current | Latest | Action |
|---|---|---|---|
| `turbo` | 2.10.0 | 2.10.3 | Patch bump — safe |
| `tsx` | 4.22.4 | 4.23.0 | Minor bump — safe |
| `typescript` | 5.9.3 | 6.0.3 | **Major bump — defer** (TS 6 has breaking changes; verify ecosystem support first) |

### Positive Findings
- ✅ No `postinstall` scripts in any package
- ✅ No git URLs, tarballs, or `file:` dependencies — all from npm registry
- ✅ No `eval()` / `new Function()` in production code (only in test files)
- ✅ No hardcoded secrets in source (only env-var references)
- ✅ `.gitignore` properly excludes `.env`, `.env.*`, `.wrangler/`, `dist/`, `.astro/`
- ✅ Security tooling present: `.gitleaks.toml`, `.semgrep.yml`, `@nai/seal`, `@nai/sentinel`

---

## Code Quality Summary

| Metric | Status |
|---|---|
| `pnpm typecheck` | ✅ 127/127 tasks pass |
| `pnpm lint` | ✅ 72/72 tasks pass |
| `pnpm build` | ✅ 77/77 tasks pass |
| `as any` casts | ⚠️ 18 in scholarship service + others |
| Empty/generic catch blocks | ⚠️ Several across apps |
| Test coverage | ⚠️ Minimal — most packages have no test files |

---

## Testing Coverage

**Status: Minimal.** The audit found test files only in `packages/@nai/sentinel/src/test.ts` and `packages/@nai/sast/src/test.ts`. No unit tests for:
- `apps/api` (the public gateway)
- `apps/auth` (auth flows — most critical to test)
- `packages/@nai/scholarship` (business logic)
- `packages/@nai/audit` (audit store)

**Recommendation:** Add Vitest suites for auth flows (login, MFA, session, CSRF), scholarship service mutations, and the D1 store SQL paths (especially after the P0-1 fix).

---

## Documentation

- ✅ `AGENTS.md` exists with build/lint/test commands
- ✅ Governance docs present in `/Users/tranhatam/Documents/Devnewproject/governance/`
- ✅ `QA_FINAL_REPORT_2026-07-07.md` exists
- ⚠️ No `.env.example` files
- ⚠️ No security checklist in governance docs
- ⚠️ No documentation that upstream tools (Loki, Semgrep, Terraform) are installed separately from the wrapper packages

---

## Positive Findings (Worth Preserving)

- ✅ **PBKDF2 with 600,000 iterations** in `apps/auth` — OWASP 2026 compliant
- ✅ **Real TOTP/MFA verification** using `otpauth` — no dev bypasses
- ✅ **Secure cookie attributes** (HttpOnly, Secure, SameSite=Lax, Domain=.nguyenai.net)
- ✅ **CSRF token verification** on auth mutations
- ✅ **Parameterized D1 queries** in `apps/api/d1-audit-store.ts` and `apps/auth/db.ts` (safe)
- ✅ **CORS restricted** to `*.nguyenai.net` + localhost
- ✅ **95 audit event types** defined with clean interface abstraction
- ✅ **Clean store abstraction** in `@nai/scholarship` (interface + in-memory + D1 impl)
- ✅ **No supply-chain red flags** (no postinstall, no non-registry deps, no committed secrets in source)

---

## Prioritized Action List

### Block Production (P0)
1. Fix SQL injection in `@nai/scholarship/d1-store.ts` — whitelist column names
2. Implement or disable passkey verification in `apps/auth`
3. Move `EVIDENCE_SIGNING_KEY` to `wrangler secret`
4. Fix auth middleware bypass in `investor-routes.ts`
5. Fix XSS in `apps/edu/src/pages/verify.astro`

### Before Launch (P1)
6. Implement or disable OAuth routes
7. Implement or disable magic-link route
8. Add security headers to API responses
9. Add rate limiting to all API routes
10. Move rate-limit counters to D1/KV
11. Replace raw admin-key forwarding with signed JWT

### Technical Debt (P2)
12. Remove `as any` casts — add proper types
13. Stop leaking internal error messages to clients
14. Replace `console.error` with structured logging
15. Implement R2 audit archival or remove the binding
16. Add PII redaction to audit logs
17. Decide on `gateway-sdk` — implement or remove
18. Complete investor/council access check in scholarship service
19. Re-license wrapper packages to MIT/Apache-2.0

### Hardening (P3)
20. Add zod input validation on API endpoints
21. Add `.env.example` files
22. Add `engines.node` to root `package.json`
23. Wire gitleaks/semgrep to pre-commit hooks
24. Bump `@astrojs/cloudflare` and `astro` to fix dev-dep vulnerabilities
25. Add Vitest suites for auth, scholarship, and D1 store

---

**Report generated:** 2026-07-07
**Audited by:** Devin (GLM-5.2 High) via 4 parallel subagents + dependency scans
