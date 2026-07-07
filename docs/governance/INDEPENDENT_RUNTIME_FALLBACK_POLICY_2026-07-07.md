# Nguyen AI — Independent Runtime and Fallback Policy

- **Status:** BINDING POLICY
- **Date:** 2026-07-07
- **Owner:** Founder
- **Related:** `INDEPENDENT_RUNTIME_FALLBACK_EXECUTION_PLAN_2026-07-07.md`, `FALLBACK_TO_GEN1_GEN2_POLICY.md`

---

## 1. Policy verdict

`nguyenai.net` is the main independent operating system for the Nguyen AI vertical.

Gen 1 (`computer.iai.one`) and Gen 2 (`maytinhai.org`) are fallback/reference layers only. They are not the main runtime, not the default store, not a source of truth for Nguyen AI vertical operations, and not an approval bypass.

---

## 2. Runtime authority

| Surface | Role | Runtime authority |
|---|---|---|
| `api.nguyenai.net` | Main API gateway | Primary |
| `auth.nguyenai.net` | Identity, session, RBAC | Primary |
| `app.nguyenai.net` | User console | Primary frontend |
| `edu.nguyenai.net` | Public education and scholarships | Primary frontend |
| `academy.nguyenai.net` | Gated learning, exams, certificates | Primary frontend |
| `invest.nguyenai.net` | Investor portal and private room | Primary frontend |
| `admin.nguyenai.net` | Admin dashboard and approvals | Primary frontend |
| `status.nguyenai.net` | Service status | Primary frontend |
| Gen 1 | Emergency runtime fallback/reference | Fallback only |
| Gen 2 | Emergency product/entitlement fallback/reference | Fallback only |

---

## 3. Fallback principles

Fallback may be considered only when:

- primary Nguyen AI API is unavailable;
- primary model gateway cannot process a permitted task;
- primary background workflow fails repeatedly;
- proof/certificate/evidence subsystem is unavailable;
- Admin approves temporary fallback;
- policy classifies the data as safe for fallback;
- audit logging is available.

Fallback must never be used as:

- default execution path;
- default storage path;
- way to avoid Nguyen AI policy;
- way to bypass Admin approval;
- way to send sensitive data to another system without classification;
- way to skip audit logs or receipts.

---

## 4. Data restrictions

The following classes must not be sent to fallback without Admin approval and a specific incident or approval id:

- identity documents;
- investor private-room data;
- scholarship sensitive records;
- payment records;
- secrets;
- family private data;
- private vault objects;
- unaudited logs;
- content without user consent.

Required metadata for any fallback event:

- fallback level (`F0` through `F4`);
- data class;
- purpose;
- affected user/tenant;
- Admin approval id where required;
- incident id;
- retention period;
- deletion plan;
- audit event id.

---

## 5. Runtime independence tests

Before go-live, QA must prove:

1. Gen 1 disabled: login works.
2. Gen 1 disabled: model gateway policy-check works.
3. Gen 1 disabled: incident creation works.
4. Gen 1 disabled: audit logging works.
5. Gen 2 disabled: login works.
6. Gen 2 disabled: entitlement denial works locally.
7. Gen 2 disabled: fallback does not silently activate.
8. Both disabled: public web/edu/invest pages render.

---

## 6. Implementation notes

Use Cloudflare bindings for Workers-to-storage/service integration where possible. Do not call Cloudflare REST APIs from Workers for first-party bindings. Secrets must be set through secret mechanisms, not `vars`.
