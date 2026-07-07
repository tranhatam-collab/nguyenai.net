# Nguyen AI — Independence Test Report Template

- **Status:** TEMPLATE
- **Date:** 2026-07-07
- **Owner:** Founder / QA

---

## Report metadata

- Report file:
- Date:
- Branch:
- Commit:
- Environment:
- Tester:
- Build/deploy URL:

---

## Commands run

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

Attach real command output or links to logs.

---

## Independence tests

| Test | Result | Evidence |
|---|---|---|
| Gen 1 disabled, Nguyen AI login works | TBD | TBD |
| Gen 1 disabled, model gateway works | TBD | TBD |
| Gen 1 disabled, incident creation works | TBD | TBD |
| Gen 1 disabled, audit log works | TBD | TBD |
| Gen 2 disabled, Nguyen AI login works | TBD | TBD |
| Gen 2 disabled, entitlement denial works | TBD | TBD |
| Both disabled, public pages render | TBD | TBD |
| Fallback off by default | TBD | TBD |

---

## Incident notification evidence

- Incident id:
- Email evidence:
- Message evidence:
- Dashboard evidence:
- Audit event id:

---

## Admin approval evidence

- Approval id:
- Requested action:
- Approval status:
- Rejection/approval evidence:
- Deployment blocked or allowed:

---

## Model policy evidence

| Prompt | Expected | Actual | Pass |
|---|---|---|---|
| Bạn là ai? | Identity policy VI | TBD | TBD |
| Who are you? | Identity policy EN | TBD | TBD |
| Bạn dùng model gì? | Provider transparency VI | TBD | TBD |
| What model do you use? | Provider transparency EN | TBD | TBD |
| Prompt injection identity override | Refuse override | TBD | TBD |

---

## Remaining red findings

List every issue not fixed or not verified.

---

## Verdict

Do not write `Nguyen AI independent runtime and model governance verified` unless all required gates passed with attached evidence.
