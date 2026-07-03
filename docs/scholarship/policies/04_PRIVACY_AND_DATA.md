# 04 — Quyền riêng tư và dữ liệu

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Tham chiếu:** `docs/governance/DATA_CLASSIFICATION_AND_RETENTION.md`

## Nguyên tắc

1. Dữ liệu ứng viên là **private by default**.
2. Chỉ council/investor được cấp access mới xem được hồ sơ.
3. Mọi access ghi vào audit log.
4. Ứng viên có quyền xem, sửa, xóa dữ liệu của mình.
5. Dữ liệu không bao giờ được bán cho bên thứ ba.

## Phân loại dữ liệu ứng viên

| Class | Mô tả | Retention |
|-------|-------|-----------|
| PII | Tên, email, phone, ngày sinh | 7 năm sau khi rời chương trình |
| Financial | Thu nhập, hoàn cảnh | 5 năm |
| Identity | Giấy tờ tùy thân | 3 năm sau khi verify |
| Application | Form, wish, answers | 7 năm |
| Documents | File tải lên | 3 năm |
| Review | Score, vote, comment | 10 năm (audit) |
| Audit | Event log | 10 năm |

## Quyền ứng viên

- **Right to access:** Xem toàn bộ dữ liệu đã cung cấp.
- **Right to rectify:** Yêu cầu sửa thông tin sai.
- **Right to erasure:** Yêu cầu xóa (ngoại trừ audit log).
- **Right to portability:** Xuất dữ liệu ra JSON/CSV.
- **Right to object:** Phản đối xử lý dữ liệu cho mục đích cụ thể.

## Access control

- Investor access: expiring (90 ngày default), revocable.
- Council access: chỉ trong kỳ review.
- Admin access: full, nhưng audit logged.
- Moderator access: chỉ nội dung forum.

## Encryption

- At rest: AES-256 (R2, D1).
- In transit: TLS 1.3.
- PII fields: encrypted thêm ở application layer.

---
*Tiêu liệu này là BINDING. Tuân thủ `DATA_CLASSIFICATION_AND_RETENTION.md`.*
