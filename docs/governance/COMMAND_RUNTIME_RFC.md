# Nguyen AI — Command Runtime RFC

- **Status:** BINDING — Sprint 0 Governance (created before Sprint 3 per Founder decision)
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `IDENTITY_AND_TENANCY_RFC.md`, `ENTITLEMENT_API_RFC.md`, `AUDIT_EVENT_REGISTRY.md`

---

## 1. Purpose

Lock the command runtime contract for Nguyen AI. Every command executed by the runtime must conform to this RFC. No repo may implement its own command runtime outside this contract.

---

## 2. Command schema

```json
{
  "command_id": "uuid",
  "user_id": "uuid",
  "tenant_id": "uuid",
  "agent_id": "string",
  "type": "chat | tool_call | workflow | search | analysis",
  "input": { "prompt": "string", "context": { ... }, "tools": [...] },
  "model_route": { "provider": "string", "model": "string", "tier": "free | standard | pro | enterprise" },
  "priority": "low | normal | high",
  "created_at": "ISO8601",
  "expires_at": "ISO8601",
  "idempotency_key": "string" | null,
  "metadata": { ... }
}
```

---

## 3. Job schema

A job is a unit of execution within the runtime.

```json
{
  "job_id": "uuid",
  "command_id": "uuid",
  "status": "queued | running | completed | failed | cancelled | timed_out",
  "started_at": "ISO8601" | null,
  "completed_at": "ISO8601" | null,
  "result": { ... } | null,
  "error": { "code": "string", "message": "string" } | null,
  "retry_count": 0,
  "max_retries": 3,
  "trace_id": "string"
}
```

---

## 4. Lifecycle

```
created → queued → running → completed
                  ↘ failed → retry (if retry_count < max_retries) → queued
                  ↘ cancelled
                  ↘ timed_out
```

- `created`: command accepted, validated, entitlement-checked
- `queued`: job enqueued for execution
- `running`: job picked up by worker
- `completed`: job finished successfully, result stored
- `failed`: job failed, may retry
- `cancelled`: job cancelled by user or system
- `timed_out`: job exceeded timeout

---

## 5. Idempotency

- If `idempotency_key` is provided, the runtime checks for an existing completed job with the same key.
- If found, returns cached result (200).
- If not found, executes and stores result with key.
- Idempotency keys are retained for 24 hours.
- Without `idempotency_key`, every command is treated as unique.

---

## 6. Model/tool route

- Model route is determined by: `machine.model.tier` (entitlement) + command type + availability.
- Tool route is determined by: agent config + command input + entitlement.
- Runtime MUST check `machine.model.tier` before calling model.
- Runtime MUST check `machine.agents.enabled` and `machine.super_apps.enabled` before invoking agent/tool.
- If entitlement is insufficient, return `403` with `reason: "entitlement_insufficient"`.

---

## 7. Approval

- If `machine.approval.required = all`, every command requires approval before execution.
- If `machine.approval.required = sensitive`, only commands with `type: tool_call` or `priority: high` require approval.
- If `machine.approval.required = none`, no approval needed.
- Approval flow: command created → `approval_requested` audit → approver approves/denies → `approval_granted`/`approval_denied` audit → command proceeds or is rejected.
- See `@nai/approval` package for implementation.

---

## 8. Evidence

- Every completed command produces evidence: input, output, model used, tokens consumed, duration.
- Evidence is stored in R2 (immutable) with content hash.
- Evidence references are logged in audit (`command_executed`).
- Evidence is retained per `DATA_CLASSIFICATION_AND_RETENTION.md`.

---

## 9. Cancellation

- User may cancel a command via `DELETE /v1/commands/{command_id}`.
- System may cancel a command on: timeout, entitlement revocation, admin action.
- Cancellation is logged as `command_cancelled` in audit.
- If job is already `completed`, cancellation returns `409`.
- If job is `running`, runtime sends cancellation signal to worker. Worker may take up to `timeout` to stop.

---

## 10. Retry

- Retry policy: exponential backoff (1s, 2s, 4s, 8s) up to `max_retries` (default 3).
- Retry only on `failed` status, not on `cancelled` or `timed_out`.
- Retry count is logged in job schema.
- Final failure (after max retries) emits `command_failed` audit event.

---

## 11. Rate limit

- Per-user rate limit: `machine.command.quota` per period (default daily).
- Per-tenant rate limit: configurable, default 10x user limit.
- On rate limit exhaustion: return `429` with `X-RateLimit-Remaining: 0` and `Retry-After` header.
- Rate limit is checked BEFORE entitlement check (cheaper operation).

---

## 12. Timeout

- Default timeout: 30 seconds for chat, 120 seconds for tool_call, 300 seconds for workflow.
- Timeout is configurable per command type.
- On timeout: job status → `timed_out`, audit event `command_failed` with `error.code = "timed_out"`.
- No retry on timeout (user must resubmit).

---

## 13. Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `entitlement_insufficient` | 403 | User lacks required entitlement |
| `rate_limited` | 429 | Rate limit exceeded |
| `quota_exceeded` | 429 | Command/token quota exceeded |
| `approval_required` | 202 | Command queued, awaiting approval |
| `approval_denied` | 403 | Approval was denied |
| `timed_out` | 504 | Command exceeded timeout |
| `model_unavailable` | 503 | Model provider unavailable |
| `tool_unavailable` | 503 | Tool not available |
| `invalid_input` | 400 | Malformed command input |
| `idempotent_replay` | 200 | Returning cached result |

---

## 14. Audit

| Event type | When |
|---|---|
| `command_executed` | Job completed successfully |
| `command_failed` | Job failed (after retries) or timed out |
| `command_cancelled` | Job cancelled |
| `tool_called` | Tool invoked by agent |
| `workflow_completed` | Workflow finished |
| `approval_requested` | Approval requested for command |
| `approval_granted` | Approval granted |
| `approval_denied` | Approval denied |

All events include: `user_id`, `tenant_id`, `command_id`, `job_id`, `trace_id`, `registry_version`.

---

## 15. Usage/cost

- Every command records: tokens_in, tokens_out, model, duration_ms, cost_estimate.
- Usage is aggregated per user per period.
- Usage is queryable via `GET /v1/me/usage`.
- Cost estimate is based on model pricing table (maintained in `@nai/product-catalog`).
- Billing service consumes usage events for invoicing.

---

## 16. Tenant isolation

- Every command is scoped to `tenant_id`.
- Runtime enforces tenant isolation: a command from tenant A cannot access data from tenant B.
- Cross-tenant queries require `SUPER_ADMIN` role + audit logging.
- Tenant context is derived from session, never from client input.

---

## 17. Change log

| Date | Change |
|---|---|
| 2026-07-02 | Initial RFC — command schema, job schema, lifecycle, idempotency, model/tool route, approval, evidence, cancellation, retry, rate limit, timeout, error codes, audit, usage/cost, tenant isolation |
