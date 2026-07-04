# 04 — Quyền riêng tư và dữ liệu

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder + Council
**Tham chiếu:** `docs/governance/DATA_CLASSIFICATION_AND_RETENTION.md`

## Mục đích

Tài liệu này định nghĩa phân loại dữ liệu, quyền của chủ thể dữ liệu, thời gian lưu trữ, quy tắc chia sẻ, yêu cầu mã hóa, quy trình thông báo vi phạm, và quy tắc chuyển dữ liệu xuyên biên giới. Mọi điều khoản là BINDING và tuân thủ `DATA_CLASSIFICATION_AND_RETENTION.md`.

## Nguyên tắc cốt lõi

1. Dữ liệu ứng viên là **private by default**. BẮT BUỘC.
2. Chỉ council/investor được cấp access mới xem được hồ sơ. YÊU CẦU explicit grant.
3. Mọi access PHẢI ghi vào audit log. NGHIÊM CẤM truy cập không ghi log.
4. Ứng viên có quyền xem, sửa, xóa, xuất dữ liệu của mình. BẮT BUỘC.
5. Dữ liệu KHÔNG BAO GIỜ được bán cho bên thứ ba. NGHIÊM CẤM.

## 15 phân loại dữ liệu (Data Classes)

Per `DATA_CLASSIFICATION_AND_RETENTION.md`:

| # | Class | Mô tả | Retention |
|---|-------|-------|-----------|
| 1 | `public` | Marketing, docs công khai, certs công khai | Cho đến khi unpublish |
| 2 | `account` | Email, tên, locale, password hash, passkey | Per §6 (7 năm) |
| 3 | `session` | Session ID, refresh token, device metadata | 1h access / 30d refresh |
| 4 | `organization` | Org name, member list, plan | Per §6 (5 năm) |
| 5 | `machine_state` | Instance config, command history, job state | Per §6 (3 năm) |
| 6 | `memory` | Preference, fact, semantic, procedural memory | Per §7 (5 năm) |
| 7 | `vault_object` | Uploaded files, derived chunks, embeddings | Per §7 (3 năm) |
| 8 | `evidence` | Command evidence, trace, approval records | Per §6 (10 năm) |
| 9 | `academy_progress` | Enrollment, lesson status, attempts, scores | Per §6 (7 năm) |
| 10 | `proof` | Proof submissions, rubric results | Per §6 (10 năm) |
| 11 | `certificate` | Certificate record, verify URL | Per §6 (vĩnh viễn) |
| 12 | `investor_profile` | Qualification data, NDA, access grant | Per §6 (7 năm) |
| 13 | `data_room_document` | Investor docs, cap table, financial model | Per §6 (5 năm) |
| 14 | `audit_log` | Identity events, access events, admin actions | Per §6 (10 năm) |
| 15 | `billing` | Invoices, payment method tokens | Per legal requirement |

## Quyền của chủ thể dữ liệu (Data Subject Rights)

### 1. Right to Access (Quyền truy cập)

- Ứng viên CÓ THỂ yêu cầu xem toàn bộ dữ liệu đã cung cấp.
- Yêu cầu PHẢI được xử lý trong 30 ngày. BẮT BUỘC.
- Dữ liệu SHALL được xuất ra JSON/CSV.

### 2. Right to Rectification (Quyền sửa chữa)

- Ứng viên CÓ THỂ yêu cầu sửa thông tin sai.
- Yêu cầu PHẢI được xử lý trong 14 ngày. BẮT BUỘC.
- Nếu từ chối, PHẢI ghi lý do.

### 3. Right to Erasure (Quyền xóa)

- Ứng viên CÓ THỂ yêu cầu xóa dữ liệu.
- YÊU CẦU xóa audit log: KHÔNG ĐƯỢC. Audit log lưu vĩnh viễn per legal requirement.
- Yêu cầu xóa PHẢI được xử lý trong 30 ngày.
- Sau khi xóa, dữ liệu SHALL không thể khôi phục.

### 4. Right to Portability (Quyền chuyển dữ liệu)

- Ứng viên CÓ THỂ yêu cầu xuất dữ liệu ra JSON/CSV.
- Yêu cầu PHẢI được xử lý trong 30 ngày. BẮT BUỘC.
- Dữ liệu xuất SHALL bao gồm tất cả class liên quan đến ứng viên.

### 5. Right to Object (Quyền phản đối)

- Ứng viên CÓ THỂ phản đối xử lý dữ liệu cho mục đích cụ thể.
- Yêu cầu PHẢI được xử lý trong 14 ngày.
- Nếu đồng ý, xử lý SHALL dừng lại cho mục đích đó.

## Thời gian lưu trữ (Retention Periods)

- `account`: 7 năm sau khi rời chương trình.
- `organization`: 5 năm sau khi org giải tán.
- `machine_state`: 3 năm sau khi instance ngừng.
- `memory`: 5 năm sau khi user inactive.
- `vault_object`: 3 năm sau khi user inactive.
- `evidence`: 10 năm (audit requirement).
- `academy_progress`: 7 năm sau khi rời chương trình.
- `proof`: 10 năm (audit requirement).
- `certificate`: Vĩnh viễn (verification).
- `investor_profile`: 7 năm sau khi access revoked.
- `data_room_document`: 5 năm sau khi access revoked.
- `audit_log`: 10 năm (legal requirement). KHÔNG ĐƯỢC xóa.
- `billing`: Per legal requirement (thường 10 năm).

Sau khi hết retention, dữ liệu SHALL bị xóa vĩnh viễn. BẮT BUỘC.

## Quy tắc chia sẻ (Sharing Rules)

1. Dữ liệu KHÔNG BAO GIỜ được bán cho bên thứ ba. NGHIÊM CẤM.
2. Chia sẻ với council: chỉ trong kỳ review. Access tự hết hạn.
3. Chia sẻ với investor: expiring (90 ngày default), revocable. PHẢI có explicit grant.
4. Chia sẻ với admin: full access, nhưng audit logged. BẮT BUỘC.
5. Chia sẻ với moderator: chỉ nội dung forum. KHÔNG ĐƯỢC truy cập PII.
6. Chia sẻ với bên thứ ba (vendor): PHẢI có Founder approval + NDA. BẮT BUỘC.
7. Mọi chia sẻ PHẢI ghi vào audit log: who, what, when, why, expiry.

## Yêu cầu mã hóa (Encryption Requirements)

1. **At rest:** AES-256 cho R2, D1, Neon PostgreSQL. BẮT BUỘC.
2. **In transit:** TLS 1.3 cho mọi connection. NGHIÊM CẤM dùng TLS < 1.2.
3. **PII fields:** Encrypted thêm ở application layer (field-level encryption). BẮT BUỘC.
4. **Audit log:** Hash chain (append-only, tamper-evident). BẮT BUỘC.
5. **Backups:** Encrypted snapshots. BẮT BUỘC.
6. **Key management:** PHẢI rotate keys mỗi 90 ngày. YÊU CẦU.
7. **Password:** bcrypt hoặc argon2. KHÔNG ĐƯỢC lưu plaintext. NGHIÊM CẤM.

## Thông báo vi phạm (Breach Notification)

1. Khi phát hiện vi phạm dữ liệu (data breach), admin PHẢI báo Founder trong **72 giờ**. BẮT BUỘC.
2. Nếu vi phạm ảnh hưởng ứng viên, PHẢI thông báo ứng viên trong **72 giờ** sau khi xác nhận.
3. Thông báo PHẢI bao gồm: loại dữ liệu bị vi phạm, số lượng người ảnh hưởng, biện pháp khắc phục.
4. PHẢI ghi vi phạm vào audit log với `breach_detected` event.
5. PHẢI nộp breach report cho Council trong 7 ngày.
6. KHÔNG ĐƯỢC che giấu vi phạm. NGHIÊM CẤM. Vi phạm dẫn đến removal.

## Chuyển dữ liệu xuyên biên giới (Cross-border Transfer Rules)

1. Chuyển dữ liệu ra ngoài quốc gia lưu trữ PHẢI có Founder approval. BẮT BUỘC.
2. Quốc gia đích PHẢI có luật bảo vệ dữ liệu tương đương (adequacy).
3. Nếu không có adequacy, PHẢI sử dụng Standard Contractual Clauses (SCC).
4. Chuyển dữ liệu PHẢI ghi vào audit log: destination, purpose, legal basis.
5. Ứng viên CÓ THỂ phản đối chuyển dữ liệu (right to object).
6. KHÔNG ĐƯỢC chuyển dữ liệu sang quốc gia có rủi ro pháp lý cao. NGHIÊM CẤM.

## Access Control

- Investor access: expiring (90 ngày default), revocable. BẮT BUỘC.
- Council access: chỉ trong kỳ review. Tự hết hạn.
- Admin access: full, nhưng audit logged. BẮT BUỘC.
- Moderator access: chỉ nội dung forum. KHÔNG ĐƯỢC truy cập PII.

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
