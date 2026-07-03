# 03 — Quy trình kiểm duyệt nội dung

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING

## 14 tiêu chí cấm (Section XXV.3)

1. Thông tin sai sự thật, lừa đảo
2. Nội dung thù ghét, phân biệt đối xử
3. Bạo lực, đe dọa
4. Quấy rối, xúc phạm cá nhân
5. Nội dung người chưa thành niên không phù hợp
6. Thông tin cá nhân của người thứ ba chưa có đồng ý
7. Vi phạm bản quyền
8. Spam, quảng cáo không phép
9. Malware, phishing
10. Nội dung khiêu dâm
11. Khuyến khích hành vi phạm pháp
12. Thông tin y tế sai lệch
13. Thông tin tài chính sai lệch
14. Khai thác tài nguyên trái phép

## Quy trình kiểm duyệt

1. **Auto-filter:** Hệ thống quét nội dung khi submit.
2. **Manual review:** Moderator xem xét trong 48 giờ.
3. **Decision:** `approve` / `reject` / `request_changes`.
4. **Notification:** Tác giả nhận thông báo kết quả.
5. **Appeal:** Tác giả có thể appeal trong 14 ngày.

## Báo cáo (Report)

- Bất kỳ user nào có thể report post/comment.
- 7 danh mục report: `prohibited_content`, `personal_info`, `harassment`, `spam`, `misinformation`, `copyright`, `other`.
- Moderator review report trong 72 giờ.
- Action: `actioned` (xóa/ẩn) hoặc `dismissed`.

## Audit

- Mọi moderation decision ghi vào audit log.
- `moderation_approved`, `moderation_rejected`, `complaint_submitted`, `complaint_resolved`.

---
*Tiêu liệu này là BINDING.*
