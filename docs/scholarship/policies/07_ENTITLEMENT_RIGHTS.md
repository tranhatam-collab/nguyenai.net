# 07 — Quyền lợi học bổng

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder + Council

## 1. Quyền lợi theo chương trình

Mỗi chương trình học bổng trong 9 programs (programs) có quyền lợi riêng được quy định tại policy tương ứng. Tuy nhiên, mọi entitlement (quyền lợi) đều PHẢI tuân thủ các quyền lợi chung BẮT BUỘC dưới đây:

1. **AI Computer Instance** — Mỗi học viên được cấp một máy AI (AI Computer Instance) riêng, mặc định 365 ngày (1 năm). Instance này KHÔNG ĐƯỢC chia sẻ, chuyển nhượng hoặc cho thuê.
2. **Learning paths** — Truy cập đầy đủ các program modules (module chương trình) theo lộ trình đã định nghĩa. Truy cập PHẢI được ghi audit log.
3. **Cohort** — Tham gia cohort (khóa học cùng kỳ) được gán tự động khi entitlement chuyển sang trạng thái `active`.
4. **Mentorship** — Mentor (người hướng dẫn) từ council (hội đồng) hoặc investor (nhà đầu tư) được phân bổ theo matching algorithm.
5. **Community** — Forum (diễn đàn) + network access (truy cập mạng lưới) với quyền thành viên đầy đủ.
6. **Certificate** — Chứng nhận hoàn thành (certificate) chỉ được cấp khi entitlement đạt trạng thái `completed`.

## 2. Vòng đời entitlement (Entitlement Lifecycle)

Mọi entitlement PHẢI đi qua vòng đời sau theo đúng trình tự. Bất kỳ chuyển trạng thái nào BẮT BUỘC phải ghi audit log với timestamp, actor và lý do:

| Trạng thái | Mô tả | Chuyển tiếp hợp lệ |
|-----------|-------|-------------------|
| `granted` | Entitlement vừa được cấp, chưa kích hoạt | → `active` |
| `active` | Đang sử dụng quyền lợi đầy đủ | → `suspended`, `completed`, `expired` |
| `suspended` | Tạm dừng, có thể khôi phục | → `active`, `revoked` |
| `revoked` | Thu hồi vĩnh viễn, KHÔNG thể khôi phục | (terminal) |
| `completed` | Hoàn thành chương trình, nhận certificate | (terminal) |
| `expired` | Hết hạn thời gian, không gia hạn tự động | (terminal) |

NGHIÊM CẤM chuyển trạng thái ngược hoặc bỏ qua bước. Chỉ Founder hoặc Council mới có thẩm quyền chuyển sang `revoked`.

## 3. Quy tắc truy cập learning path (Learning Path Access Rules)

- Học viên CHỈ được truy cập modules thuộc program đã được cấp entitlement.
- Truy cập module ngoài program YÊU CẦU sự phê duyệt của Council.
- Tiến độ học tập (learning progress) PHẢI được ghi nhận tự động vào hệ thống.
- Nếu học viên không hoàn thành module trong thời gian quy định, hệ thống PHẢI cảnh báo và có thể suspend entitlement.

## 4. Cấp phát AI Computer Instance (AI Computer Instance Provisioning)

- Instance PHẢI được provision (cấp phát) trong vòng 72 giờ kể từ khi entitlement chuyển sang `active`.
- Mỗi instance có cấu hình riêng theo program level: CPU, RAM, storage, model access.
- Instance KHÔNG ĐƯỢC dùng cho mục đích thương mại ngoài chương trình học.
- Khi entitlement kết thúc (`completed`, `expired`, `revoked`), instance PHẢI bị deprovision (thu hồi) trong vòng 7 ngày. Dữ liệu học viên được giữ 30 ngày để export trước khi xóa.

## 5. Gán cohort (Cohort Assignment)

- Cohort PHẢI được gán tự động dựa trên ngày entitlement `active` và lịch khai giảng.
- Mỗi cohort có tối đa 50 học viên để đảm bảo chất lượng mentorship.
- Học viên KHÔNG ĐƯỢC tự đổi cohort. Yêu cầu đổi cohort PHẢI được Council phê duyệt.
- Nếu cohort đầy, học viên được đưa vào waitlist (danh sách chờ) cho kỳ tiếp theo.

## 6. Thời hạn và gia hạn (Duration and Renewal)

- **Thời hạn mặc định:** 365 ngày kể từ ngày `active`.
- Gia hạn KHÔNG tự động. Học viên PHẢI nộp yêu cầu gia hạn trước 30 ngày khi hết hạn.
- Gia hạn chỉ được xét duyệt nếu học viên duy trì tiến độ học tập đạt chuẩn.
- Số lần gia hạn tối đa: 1 lần, thêm 90 ngày.
- Khi hết hạn, học viên CÓ THỂ apply (nộp đơn) lại cho cohort tiếp theo như ứng viên mới.

## 7. Căn cứ tạm dừng (Suspension Grounds)

Entitlement PHẢI bị suspend (tạm dừng) trong các trường hợp sau:

1. **Gian lận học thuật (academic dishonesty):** Sao chép, đạo văn, hoặc sử dụng AI tạo nội dung khi bị cấm.
2. **Không hoạt động (inactivity):** Không đăng nhập hoặc không có learning activity trong 30 ngày liên tiếp.
3. **Vi phạm nội quy cộng đồng:** Spam, quấy rối, hoặc hành vi phá hoại.
4. **Kiểm tra thông tin (verification hold):** Cần xác minh lại thông tin hồ sơ.
5. **Yêu cầu từ học viên:** Học viên tự yêu cầu tạm dừng (tối đa 90 ngày).

Quyết định suspend PHẢI ghi rõ lý do, thời gian dự kiến, và điều kiện khôi phục. Thông báo PHẢI được gửi đến học viên trong vòng 24 giờ.

## 8. Căn cứ thu hồi (Revocation Grounds)

Entitlement PHẢI bị revoke (thu hồi vĩnh viễn) trong các trường hợp sau:

1. **Gian lận hồ sơ (application fraud):** Khai man bằng cấp, thông tin cá nhân, hoặc tài liệu hỗ trợ.
2. **Vi phạm nghiêm trọng:** Vi phạm pháp luật, xâm phạm quyền sở hữu trí tuệ, hoặc gây thiệt hại cho nền tảng.
3. **Quyết định Council:** Council bỏ phiếu thu hồi theo quy trình moderation.
4. **Vi phạm lặp lại:** Bị suspend 3 lần trong cùng entitlement period.

Thu hồi là quyết định cuối cùng (terminal). KHÔNG có quyền kháng cáo nội bộ sau khi Founder phê duyệt thu hồi, ngoại trừ quy trình appeal theo Policy 08.

## 9. Điều kiện khôi phục (Restoration Conditions)

- Chỉ entitlement ở trạng thái `suspended` mới CÓ THỂ được restore (khôi phục).
- Entitlement `revoked`, `completed`, hoặc `expired` KHÔNG ĐƯỢC restore dưới mọi hình thức.
- Điều kiện khôi phục PHẢI bao gồm: (a) hết thời gian suspend, (b) khắc phục nguyên nhân suspend, (c) Council phê duyệt.
- Nếu suspend do inactivity, học viên PHẢI đăng nhập và hoàn thành ít nhất 1 module trước khi yêu cầu restore.
- Thời gian suspend KHÔNG cộng vào thời hạn entitlement (365 ngày vẫn tính từ ngày `active` ban đầu).

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
