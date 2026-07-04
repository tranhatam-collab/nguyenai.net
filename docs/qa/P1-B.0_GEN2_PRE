# P1-B.0 — Gen2 Pre-Integration Audit

**Date:** 2026-07-04
**Auditor:** Devin (automated)
**Scope:** Gen2 (maytinhai-os) — pre-integration audit before Nguyen AI migrates/adapts Gen2 components.
**Status:** Gen2 FROZEN per Founder Architecture Amendment — reference only, not modified.

---

## 1. Gen2 Repository Overview

| Attribute | Value |
|-----------|-------|
| Repo | `/Users/tranhatam/Documents/Devnewproject/maytinhai-os` |
| Brand | maytinhai.org |
| API | Cloudflare Workers (apps/api) |
| Auth | Supabase JWT |
| DB | D1 + KV + R2 + Durable Objects |
| Packages | 41 packages in `packages/` |
| Status | FROZEN — reference only |

---

## 2. Gen2 Package Inventory (41 packages)

### Packages relevant to Nguyen AI P1-B/C/D/E

| Gen2 package | NAI equivalent | P1 item | Migration status |
|--------------|----------------|---------|------------------|
| `agent-graph` | `@nai/conductor` | P1-A.3 | ✅ Built independently (not migrated) |
| `app-registry` | (Super Apps) | P1-B.8/9 | Reference for Super App pattern |
| `auth` | `@nai/auth` | P0-B | ✅ Built independently |
| `authz-fga` | `@nai/policy-fga` | P0-B | ✅ Built independently |
| `billing` | `@nai/billing` | P1-B.3/4/5 | ✅ Built independently |
| `browser` | `@nai/scout` | P1-C.2 | Building (MVP) |
| `browser-visual` | `@nai/pilot` | P1-C.3 | Building (MVP) |
| `command-system` | `@nai/conductor` | P1-A.3 | ✅ Built independently |
| `crew` | `@nai/ensemble` | P1-C.4 | Building (MVP) |
| `dashboard` | `@nai/atlas` | P1-D.9 | Building (MVP) |
| `email` | `@nai/email` | P0-B | ✅ Built independently |
| `eval` | `@nai/scale` | P1-D.3 | Building (MVP) |
| `file-system` | (Vault) | P1-B.6 | Building @nai/covenant |
| `fulfillment` | `@nai/billing` | P1-B.5 | ✅ Built independently |
| `integrations` | — | — | Not migrating (Gen2-specific) |
| `legal` | — | — | Not migrating |
| `llm-platform` | `@nai/prism` | P1-A.5 | ✅ Built independently |
| `logs` | `@nai/atlas` | P1-D.8 | Building (MVP) |
| `machine-state` | — | — | Not migrating (Gen2-specific) |
| `memory` | `@nai/relic` | P1-A.6 | ✅ Built independently |
| `observe-llm` | `@nai/tally` | P1-D.1 | Building (MVP) |
| `observe-phoenix` | `@nai/beacon` | P1-D.1 | Wrapper (not yet built) |
| `orchestrator` | `@nai/aqueduct` | P1-C.1 | Building (MVP) |
| `pipeline` | `@nai/loom` | P1-C.5 | Building (MVP) |
| `policy-engine` | `@nai/policy-engine` | P0-B | ✅ Built independently |
| `queue` | — | — | Not migrating (use Cloudflare Queues) |
| `rag` | `@nai/scroll` | P1-A.8 | ✅ Built independently |
| `sbom` | `@nai/provenance` | P1-E.6 | Building (MVP) |
| `scan-code` | `@nai/sentinel` | P1-E.1 | Building (MVP) |
| `scan-deps` | `@nai/hound` | P1-E.3 | Building (MVP) |
| `scan-secrets` | `@nai/sentinel` | P1-E.4 | Building (MVP) |
| `security` | `@nai/warden` | P1-E | Building (MVP) |
| `telemetry` | `@nai/seismograph` | P1-D.2/7 | Building (MVP) |
| `test-llm` | `@nai/forge` | P1-D.5 | Building (MVP) |
| `test-prompt` | `@nai/forge` | P1-D.6 | Building (MVP) |
| `tool-registry` | `@nai/harness` | P1-A.4 | ✅ Built independently |
| `trace` | `@nai/seismograph` | P1-D.2 | Building (MVP) |
| `vector` | `@nai/compass` | P1-A.7 | ✅ Built independently |
| `workflow` | `@nai/aqueduct` | P1-C.1 | Building (MVP) |

### Packages NOT migrating (Gen2-specific)

| Package | Reason |
|---------|--------|
| `design-system` | Gen2-specific UI components |
| `feedback` | Gen2-specific feedback system |
| `integrations` | Gen2-specific third-party integrations |
| `legal` | Gen2-specific legal docs |
| `machine-state` | Gen2-specific machine state management |
| `queue` | Use Cloudflare Queues directly |
| `observe-phoenix` | Phoenix is Gen2-specific observability |

---

## 3. Gen2 API Audit

### 3.1 Endpoints

Gen2 API (apps/api) exposes:
- `/health` — health check
- `/v1/pay/checkout` — payment checkout (proxy to PAY_API_BASE_URL)
- `/session/*` — Durable Object routes (UserSession)
- `/machine/*` — Durable Object routes (MachineSession)
- `/command/*` — Durable Object routes (CommandOrchestrator)
- `/approval/*` — Durable Object routes (ApprovalQueue)
- `/ai/*` — proxy to AIAGENT_API_BASE_URL/v1/* (Gen1 gateway)

### 3.2 Architecture differences (Gen2 vs NAI)

| Aspect | Gen2 | NAI |
|--------|------|-----|
| Auth | Supabase JWT | @nai/auth (better-auth rebrand) |
| State | Durable Objects | InMemory (MVP) → D1/Postgres |
| Payments | PAY_API_BASE_URL proxy | @nai/billing (Stripe + VNPay) |
| Gateway | /ai/* → Gen1 | /v1/chat, /v1/stream → Gen1 |
| Entitlements | machine-state DO | @nai/entitlement + @nai/product-catalog |

### 3.3 Compatibility contract

Per Founder Architecture Amendment:
- NAI backend is independent (Decision 1)
- Gen2 stays frozen (reference only)
- NAI must maintain compatibility contract when integrating
- Adapter/gateway is NOT source of truth

**Compatibility requirements for integration:**
1. If NAI calls Gen2 APIs, must use Gen2's auth (Supabase JWT) — NOT NAI's auth
2. If NAI shares data with Gen2, must use Gen2's D1 schema — NOT NAI's schema
3. If NAI proxies to Gen2, must preserve Gen2's request/response format
4. NAI adapter does NOT own command execution, identity, entitlement, billing, proof

**Current status:** No integration needed for P1. NAI builds all components independently. Gen2 integration is deferred to Phase 5+ (when cross-system features are needed).

---

## 4. Gen2 Known Issues (from QA reports)

| Issue | Severity | Gen2 status | NAI impact |
|-------|----------|-------------|------------|
| CORS `*` in Gen2 API | P0 | Known, not fixed | NAI does NOT inherit (independent backend) |
| SQL injection in Gen2 | P0 | Known, not fixed | NAI does NOT inherit (independent backend) |
| Brand mismatch (maytinhai.org serving computer.iai.one) | P0 | Fixed 2026-07-03 | No impact on NAI |
| DNS CNAME wrong account | P0 | Fixed 2026-07-03 | No impact on NAI |
| Missing brand assets | P1 | Fixed 2026-07-03 | No impact on NAI |

**Key finding:** Gen2's security issues (CORS `*`, SQLi) do NOT affect NAI because NAI has an independent backend. NAI must NOT copy Gen2's API code or patterns.

---

## 5. Migration Decision

**Decision: NO MIGRATION from Gen2.**

Rationale:
1. NAI backend is independent per Founder Override Decision 1
2. Gen2 has known security issues (CORS `*`, SQLi) that would be inherited if copied
3. NAI has already built equivalent packages independently (P1-A complete)
4. Gen2's architecture (Durable Objects + Supabase) differs from NAI's (D1/Postgres + @nai/auth)
5. Founder Architecture Amendment: adapter is NOT source of truth

**Gen2 is used as REFERENCE ONLY:**
- Package naming patterns (adopted)
- Feature scope (adopted)
- API endpoint patterns (adapted, not copied)
- Security lessons (CORS `*` → NAI uses strict CORS)

---

## 6. P1-B.0 Conclusion

| Check | Result |
|-------|--------|
| Gen2 repo accessible | ✅ Yes |
| Gen2 package inventory complete | ✅ 41 packages mapped |
| Gen2 known issues documented | ✅ CORS `*`, SQLi, brand mismatch |
| Compatibility contract defined | ✅ Auth, data, gateway rules |
| Migration decision | ✅ NO MIGRATION — reference only |
| NAI equivalent packages | ✅ All P1-A done, P1-B/C/D/E building |

**P1-B.0 PASSED — Gen2 pre-integration audit complete. No migration needed. NAI builds independently.**
