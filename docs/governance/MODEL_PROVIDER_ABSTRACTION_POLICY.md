# Model Provider Abstraction Policy

> **Provider amendment 2026-07-16:** Credential and runtime source rules in this historical policy are superseded by `AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md`. Nguyen AI must use `aiagent.iai.one` as the single AI Provider Gateway and must not retain vendor keys directly.

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`, `NO_DIRECT_MODEL_CALL_POLICY.md`, `MODEL_FAILURE_AND_SINGLE_MODEL_SURVIVAL_POLICY.md`
- **Implementation:** `packages/@nai/prism/src/index.ts`, `packages/@nai/model-gateway/src/index.ts`

---

## 1. Purpose

Lock the abstraction boundary between Nguyen AI and LLM providers (OpenAI, Anthropic, Google, Meta, Mistral, local). No application code, API route, or frontend may import or call a provider SDK directly. All provider calls go through `@nai/prism` (routing) and `@nai/model-gateway` (invocation + receipt).

---

## 2. Architecture layers

```
┌─────────────────────────────────────────────────┐
│  API routes (/v1/chat, /v1/stream, /v1/invoke)  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  @nai/training-gateway (orchestrator)            │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  @nai/prism (model routing + tier check)         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  @nai/model-gateway (invocation + receipt)       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Provider adapters (OpenAI, Anthropic, Google)   │
└─────────────────────────────────────────────────┘
```

### 2.1 Layer responsibilities

| Layer | Owns | Does NOT own |
|-------|------|-------------|
| API routes | HTTP request/response, auth | Model selection, provider calls |
| training-gateway | 8-step pipeline orchestration | Provider SDK calls |
| prism | Model routing, tier gating, prompt versioning | HTTP calls to providers |
| model-gateway | Invocation record, receipt creation, provider dispatch | Model selection logic |
| Provider adapters | HTTP call to provider API, response parsing | Routing, tier, guard |

---

## 3. Supported providers

| Provider | SDK / API | Status | Tier |
|----------|-----------|--------|------|
| OpenAI | `openai` npm or fetch | Planned | pro+ |
| Anthropic | `@anthropic-ai/sdk` or fetch | Planned | pro+ |
| Google | `@google/generative-ai` or fetch | Planned | standard+ |
| Meta (Llama) | via OpenAI-compatible endpoint | Planned | free |
| Mistral | via OpenAI-compatible endpoint | Planned | standard+ |
| Mock | in-process, deterministic | Active (test only) | all |

### 3.1 Provider abstraction contract

Each provider adapter must implement:

```typescript
interface ProviderAdapter {
  provider: string;
  chat(req: ProviderChatRequest): Promise<ProviderChatResponse>;
  stream?(req: ProviderChatRequest): AsyncIterable<ProviderChatChunk>;
  healthCheck(): Promise<{ healthy: boolean; latencyMs?: number }>;
}
```

Adapters are registered in `@nai/model-gateway`. The gateway dispatches based on `model.provider` field from the model descriptor.

### 3.2 No vendor lock-in

- Provider names are internal identifiers, not public brands.
- `served_by` (provider name) is not returned to end users (see `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md` §8.4).
- Model descriptors use `providerModel` (vendor-specific model ID) internally; public API uses abstract `model` IDs.
- Switching providers for a given model tier requires only changing the adapter mapping, not application code.

---

## 4. Model routing

### 4.1 Auto-route

When `model = 'auto-route'`, prism selects a model based on:
1. User tier (from `plan_id` → entitlement)
2. Task hint (from training-gateway metadata)
3. Cost optimization (cheapest model that meets tier + capability requirements)
4. Health status (skip unhealthy providers — see `MODEL_FAILURE_AND_SINGLE_MODEL_SURVIVAL_POLICY.md`)

### 4.2 Explicit model

When `model` is a specific model ID (e.g., `claude-3-5-sonnet`), prism:
1. Checks tier entitlement (user plan allows this model?)
2. Checks health status (provider healthy?)
3. Routes to the provider adapter

If tier check fails: return `tier_allowed: false` with reason.
If health check fails: fall back to alternate provider (see failure policy).

### 4.3 Model registry

Model descriptors are defined in `@nai/prism` as a static registry. Phase 2 will add dynamic registry (DB-backed) with admin UI for adding/removing models.

---

## 5. Tier gating

| Tier | Plan | Models available |
|------|------|-----------------|
| free | Nguyen Start | Mock, Llama-3.1-8B, GPT-4o-mini |
| student | (future) | + Gemini-1.5-Flash |
| standard | Nguyen Personal | + GPT-4o, Gemini-1.5-Pro |
| pro | Nguyen Creator, Nguyen Founder | + Claude-3.5-Sonnet, GPT-4o |
| business | Nguyen Business | + Claude-3.5-Sonnet, all standard |
| enterprise | Nguyen Enterprise | All models, dedicated capacity |

Tier gating is enforced by `@nai/prism` using `@nai/entitlement` to resolve plan → tier mapping.

---

## 6. Prompt versioning

`@nai/prism` owns named, versioned prompt templates:

```typescript
interface PromptTemplate {
  name: string;
  version: string;
  systemPrompt: string;
  render(context: Record<string, string>): string;
}
```

- System prompts are versioned and stored in `@nai/prism/src/prompts/`.
- Application code references prompts by name + version, not by raw string.
- Prompt changes require a new version (immutable), not in-place edits.

---

## 7. Violations

| Violation | Severity | CI gate |
|-----------|----------|---------|
| API route imports provider SDK directly | Critical | Phase 10 grep audit |
| Application code calls `fetch()` to provider URL | Critical | Phase 10 grep audit |
| `served_by` returned in API response | High | Runtime check in training-gateway |
| Provider adapter bypasses model-gateway | Critical | Code review |

---

## 8. Amendment

Adding a new provider requires:
1. New adapter implementing `ProviderAdapter` interface
2. Registration in `@nai/model-gateway`
3. Model descriptors in `@nai/prism` registry
4. Health check endpoint in `GET /v1/models/health`
5. Founder approval for tier mapping

This policy may only be amended by Founder decision.
