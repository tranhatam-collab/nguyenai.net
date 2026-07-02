# Nguyen AI — Product Boundary Contract

- **Status:** BINDING — Sprint 0 Governance Lock
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `ENTITLEMENT_MODEL.md`

---

## 1. Purpose

Lock the boundaries between product lines so that no repo, team, or sprint may blur them. The Nguyen AI ecosystem sells **five distinct commercial objects**. They are not the same, they are not bundable by default, and they are not interchangeable.

---

## 2. The five commercial objects (locked)

| # | Object | Owner layer | Sold as | Entitlement key |
|---|---|---|---|---|
| 1 | AI Computer Subscription | Gen 2 | recurring plan | `machine.plan` |
| 2 | Academy Pass | Gen 2 + Proof service | recurring or one-time | `academy.pass` |
| 3 | Certification Fee | Proof service | per certification | `cert.fee` |
| 4 | SME Deployment | Gen 2 | contract | `sme.deployment` |
| 5 | Marketplace Purchase | Gen 2 | per item | `marketplace.purchase` |

### 2.1 Hard separation rules

```
AI COMPUTER SUBSCRIPTION
        ≠
ACADEMY PASS
        ≠
CERTIFICATION FEE
        ≠
SME DEPLOYMENT
        ≠
MARKETPLACE PURCHASE
```

- An AI Computer plan does **not** include Academy Pass by default.
- Academy Pass does **not** grant AI Computer runtime access.
- Certification Fee is assessed per certification attempt and is **not** included in Academy Pass by default.
- SME Deployment is a separate contract and is **not** a plan tier.
- Marketplace purchases are per-item and are **not** included in any plan.

---

## 3. Product boundary by repo

### 3.1 `nguyenai.net` (public brand)

May describe all five objects for marketing purposes. May **not**:
- define pricing independently (must read from `packages/product-catalog/`)
- claim runtime readiness without evidence
- bundle objects in copy in a way that contradicts §2

### 3.2 `nguyenai-console` (app console)

Operates **only** the AI Computer Subscription surface. May **not**:
- sell Academy Pass
- charge certification fees
- configure SME deployments
- list marketplace items

Console may **display** Academy progress and certification status (read-only) if the user holds those entitlements, but the console is not the purchase surface for them.

### 3.3 `nguyenai-academy` (academy portal)

Operates **only** the Academy Pass and Certification Fee surfaces. May **not**:
- sell AI Computer plans
- configure SME deployments
- list marketplace items
- execute Gen 1 commands on its own (must call Gen 1 runtime via contract)

Academy may **display** the user's AI Computer plan status (read-only) for context.

### 3.4 `nguyenai-invest` (investor portal)

Operates **only** the investor relations surface. May **not**:
- sell any of the five commercial objects
- issue certifications
- execute Gen 1 commands
- define its own qualification rules (must follow `INVESTOR_ACCESS_POLICY.md`)

### 3.5 Gen 1 (`computer.iai.one`)

Owns runtime. May **not**:
- define plans or pricing
- issue entitlements
- bill customers
- issue certifications

### 3.6 Gen 2 (`maytinhai.org`)

Owns product/entitlement/billing. May **not**:
- execute agent commands directly (must call Gen 1)
- issue certifications (must call Proof service)
- define its own identity system (must use shared Identity service)

---

## 4. Ownership matrix

| Capability | Gen 1 | Gen 2 | Identity | Proof | Nguyen AI repos |
|---|---|---|---|---|---|
| Agent execution | **owns** | calls | — | — | calls via console |
| Model routing | **owns** | calls | — | — | calls via console |
| Memory | **owns** | calls | — | — | calls via console |
| Data Vault storage | **owns** | calls | — | — | calls via console |
| Evidence / trace | **owns** | calls | — | reads | reads |
| Approval engine | **owns** | calls | — | — | calls via console |
| Plans / pricing | — | **owns** | — | — | renders |
| Entitlement / quota | — | **owns** | — | — | reads |
| Billing / payment | — | **owns** | — | — | none |
| Subscription lifecycle | — | **owns** | — | — | none |
| Machine provisioning | — | **owns** | — | — | console calls |
| Organization / workspace | — | **owns** | reads | — | console reads |
| Identity / session | — | — | **owns** | — | all rely |
| RBAC / permissions | — | — | **owns** | — | all rely |
| Proof submission | — | — | — | **owns** | academy calls |
| Rubric scoring | — | — | — | **owns** | academy calls |
| Certificate issuance | — | — | — | **owns** | academy calls |
| Certificate verify | — | — | — | **owns** | public |
| Investor qualification | — | — | **owns** identity | — | invest calls |
| Investor access grant | — | — | — | — | invest calls (per `INVESTOR_ACCESS_POLICY.md`) |

---

## 5. Forbidden cross-boundary behaviors

1. **No repo may run its own agent loop.** All agent execution goes through Gen 1.
2. **No repo may store its own pricing.** All pricing reads from `packages/product-catalog/`.
3. **No repo may issue its own session.** All sessions come from `auth.nguyenai.net`.
4. **No repo may generate its own certificate ID.** All certificates come from the Proof service.
5. **No repo may persist business state in localStorage.** localStorage is for UI preferences only.
6. **No repo may call model providers from the browser.** Model calls go through Gen 1.
7. **No repo may define its own qualification rules for investors.** Rules live in `INVESTOR_ACCESS_POLICY.md`.
8. **No repo may claim Gen 1 is running without runtime evidence.**

---

## 6. Contract dependencies

Each cross-boundary call must use a locked contract from `IDENTITY_AND_TENANCY_RFC.md`:

- Identity contract: `/v1/session`, `/v1/auth/*`, `/v1/me`
- Entitlement contract: `/v1/entitlements`, `/v1/plans`, `/v1/usage`
- Command runtime contract: `/v1/commands`, `/v1/jobs`
- Approval contract: `/v1/approvals`
- Academy contract: `/v1/tracks`, `/v1/lessons`, `/v1/progress`, `/v1/quiz/attempts`, `/v1/proofs`, `/v1/certificates`
- Investor qualification contract: `/v1/investor-interest`, `/v1/private-access`, `/v1/data-room/documents`

No repo may invent ad-hoc endpoints outside these contracts.

---

## 7. Academy boundary — special rules

Academy is the most easily blurred boundary. Lock the following:

1. `academy.nguyenai.net` is the **branded learning experience** for Nguyen AI users.
2. `academy.iai.one` is the **shared academy engine** (credential engine, curriculum infrastructure, certification registry, shared learning platform).
3. `academy.nguyenai.net` consumes `academy.iai.one` via the Academy contract.
4. Academy content (lessons, tracks) for the Nguyen AI vertical may live in the Nguyen AI repo **as content**, but the proof/certification engine lives in `academy.iai.one`.
5. Academy is **not** "free AI learning for subscribers" by default. Academy access is governed by the `academy.pass` entitlement, which is separate from `machine.plan`.
6. A machine plan may be shown alongside Academy marketing in UI, but it does **not** grant Academy Pass. Any promotional Academy access must be issued as a standalone, audited grant and recorded in `packages/product-catalog/academy-access.json`.

---

## 8. SME deployment boundary

SME Deployment is a **contract** product, not a plan tier. It must not be presented as "the highest plan". It involves:

- dedicated or isolated Gen 1 runtime
- dedicated or isolated Gen 2 tenant
- custom entitlement scope
- custom data residency
- custom legal terms
- separate billing

The console may show an SME deployment context if the user is a member of one, but may **not** sell or configure it.

---

## 9. Marketplace boundary

Marketplace is a future product. Until it ships:

- no repo may list marketplace items
- no repo may define marketplace pricing
- no repo may imply marketplace is live

When it ships, it will be governed by a separate `MARKETPLACE_POLICY.md` and will use the `marketplace.purchase` entitlement key.

---

## 10. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-02 | Initial lock | Founder |
