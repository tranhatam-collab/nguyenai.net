# 08 — Quy trình khiếu nại và kháng cáo

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING

## Loại khiếu nại (4 loại)

1. **rejection** — Kháng cáo quyết định từ chối
2. **moderation** — Kháng cáo quyết định kiểm duyệt
3. **revocation** — Kháng cáo thu hồi entitlement
4. **other** — Kháng cáo khác

## Quy trình

1. **Nộp appeal** — trong 14 ngày kể từ quyết định.
2. **Review** — Council (không phải member đã vote) xem xét.
3. **Investigation** — Thu thập thêm thông tin nếu cần.
4. **Decision** — `upheld` (giữ nguyên) hoặc `overturned` (đảo ngược).
5. **Notification** — Applicant nhận kết quả trong 30 ngày.

## Nguyên tắc

- Appeal không trả phí.
- Mỗi quyết định chỉ appeal 1 lần.
- Council review appeal phải là member khác với member đã vote ban đầu.
- Mọi appeal ghi audit log (`appeal_submitted`, `appeal_reviewed`).

## Tài liệu hỗ trợ

- Applicant có thể tải lên tài liệu bổ sung (xem Scholarship Room → Documents).
- Council có thể yêu cầu thêm thông tin.

## Hết hạn appeal

- Sau 14 ngày: không nhận appeal.
- Sau decision: không appeal tiếp (chỉ 1 lần).

---
*Tiêu liệu này là BINDING.*
