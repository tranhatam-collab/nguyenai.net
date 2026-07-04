# 05 — Hội đồng đánh giá (Council)

**Phiên bản:** 1.0.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING

## Thành phần

- 5 council members (per `COUNCIL_CONFIG.size`).
- Bầu chọn: Founder bổ nhiệm, có thể thay thế.
- Nhiệm kỳ: 2 năm, có thể gia hạn.
- Yêu cầu: Không có xung đột lợi ích với ứng viên.

## Vai trò

1. Đọc hồ sơ ứng viên
2. Kiểm tra xung đột lợi ích
3. Thảo luận với council
4. Bầu chọn: `approve` / `deny` / `abstain`
5. Công bố quyết định

## Ngưỡng phê duyệt

- **Approve:** ≥ 3/5 votes (majority)
- **Deny:** ≥ 3/5 deny votes
- **Waitlist:** 1-2 approve votes (borderline)
- **Pending:** 0 votes hoặc chưa đủ

## Xung đột lợi ích (5 trường hợp)

1. Họ hàng gia đình
2. Quan hệ công việc hiện tại hoặc trong 2 năm qua
3. Quan hệ đầu tư hoặc thương mại
4. Tranh chấp pháp lý
5. Quan hệ đối tác thương mại

## Hậu quả xung đột

- Không tham gia bầu chọn
- Không tham gia thảo luận
- Khai báo công khai
- Ghi vào audit log

## Scoring rubric (7 tiêu chí)

| # | Criteria | Weight |
|---|----------|--------|
| 1 | need | 20% |
| 2 | clarity | 15% |
| 3 | feasibility | 15% |
| 4 | product_value | 20% |
| 5 | commitment | 15% |
| 6 | giveback | 10% |
| 7 | integrity | 5% |

Mỗi tiêu chí chấm 0-10. Tổng = Σ(score/10 × weight) × 100.

---
*Tiêu liệu này là BINDING.*
