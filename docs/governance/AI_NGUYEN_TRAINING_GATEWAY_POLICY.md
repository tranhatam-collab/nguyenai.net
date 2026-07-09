# AI Nguyễn Training Gateway Policy

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `NO_DIRECT_MODEL_CALL_POLICY.md`, `OUTPUT_GUARD_POLICY.md`, `MODEL_PROVIDER_ABSTRACTION_POLICY.md`
- **Implementation:** `packages/@nai/training-gateway/src/index.ts`

---

## 1. Purpose

Lock the architectural contract that **every** user-facing model invocation must pass through the AI Nguyễn Training Gateway. No provider response reaches the user without passing through this gateway. This is the single chokepoint for identity, language, safety, data classification, agent role, model routing, output guard, and receipt creation.

---

## 2. The 8-step gateway pipeline

Every invocation (`/v1/chat`, `/v1/stream`, `/v1/ai-nguyen/invoke`) must execute these steps in order:

| Step | Action | Package | Bypass allowed? |
|------|--------|---------|-----------------|
| 1 | Language detection | `@nai/training-gateway` | No |
| 2 | Agent role selection | `@nai/training-gateway` | No |
| 3 | Input policy check (identity, language, safety, data) | `@nai/model-policy` | No |
| 4 | Prepare chat request with metadata | `@nai/training-gateway` | No |
| 5 | Call provider via prism (model routing + tier check) | `@nai/prism` | No |
| 6 | Create invocation + receipt BEFORE output guard | `@nai/model-gateway` | No |
| 7 | Output guard (identity, language, safety, data) | `@nai/output-guard` | No |
| 8 | Return final content + receipt_id | `@nai/training-gateway` | No |

### 2.1 Short-circuit returns

The gateway may short-circuit at steps 3 and 5:

- **Step 3 fail (input policy):** Return error message in detected language. `receipt_id = ''`, `guard_action = 'block'`. Log `input_policy_blocked` audit event.
- **Step 5 fail (tier not allowed):** Return error message with tier reason. `receipt_id = ''`, `guard_action = 'block'`. Log `tier_not_allowed` audit event.

Short-circuit returns must **not** call the provider. No token cost is incurred.

---

## 3. Language detection

- Input language is detected from message content using Vietnamese diacritic markers and common word heuristics.
- Detected language: `vi`, `en`, or `other`.
- Caller may override with `req.language`.
- Detected language is passed to input policy, output guard, and receipt metadata.

### 3.1 Vietnamese-first rule

When `lang="vi"` (Vietnamese UI context), the gateway must:
- Respond in Vietnamese when input is Vietnamese.
- Respond in English when input is English (do not force Vietnamese).
- Never mix languages in a single response unless the user explicitly requests translation.

---

## 4. Agent role selection

The gateway selects an agent role based on `task_hint`:

| task_hint contains | Agent role |
|---|---|
| code, technical, program | Nguyễn Kỹ Thuật |
| research, study, investigate | Nguyễn Nghiên Cứu |
| write, content, edit | Nguyễn Biên Tập |
| plan, strategy, roadmap | Nguyễn Chiến Lược |
| family, genealogy, roots | Nguyễn Gia Phả |
| invest, finance, stock | Nguyễn Đầu Tư |
| edu, teach, scholarship | Nguyễn Giáo Dục |
| verify, fact, check | Nguyễn Kiểm Chứng |
| (default) | Nguyễn Điều Phối |

Agent role is metadata only — it does not override model routing. Model routing is handled by `@nai/prism` based on `model` field and `user_tier`.

---

## 5. Data classification

Default data classification: `public`.

Caller may override with `req.data_classification`:
- `public` — no restrictions
- `internal` — agent access only, no cross-tenant
- `confidential` — encryption at rest, no agent access without consent
- `restricted` — living-person data, family trees, private documents

Classification is passed to input policy, output guard, and receipt metadata.

---

## 6. Receipt creation

Every successful provider call must create a receipt via `@nai/model-gateway.invokeModel()`:

- Receipt is created **before** output guard runs.
- Receipt contains: invocation ID, user ID, tenant ID, session ID, provider, model, token usage, cost, data classification.
- `receipt_id` is returned to the caller in every successful response.
- If output guard blocks, the receipt still exists (the invocation happened, the guard blocked the output).

### 6.1 Cost tracking

Current implementation: `costUsd = 0` (placeholder).

Phase 2 requirement: compute cost from `model.inputCostPer1M` and `model.outputCostPer1M` using actual token counts from `result.usage`.

---

## 7. Audit events

The gateway logs these governance audit events via `@nai/audit`:

| Event | When | Category |
|-------|------|----------|
| `input_policy_blocked` | Step 3 fail | `training_gateway` |
| `tier_not_allowed` | Step 5 fail | `training_gateway` |
| `invoke_complete` | Step 8 success | `training_gateway` |

Audit events contain: `user_id`, `tenant_id`, `target`, `details` (model, provider, agent_role, guard_action, guard_reason, total_tokens).

---

## 8. API surface

### 8.1 `invokeThroughTrainingGateway(req: TrainingGatewayRequest): Promise<TrainingGatewayResponse>`

Single entry point. Used by:
- `POST /v1/chat`
- `POST /v1/stream` (wrapped in SSE)
- `POST /v1/ai-nguyen/invoke`

### 8.2 Request fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `tenant_id` | string | Yes | — |
| `user_id` | string | Yes | — |
| `plan_id` | string | Yes | — |
| `session_id` | string \| null | No | null |
| `model` | string | Yes | — |
| `messages` | array | Yes | — |
| `max_tokens` | number | No | provider default |
| `temperature` | number | No | provider default |
| `task_hint` | string | No | — |
| `user_tier` | string | Yes | — |
| `data_classification` | DataClassification | No | `public` |
| `language` | Language | No | auto-detect |

### 8.3 Response fields

| Field | Type | Notes |
|-------|------|-------|
| `content` | string | Final content after output guard |
| `finish_reason` | `'stop' \| 'length' \| 'tool_call' \| 'error'` | — |
| `usage` | `{ prompt_tokens, completion_tokens, total_tokens }` | — |
| `model` | string | Actual model used (may differ from requested) |
| `receipt_id` | string | Empty on short-circuit |
| `tier_allowed` | boolean | — |
| `tier_reason` | string \| null | — |
| `guard_action` | `'allow' \| 'block' \| 'modify'` | — |
| `guard_reason` | string \| undefined | — |

### 8.4 Hidden fields

`served_by` (provider name) is **not** returned to the caller. It is logged in audit events only. This prevents provider fingerprinting by end users.

---

## 9. Streaming

Current implementation: `/v1/stream` wraps non-streaming response in SSE format.

Phase 3 requirement: true streaming via provider streaming API, with output guard applied per-chunk. The gateway must buffer the final chunk for receipt creation and guard verification.

---

## 10. Violations

Any code path that calls a provider directly (bypassing `invokeThroughTrainingGateway`) is a **critical violation** of this policy. CI gate: `tools/audit-independence.sh` checks that `/v1/chat` does not call `proxyToGen1` directly.

Future CI gate (Phase 10): grep for direct `fetch()` calls to provider URLs outside of `@nai/prism` and `@nai/model-gateway`.

---

## 11. Amendment

This policy may only be amended by Founder decision. Any change to the 8-step pipeline, short-circuit behavior, or receipt creation requires a new Founder decision logged in `GOVERNANCE_DECISION_LOG.md`.
