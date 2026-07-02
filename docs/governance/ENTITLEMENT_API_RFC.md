# Nguyen AI — Entitlement API RFC

- **Status:** BINDING — Sprint 0 Governance
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ENTITLEMENT_MODEL.md`, `PRICING_CATALOG_OWNERSHIP.md`, `AUDIT_EVENT_REGISTRY.md`

---

## 1. Purpose

Lock the Entitlement API contract. No client may call POST, PUT, or DELETE directly on entitlements. All write operations require service authentication, idempotency, and audit logging.

---

## 2. Authority model

| Actor | May grant? | May revoke? | May read? | Notes |
|---|---|---|---|---|
| Billing service | Yes (from payment/subscription event) | Yes (on refund/cancellation) | Yes | Service-authenticated |
| Admin service | Yes (with audit) | Yes (with audit) | Yes | Service-authenticated, requires `SUPER_ADMIN` |
| Academy service | No | No | Yes (Academy scope only) | Service-authenticated, scoped read |
| Console | No | No | Yes (Machine scope only) | User-session authenticated |
| Public site | No | No | Yes (public catalog only) | Unauthenticated, catalog read |
| Client (user) | No | No | Yes (own entitlements) | User-session authenticated |

Write operations are **never** public. All write endpoints require `service` authentication (API key + IP allowlist or mTLS).

---

## 3. Endpoints (minimum)

### 3.1 Public read

```
GET /v1/plans
  → 200 [ { id, name, name_vi, name_en, price_vnd, price_usd, currency, period, model_tier, ... } ]
  Auth: none
  Rate limit: 60 req/min per IP
```

### 3.2 User read (session-authenticated)

```
GET /v1/me/entitlements
  → 200 { machine: { ... }, academy: { ... }, cert: { ... }, sme: { ... } | null, invest: { ... } | null }
  Auth: valid session
  Scope: session user_id + tenant_id

GET /v1/me/usage
  → 200 { machine: { commands_used, commands_quota, tokens_used, tokens_quota }, academy: { lessons_completed, ... } }
  Auth: valid session
  Scope: session user_id + tenant_id
```

### 3.3 Service write (service-authenticated only)

```
POST /v1/internal/entitlements/grant
  Body: { user_id, entitlement_key, value, source, idempotency_key, reason }
  Auth: service (API key + IP allowlist)
  Idempotent: yes (via idempotency_key)
  Audit: entitlement_granted
  → 200 { entitlement_id, granted_at } | 409 { already_granted }

POST /v1/internal/entitlements/revoke
  Body: { user_id, entitlement_key, revoked_by, reason, idempotency_key }
  Auth: service (API key + IP allowlist)
  Idempotent: yes
  Audit: entitlement_revoked
  → 200 { revoked_at } | 404 { not_found }

POST /v1/internal/entitlements/recalculate
  Body: { user_id, trigger, idempotency_key }
  Auth: service (API key + IP allowlist)
  Idempotent: yes
  Audit: entitlement_recalculated
  → 200 { recalculated_at, changes: [...] }
```

---

## 4. Authorization rules

- `GET /v1/me/*` endpoints ignore client-supplied `user_id` or `tenant_id`. Always scoped to session.
- `POST /v1/internal/*` endpoints require `X-Service-Key` header + IP allowlist.
- Service keys are rotated quarterly and logged in `audit_event_registry` (`api_key_created`, `api_key_revoked`).
- No endpoint accepts `user_id` from a public client for write operations.

---

## 5. Idempotency

- All write endpoints accept `idempotency_key` (UUID v4 or deterministic hash).
- Server stores `(idempotency_key, response)` for 24 hours.
- Duplicate request with same key returns cached response (200 or 409).
- Without `idempotency_key`, write endpoints return `400`.

---

## 6. Audit logging

Every write operation MUST log to `audit_log`:

| Event type | When |
|---|---|
| `entitlement_granted` | POST /grant success |
| `entitlement_updated` | POST /recalculate changes a value |
| `entitlement_revoked` | POST /revoke success |
| `entitlement_expired` | System cron expires entitlement |
| `entitlement_recalculated` | POST /recalculate completes (even if no change) |

All events include: `user_id`, `actor_id`, `entitlement_key`, `source`, `registry_version`, `trace_id`.

---

## 7. Change events

The entitlement service emits events for downstream consumers:

| Event | Payload | Consumers |
|---|---|---|
| `entitlement.granted` | `{ user_id, entitlement_key, value, source, timestamp }` | Academy, Console, Proof |
| `entitlement.updated` | `{ user_id, entitlement_key, old_value, new_value, timestamp }` | Academy, Console |
| `entitlement.revoked` | `{ user_id, entitlement_key, revoked_by, timestamp }` | Academy, Console, Proof |
| `entitlement.expired` | `{ user_id, entitlement_key, expired_at }` | Academy, Console |
| `entitlement.recalculated` | `{ user_id, changes, trigger, timestamp }` | Academy, Console |

Events are delivered via Cloudflare Queues (at-least-once). Consumers must be idempotent.

---

## 8. Error codes

| Code | Meaning |
|---|---|
| 400 | Missing idempotency_key or invalid body |
| 401 | No valid session (user endpoints) or no service key (internal endpoints) |
| 403 | Session user differs from requested user, or service key lacks scope |
| 404 | Entitlement not found for revoke |
| 409 | Idempotent replay with different body, or already granted |
| 429 | Rate limit exceeded |
| 500 | Internal error (logged with trace_id) |

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-07-02 | Initial RFC — authority model, 6 endpoints, 5 change events |
