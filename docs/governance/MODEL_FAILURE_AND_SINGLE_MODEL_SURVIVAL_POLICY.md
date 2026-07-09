# Model Failure and Single Model Survival Policy

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `MODEL_PROVIDER_ABSTRACTION_POLICY.md`, `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`
- **Implementation:** `packages/@nai/fallback/src/`, `packages/@nai/incident/src/`

---

## 1. Purpose

Lock the contract for what happens when a model provider fails, is degraded, or is unavailable. The system must survive the loss of any single provider without user-visible outage. No single provider is a single point of failure.

---

## 2. Failure scenarios

| Scenario | Detection | Response |
|----------|-----------|----------|
| Provider API timeout (>30s) | Timeout in adapter | Retry once, then fallback |
| Provider API 5xx error | HTTP status | Fallback immediately |
| Provider API 429 (rate limit) | HTTP status | Fallback + log incident |
| Provider API auth failure (401/403) | HTTP status | Fallback + alert admin |
| Provider response malformed | JSON parse fail | Fallback immediately |
| Provider response empty | Empty content | Fallback immediately |
| Provider response violates guard | Output guard block | No fallback (guard decision is final) |
| All providers failed | Exhausted fallback list | Return graceful degradation message |

---

## 3. Fallback chain

### 3.1 Per-tier fallback

| Requested tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|----------------|---------|------------|------------|------------|
| free | Llama-3.1-8B | GPT-4o-mini | Mock | — |
| standard | GPT-4o | Gemini-1.5-Pro | Claude-3.5-Sonnet | GPT-4o-mini |
| pro | Claude-3.5-Sonnet | GPT-4o | Gemini-1.5-Pro | GPT-4o-mini |
| business | Claude-3.5-Sonnet | GPT-4o | Gemini-1.5-Pro | GPT-4o-mini |
| enterprise | (dedicated) | GPT-4o | Claude-3.5-Sonnet | Gemini-1.5-Pro |

### 3.2 Fallback rules

1. Fallback model must be same tier or lower (never upgrade tier on fallback)
2. Fallback preserves original request (messages, max_tokens, temperature)
3. Fallback creates a new receipt (original failed invocation receipt + new fallback receipt)
4. Fallback is transparent to user — `model` field in response shows actual model used, not requested
5. Maximum 3 fallback attempts before graceful degradation

### 3.3 Graceful degradation

When all fallbacks are exhausted:

```
AI Nguyễn tạm thời không thể xử lý yêu cầu này do tất cả mô hình đều không khả dụng.
Vui lòng thử lại sau ít phút.
Mã tham chiếu: [receipt_id]
```

- Response is in Vietnamese (or detected language)
- `finish_reason: 'error'`
- `receipt_id` is set (the failed invocation is still recorded)
- Incident is logged via `@nai/incident`

---

## 4. Health monitoring

### 4.1 Health check endpoint

`GET /v1/models/health` returns:

```json
{
  "models": [
    { "model": "gpt-4o", "provider": "openai", "healthy": true, "latencyMs": 240 },
    { "model": "claude-3-5-sonnet", "provider": "anthropic", "healthy": false, "latencyMs": null }
  ],
  "overall": "degraded"
}
```

### 4.2 Health check schedule

- Health check runs every 60 seconds (cron trigger in Cloudflare Worker)
- Health check calls each provider with a minimal ping request
- Result stored in `@nai/model-health` (Phase 2 package)
- Unhealthy providers are skipped in routing for 5 minutes, then re-checked

### 4.3 Overall status

| Status | Meaning |
|--------|---------|
| `healthy` | All providers healthy |
| `degraded` | 1+ provider unhealthy, fallbacks available |
| `critical` | Only 1 provider healthy |
| `down` | All providers unhealthy |

---

## 5. Circuit breaker

Each provider adapter implements a circuit breaker:

| State | Condition | Behavior |
|-------|-----------|----------|
| `closed` | Normal | All requests go through |
| `open` | 5 consecutive failures | Requests skip this provider for 60s |
| `half-open` | 60s elapsed since open | 1 test request allowed; if success → closed, if fail → open |

Circuit breaker state is in-memory per Worker isolate. Phase 2: shared state via Durable Object.

---

## 6. Incident logging

Every provider failure logs an incident via `@nai/incident`:

| Field | Value |
|-------|-------|
| `category` | `model_failure` |
| `severity` | `warning` (single failure) / `critical` (all providers down) |
| `provider` | Provider name |
| `model` | Model ID |
| `error` | Error message |
| `fallback_used` | Model ID of fallback, or null |
| `user_id` | Affected user |
| `tenant_id` | Affected tenant |

---

## 7. Single model survival

### 7.1 Minimum viable configuration

The system must function with only 1 provider available:
- If only Mock provider is available: all requests get mock responses (clearly labeled)
- If only 1 real provider is available: all tiers route to that provider (tier gating relaxed)
- If 0 providers available: graceful degradation (see §3.3)

### 7.2 Tier relaxation rules

When `overall = critical` (1 provider left):
- All tiers route to the surviving provider
- `tier_allowed` is always `true` (no tier gating during survival mode)
- Audit event `tier_relaxation_activated` is logged
- Admin is alerted to restore providers

When `overall = healthy` again:
- Tier gating resumes normal operation
- Audit event `tier_relaxation_lifted` is logged

---

## 8. Cost implications of fallback

- Fallback to a more expensive model: user is not charged extra (cost absorbed by platform)
- Fallback to a cheaper model: user is charged at requested model rate (no refund automation in Phase 1)
- Cost tracking (Phase 2) will record actual provider cost vs billed cost for margin analysis

---

## 9. Violations

| Violation | Severity |
|-----------|----------|
| No fallback configured for a tier | High |
| Fallback upgrades tier (free → pro) | Critical |
| No incident logged on provider failure | High |
| No health check endpoint | Medium |
| Circuit breaker disabled | High |

---

## 10. Amendment

Changing the fallback chain, adding/removing providers from fallback, or changing tier relaxation rules requires Founder approval. Emergency provider removal (e.g., provider shutdown) may be done by admin with post-hoc Founder notification within 24 hours.
