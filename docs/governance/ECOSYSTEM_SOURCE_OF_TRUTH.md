# Nguyen AI Ecosystem — Source of Truth

- **Status:** BINDING — Sprint 0 Governance Lock
- **Date:** 2026-07-02
- **Owner:** Founder
- **Supersedes:** all prior partial definitions of Gen1, Gen2, Nguyen AI in any repo, doc, or commit before 2026-07-02
- **Scope:** every repo, subdomain, package, service, doc and surface that claims to belong to the Nguyen AI ecosystem

---

## 1. Canonical identity of the ecosystem

The Nguyen AI ecosystem is **one product system with four branded surfaces**, built on **two shared technology layers**.

```
┌─────────────────────────────────────────────────────────────┐
│  Nguyen AI — vertical brand + distribution + content layer  │
│  nguyenai.net · app.nguyenai.net · academy.nguyenai.net     │
│  invest.nguyenai.net                                        │
└─────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│ Gen 2 — maytinhai.org    │  │ Gen 1 — computer.iai.one     │
│ Product / account /      │  │ Core runtime / orchestration │
│ entitlement / billing    │  │ agent / model / memory /     │
│ onboarding / workflow UI │  │ vault / evidence / approval  │
└──────────────────────────┘  └──────────────────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         ▼
            ┌──────────────────────────┐
            │ Shared Identity Service  │
            │ auth.nguyenai.net        │
            │ + Proof / Verify service │
            └──────────────────────────┘
```

There is **no third engine**. Nguyen AI is not a runtime, not an auth system, not an academy engine, not a billing engine, not a certificate engine. It is a vertical brand and product family that uses Gen 1 + Gen 2 + shared services.

---

## 2. Layer responsibilities (locked)

### 2.1 Gen 1 — `computer.iai.one` — Core Runtime

Owner of:
- agent execution
- model routing / Model Mesh
- memory (preference, fact, semantic, procedural)
- Data Vault (object storage, ingestion, retrieval)
- evidence and trace
- approval engine
- workflow state
- tool / connector gateway
- command runtime
- policy engine
- secrets vault
- runtime audit

Gen 1 is the **only** runtime. No repo may spin up its own command/agent execution engine.

### 2.2 Gen 2 — `maytinhai.org` — Product Layer

Owner of:
- product plans and pricing (canonical source)
- entitlement / quota / limits
- billing and payment state
- onboarding flows
- workspace / organization provisioning
- machine instance provisioning
- subscription lifecycle
- marketplace (when added)
- SME deployment configuration

Gen 2 is the **only** entitlement and billing authority. No repo may hardcode its own pricing, plan, or entitlement definition.

### 2.3 Nguyen AI — Brand / Distribution / Content Layer + Independent Backend

Owner of:
- public brand surface (`nguyenai.net`)
- branded console (`app.nguyenai.net`)
- branded academy surface (`academy.nguyenai.net`)
- branded investor portal (`invest.nguyenai.net`)
- Vietnamese-vertical content, copy, narrative
- Academy lesson content for the Nguyen AI vertical
- investor thesis and disclosure copy
- localization (VI / EN) for the Nguyen AI surfaces
- **independent backend monorepo** (`nguyenai.net/` chứa `apps/api/`, `packages/@nai/*`) — Founder decision 2026-07-02

> **FOUNDER OVERRIDE 2026-07-02:** `nguyenai.net` sở hữu backend riêng độc lập cho vertical Nguyen AI (auth, runtime, agents, billing, evidence). Không phụ thuộc runtime Gen1 (`computer.iai.one`) hay Gen2 (`maytinhai.org`) lúc chạy. Gen1 và Gen2 đóng băng (reference only, không sửa, không deploy). Được phép copy có chọn lọc package từ `maytinhai-os` (fix security khi copy). See `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`.

Nguyen AI **không còn là** brand-only static layer. Nó sở hữu runtime riêng cho vertical Nguyen AI. Gen1/Gen2 không còn là dependency runtime — chỉ là reference kiến trúc.

### 2.4 Shared Identity Service — `auth.nguyenai.net`

Owner of:
- identity proofing
- authentication (passkey / magic link / OAuth)
- session issuance, rotation, revocation
- organization / tenant context
- RBAC + permissions
- consent ledger
- audit trail for identity events

This is a **dedicated service**, not the console, not the academy, not the investor site.

### 2.5 Shared Proof / Verify Service

Owner of:
- proof submission
- rubric scoring
- certificate issuance, registry, revocation, verify
- evidence references

Used by Academy and any future credential-bearing surface. Academy does not implement its own certificate engine.

---

## 3. Repo → Layer mapping (locked)

| Repo / surface | Layer | Owns backend? | Consumes |
|---|---|---|---|
| `nguyenai.net` | Nguyen AI brand + independent backend | **Yes** (Founder override 2026-07-02) | its own services (`@nai/*` packages) |
| `nguyenai-console` | Nguyen AI brand | No | merged into `nguyenai.net/apps/console/` |
| `nguyenai-academy` | Nguyen AI brand | No (only content) | merged into `nguyenai.net/apps/academy/` |
| `nguyenai-invest` | Nguyen AI brand | No (only public copy + request form) | merged into `nguyenai.net/apps/invest/` |
| `computer.iai.one` (Gen 1) | Core runtime (FROZEN — reference only) | Yes (frozen) | — |
| `maytinhai.org` (Gen 2) | Product layer (FROZEN — reference only) | Yes (frozen) | — |
| `auth.nguyenai.net` | Identity (now lives inside `nguyenai.net/packages/@nai/auth`) | Yes | its own store |
| Proof / Verify service | Shared (now lives inside `nguyenai.net/packages/@nai/evidence`) | Yes | Identity |

> **FOUNDER OVERRIDE 2026-07-02:** `nguyenai.net` là backend độc lập. Gen1/Gen2 đóng băng (reference only, không sửa, không deploy). `auth.nguyenai.net` và Proof/Verify service được implement bên trong `nguyenai.net/packages/@nai/*` thay vì service riêng. Repo `nguyenai-console`, `nguyenai-academy`, `nguyenai-invest` merge vào `nguyenai.net/apps/*`.

Any repo that currently has its own auth, pricing, progress store, certificate generator, or command runtime must remove it and consume the shared service instead — **trừ `nguyenai.net`**, nơi các service này được build mới theo `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`.

---

## 4. Domain map (locked)

| Domain | Purpose | Public? |
|---|---|---|
| `nguyenai.net` | Public brand site | yes |
| `app.nguyenai.net` | AI Computer Console | no (auth) |
| `academy.nguyenai.net` | Academy portal for Nguyen AI users | partial (marketing public, learning auth) |
| `invest.nguyenai.net` | Investor portal | public pages + private room |
| `auth.nguyenai.net` | Identity service | no (API only) |
| `admin.nguyenai.net` | Admin console | no (auth, internal) |
| `api.nguyenai.net` | Public API gateway for Nguyen AI surfaces | no (API only) |
| `computer.iai.one` | Gen 1 runtime | no (API / internal) |
| `maytinhai.org` | Gen 2 product | partial (own brand surface) |
| `academy.iai.one` | Shared academy engine + credential infrastructure | no (API / internal) |

`computer.iai.one` and `maytinhai.org` may appear in architecture, developer docs, investor private room, legal/IP disclosure. They must **not** appear in Nguyen AI hero, pricing, CTA, checkout, default SEO metadata, or social OG defaults.

---

## 5. What Nguyen AI is NOT (locked, amended 2026-07-02)

> **FOUNDER OVERRIDE 2026-07-02:** Lines struck through below are superseded by Founder sign-off. `nguyenai.net` now owns an independent backend. See `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`.

- ~~Not a new runtime~~ → **IS a new runtime** (independent backend, `apps/api/` Hono on Workers)
- ~~Not a new identity provider~~ → **IS its own identity provider** (`@nai/auth` via better-auth)
- ~~Not a new academy engine~~ → **IS its own academy engine** (`apps/academy/`)
- ~~Not a new billing engine~~ → **IS its own billing engine** (`@nai/billing`, VNPay + Stripe)
- ~~Not a new certificate engine~~ → **IS its own certificate engine** (`@nai/evidence`)
- Not a Gen 3 (it is a vertical product line, not a generation)
- Not a fork of Gen 1 or Gen 2 (fresh build, selective copy only)
- Not a replacement brand for `maytinhai.org`
- ~~Not a vertical that owns its own user database~~ → **IS a vertical that owns its own user database** (Neon Postgres + D1)

Any code, doc, or commit that still implies the struck-through items is a defect and must be corrected before release.

---

## 6. What each repo may NOT do (locked)

| Repo | May NOT |
|---|---|
| `nguyenai.net` | expose `computer.iai.one` on hero/CTA, claim runtime readiness without evidence, copy packages from `maytinhai-os` without security audit |
| `nguyenai-console` | implement its own auth, persist business state in localStorage, call model providers directly from browser, define plans/entitlements |
| `nguyenai-academy` | implement its own auth, persist progress in memory, generate certificate IDs with `Math.random`, define quiz bank per track in isolation from Proof service |
| `nguyenai-invest` | implement its own auth, ship private room as static HTML, define its own qualification rules outside this contract |

---

## 7. Single source of truth for pricing

Pricing lives in **one** canonical catalog:

```
packages/product-catalog/
├── plans.json
├── entitlements.json
├── limits.json
├── prices.json
├── academy-access.json
└── catalog.schema.json
```

All four repos render pricing from this catalog. No repo may hardcode prices in source.

---

## 8. Single source of truth for identity

Identity lives in `auth.nguyenai.net`. All repos are relying parties. See `IDENTITY_AND_TENANCY_RFC.md`.

---

## 9. Single source of truth for entitlement

Entitlement lives in Gen 2. Academy pass, certification fee, SME deployment, and marketplace purchase are **separate** entitlements from the AI Computer subscription. See `ENTITLEMENT_MODEL.md`.

---

## 10. Single source of truth for proof and certification

Proof and certification live in the shared Proof / Verify service. Academy is a consumer, not an issuer. See `IDENTITY_AND_TENANCY_RFC.md` and `ENTITLEMENT_MODEL.md`.

---

## 11. Verification status of Gen 1 and Gen 2

As of 2026-07-02:
- Gen 1 runtime was **not** independently cloned, executed, or verified as part of the 4-repo audit.
- Gen 2 runtime was **not** audited end-to-end as part of the 4-repo audit.
- Any claim "Gen 1 is running" or "Gen 1 is only docs" must be accompanied by repo HEAD, build log, and runtime evidence.

Before Sprint 3 (Gen 1 runtime integration), Gen 1 and Gen 2 must be independently audited.

---

## 12. Conflict resolution rule

If any repo, doc, or commit conflicts with this document, **this document wins**. To change this document, Founder approval is required in writing.

---

## 13. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-02 | Initial lock | Founder |
