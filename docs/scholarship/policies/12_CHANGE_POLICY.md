# 12 — Chính sách thay đổi và phiên bản

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING

## Versioning

- Mọi policy doc có phiên bản `MAJOR.MINOR.PATCH`.
- **MAJOR:** Thay đổi lớn (new policy, breaking change).
- **MINOR:** Cập nhật nhỏ (clarification, new section).
- **PATCH:** Fix typo, formatting.

## Change process

1. **Draft:** Founder hoặc Council draft thay đổi.
2. **Review:** Council review (7 ngày).
3. **Approve:** Founder approve.
4. **Notice:** Public notice 7-30 ngày trước hiệu lực.
5. **Effective:** Áp dụng.
6. **Log:** Ghi vào `ACCEPTANCE_LOG.md`.

## Notice period

| Loại thay đổi | Notice period |
|--------------|--------------|
| MAJOR (new policy, breaking) | 30 ngày |
| MINOR (clarification) | 14 ngày |
| PATCH (typo) | 7 ngày |
| Emergency (security) | Immediate |

## Public routes

- `/scholarship/policies` — Index tất cả 12 policies
- `/scholarship/policies/:id` — Chi tiết từng policy
- `/scholarship/changelog` — Lịch sử thay đổi
- `/scholarship/acceptance-log` — Acceptance log

## Change notice format

```markdown
## [YYYY-MM-DD] Policy XX changed v1.0.0 → v1.1.0

**Thay đổi:**
- [Section] Description of change

**Lý do:**
- Why this change was made

**Hiệu lực:**
- YYYY-MM-DD (sau N ngày notice)

**Thẩm quyền:**
- Approved by [Founder/Council]
```

## Acceptance log

Mỗi thay đổi ghi vào `ACCEPTANCE_LOG.md`:
- Date
- Policy ID
- Version change
- Summary
- Approved by
- Effective date

## Archive

- Version cũ được archive, không xóa.
- Link đến version cũ trong changelog.

---
*Tiêu liệu này là BINDING.*
