# Nguyen AI — Incident Notification Policy

- **Status:** BINDING POLICY
- **Date:** 2026-07-07
- **Owner:** Founder
- **Related:** `INCIDENT_SEVERITY_MATRIX.md`, `ADMIN_APPROVAL_MATRIX.md`

---

## 1. Purpose

Critical operational, security, privacy, payment, scholarship, investor, certificate and model-policy failures must be detected, classified, recorded, notified and closed with evidence.

---

## 2. Notification channels

Required channels:

1. Email.
2. Message adapter.
3. Admin dashboard notification.
4. Audit log.
5. Internal status page.

Message adapters must be provider-neutral. Allowed adapters include SMS, Telegram, Zalo, Slack, Discord, WhatsApp or another Founder-approved provider.

No provider credential may be stored in source code or `wrangler.jsonc` vars.

---

## 3. Notification matrix

| Severity | Email | Message | Dashboard | Risk lock | Admin approval |
|---|---:|---:|---:|---:|---:|
| S0 Normal | No | No | Optional | No | No |
| S1 Minor | No | No | Yes | No | No |
| S2 Degraded | Yes | No | Yes | No | No |
| S3 Critical | Yes | Yes | Yes | Maybe | Yes |
| S4 Emergency | Yes | Yes | Yes | Yes | Yes |

---

## 4. Incident triggers

Create an incident when any condition is true:

- API timeout more than 3 times in 5 minutes;
- 500 responses more than 5 times in 10 minutes;
- abnormal authentication failure pattern;
- payment failure or callback verification failure;
- scholarship application submission failure;
- investor private room access failure;
- certificate verification failure;
- suspected XSS, SQL injection or secret leak;
- model identity policy violation;
- language policy violation in user-facing output;
- fallback activation request;
- AI Agent proposes a production patch.

---

## 5. Required incident record

Each incident must include:

- `incident_id`;
- severity;
- service;
- environment;
- timestamp;
- error code;
- summary;
- impact;
- affected flows;
- diagnosis status;
- proposed fix;
- approval requirement;
- notification ids;
- audit event ids;
- close reason.

---

## 6. Email template — Vietnamese

Subject:

```text
[CẢNH BÁO NGUYỄN AI] {{severity}} tại {{service}}
```

Body:

```text
Hệ thống phát hiện lỗi cấp {{severity}}.
Dịch vụ: {{service}}
Thời điểm: {{timestamp}}
Mã lỗi: {{error_code}}
Mô tả: {{summary}}
Ảnh hưởng: {{impact}}
Tác vụ bị ảnh hưởng: {{affected_flows}}
Đã tự chẩn đoán: {{diagnosis_status}}
Đề xuất khắc phục: {{proposed_fix}}
Cần Admin duyệt: {{approval_required}}
Liên kết xem incident: {{admin_incident_url}}
```

English email may be sent only when Admin language preference is English. Do not mix languages in the same message unless explicitly configured.

---

## 7. Short message template

```text
Nguyễn AI cảnh báo {{severity}}: {{service}} lỗi. Xem incident và duyệt phương án tại {{incident_url}}.
```

---

## 8. Close requirements

An incident may close only when:

- root cause is recorded or marked unknown with reason;
- mitigation is recorded;
- affected flows are retested;
- notification status is recorded;
- Admin approval outcome is recorded where applicable;
- audit event is created.
