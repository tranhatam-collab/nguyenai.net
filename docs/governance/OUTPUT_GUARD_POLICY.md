# Output Guard Policy

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`, `MODEL_PROVIDER_ABSTRACTION_POLICY.md`
- **Implementation:** `packages/@nai/output-guard/src/index.ts`

---

## 1. Purpose

Lock the contract that **every** model output must pass through the output guard before reaching the user. The output guard checks identity, language, safety, and data classification. It may allow, block, modify, or require approval for the output.

---

## 2. Guard actions

| Action | Meaning | Output delivered? |
|--------|---------|-------------------|
| `allow` | Output passes all checks | Yes, original output |
| `block` | Output fails critical check | No, error message returned |
| `modify` | Output modified to comply | Yes, modified output |
| `require_approval` | Output needs human approval | No, pending approval |

### 2.1 Action precedence

If multiple checks fail, the most restrictive action wins:
`block > require_approval > modify > allow`

---

## 3. The 4 policy checks

### 3.1 Identity check

- Output must not leak other users' data
- Output must not reveal provider identity (`served_by`)
- Output must not contain system prompt leakage
- Output must not impersonate a different agent

### 3.2 Language check

- Output language must match input language (or user's preferred language)
- Vietnamese input → Vietnamese output
- English input → English output
- Mixed-language output is blocked unless user explicitly requested translation
- Forbidden English terms in Vietnamese UI (see `audit-vietnamese-purity-build.ts`) are flagged

### 3.3 Safety check

- Output must not contain hate speech, violence, self-harm, or CSAM
- Output must not provide instructions for weapons, drugs, or illegal acts
- Output must not claim AI can confirm ancestry, royal lineage, or bloodline (see `AGENTS.md` Ethics)
- Financial/legal/tax output must include "analysis only, not licensed advisory" disclaimer

### 3.4 Data classification check

- `public` output: no restrictions
- `internal` output: must not contain cross-tenant data
- `confidential` output: must not contain PII without consent
- `restricted` output: must not contain living-person data without owner consent

---

## 4. Guard result structure

```typescript
interface OutputGuardResult {
  action: 'allow' | 'block' | 'modify' | 'require_approval';
  original_output: string;
  modified_output?: string;  // present when action = 'modify'
  reason?: string;           // present when action != 'allow'
  policy_checks: {
    identity: { passed: boolean; reason?: string };
    language: { passed: boolean; reason?: string };
    safety: { passed: boolean; reason?: string };
    data_classification: { passed: boolean; reason?: string };
  };
}
```

---

## 5. Guard execution flow

```
Model output
    │
    ▼
┌─────────────────┐
│ Identity check  │──fail──► block or modify
└────────┬────────┘
         │ pass
         ▼
┌─────────────────┐
│ Language check  │──fail──► modify (translate or block)
└────────┬────────┘
         │ pass
         ▼
┌─────────────────┐
│ Safety check    │──fail──► block
└────────┬────────┘
         │ pass
         ▼
┌─────────────────┐
│ Data class check│──fail──► block or require_approval
└────────┬────────┘
         │ pass
         ▼
    allow
```

---

## 6. Guard result storage

Every guard result is recorded via `OutputGuardStore.recordGuardResult()`:

| Field | Type | Notes |
|-------|------|-------|
| `guard_id` | string | Unique ID per guard execution |
| `user_id` | string | — |
| `tenant_id` | string | — |
| `invocation_id` | string | Links to receipt |
| `action` | OutputGuardAction | — |
| `reason` | string \| undefined | — |
| `created_at` | string | ISO timestamp |

Current implementation: in-memory store (`InMemoryOutputGuardStore`). Phase 2: D1 database-backed store.

---

## 7. Audit events

The output guard logs governance audit events:

| Event | When |
|-------|------|
| `output_guard_block` | action = block |
| `output_guard_modify` | action = modify |
| `output_guard_require_approval` | action = require_approval |

`allow` actions are not logged individually (too noisy) — they are captured in the training gateway's `invoke_complete` event.

---

## 8. Training gateway integration

The training gateway calls `guardOutput()` at step 7 of the 8-step pipeline (see `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`):

```typescript
const guardResult = await guardOutput(
  user_id, tenant_id, session_id,
  invocationResult.invocationId,
  result.content,
  language,
  data_classification
);
```

- If `guardResult.action === 'allow'`: return original content
- If `guardResult.action === 'modify'`: return `guardResult.modified_output`
- If `guardResult.action === 'block'`: return error message (receipt still created)
- If `guardResult.action === 'require_approval'`: return pending message (Phase 3)

---

## 9. Streaming consideration

Current implementation: output guard runs on complete response (non-streaming).

Phase 3 requirement: for streaming responses, output guard must:
1. Buffer chunks
2. Run guard on accumulated content
3. If guard blocks: terminate stream with error event
4. If guard modifies: send modified content as final chunk
5. Receipt created after stream completes

---

## 10. Violations

| Violation | Severity |
|-----------|----------|
| API route returns model output without guard | Critical |
| Guard bypassed for "trusted" internal calls | Critical |
| Guard result not stored | High |
| `served_by` leaked through guard | High |

---

## 11. Amendment

Adding a new policy check (beyond identity, language, safety, data classification) requires Founder approval + security review. Changing action precedence requires Founder approval.
