# Nguyen AI — Incident Severity Matrix

- **Status:** BINDING POLICY
- **Date:** 2026-07-07
- **Owner:** Founder

---

## Severity levels

| Code | Name | Meaning | Required action |
|---|---|---|---|
| S0 | Normal | System healthy | Log only |
| S1 | Minor warning | Small issue, self-recovering | Log and monitor |
| S2 | Degraded service | One feature partially failing | Dashboard notification, email if user-facing |
| S3 | Critical | API/service failure affects users | Email, message, dashboard, incident, possible risk lock |
| S4 | Emergency | Outage, security, data loss, payment, severe privacy | All channels, risk lock, Admin approval required |

---

## Trigger thresholds

| Condition | Severity |
|---|---|
| API timeout > 3 times in 5 minutes | S3 |
| 500 response > 5 times in 10 minutes | S3 |
| Auth anomaly | S3 or S4 |
| Payment callback verification failure | S3 or S4 |
| Suspected XSS | S4 |
| Suspected SQL injection | S4 |
| Secret leak | S4 |
| Investor private room access failure | S3 |
| Scholarship submission failure | S3 |
| Certificate verification unavailable | S3 |
| Model identity violation | S3 |
| Model privacy leak | S4 |
| Fallback activation request | S2 to S4 based on data class |
| AI Agent proposes production patch | S2 unless incident-driven S3/S4 |

---

## Risk lock behavior

Risk lock may disable:

- payment submission;
- scholarship submission;
- investor private room downloads;
- certificate issuance;
- fallback sending;
- production deploy pipeline;
- model provider route.

Risk lock must be audited and reversible only by Admin approval.
