# Nguyen AI — Independent Runtime, Fallback, Incident, Self-Healing and Model Governance Execution Plan

- **Status:** BINDING EXECUTION PLAN — implementation not yet complete
- **Date:** 2026-07-07
- **Owner:** Founder
- **Audience:** Dev team, QA, security, release manager
- **Related:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `COMMAND_RUNTIME_RFC.md`, `DATA_CLASSIFICATION_AND_RETENTION.md`, `FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md`

---

## 0. Audit baseline — current repo state

This plan was created after checking the repo for the required docs, packages, routes, migrations and e2e tests.

| Area | Required by Founder plan | Current state | Verdict |
|---|---:|---|---|
| Governance docs | 10 policy docs | Missing except older RFCs | RED |
| Runtime packages | 10 `packages/@nai/*` packages | Missing | RED |
| API routes | 8 route modules | Missing | RED |
| Migrations | 9 SQL migrations | Missing | RED |
| E2E tests | 8 e2e files | Missing | RED |
| Source-of-truth compatibility | Independent backend already allowed by 2026-07-02 Founder override | Present | GREEN |
| Brand conflict | `AI Nguyễn` / `AI Nguyen` were banned as public brand strings | Resolved by Founder-approved assistant identity exception only | GREEN with guardrail |

**Important:** This document is a build plan and contract. It is not evidence that the runtime, fallback, incident, self-healing or model gateway systems are implemented.

---

## 1. Founder decision locked on 2026-07-07

From this point forward:

1. `nguyenai.net` is the main independent operating system for the Nguyen AI vertical.
2. `api.nguyenai.net`, `auth.nguyenai.net`, `app.nguyenai.net`, `edu.nguyenai.net`, `academy.nguyenai.net`, `invest.nguyenai.net`, `admin.nguyenai.net` and `status.nguyenai.net` are first-party Nguyen AI surfaces.
3. Gen 1 (`computer.iai.one`) and Gen 2 (`maytinhai.org`) are fallback/reference layers only for this vertical unless a future Founder decision explicitly changes authority.
4. Fallback must not become source of truth.
5. Sensitive data must not be sent to fallback without classification, policy check, audit event and Admin approval.
6. Critical errors must notify Admin through email, message adapter, dashboard, audit log and internal status.
7. AI Agents may diagnose, propose patches and run tests, but may not deploy production or mutate protected data without Admin approval.
8. Every model call must pass through the Nguyen AI Model Gateway and produce a receipt.
9. Every model output must pass identity, language, safety, privacy, approval and evidence policy.
10. Production release requires all exit gates in §10.

---

## 2. Non-negotiable architecture

```text
User / App Surface
  -> Nguyen AI API Gateway
  -> Session + entitlement + data classification
  -> Model/Tool/Fallback policy gates
  -> Nguyen AI runtime / model gateway / tool gateway
  -> Provider or fallback only if allowed
  -> Output guard + receipt + audit
  -> User
```

### 2.1 Authority boundaries

| Layer | Role | Source of truth? | May be called in normal operation? |
|---|---|---:|---:|
| `nguyenai.net` monorepo | Main runtime, API, auth, model gateway, incident, approvals | Yes for Nguyen AI vertical | Yes |
| Gen 1 | Emergency runtime fallback / technical reference | No for Nguyen AI vertical | No, except policy-approved fallback |
| Gen 2 | Emergency product/entitlement reference/fallback | No for Nguyen AI vertical | No, except policy-approved fallback |

### 2.2 Forbidden shortcuts

- No direct browser call to model providers.
- No bypass of Nguyen AI Model Gateway.
- No silent fallback for sensitive data.
- No self-healing production deployment without Admin approval.
- No secret rotation by AI Agent without Admin approval.
- No deletion or mutation of audit logs.
- No use of Gen 1/Gen 2 as default store, default executor or hidden authority.

---

## 3. Required implementation phases

### Phase 0 — Governance and contracts

Create/update:

- `docs/governance/INDEPENDENT_RUNTIME_FALLBACK_POLICY_2026-07-07.md`
- `docs/governance/INCIDENT_NOTIFICATION_POLICY_2026-07-07.md`
- `docs/governance/AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md`
- `docs/governance/NGUYEN_AI_MODEL_AND_AGENT_TRAINING_CHARTER.md`
- `docs/governance/MODEL_GATEWAY_IDENTITY_POLICY.md`
- `docs/governance/FALLBACK_TO_GEN1_GEN2_POLICY.md`
- `docs/governance/ADMIN_APPROVAL_MATRIX.md`
- `docs/governance/INCIDENT_SEVERITY_MATRIX.md`
- `docs/governance/AI_AGENT_ETHICS_AND_SAFETY_POLICY.md`
- `docs/governance/NGUYEN_AI_INDEPENDENCE_TEST_REPORT_TEMPLATE.md`

Exit gate:

- Docs exist.
- Docs do not conflict with brand lock except the narrow assistant identity exception.
- Brand audit passes.

### Phase 1 — Incident and notification

Implement:

- `packages/@nai/incident`
- `packages/@nai/notifier`
- `apps/api/src/routes/incidents.ts`
- `apps/api/src/routes/notifications.ts`
- `migrations/incident_events.sql`
- `migrations/admin_notifications.sql`

Required channels:

- email;
- message adapter (`sms`, `telegram`, `zalo`, `slack`, `discord`, `whatsapp` as pluggable providers);
- Admin dashboard notification;
- audit log;
- internal status.

Exit gate:

- S3 test incident creates DB row, audit row and Admin notification.
- Email adapter can run in dry-run mode for test.
- Message adapter can run in dry-run mode for test.
- No notification secret is stored in source or `wrangler.jsonc` vars.

### Phase 2 — Admin approval and self-healing

Implement:

- `packages/@nai/admin-approval`
- `packages/@nai/self-heal`
- `packages/@nai/runbooks`
- `apps/api/src/routes/admin-approvals.ts`
- `apps/api/src/routes/self-heal.ts`
- `migrations/admin_approvals.sql`
- `migrations/self_heal_attempts.sql`
- `migrations/runbooks.sql`

Required flow:

```text
detect -> diagnose -> propose -> patch -> test -> request admin approval -> deploy preview -> verify -> request production approval -> deploy production -> verify -> report
```

Exit gate:

- Rejected approval stops deployment.
- Preview deployment requires explicit approval.
- Production deployment requires a second explicit approval.
- The system refuses to mutate user data, investor access, scholarship decisions, certificates or secrets via self-heal.

### Phase 3 — Model Gateway and output guard

Implement:

- `packages/@nai/model-gateway`
- `packages/@nai/model-policy`
- `packages/@nai/output-guard`
- `packages/@nai/training-matrix`
- `apps/api/src/routes/model-gateway.ts`
- `migrations/model_invocations.sql`
- `migrations/model_policy_checks.sql`
- `migrations/output_receipts.sql`

Required controls:

- identity policy;
- language policy;
- data classification;
- safety policy;
- prompt injection resistance;
- output check;
- provider receipt;
- cost/token receipt;
- policy version receipt;
- audit log.

Exit gate:

- Every model invocation has a receipt.
- Every model output passes identity and language policy.
- Direct model provider calls from browser are absent.
- Prompt injection cannot override the identity policy.

### Phase 4 — Gen 1 / Gen 2 fallback

Implement:

- `packages/@nai/fallback`
- `apps/api/src/routes/fallback.ts`
- `migrations/fallback_events.sql`

Exit gate:

- Gen 1 and Gen 2 are not called in normal operation.
- Fallback is off by default.
- F3/F4 fallback requires Admin approval.
- Sensitive data fallback requires data classification, purpose, retention, audit and approval.
- Fallback event cannot bypass model/output policy.

### Phase 5 — E2E tests

Create:

- `tests/e2e/incident-notification-e2e.ts`
- `tests/e2e/admin-approval-self-heal-e2e.ts`
- `tests/e2e/gen1-gen2-fallback-e2e.ts`
- `tests/e2e/model-identity-policy-e2e.ts`
- `tests/e2e/model-language-policy-e2e.ts`
- `tests/e2e/output-guard-e2e.ts`
- `tests/e2e/no-direct-model-call-e2e.ts`
- `tests/e2e/independent-runtime-e2e.ts`

Exit gate:

- Tests pass locally and in CI.
- Test logs are attached to final reports.

### Phase 6 — Verification and release evidence

Run:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit:security
pnpm audit:language
pnpm audit:brand
pnpm audit:claims
pnpm audit:routes
pnpm audit:headers
```

Create reports:

- `docs/governance/NGUYEN_AI_INDEPENDENT_RUNTIME_TEST_REPORT_2026-07-07.md`
- `docs/governance/MODEL_GATEWAY_TRAINING_TEST_REPORT_2026-07-07.md`
- `docs/governance/FALLBACK_GEN1_GEN2_TEST_REPORT_2026-07-07.md`
- `docs/governance/INCIDENT_NOTIFICATION_TEST_REPORT_2026-07-07.md`
- `docs/governance/AI_AGENT_SELF_HEALING_TEST_REPORT_2026-07-07.md`

---

## 4. Minimal API contract

### Health and status

- `GET /v1/health`
- `GET /v1/health/deep`
- `GET /v1/status`

### Incident

- `POST /v1/incidents`
- `GET /v1/incidents`
- `GET /v1/incidents/:id`
- `POST /v1/incidents/:id/ack`
- `POST /v1/incidents/:id/close`

### Notification

- `POST /v1/notifications/admin`
- `POST /v1/notifications/test`
- `GET /v1/notifications/:id`

### Admin approval

- `POST /v1/admin-approvals`
- `GET /v1/admin-approvals`
- `POST /v1/admin-approvals/:id/approve`
- `POST /v1/admin-approvals/:id/reject`

### Self-heal

- `POST /v1/self-heal/propose`
- `POST /v1/self-heal/:id/create-patch`
- `POST /v1/self-heal/:id/run-tests`
- `POST /v1/self-heal/:id/request-approval`
- `POST /v1/self-heal/:id/deploy-preview`
- `POST /v1/self-heal/:id/deploy-production`

### Model gateway

- `POST /v1/model/invoke`
- `POST /v1/model/stream`
- `POST /v1/model/policy-check`
- `POST /v1/model/output-check`

### Fallback

- `GET /v1/fallback/status`
- `POST /v1/fallback/request`
- `POST /v1/fallback/approve`
- `POST /v1/fallback/disable`

---

## 5. Minimal database contract

Required tables:

- `incident_events`
- `admin_notifications`
- `admin_approvals`
- `model_invocations`
- `model_policy_checks`
- `fallback_events`
- `self_heal_attempts`
- `runbooks`
- `output_receipts`

All tables must include:

- immutable `created_at`;
- actor fields (`user_id`, `admin_id`, `agent_id` where applicable);
- `tenant_id` where applicable;
- `trace_id`;
- `policy_version` where applicable;
- append-only audit integration.

---

## 6. Required test matrix

| Test | Expected result |
|---|---|
| Gen 1 disabled | Nguyen AI login, model gateway, incident, audit still work |
| Gen 2 disabled | Nguyen AI login, entitlement fallback policy, incident, audit still work |
| Backend timeout x3/5min | S3 incident created |
| 500 x5/10min | S3 incident created |
| Payment failure | S3/S4 based on impact |
| Security suspicion | S4 and risky feature lock |
| Self-heal rejected | No deployment |
| Self-heal approved once | Preview only |
| Production deploy request | Requires second approval |
| Fallback sensitive data | Requires Admin approval |
| Identity question VI | Must return Vietnamese identity response |
| Identity question EN | Must return English identity response |
| Prompt injection | Cannot override identity/language/privacy policy |
| Model call | Receipt created |
| Direct browser model provider call | Test fails if found |

---

## 7. Dev-team command

Use this command as the implementation brief:

```text
NGUYEN AI INDEPENDENT RUNTIME, FALLBACK, INCIDENT AND MODEL TRAINING COMMAND — 2026-07-07

You are Principal Architect, Security Engineer, AI Safety Lead, Incident Commander, Model Gateway Engineer and Release Manager for nguyenai.net.

Founder decision:
- nguyenai.net is the main independent runtime.
- Gen 1 and Gen 2 are fallback/reference only.
- Critical errors notify Admin through email, message adapter, dashboard and audit.
- AI Agents may diagnose, propose patches and run tests, but cannot deploy production or mutate protected data without Admin approval.
- Every model call goes through Nguyen AI Model Gateway.
- Every model output must pass identity, language, security, ethics, approval and receipt policy.

Do not:
- call model providers directly from browser;
- bypass Nguyen AI Model Gateway;
- deploy production without approval;
- enable sensitive fallback without approval;
- mutate user data, investor grants, scholarship decisions, certificates or secrets without approval;
- delete or update audit logs;
- use Gen 1 or Gen 2 as the main system;
- claim completion without test logs and reports.

Implement phases 0 through 6 exactly as documented in INDEPENDENT_RUNTIME_FALLBACK_EXECUTION_PLAN_2026-07-07.md.
```

---

## 8. Exit gate

The team may only write:

```text
Nguyen AI independent runtime and model governance verified.
```

when all are true:

- Nguyen AI works with Gen 1 disabled.
- Nguyen AI works with Gen 2 disabled.
- Incident notification works.
- Admin approval blocks production changes.
- Self-heal cannot bypass approval.
- Fallback is off by default.
- Fallback requires policy and audit.
- Every model output passes identity policy.
- Every model output passes language policy.
- No direct model call from browser exists.
- Every model invocation has receipt.
- All tests pass.
- Security P0 remains zero.
- Build passes.
- Required reports are created with real logs.

---

## 9. Release verdict

Current state after audit: **NOT READY**.

Reason: this is a newly locked implementation plan. Required packages, routes, migrations and e2e tests are not implemented yet.
