# Nguyen AI — Gen 1 / Gen 2 Fallback Test Report

- **Status:** NOT RUN — template instantiated for final QA
- **Date:** 2026-07-07
- **Owner:** QA / Incident Commander

---

## Metadata

- Branch: TBD
- Commit: TBD
- Environment: TBD
- Tester: TBD
- Fallback policy version: 2026-07-07

---

## Verdict

**NOT VERIFIED.** Complete only after fallback implementation and real tests.

---

## Normal operation tests

| Test | Expected | Actual | Pass | Evidence |
|---|---|---|---|---|
| Gen 1 not called during normal model invocation | No Gen 1 calls | TBD | TBD | TBD |
| Gen 2 not called during normal entitlement path unless configured | No Gen 2 calls | TBD | TBD | TBD |
| Fallback status default | F0 / disabled | TBD | TBD | TBD |

---

## Failure tests

| Trigger | Expected | Actual | Pass | Evidence |
|---|---|---|---|---|
| Primary API timeout | Incident created, fallback request not auto-approved | TBD | TBD | TBD |
| Model gateway unavailable | Fallback request created | TBD | TBD | TBD |
| Sensitive data fallback | Requires Admin approval | TBD | TBD | TBD |
| Admin rejects fallback | Fallback remains disabled | TBD | TBD | TBD |
| Admin approves F2 | Fallback event logged and scoped | TBD | TBD | TBD |
| Admin approves F3/F4 | Approval, audit, expiry, rollback required | TBD | TBD | TBD |

---

## Required records

- Incident id:
- Fallback request id:
- Admin approval id:
- Audit event id:
- Expiry time:
- Rollback/disable evidence:

---

## Commands run

```bash
pnpm test --filter @nai/fallback
pnpm test tests/e2e/gen1-gen2-fallback-e2e.ts
pnpm test tests/e2e/independent-runtime-e2e.ts
```

Attach real logs.
