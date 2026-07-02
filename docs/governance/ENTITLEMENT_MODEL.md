# Nguyen AI — Entitlement Model

- **Status:** BINDING — Sprint 0 Governance Lock
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `PRODUCT_BOUNDARY_CONTRACT.md`, `IDENTITY_AND_TENANCY_RFC.md`

---

## 1. Purpose

Lock the entitlement model so that no repo, plan, or feature may grant or restrict access outside this contract. The entitlement service lives in Gen 2. All repos read entitlements via the Entitlement contract; none define their own.

---

## 2. Entitlement keys (locked)

Every grantable right in the ecosystem is identified by a scoped key.

### 2.1 Machine entitlements

```
machine.plan              — plan id (free | personal | family | creator | founder | business | chapter | enterprise)
machine.instance.count    — number of AI Computer instances
machine.model.tier        — model mesh tier (free | standard | pro | enterprise)
machine.command.quota     — commands per period
machine.tokens.quota      — tokens per period
machine.agents.enabled    — list of enabled agents
machine.super_apps.enabled — list of enabled Super Apps
machine.approval.required — approval gate level (none | sensitive | all)
```

### 2.2 Academy entitlements

```
academy.pass              — boolean (holds Academy Pass)
academy.tracks.enabled    — list of track ids
academy.lessons.limit     — lessons per period (or unlimited)
academy.cert.attempts     — certification attempts per period
academy.cert.discount     — discount on cert fee (0..100 %)
```

### 2.3 Certification entitlements

```
cert.fee.paid             — boolean (cert fee paid for a specific program)
cert.program              — program id
cert.attempt.id           — current attempt id
cert.eligible             — boolean (completed prerequisites)
```

### 2.4 SME deployment entitlements

```
sme.deployment.id         — deployment id
sme.runtime.isolated      — boolean (dedicated Gen 1 runtime)
sme.tenant.isolated       — boolean (dedicated Gen 2 tenant)
sme.region                — data residency region
sme.custom.entitlements   — org-specific entitlement scope
```

### 2.5 Marketplace entitlements

```
marketplace.purchase.id   — purchase id
marketplace.item.id       — item id
marketplace.access.expires — expiry (if time-limited)
```

### 2.6 Investor entitlements

```
invest.request.submitted  — boolean
invest.qualification.status — pending | qualified | rejected | expired
invest.private.scope      — list of private room scopes
invest.access.expires     — access expiry timestamp
invest.nda.signed         — boolean
invest.download.allowed   — boolean
```

---

## 3. Plan → entitlement mapping (locked)

The 8 plans defined in `packages/product-catalog/plans.json` map to entitlements as follows. This is the **only** authoritative mapping. No repo may redefine it.

| Plan | `machine.plan` | `machine.instance.count` | `machine.model.tier` | `academy.pass` | `academy.cert.discount` | `machine.approval.required` |
|---|---|---|---|---|---|---|
| Start (Free) | free | 1 | free | false | 0 | all |
| Personal | personal | 1 | standard | false | 0 | sensitive |
| Family | family | 1 shared | standard | false | 0 | sensitive |
| Creator | creator | 1 | standard | false | 0 | sensitive |
| Founder | founder | 1 | pro | false | 0 | sensitive |
| Business | business | 5 | pro | false | 0 | sensitive |
| Chapter | chapter | 1 shared | pro | false | 0 | sensitive |
| Enterprise | enterprise | custom | enterprise | custom | custom | custom |

### 3.1 Important rules

- `academy.pass` is **not** granted by any machine plan by default. Academy Pass is a standalone paid product and may be purchased independently.
- `academy.cert.discount` is not plan-linked by default. Any promotion or scholarship for Academy or certification must be issued as a separate, audited grant.
- `machine.approval.required = all` for the free plan means every command requires approval.
- Enterprise plan entitlements are defined per contract, not per plan row.

---

## 4. Academy Pass — separate product

Academy Pass is a **separate entitlement** from the machine plan.

```
academy.pass = true   ← granted by:
  - Standalone Academy Pass purchase
  - Promotional grant (time-limited, audited)
```

A user with any machine plan and no Academy Pass may see the Academy marketing page but cannot access lessons. The academy portal must check `academy.pass` server-side, not just `machine.plan`.

---

## 5. Certification Fee — separate transaction

Certification is a **per-attempt** transaction, governed by the Proof service.

```
cert.fee.paid = true   ← granted by:
  - Per-attempt payment
  - Discount applied via academy.cert.discount
  - Voucher / scholarship (audited, time-limited)
```

A user with Academy Pass can take lessons and quizzes, but cannot request a certification attempt without `cert.fee.paid` (or a valid voucher).

---

## 6. Entitlement contract (API)

Served by Gen 2 (proxied via `api.nguyenai.net`).

```
GET /v1/entitlements
  → 200 {
       machine: { plan, instance_count, model_tier, ... },
       academy: { pass, tracks_enabled, cert_attempts, ... },
       cert:    { ... },
       sme:     { ... } | null,
       invest:  { ... } | null
     }

GET /v1/entitlements/{key}
  → 200 { key, value, expires_at, source }

GET /v1/plans
  → 200 [ { id, name, price, currency, period, entitlements } ]

GET /v1/usage
  → 200 { machine: { commands_used, tokens_used, ... }, academy: { lessons_completed, ... } }
```

### 6.1 Authorization

- `GET /v1/entitlements` requires a valid session for the requesting user.
- The response is always scoped to the session's `user_id` and `tenant_id`.
- Client-supplied `user_id` or `tenant_id` are ignored for authorization.

---

## 7. Quota and limit enforcement

Quotas are enforced **server-side** at the Gen 1 / Gen 2 boundary, never in the client.

### 7.1 Command quota

- Gen 1 checks `machine.command.quota` before executing a command.
- On quota exhaustion, Gen 1 returns `429` with `X-RateLimit-Remaining: 0`.
- The console must display the quota state from `GET /v1/usage`, not from a client-side counter.

### 7.2 Token quota

- Gen 1 model gateway checks `machine.tokens.quota` before calling a model.
- Token usage is written to `usage_events` and visible via `GET /v1/usage`.

### 7.3 Academy lesson limit

- Academy API checks `academy.lessons.limit` before serving a lesson.
- Lessons beyond the limit return `403` with an upgrade CTA.

---

## 8. Entitlement grant lifecycle

```
[plan purchased or add-on purchased]
        ↓
Gen 2 creates Entitlement record
        ↓
Entitlement record: { user_id, key, value, source, granted_at, expires_at, revoked_at }
        ↓
GET /v1/entitlements reflects the new grant
        ↓
Repo reads entitlement and gates UI accordingly
```

### 8.1 Grant fields

```
entitlement_id
user_id
tenant_id
key                 — e.g. "academy.pass"
value               — e.g. true
source              — "plan:founder" | "add-on:academy-pass" | "voucher:..." | "admin:grant"
granted_at
expires_at          — null for non-expiring, or timestamp
revoked_at          — null until revoked
granted_by          — user_id of admin or "system"
```

### 8.2 Revocation

- An entitlement may be revoked by ADMIN / SUPER_ADMIN or by the system (e.g. refund, plan downgrade).
- Revocation is audited.
- Revocation propagates: a revoked `academy.pass` immediately blocks lesson access on the next server-side check.

---

## 9. Forbidden entitlement patterns

- Client-side entitlement checks as the only gate
- Hardcoded plan → feature mapping in any repo
- "If plan is not free, allow everything" logic
- Entitlements stored in localStorage
- Entitlements derived from the JWT payload alone (must call `GET /v1/entitlements`)
- Console granting entitlements (only Gen 2 / admin may grant)
- Academy issuing its own `academy.pass = true`

---

## 10. Pricing source of truth

Pricing lives in `packages/product-catalog/`:

```
packages/product-catalog/
├── plans.json            — plan id, name, price, currency, period
├── entitlements.json     — plan id → entitlement keys
├── limits.json           — entitlement key → quota / limit
├── prices.json           — standalone product prices (Academy Pass, cert fee, ...)
├── academy-access.json   — Academy product pricing, grants, and promotion rules
└── catalog.schema.json   — JSON Schema for the above
```

All four repos render pricing from this catalog. No repo may hardcode prices in source. The catalog is versioned; a change to the catalog is a release event.

---

## 11. Currency rules

- Functional currency: VND (Vietnamese Dong).
- Reporting currency for investor materials: USD allowed, with explicit exchange-rate assumption, source date, and VND equivalent.
- Academy and console display VND for Vietnamese users and USD for international users, based on locale.
- The catalog stores prices in VND; conversion to USD uses a locked rate with an `as_of` date.

---

## 12. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-02 | Initial lock | Founder |
