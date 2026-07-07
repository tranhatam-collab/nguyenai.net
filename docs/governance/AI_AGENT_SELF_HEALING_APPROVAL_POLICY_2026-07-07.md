# Nguyen AI — AI Agent Self-Healing Approval Policy

- **Status:** BINDING POLICY
- **Date:** 2026-07-07
- **Owner:** Founder
- **Related:** `ADMIN_APPROVAL_MATRIX.md`, `AI_AGENT_ETHICS_AND_SAFETY_POLICY.md`

---

## 1. Policy verdict

AI Agents may detect, diagnose, propose, patch and test. They may not deploy production, rotate secrets, mutate protected data or override Admin decisions.

---

## 2. Allowed actions without approval

AI Agents may:

- read permitted logs;
- classify errors;
- create an incident;
- generate diagnosis;
- propose remediation;
- create a code patch in a branch or draft diff;
- create tests;
- run local/CI tests;
- create reports;
- request Admin approval.

---

## 3. Forbidden without Admin approval

AI Agents must not:

- deploy production;
- rotate or reveal secrets;
- grant investor access;
- grant, revoke or decide scholarships;
- issue or revoke certificates;
- mutate user, family, investor, scholarship or billing data;
- delete or update audit logs;
- enable fallback with sensitive data;
- send bulk email;
- change pricing, terms, legal policy or investment policy;
- disable security controls.

---

## 4. Self-heal lifecycle

```text
detected -> diagnosing -> proposed -> patch_created -> tests_running -> awaiting_admin_approval -> approved/rejected -> deployed_preview -> verified_preview -> awaiting_production_approval -> deployed_production -> verified_production -> closed
```

Rollback states:

- `rolled_back_preview`;
- `rolled_back_production`;
- `abandoned`.

---

## 5. Required approval gates

| Gate | Required for | Approval type |
|---|---|---|
| Patch creation | Any code-writing action by autonomous agent | Log-only or Admin policy |
| Preview deploy | Any environment with live integrations | Admin approval |
| Production deploy | Production traffic | Second Admin approval |
| Data mutation | Any protected data | Admin approval + purpose |
| Secret change | Any secret | Founder/Admin approval |
| F3/F4 fallback | Sensitive or emergency fallback | Admin approval |

---

## 6. Evidence required before approval

Approval request must include:

- incident id;
- root cause summary;
- files changed;
- commands run;
- test output;
- risk assessment;
- rollback plan;
- data classes touched;
- security impact;
- user impact;
- proposed deployment target.

---

## 7. Refusal behavior

If Admin rejects:

- patch remains unmerged;
- no deployment occurs;
- incident remains open or moves to monitored state;
- rejection reason is recorded;
- AI Agent may propose a revised plan but cannot override rejection.
