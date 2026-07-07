# Nguyen AI — Incident Notification Test Report

- **Status:** NOT RUN — template instantiated for final QA
- **Date:** 2026-07-07
- **Owner:** QA / Incident Commander

---

## Metadata

- Branch: TBD
- Commit: TBD
- Environment: TBD
- Tester: TBD
- Notification policy version: 2026-07-07

---

## Verdict

**NOT VERIFIED.** Complete only after incident/notification implementation and real notification tests.

---

## Incident creation tests

| Trigger | Expected severity | Actual | Pass | Evidence |
|---|---|---|---|---|
| API timeout x3/5min | S3 | TBD | TBD | TBD |
| 500 x5/10min | S3 | TBD | TBD | TBD |
| Payment failure | S3/S4 | TBD | TBD | TBD |
| Secret leak simulation | S4 | TBD | TBD | TBD |
| Model identity violation | S3 | TBD | TBD | TBD |

---

## Notification channel tests

| Channel | Expected | Actual | Pass | Evidence |
|---|---|---|---|---|
| Email | Delivered or dry-run captured | TBD | TBD | TBD |
| Message adapter | Delivered or dry-run captured | TBD | TBD | TBD |
| Admin dashboard | Visible notification | TBD | TBD | TBD |
| Audit log | Append-only event | TBD | TBD | TBD |
| Internal status | Status updated | TBD | TBD | TBD |

---

## Required records

- Incident id:
- Email notification id:
- Message notification id:
- Dashboard notification id:
- Audit event id:
- Close event id:

---

## Commands run

```bash
pnpm test --filter @nai/incident
pnpm test --filter @nai/notifier
pnpm test tests/e2e/incident-notification-e2e.ts
```

Attach real logs.
