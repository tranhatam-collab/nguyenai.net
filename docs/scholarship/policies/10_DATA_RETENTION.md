# 10 — Chính sách giữ dữ liệu và xóa

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder + Data Protection Officer
**Tham chiếu:** `docs/governance/DATA_CLASSIFICATION_AND_RETENTION.md`, `docs/privacy/NGUYEN_AI_PRIVACY_DATA_MAP.md`

## 1. Lịch giữ dữ liệu (Retention Schedule)

Mọi data class (lớp dữ liệu) PHẢI tuân thủ lịch giữ (retention schedule) dưới đây. Sau khi hết hạn, dữ liệu PHẢI được xử lý theo cột "Action after" (hành động sau hết hạn). KHÔNG ĐƯỢC giữ dữ liệu quá thời hạn trừ khi có legal hold (giữ giữ pháp lý):

| Data class | Retention | Action after |
|-----------|-----------|--------------|
| Application data (dữ liệu đơn) | **7 năm** post-decision | Archive 1 năm → Hard delete |
| Uploaded documents (tài liệu tải lên) | **5 năm** post-decision | Hard delete from R2 |
| Identity documents (giấy tờ tùy thân) | 3 năm post-verify | Hard delete |
| Audit logs (nhật ký kiểm toán) | **10 năm** | Archive (append-only, không xóa) |
| Review scores + votes (điểm đánh giá) | 10 năm | Archive (audit) |
| PII (name, email, phone, DOB) | 7 năm post-exit | Hard delete |
| Financial info (thông tin tài chính) | 5 năm | Hard delete |
| Forum posts (bài đăng diễn đàn) | **Indefinite** (user-controlled) | User có thể tự xóa |
| Notifications (thông báo) | 1 năm | Auto-delete |
| Deleted accounts (tài khoản đã xóa) | **90 ngày** (tombstone) | Hard delete sau 90 ngày |
| Session logs | 90 ngày | Auto-delete |
| Backup data | Theo §4 | Theo §4 |

Lịch giữ này áp dụng cho cả primary database (Neon) và storage (R2). KHÔNG ĐƯỢC giữ bản sao ngoài lịch.

## 2. Quy trình xóa (Deletion Process)

- **Hard delete** = xóa vĩnh viễn, không thể recover (khôi phục). Dữ liệu bị ghi đè hoặc crypto-shredded.
- **Soft delete** = đánh dấu `deleted_at`, giữ 90 ngày rồi hard delete tự động.
- Quy trình hard delete PHẢI bao gồm: (a) xóa từ primary DB, (b) xóa từ R2 storage, (c) xóa từ cache (KV), (d) xóa từ vector DB (Qdrant), (e) xóa từ backup cũ khi backup cycle kết thúc.
- Mọi hard delete PHẢI ghi audit log với: entity type, entity ID, actor, timestamp, reason.
- KHÔNG ĐƯỢC hard delete dữ liệu đang dưới legal hold.

## 3. Quy tắc ẩn danh (Anonymization Rules)

- Sau retention period, dữ liệu CÓ THỂ được anonymized (ẩn danh) thay vì hard delete nếu có giá trị aggregate analytics (thống kê tổng hợp).
- Anonymization PHẢI đạt tiêu chuẩn **irreversible** (không thể đảo ngược): xóa hoặc băm (hash) tất cả trường định danh (name, email, phone, ID).
- Anonymized data KHÔNG ĐƯỢC chứa combination có thể re-identify (tái định danh) cá nhân (k-anonymity ≥ 5).
- Anonymized data CHỈ dùng cho aggregate analytics. NGHIÊM CẤM sử dụng cho targeted decision về cá nhân.
- Quyết định anonymize vs. hard delete do Data Protection Officer (DPO) quyết định theo từng data class.

## 4. Giữ backup (Backup Retention)

Backup (sao lưu) PHẢI tuân thủ lịch giữ sau. Tất cả backup PHẢI được mã hóa AES-256:

| Loại backup | Số lượng giữ | Tần suất |
|------------|-------------|----------|
| Daily backup | **30 bản** | Mỗi ngày |
| Monthly backup | **12 bản** | Mỗi tháng |
| Yearly backup | **7 bản** | Mỗi năm |

- Backup PHẢI được test restore hàng quý (quarterly). Kết quả test ghi audit log.
- Backup KHÔNG ĐƯỢC lưu ngoài Cloudflare R2 (hoặc storage được Founder phê duyệt).
- Khi backup hết hạn, PHẢI hard delete. KHÔNG ĐƯỢC giữ backup quá lịch.
- Backup chứa PII PHẢI tuân thủ cùng retention policy như primary data.

## 5. Giữ giữ pháp lý (Legal Hold Procedures)

- Legal hold (giữ giữ pháp lý) là lệnh từ Founder, Council, hoặc cơ quan pháp luật yêu cầu giữ dữ liệu vượt quá retention period.
- Khi legal hold được kích hoạt:
  1. DPO PHẢI ghi legal hold record: entity, scope, reason, issued by, date.
  2. Hệ thống PHẢI đánh dấu dữ liệu liên quan là `legal_hold = true`.
  3. Retention schedule BỊ SUSPEND cho dữ liệu đó. KHÔNG ĐƯỢC xóa hoặc anonymize.
  4. Dữ liệu được giữ cho đến khi legal hold được release (giải trừ).
- Legal hold release PHẢI có văn bản từ người đã issued hold. Sau release, retention schedule bình thường áp dụng lại.
- Mọi legal hold PHẢI được ghi audit log (`legal_hold_issued`, `legal_hold_released`).

## 6. Xử lý yêu cầu của chủ dữ liệu (Data Subject Request Handling)

Người dùng (data subject) CÓ QUYỀN gửi các yêu cầu sau theo Decree 13 (Vietnam PDPD) / GDPR:

| Loại yêu cầu | Mô tả | Deadline |
|-------------|-------|----------|
| Access (truy cập) | Xem toàn bộ dữ liệu cá nhân | **30 ngày** |
| Export (xuất dữ liệu) | Nhận bản sao JSON/CSV | 30 ngày |
| Rectification (sửa) | Sửa dữ liệu sai | 30 ngày |
| Erasure (xóa) | Yêu cầu xóa toàn bộ dữ liệu | 30 ngày |
| Portability (chuyển) | Chuyển dữ liệu sang dịch vụ khác | 30 ngày |
| Objection (phản đối) | Phản đối xử lý dữ liệu | 30 ngày |

- Mọi data subject request (DSR) PHẢI được nhận qua endpoint chính thức: `GET /v1/scholarship/export` (planned Sprint 8) hoặc email privacy@nguyenai.net.
- Hệ thống PHẢI xác minh danh tính người gửi trước khi xử lý (không qua email, cần MFA verification).
- **Audit log KHÔNG BỊ XÓA** dù người dùng yêu cầu erasure. Audit log giữ cho legal compliance (tuân thủ pháp luật).
- Nếu request phức tạp, DPO CÓ THỂ gia hạn thêm 60 ngày nhưng PHẢI thông báo người gửi trong 30 ngày đầu.
- DSR từ cơ quan pháp luật PHẢI được Founder phê duyệt trước khi thực thi.

## 7. Data export (Xuất dữ liệu)

- User có thể export (xuất) toàn bộ dữ liệu cá nhân bất cứ lúc nào.
- Endpoint: `GET /v1/scholarship/export` (planned Sprint 8).
- Format: JSON (primary) + CSV (optional).
- Delivery: email link, link hết hạn sau **7 ngày**.
- Link download PHẢI yêu cầu authentication + MFA. KHÔNG ĐƯỢC gửi raw data qua email.
- Export bao gồm: profile, applications, documents metadata (không tải lại file), review scores, forum posts, audit events liên quan.

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
