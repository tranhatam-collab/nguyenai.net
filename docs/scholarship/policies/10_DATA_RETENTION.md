# 10 — Chính sách giữ dữ liệu và xóa

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Tham chiếu:** `docs/governance/DATA_CLASSIFICATION_AND_RETENTION.md`

## Retention schedule

| Data class | Retention | Action after |
|-----------|-----------|--------------|
| PII (name, email, phone, DOB) | 7 years post-exit | Hard delete |
| Financial info | 5 years | Hard delete |
| Identity documents | 3 years post-verify | Hard delete |
| Application data | 7 years | Archive then delete |
| Uploaded documents | 3 years | Hard delete from R2 |
| Review scores + votes | 10 years | Archive (audit) |
| Audit events | 10 years | Archive (audit) |
| Forum posts | Indefinite (user-controlled) | User can delete |
| Notifications | 1 year | Auto-delete |

## Right to erasure

- User có thể yêu cầu xóa toàn bộ dữ liệu.
- Audit log **không** bị xóa (legal compliance).
- Identity documents xóa sau 3 năm verify hoặc theo yêu cầu.
- Hard delete = không recover được.

## Data export

- User có thể export toàn bộ dữ liệu (JSON/CSV).
- Endpoint: `GET /v1/scholarship/export` (planned Sprint 8)
- Delivery: email link, 7-day expiry

## Anonymization

- Sau retention period, data được anonymized trước khi archive.
- Anonymized data chỉ dùng cho aggregate analytics.

## Legal hold

- Nếu có legal hold, retention bị suspend.
- Data giữ cho đến khi hold được release.

---
*Tiêu liệu này là BINDING.*
