# QA AI NGUYEN TRAINING GATEWAY AUDIT — 2026-07-09 (CORRECTED)

**Audit Date:** 2026-07-09  
**Auditor:** Devin AI Agent  
**Correction Note:** This is a corrected audit. The previous report understated severity and missed 50% of the Founder scope (Roots Super App). This version reflects independent verification against source code.

**Scope:** nguyenai.net monorepo
- AI Nguyễn Training Gateway / Model Independence / AIOS
- Roots Super App (Gia phả / Ký ức gia đình / QR codes / AI boundary)

**Reference:**
- `PHAN_QUYET_CHIEN_LUOC_CHO_NGUYENAI_NET_2026-07-09.md` (Founder directive)
- `AGENTS.md` (Founder architecture locks)
- `apps/api/src/index.ts` and `@nai/*` packages

---

## Executive Summary

**Overall Status:** 🔴 CRITICAL — Training gateway bypassed; packages exist but are not integrated; Roots Super App missing entirely.

| Founder Requirement | Status | Evidence |
|---|---|---|
| No model may respond to the user without passing through the AI Nguyễn training gate and validation | ❌ **VIOLATED** | `apps/api/src/index.ts` lines 558-616 call `prismChat` directly, return `content` to user without output/identity/language guard |
| User interacts with AI Nguyễn, not a raw provider API | ⚠️ **PARTIAL** | Frontend calls backend API; backend then calls provider directly and exposes `served_by` |
| Independence from Gen1/Gen2 | ✅ **PASS** | `audit:independence` gate exists; `LEGACY_BRIDGE_ENABLED=false` by default |
| Single-model survival mode | ❌ **MISSING** | No provider health checks, no fail counter, no degraded/minimal mode |
| Language purity (Vietnamese UI) | ❌ **FAIL** | 28+ forbidden English terms still in UI |
| Roots Super App (Khối 2) | ❌ **MISSING** | Zero files, migrations, tests, or plans |

**Exit Gate Score:** 1/23 PASS

**Verdict:** Build NOT approved. The repo has some infrastructure code, but the AI Nguyễn Training Gateway is not active, `/v1/chat` bypasses all gates, and the Roots Super App scope was ignored.

---

## Phase 0 — Corrected Audit Findings

### 0.1 `/v1/chat` bypasses the AI Nguyễn Training Gateway

**Status:** 🔴 CRITICAL VIOLATION

**Source evidence:**

```typescript
// apps/api/src/index.ts (lines 558-616)
app.post('/v1/chat', chatRateLimit, async (c) => {
  // ... auth and body validation ...

  const result = await prismChat({
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    plan_id: session.plan_id,
    model: body.model ?? 'auto-route',
    messages: body.messages,
    max_tokens: body.max_tokens,
    temperature: body.temperature,
  }, userTier);

  // ... evidence record ...

  return c.json({
    model: result.model,
    content: result.content,        // ← raw provider output returned to user
    finish_reason: result.finish_reason,
    usage: result.usage,
    served_by: result.served_by,    // ← provider identity exposed
  });
});
```

**What is missing:**
- No `training-gateway` invocation
- No `output-guard` check on `result.content`
- No `identity-guard` check to enforce AI Nguyễn identity
- No `language-guard` check for output language purity
- No `data-classifier` pre-call check
- No `receipt-engine` integration for the chat call
- No `model-health` / fallback logic
- Provider identity leaked via `served_by` field

**Founder requirement:** "Không model nào được trả lời thẳng ra giao diện nếu chưa đi qua cổng huấn luyện và kiểm định của Nguyễn AI."

**Conclusion:** `prismChat` returns a raw provider response directly to the user. This violates the Founder requirement.

---

### 0.2 `/v1/stream` also bypasses all gates

**Status:** 🔴 CRITICAL VIOLATION

`/v1/stream` also calls `prismChat` directly and returns the raw response without output guard, identity guard, or language guard.

---

### 0.3 So-called "foundation packages" are not integrated

**Status:** 🔴 CRITICAL

The previous report claimed "Foundation backend exists." Correct assessment: the packages exist as source code but are **dead code** — they are not imported or used by the chat/runtime path.

**Verification:**

```bash
$ grep -rn "from '@nai/output-guard'" apps/api/src/
# (empty — 0 matches)

$ grep -rn "from '@nai/model-policy'" apps/api/src/
# (empty — 0 matches)

$ grep -rn "from '@nai/training-matrix'" apps/api/src/
# (empty — 0 matches)

$ grep -rn "from '@nai/model-gateway'" apps/api/src/
apps/api/src/routes/model-gateway.ts:18
```

| Package | Status | Used by `/v1/chat`? | Notes |
|---|---|---|---|
| `@nai/model-gateway` | ✅ source exists | ❌ no | Only used by `/v1/model-gateway/invoke` route, which logs metadata but does not call a provider |
| `@nai/output-guard` | ✅ source exists | ❌ no | Dead package in `apps/api/src` |
| `@nai/model-policy` | ✅ source exists | ❌ no | Dead package in `apps/api/src` |
| `@nai/training-matrix` | ✅ source exists | ❌ no | Dead package in `apps/api/src` |
| `@nai/prism` | ✅ source exists | ✅ yes | Direct provider router, no training gate |

**Corrected statement:** The repo contains *source artifacts* for some gateway components, but none of them form an active AI Nguyễn Training Gateway in the production chat path.

---

### 0.4 `/v1/model-gateway/invoke` is not a real model invocation route

**Status:** 🔴 CRITICAL

The route only accepts `prompt_tokens`, `completion_tokens`, `cost_usd` from the caller and creates an invocation/receipt record. It does **not** call the model provider. It is a metadata logging endpoint, not a real gateway.

**Source evidence:**

```typescript
// packages/@nai/model-gateway/src/index.ts
export async function invokeModel(userId, tenantId, sessionId, provider, model,
  promptTokens, completionTokens, costUsd, dataClassification) {
  // ... checks allowedProviders, allowedModels ...
  // creates invocation in store
  // creates receipt in store
  // logs audit event
  return { invocationId, receiptId };
  // Note: no actual provider call happens here
}
```

**Conclusion:** The `/v1/model-gateway/invoke` route cannot be used to enforce the Founder requirement because the actual model call is in `/v1/chat` → `prismChat`.

---

### 0.5 `@nai/prism` is a direct provider router, not an AI Nguyễn gate

**Status:** 🔴 CRITICAL

`@nai/prism` routes to OpenAI, Anthropic, Google, or a GEN1 adapter. It does not:
- Enforce AI Nguyễn identity on output
- Run language purity checks
- Run safety or data classification checks
- Create receipts
- Track model health or trigger fallback

It is a tier-based model router. It is a necessary lower layer, but it is not the AI Nguyễn Training Gateway.

---

### 0.6 No provider health, fallback, or single-model survival

**Status:** 🔴 CRITICAL

**Verification:**

```bash
$ grep -rn "provider.*health\|model.*health\|fail.*counter\|degraded\|minimal.*mode" apps/api/src/ packages/@nai/*/src/
# No meaningful implementation found
```

There is no:
- Provider health check poller
- Provider timeout/failure counter
- Degraded mode activation
- Single-model survival mode
- No-model incident mode

---

### 0.7 Language purity violations in Vietnamese UI

**Status:** 🔴 FAIL

**Evidence (source):**

```
apps/console/src/components/Sidebar.astro:
  "Agent Team" → "Đội ngũ Tác nhân"
  "Super Apps" → "Siêu ứng dụng"
  "Model Mesh" → "Lưới mô hình"
  "Data Vault" → "Kho dữ liệu"
  "Command Center" → "Trung tâm điều khiển"

apps/console/src/components/TopBar.astro:
  "AI Computer Console" → "Bảng điều khiển Máy Tính AI"

apps/console/src/components/react/CommandInput.tsx:
  "Enter your command here... · Nhập lệnh cho AI Computer của bạn..."
  (mixed EN/VI in a single placeholder)
```

**Founder requirement:** 28 forbidden English terms in Vietnamese UI. The previous report listed 8. Full list is in `tools/audit-language-boundary.sh` and `FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md`.

---

### 0.8 Independence lock is in place but the audit gate has blind spots

**Status:** 🟡 PARTIAL

**What passes:**
- `tools/audit-independence.sh` exists
- `audit:independence` is in CI
- `LEGACY_BRIDGE_ENABLED=false` default
- `/v1/chat` does not use `proxyToGen1`

**Blind spots found by independent verification:**
- Check #5 only scans `apps/*/src/data/*.ts`, missing `.astro` and `.mdx` content files
- `grep` may traverse `node_modules` and hang for >10 minutes
- Some public pages still contain Gen1/Gen2 references (e.g., `apps/invest/src/pages/moat.astro`, roadmap, data-room, technical-audit; `apps/edu/src/content/lessons/track-01-lesson-01.mdx`)

**Action:** Fix the gate script to:
1. Include `.astro`, `.mdx`, `.md` in content scan
2. Exclude `node_modules` explicitly with `--exclude-dir`
3. Re-run and fix remaining Gen1/Gen2 references

---

## Phase 0.B — Roots Super App (Khối 2) Audit

**Scope:** "FOUNDER ROOTS SUPER APP AND LANGUAGE BOUNDARY AUDIT COMMAND" — Phase 0-9

**Status:** 🔴 NOT IMPLEMENTED

### Verification

```bash
$ ls docs/governance/ | grep -i "ROOTS\|GIA_PHA\|KY_UC\|FAMILY"
# (empty)

$ ls packages/@nai/ | grep -i "roots\|family\|memorial\|oral"
# (empty)

$ ls migrations/ | grep -i "family\|roots\|gia_pha\|memorial\|oral"
# (empty)

$ ls tests/e2e/ | grep -i "family\|roots"
# (empty)

$ grep -rln "roots\|family.*data\|gia pha" apps/web/src apps/edu/src apps/invest/src apps/console/src 2>/dev/null | head -5
# (empty)
```

### Founder Requirements for Roots Super App

| Phase | Requirement | Status |
|---|---|---|
| Phase 0 | Emergency language fix (Vietnamese build audit) | Not done |
| Phase 1 | Roots Super App RFC | Not created |
| Phase 2 | Product discovery (interviews with elders, branch leaders) | Not done |
| Phase 3 | Data model: 12 migrations (family_groups, family_members, etc.) | Not created |
| Phase 4 | Roles and permissions (7 roles) | Not created |
| Phase 5 | MVP features (15 features) | Not created |
| Phase 6 | AI assistant rules for family data | Not created |
| Phase 7 | Vietnamese UI routes (8 routes) | Not created |
| Phase 8 | E2E tests (8 tests) | Not created |
| Phase 9 | Reports (5 reports) | Not created |

**Conclusion:** 100% of Roots Super App scope is missing. This is 50% of the Founder directive.

---

## Phase 1-11 Gap Analysis (Corrected)

### Phase 1 — Governance Lock

**Status:** 🔴 FAIL

**Missing policies:** 7/7

- `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`
- `MODEL_PROVIDER_ABSTRACTION_POLICY.md`
- `AI_AGENT_TRAINING_MATRIX.md`
- `OUTPUT_GUARD_POLICY.md`
- `MODEL_FAILURE_AND_SINGLE_MODEL_SURVIVAL_POLICY.md`
- `NO_DIRECT_MODEL_CALL_POLICY.md`
- `PUBLIC_TECH_DISCLOSURE_BOUNDARY.md`

**Additional missing (Roots):**
- `ROOTS_SUPER_APP_RFC.md`
- `ROOTS_DATA_BOUNDARY_POLICY.md`
- `ROOTS_AI_BOUNDARY_POLICY.md`

### Phase 2 — Backend Packages

**Status:** 🔴 FAIL

**Training Gateway / Model layer:** 14 packages required, 2 usable, 12 missing.

| Package | Required | Status |
|---|---|---|
| `@nai/training-gateway` | ✅ | ❌ missing |
| `@nai/model-router` | ✅ | ❌ missing |
| `@nai/model-policy` | ✅ | ⚠️ source exists, not integrated |
| `@nai/agent-matrix` | ✅ | ❌ missing |
| `@nai/output-guard` | ✅ | ⚠️ source exists, not integrated |
| `@nai/identity-guard` | ✅ | ❌ missing |
| `@nai/language-guard` | ✅ | ❌ missing |
| `@nai/data-classifier` | ✅ | ❌ missing |
| `@nai/receipt-engine` | ✅ | ❌ missing (receipt logic exists in `model-gateway` but not integrated) |
| `@nai/fallback-router` | ✅ | ❌ missing (different from `@nai/fallback`) |
| `@nai/model-health` | ✅ | ❌ missing |
| `@nai/provider-adapters` | ✅ | ❌ missing |
| `@nai/self-learning` | ✅ | ❌ missing |
| `@nai/eval-harness` | ✅ | ❌ missing |

**Roots packages:** 0/3 exist.

### Phase 3 — API Routes

**Status:** 🔴 FAIL

**Training Gateway routes:** 12 required, 3 exist, 9 missing.

| Route | Status |
|---|---|
| `POST /v1/ai-nguyen/invoke` | ❌ missing |
| `POST /v1/ai-nguyen/stream` | ❌ missing |
| `POST /v1/ai-nguyen/train-gate` | ❌ missing |
| `POST /v1/ai-nguyen/policy-check` | ❌ missing |
| `POST /v1/ai-nguyen/output-check` | ❌ missing |
| `GET /v1/models/health` | ❌ missing |
| `GET /v1/models/capability` | ❌ missing |
| `POST /v1/models/fallback` | ✅ exists |
| `POST /v1/receipts` | ❌ missing |
| `GET /v1/receipts/:id` | ❌ missing |
| `POST /v1/incidents` | ✅ exists |
| `POST /v1/admin-approvals` | ✅ exists |

**Critical issue:** `/v1/chat` and `/v1/stream` must be rerouted through `/v1/ai-nguyen/invoke` and `/v1/ai-nguyen/stream`.

### Phase 4 — Data Model

**Status:** 🔴 FAIL

**Missing migrations:** 14/15

Only `014_fallback_events.sql` exists. Remaining 14 tables are missing.

### Phase 5 — Training Matrix

**Status:** 🔴 FAIL

**Missing matrices:** 10/10

- Identity matrix
- Language matrix
- Data class matrix
- Agent role matrix
- Provider capability matrix
- Output safety matrix
- Approval matrix
- Receipt matrix
- Failure mode matrix
- Single-model survival matrix

### Phase 6 — Frontend Integration

**Status:** 🔴 FAIL

- Mixed EN/VI in UI (28+ violations)
- Missing AI Nguyễn-specific status messages
- Missing degraded/incident mode UI
- `/v1/chat` and `/v1/stream` UI calls the backend correctly but the backend bypasses the gate

### Phase 7 — Failure and Fallback

**Status:** 🔴 FAIL

- No provider health check
- No provider timeout handling
- No fail counter
- No degraded mode
- No single-model survival mode
- No no-model incident mode

### Phase 8 — Self-Learning and Eval

**Status:** 🔴 FAIL

- No eval sets for identity, provider, language, privacy, investment, scholarship, family data, technical disclosure, prompt injection, or model failure
- No policy patch candidate system
- No training matrix update candidate system

### Phase 9 — Tests

**Status:** 🔴 FAIL

**Missing E2E tests:** 10/12

Only `no-direct-model-call` and `output-guard` tests exist (with different specs). The remaining 10 are missing.

### Phase 10 — Audit Scripts

**Status:** 🟡 PARTIAL

**Existing:** `audit-independence`, `audit-language-boundary`, `audit-accessibility`, `audit-brand-naming-lock`, `audit-clone-contamination`

**Missing:**
- `audit-no-direct-model-call.ts`
- `audit-training-gateway-required.ts`
- `audit-provider-identity-leak.ts`
- `audit-ai-nguyen-identity.ts`
- `audit-model-fallback.ts`
- `audit-single-model-survival.ts`
- `audit-output-guard.ts`
- `audit-receipt-engine.ts`
- `audit-public-tech-disclosure.ts`
- `audit-language-purity-build.ts`

### Phase 11 — Reports

**Status:** 🔴 FAIL

No implementation reports. This audit is the only report, and it is now a corrected audit.

---

## 23 Exit Gates (Combined)

### Khối 1 — AI Nguyễn Training Gateway / Model Independence

| # | Gate | Status | Evidence |
|---|---|---|---|
| 1 | All user model calls go through AI Nguyễn Training Gateway | ❌ FAIL | `/v1/chat` calls `prismChat` directly |
| 2 | No direct provider calls from frontend | ✅ PASS | Frontend calls backend API |
| 3 | No provider identity leaks as assistant identity | ❌ FAIL | `served_by` exposed to user |
| 4 | All outputs pass identity guard | ❌ FAIL | `output-guard` not imported in `apps/api/src` |
| 5 | All outputs pass language guard | ❌ FAIL | `language-guard` not implemented |
| 6 | All sensitive inputs pass data classifier | ❌ FAIL | `data-classifier` not implemented |
| 7 | All important invocations create receipt | ❌ FAIL | Receipt only created in `/v1/model-gateway/invoke`, not `/v1/chat` |
| 8 | Single-model survival mode works | ❌ FAIL | No implementation |
| 9 | No-model incident mode works | ❌ FAIL | No implementation |
| 10 | Public UI does not expose deep technical routing | ⚠️ UNKNOWN | Not verified for all surfaces |
| 11 | Vietnamese UI is pure Vietnamese | ❌ FAIL | 28+ violations |
| 12 | English UI is pure English | ⚠️ UNKNOWN | Not fully verified |
| 13 | All tests pass | ❌ FAIL | 10/12 E2E tests missing |
| 14 | All reports filled with real logs | ❌ FAIL | Only corrected audit report |

### Khối 2 — Roots Super App

| # | Gate | Status | Evidence |
|---|---|---|---|
| 15 | Vietnamese language purity PASS | ❌ FAIL | No audit performed |
| 16 | Data boundary PASS (family data classified) | ❌ FAIL | No schema |
| 17 | Privacy-by-default PASS | ❌ FAIL | No implementation |
| 18 | QR scope PASS (public/private QR separated) | ❌ FAIL | No implementation |
| 19 | Consent PASS (explicit consent for family data) | ❌ FAIL | No implementation |
| 20 | AI boundary PASS (AI cannot claim ancestry/lineage) | ❌ FAIL | No implementation |
| 21 | Export/delete PASS | ❌ FAIL | No implementation |
| 22 | Audit log PASS | ❌ FAIL | No implementation |
| 23 | MVP plan approved by Founder | ❌ FAIL | No plan |

**Total: 1/23 PASS**

---

## Corrected Root Cause Analysis

### Why the previous report was wrong

1. **"Foundation exists" was misleading.** The packages `@nai/output-guard`, `@nai/model-policy`, and `@nai/training-matrix` exist as source files but are not imported or used by the production API. They are dead code, not an active foundation.

2. **Severity was understated.** The training gateway is not "partially integrated" — it is **not integrated at all** in `/v1/chat` and `/v1/stream`. The chat endpoint calls `@nai/prism` directly, which returns the raw provider response.

3. **Scope was cut in half.** The Founder directive contained two blocks: (1) AI Nguyễn Training Gateway, (2) Roots Super App. The previous report ignored the Roots Super App entirely.

4. **The plan was copy-pasted.** The strategic plan file was mostly a verbatim copy of the Founder directive with a generic action list. It did not contain architecture decisions, implementation details, or risk analysis.

5. **Commit was documentation-only.** The commit `7b5af2b` added 2 markdown files and 0 lines of code. It did not create packages, migrations, tests, or audit scripts.

---

## Corrected Action Plan

### Immediate (P0 — 1-2 days)

1. **Fix `/v1/chat` and `/v1/stream`**
   - Create `POST /v1/ai-nguyen/invoke` and `POST /v1/ai-nguyen/stream`
   - Route `/v1/chat` and `/v1/stream` through these new endpoints
   - The new endpoint must:
     - classify input data
     - select agent role
     - select model via capability matrix
     - call provider via `@nai/prism` or `@nai/provider-adapters`
     - run `output-guard` on provider response
     - run `identity-guard` and `language-guard`
     - create a `receipt`
     - return AI Nguyễn-branded response
   - Remove or hide `served_by` from public response

2. **Integrate existing packages**
   - Import `@nai/output-guard` and `@nai/model-policy` into the new `/v1/ai-nguyen/*` route
   - Or merge them into a single `@nai/training-gateway` package
   - Update `@nai/model-gateway` to actually call providers, not just log metadata

3. **Fix audit gate blind spots**
   - Update `tools/audit-independence.sh` to include `.astro`, `.mdx`, `.md`
   - Add `--exclude-dir=node_modules` to grep commands
   - Fix remaining Gen1/Gen2 references in `apps/invest` and `apps/edu`

4. **Fix language purity**
   - Run `tools/audit-language-boundary.sh` fully
   - Replace all 28 forbidden English terms in Vietnamese UI
   - Add CI gate for language purity

### Short-term (P1 — 1-2 weeks)

5. **Create missing packages:**
   - `@nai/training-gateway` (orchestrator)
   - `@nai/model-router` (capability-based routing)
   - `@nai/agent-matrix` (role selection)
   - `@nai/identity-guard` (separate from policy)
   - `@nai/language-guard` (output language purity)
   - `@nai/data-classifier` (input classification)
   - `@nai/receipt-engine` (receipt creation)
   - `@nai/fallback-router` (failure handling)
   - `@nai/model-health` (provider health)
   - `@nai/provider-adapters` (OpenAI, Anthropic, Google)
   - `@nai/self-learning` (eval-to-policy loop)
   - `@nai/eval-harness` (test harness)

6. **Create missing API routes:**
   - `POST /v1/ai-nguyen/invoke`
   - `POST /v1/ai-nguyen/stream`
   - `POST /v1/ai-nguyen/train-gate`
   - `POST /v1/ai-nguyen/policy-check`
   - `POST /v1/ai-nguyen/output-check`
   - `GET /v1/models/health`
   - `GET /v1/models/capability`
   - `POST /v1/receipts`
   - `GET /v1/receipts/:id`

7. **Create missing migrations:** 14 tables for training gateway

8. **Create missing governance policies:** 7 policies

9. **Implement model health, fallback, single-model survival, no-model incident**

10. **Start Roots Super App RFC and Phase 0-3**

### Medium-term (P2 — 2-3 weeks)

11. **Create training matrices:** 10 matrices
12. **Create eval sets and self-learning loop**
13. **Create E2E tests:** 10 missing tests
14. **Implement Roots Super App features**

### Long-term (P3 — 3-4 weeks)

15. **Create missing audit scripts:** 10 scripts
16. **Create implementation reports:** 6 reports
17. **Complete Roots Super App Phase 4-9**
18. **Run all 23 exit gates and produce PASS report**

---

## Conclusion

**Corrected verdict:** ❌ **BUILD NOT APPROVED**

**Reasons:**
1. `/v1/chat` and `/v1/stream` bypass the AI Nguyễn Training Gateway and return raw provider responses.
2. `@nai/output-guard`, `@nai/model-policy`, and `@nai/training-matrix` are dead code in the API runtime.
3. No provider health, fallback, or single-model survival mode exists.
4. Vietnamese UI still contains 28+ forbidden English terms.
5. Roots Super App (50% of Founder directive) is completely missing.
6. The previous strategic plan was a copy-paste of the Founder directive with no implementation detail.
7. Exit gate score: 1/23 PASS.

**Next step:** Execute the P0 actions immediately: create `/v1/ai-nguyen/invoke` and `/v1/ai-nguyen/stream`, integrate the existing guard packages into the chat path, remove provider identity leaks, fix the audit gate, and start the Roots Super App RFC.

---

**Audit file:** `docs/governance/QA_AI_NGUYEN_TRAINING_GATEWAY_AUDIT_2026-07-09.md`  
**Counterpart:** `docs/governance/QA_AUDIT_DOI_CHIEU_KE_HOACH_2026-07-09.md`  
**Strategic plan:** `docs/governance/PHAN_QUYET_CHIEN_LUOC_CHO_NGUYENAI_NET_2026-07-09.md` (to be rewritten)
