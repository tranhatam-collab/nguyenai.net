# No Direct Model Call Policy

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`, `MODEL_PROVIDER_ABSTRACTION_POLICY.md`
- **CI gate:** `tools/audit-independence.sh` (partial), Phase 10 grep audit (full)

---

## 1. Purpose

Lock the rule that **no** application code, API route, frontend component, or package outside of `@nai/prism` and `@nai/model-gateway` may call an LLM provider directly. All model invocations must go through `invokeThroughTrainingGateway()` in `@nai/training-gateway`.

---

## 2. The rule

```
┌─────────────────────────────────────────────────────────────┐
│  ALLOWED: only @nai/training-gateway → @nai/prism →         │
│  @nai/model-gateway → provider adapters                     │
├─────────────────────────────────────────────────────────────┤
│  FORBIDDEN: any other code path calling a provider          │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Allowed call paths

| Caller | Callee | Via |
|--------|--------|-----|
| API route (`/v1/chat`, `/v1/stream`, `/v1/ai-nguyen/invoke`) | `@nai/training-gateway` | `invokeThroughTrainingGateway()` |
| `@nai/training-gateway` | `@nai/prism` | `prismChat()` |
| `@nai/training-gateway` | `@nai/model-gateway` | `invokeModel()` |
| `@nai/training-gateway` | `@nai/output-guard` | `guardOutput()` |
| `@nai/training-gateway` | `@nai/model-policy` | `checkAllPolicies()` |
| `@nai/prism` | `@nai/model-gateway` | internal dispatch |
| `@nai/model-gateway` | Provider adapter | `adapter.chat()` |

### 2.2 Forbidden call paths

| Caller | Callee | Severity |
|--------|--------|----------|
| API route | Provider SDK (`openai`, `@anthropic-ai/sdk`) | Critical |
| API route | `fetch()` to provider URL | Critical |
| Frontend component | Any LLM provider | Critical |
| `@nai/training-gateway` | Provider SDK directly (bypassing prism) | Critical |
| Any package outside prism/model-gateway | Provider adapter | Critical |
| API route | `@nai/prism` directly (bypassing training-gateway) | High |

---

## 3. What counts as a "direct model call"

A direct model call is any of:

1. `import OpenAI from 'openai'` (or any provider SDK) outside of provider adapters
2. `fetch('https://api.openai.com/v1/chat/completions', ...)` outside of provider adapters
3. `import { chat } from '@nai/prism'` in an API route (must use training-gateway instead)
4. `import { invokeModel } from '@nai/model-gateway'` in an API route (must use training-gateway instead)
5. Any code that constructs a provider-specific request payload outside of provider adapters

---

## 4. Exceptions

### 4.1 Health check

`@nai/model-gateway` may call provider adapters directly for health checks (`adapter.healthCheck()`). This does not go through the training gateway because:
- No user context (no user_id, tenant_id)
- No content to guard
- No receipt needed
- Purpose is infrastructure monitoring, not user-facing invocation

### 4.2 Admin tools

Admin tools (Phase 2, `apps/admin`) may call `@nai/prism` directly for:
- Model registry management (add/remove models)
- Prompt template management (add/remove versions)
- Health check dashboard

Admin tools must NOT call provider SDKs directly — they go through prism/model-gateway.

### 4.3 Test utilities

Test utilities (`@nai/test-llm`, `@nai/test-prompt`) may call providers directly for:
- Evaluating model quality (eval harness)
- Prompt testing (A/B testing)
- Load testing

Test utilities must NOT be used in production code paths.

---

## 5. CI enforcement

### 5.1 Current enforcement (Phase 0)

`tools/audit-independence.sh` checks:
- `/v1/chat` does not call `proxyToGen1` directly
- `LEGACY_BRIDGE_ENABLED` is not `true`
- `GEN1_GATEWAY_URL` not in `wrangler.jsonc` vars

### 5.2 Phase 10 enforcement (full)

A new audit script `tools/audit-no-direct-model-call.sh` will:

1. Grep all `.ts` files in `apps/` for provider SDK imports:
   ```bash
   grep -rn "from 'openai'\|from '@anthropic-ai/sdk'\|from '@google/generative-ai'" apps/
   ```
   Expected: 0 matches outside of `packages/@nai/model-gateway/src/adapters/`

2. Grep all `.ts` files in `apps/` for `fetch()` to known provider URLs:
   ```bash
   grep -rn "api.openai.com\|api.anthropic.com\|generativelanguage.googleapis.com" apps/
   ```
   Expected: 0 matches

3. Grep API routes for direct prism/model-gateway imports:
   ```bash
   grep -rn "from '@nai/prism'\|from '@nai/model-gateway'" apps/api/src/routes/
   ```
   Expected: 0 matches (routes should import from `@nai/training-gateway` only)

4. Grep frontend for any model calls:
   ```bash
   grep -rn "from '@nai/prism'\|from '@nai/model-gateway'\|from '@nai/training-gateway'" apps/web/ apps/console/ apps/edu/ apps/invest/
   ```
   Expected: 0 matches (frontend calls API, not packages directly)

---

## 6. Why this matters

### 6.1 Security

Direct provider calls bypass:
- Input policy check (identity, language, safety, data classification)
- Output guard (identity, language, safety, data classification)
- Receipt creation (no audit trail)
- Tier gating (free users could access pro models)
- Rate limiting (no quota enforcement)

### 6.2 Cost control

Direct provider calls have no:
- Cost tracking (no receipt)
- Tier-based model selection (could use expensive models for free users)
- Fallback routing (no graceful degradation)

### 6.3 Independence

Direct provider calls create vendor lock-in:
- Switching providers requires changing application code
- Provider-specific request formats leak into business logic
- No abstraction layer for multi-provider routing

---

## 7. Violations

| Violation | Severity | Action |
|-----------|----------|--------|
| First offense (unintentional) | Critical | Code review rejection, fix required |
| Repeated offense | Critical | Build blocked by CI gate |
| Production bypass | Critical | Incident logged, post-hoc review |

---

## 8. Amendment

This policy has zero exceptions for production code. Any proposed exception requires Founder approval and must be documented as a named exception in this file with:
- Exception name
- Reason
- Scope (which code path)
- Expiry date (if applicable)
- Security review sign-off
