# Nguyen AI — Implementation Plan Audit Delta Report

- **Status:** COMMIT CANDIDATE — governance/plan only, implementation not complete
- **Date:** 2026-07-07
- **Owner:** Founder / QA Audit
- **Scope:** Independent runtime, Gen 1/Gen 2 fallback, incident notification, self-healing approval, model gateway identity/training, QA report templates

---

## 1. Purpose

This report records the before/after delta for the governance planning work prepared for commit so Founder can audit exactly what changed before implementation begins.

This is **not** a production readiness report and **not** evidence that packages, API routes, migrations or E2E tests are implemented.

---

## 2. Baseline before this planning update

| Area | Before | Risk |
|---|---|---|
| Independent runtime/fallback execution plan | No single execution contract for incident + fallback + model gateway + self-heal | Dev team could build inconsistent systems |
| Incident notification policy | No detailed provider-neutral notification policy in the new 2026-07-07 form | Telegram/WhatsApp/email decisions could drift |
| Admin approval matrix | No single action-by-action approval matrix for self-heal/fallback/model/admin tasks | AI Agent could overstep authority |
| Model identity policy | No dedicated policy reconciling `AI Nguyễn`/`AI Nguyen` assistant identity with brand lock | Brand audit conflict and model identity drift |
| Training charter | No single mandatory matrix for identity, language, security, ethics, approvals and receipts | Models could answer inconsistently |
| Fallback policy | Gen 1/Gen 2 fallback principles existed in scattered architecture language, not as a specific F0-F4 policy | Fallback could be treated as source of truth |
| QA report templates | No templates for the 5 required post-implementation verification reports | Team could claim completion without evidence |
| Brand audit | `AI Nguyễn` and `AI Nguyen` were banned globally | New Founder identity answers would fail CI if documented |

---

## 3. After this planning update

| Area | After | Audit outcome |
|---|---|---|
| Master execution plan | Added `INDEPENDENT_RUNTIME_FALLBACK_EXECUTION_PLAN_2026-07-07.md` | Team now has phase-by-phase build contract |
| Runtime/fallback policy | Added binding runtime/fallback policy | Clarifies Nguyen AI is primary, Gen 1/Gen 2 fallback-only |
| Incident policy | Added binding notification policy with severity/channel matrix | Telegram fits as message adapter, not hardcoded architecture |
| Self-healing policy | Added AI Agent self-heal approval rules | Production deploy and sensitive actions require Admin approval |
| Model identity policy | Added identity answers and provider-transparency rules | Resolves model identity behavior |
| Training charter | Added mandatory model/agent training charter | Covers identity, origin, language, security, ethics, approvals, receipts |
| Fallback policy | Added F0-F4 fallback levels and data restrictions | Sensitive fallback requires policy + approval + audit |
| Admin approval matrix | Added explicit approval table | Blocks autonomous secret/user/investor/scholarship/certificate mutations |
| Incident severity matrix | Added S0-S4 triggers and risk-lock behavior | Enables implementation of incident classification |
| AI ethics/safety policy | Added agent safety rules | Blocks fabricated evidence and unauthorized sensitive actions |
| QA templates | Added 5 post-implementation test report templates + one general template | Reports start as NOT RUN / NOT VERIFIED to avoid pass-ảo |
| Brand lock | Added narrow Founder exception for `AI Nguyễn` / `AI Nguyen` only as assistant/model identity strings | Public brand lock remains intact |
| Brand audit script | Added allowlist only for approved governance identity policy docs | `audit-brand-naming-lock.sh` passes without opening public brand loophole |

---

## 4. Files included in this commit candidate

### New governance/policy files

- `docs/governance/INDEPENDENT_RUNTIME_FALLBACK_EXECUTION_PLAN_2026-07-07.md`
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

### New report templates

- `docs/governance/NGUYEN_AI_INDEPENDENT_RUNTIME_TEST_REPORT_2026-07-07.md`
- `docs/governance/MODEL_GATEWAY_TRAINING_TEST_REPORT_2026-07-07.md`
- `docs/governance/FALLBACK_GEN1_GEN2_TEST_REPORT_2026-07-07.md`
- `docs/governance/INCIDENT_NOTIFICATION_TEST_REPORT_2026-07-07.md`
- `docs/governance/AI_AGENT_SELF_HEALING_TEST_REPORT_2026-07-07.md`

### Modified governance/audit files

- `docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md`
- `tools/audit-brand-naming-lock.sh`

### This delta report

- `docs/governance/IMPLEMENTATION_PLAN_AUDIT_DELTA_REPORT_2026-07-07.md`

---

## 5. Important scope note

The worktree contains many unrelated pre-existing modifications and generated `.turbo` cache/log files. This commit candidate intentionally stages only the governance planning/audit files listed above.

Not included in this commit candidate:

- `.turbo/cache` changes;
- package build logs;
- P0/P1 code fixes from earlier work;
- app source changes outside the listed governance/audit files;
- new package or API implementation code;
- migrations or E2E tests.

---

## 6. Current red findings after this planning update

| Finding | Status |
|---|---|
| `packages/@nai/incident` | Not implemented |
| `packages/@nai/notifier` | Not implemented/verified in this commit candidate |
| `packages/@nai/admin-approval` | Not implemented |
| `packages/@nai/self-heal` | Not implemented |
| `packages/@nai/model-gateway` | Not implemented |
| `packages/@nai/model-policy` | Not implemented |
| `packages/@nai/output-guard` | Not implemented |
| `packages/@nai/training-matrix` | Not implemented |
| `packages/@nai/fallback` | Not implemented |
| API routes for incidents/notifications/approvals/model/fallback/self-heal | Not implemented |
| Migrations for incident/notification/approval/model/fallback/self-heal/receipts | Not implemented |
| E2E tests | Not implemented |
| Telegram secrets | Founder must set via `wrangler secret put`; do not store in source |
| WhatsApp | Deferred to adapter Phase 2 |

---

## 7. Current green findings after this planning update

| Finding | Evidence |
|---|---|
| Governance execution plan exists | File created |
| Required policy docs exist | File search confirmed all 16 docs/report files |
| Brand conflict resolved narrowly | `AI Nguyễn` / `AI Nguyen` allowed only in identity policy docs |
| Brand audit passes | `./tools/audit-brand-naming-lock.sh` returned 0 violations |
| Telegram recommendation matches policy | Telegram is an allowed message adapter |
| WhatsApp deferral is justified | Meta 24h customer service window requires templates outside the window |

---

## 8. Verification run for this commit candidate

Command:

```bash
./tools/audit-brand-naming-lock.sh
```

Result:

```text
=== BRAND NAMING AUDIT PASSED ===
0 violations found. All naming follows FOUNDER_BRAND_NAMING_LOCK.
```

No full `pnpm typecheck`, `pnpm lint` or `pnpm build` was required for this governance-only commit candidate. Those commands remain required for implementation commits.

---

## 9. Founder audit checklist

Before approving implementation, check:

- [ ] `@nai/notifier` is the package name, not `@nai/alert`.
- [ ] Telegram token/chat id are never committed.
- [ ] Telegram is implemented as provider adapter, not hardcoded core.
- [ ] Email remains required for S2/S3/S4 policy.
- [ ] Admin dashboard notification remains required.
- [ ] Audit log remains required.
- [ ] Internal status remains required.
- [ ] Gen 1 and Gen 2 are fallback-only.
- [ ] AI Agent self-heal cannot deploy production without second approval.
- [ ] Every model call creates a receipt.
- [ ] Every model output passes identity and language policy.

---

## 10. Commit verdict

This commit candidate is safe to review as a governance planning commit.

It must not be interpreted as implementation completion.
