# Nguyen AI — Fallback to Gen 1 and Gen 2 Policy

- **Status:** BINDING POLICY
- **Date:** 2026-07-07
- **Owner:** Founder
- **Related:** `INDEPENDENT_RUNTIME_FALLBACK_POLICY_2026-07-07.md`, `DATA_CLASSIFICATION_AND_RETENTION.md`

---

## 1. Verdict

Gen 1 and Gen 2 are fallback/reference only for Nguyen AI operations. Fallback is off by default and must not become source of truth.

---

## 2. Fallback levels

| Level | Name | Risk | Admin approval |
|---|---|---|---|
| F0 | No fallback | Low | No |
| F1 | Read-only status fallback | Low | Policy-dependent |
| F2 | Non-sensitive task fallback | Medium | May require approval |
| F3 | User-data fallback | High | Required |
| F4 | Emergency fallback | Very high | Required |

---

## 3. Allowed fallback triggers

Fallback request may be created when:

- primary backend is unavailable;
- API error rate crosses S3 threshold;
- model gateway route is unavailable;
- evidence/proof/certificate subsystem is unavailable;
- Admin explicitly requests fallback;
- emergency runbook allows fallback.

---

## 4. Forbidden fallback use

Fallback must not be used to:

- bypass model policy;
- bypass privacy policy;
- bypass Admin approval;
- hide failures from Admin;
- write canonical Nguyen AI records into Gen 1/Gen 2 by default;
- process secrets;
- process investor private data without approval;
- process scholarship sensitive data without approval;
- process family private data without approval.

---

## 5. Fallback request record

Each request must include:

- fallback level;
- affected service;
- incident id;
- reason;
- data class;
- user/tenant scope;
- policy decision;
- Admin approval id if required;
- expiry time;
- rollback plan;
- audit event id.

---

## 6. Exit criteria for fallback mode

Fallback mode must be disabled when:

- primary service is healthy;
- incident is mitigated;
- data reconciliation is complete;
- Admin acknowledges exit;
- audit event is created.
