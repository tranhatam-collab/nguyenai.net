# 08 — Quy trình khiếu nại và kháng cáo

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder + Council

## 1. Loại khiếu nại (Appeal Types)

Hệ thống PHẢI hỗ trợ 4 loại khiếu nại (appeal types) sau. Mỗi loại có quy trình review riêng nhưng tuân thủ chung các nguyên tắc BINDING trong tài liệu này:

1. **rejection** — Kháng cáo quyết định từ chối đơn học bổng (application rejection). Áp dụng khi đơn bị Council từ chối và ứng viên cho rằng quyết định sai.
2. **moderation** — Kháng cáo quyết định kiểm duyệt (moderation decision). Áp dụng khi nội dung bị gỡ, entitlement bị suspend, hoặc hành vi bị cảnh cáo.
3. **eligibility** — Kháng cáo quyết định về điều kiện tham gia (eligibility decision). Áp dụng khi ứng viên bị cho là không đủ điều kiện nộp đơn.
4. **award_decision** — Kháng cáo quyết định cấp học bổng (award decision). Áp dụng khi học bổng được cấp nhưng program, cohort, hoặc entitlement không đúng mong đợi.

## 2. Hạn nộp khiếu nại (Filing Deadline)

- Ứng viên PHẢI nộp appeal trong vòng **14 ngày** kể từ ngày nhận được quyết định chính thức.
- Ngày nhận quyết định được tính dựa trên timestamp của notification (thông báo hệ thống), không phải ngày ứng viên đọc.
- Sau 14 ngày, hệ thống NGHIÊM CẤM nhận appeal mới cho quyết định đó.
- Mỗi quyết định CHỈ được appeal **1 lần**. Không có quyền appeal lần hai (no second appeal).

## 3. Tài liệu bắt buộc (Required Documentation)

Khi nộp appeal, ứng viên BẮT BUỘC cung cấp các tài liệu sau. Appeal thiếu tài liệu sẽ bị từ chối xử lý:

1. **Appeal type** — Chọn 1 trong 4 loại trên.
2. **Decision reference** — ID của quyết định đang kháng cáo.
3. **Grounds for appeal** — Lý do kháng cáo, viết rõ ràng, tối thiểu 100 từ.
4. **Supporting documents** — Tài liệu bổ sung (tối đa 10 file, mỗi file tối đa 10MB). Có thể tải lên qua Scholarship Room → Documents.
5. **Desired outcome** — Kết quả mong muốn (overturned, remanded, partial overturn).

Council CÓ THỂ yêu cầu thêm thông tin từ ứng viên trong quá trình review. Ứng viên PHẢI phản hồi trong vòng 7 ngày, nếu không appeal bị tự động dismissed (bác bỏ).

## 4. Thành phần hội đồng review (Review Panel Composition)

- Review panel (hội đồng xét duyệt) PHẢI gồm ít nhất **3 thành viên Council**.
- Thành viên Council đã vote trong quyết định ban đầu KHÔNG ĐƯỢC tham gia review panel. Đây là nguyên tắc xung đột lợi ích (conflict of interest) BẮT BUỘC.
- Nếu không đủ 3 thành viên Council không xung đột, Founder PHẢI chỉ định thêm reviewer ad hoc.
- Đối với appeal loại `award_decision`, panel PHẢI bao gồm ít nhất 1 thành viên có chuyên môn về program liên quan.
- Mọi thành viên panel PHẢI ký cam kết bảo mật (confidentiality undertaking) trước khi tiếp cận hồ sơ.

## 5. Quy trình xử lý (Review Process)

1. **Nộp appeal (Filing):** Ứng viên nộp trong 14 ngày. Hệ thống ghi audit event `appeal_submitted`.
2. **Phân loại (Triage):** Admin xác minh appeal hợp lệ (đủ tài liệu, trong hạn) trong 3 ngày.
3. **Review:** Review panel xem xét hồ sơ, tài liệu bổ sung, và quyết định ban đầu.
4. **Investigation:** Nếu cần, panel thu thập thêm thông tin từ ứng viên, Council, hoặc hệ thống audit log.
5. **Decision:** Panel ra quyết định trong vòng **30 ngày** kể từ ngày appeal được chấp nhận xử lý.
6. **Notification:** Kết quả PHẢI được gửi đến ứng viên trong vòng 48 giờ sau khi quyết định.

## 6. Kết quả có thể (Possible Outcomes)

Review panel PHẢI ra một trong 3 quyết định sau:

| Kết quả | Mô tả | Hệ quả |
|---------|-------|--------|
| `upheld` | Giữ nguyên quyết định ban đầu | Quyết định ban đầu có hiệu lực. Appeal đóng. |
| `overturned` | Đảo ngược quyết định ban đầu | Quyết định ban đầu bị hủy. Hệ thống thực thi quyết định mới. |
| `remanded` | Gửi lại để xét duyệt lại | Quyết định ban đầu bị hủy. Council PHẢI review lại với hướng dẫn từ panel. |

Quyết định `remanded` PHẢI có deadline (hạn chót) cho Council review lại, tối đa 21 ngày.

## 7. Escalation lên Founder (Escalation to Founder)

- Nếu appeal bị `upheld` và ứng viên cho rằng có sai sót nghiêm trọng về quy trình (procedural error), ứng viên CÓ THỂ escalate (đưa lên cấp cao hơn) lên Founder.
- Escalation PHẢI nộp trong vòng 7 ngày kể từ ngày nhận kết quả appeal.
- Founder xem xét escalation trong vòng 14 ngày. Quyết định của Founder là **final** (cuối cùng, không kháng cáo tiếp).
- Founder CHỈ xem xét lỗi quy trình, không review lại nội dung chuyên môn.

## 8. Bảo đảm không trả đũa (No Retaliation Guarantee)

- Nguyễn AI NGHIÊM CẤM mọi hình thức trả đũa (retaliation) đối với ứng viên nộp appeal.
- Retaliation bao gồm: giảm quyền lợi, trì hoãn xử lý, công khai thông tin appeal, hoặc đối xử bất lợi trong các đơn sau.
- Bất kỳ thành viên Council, Admin, hoặc Staff nào vi phạm sẽ bị xử lý kỷ luật nội bộ.
- Ứng viên phát hiện retaliation CÓ THỂ báo cáo trực tiếp cho Founder qua security@nguyenai.net.

## 9. Yêu cầu audit (Audit Requirements)

Mọi appeal PHẢI ghi đầy đủ audit log. Các event BẮT BUỘC:

- `appeal_submitted` — Khi ứng viên nộp appeal.
- `appeal_triaged` — Khi admin xác minh hợp lệ.
- `appeal_reviewed` — Khi panel bắt đầu review.
- `appeal_decision` — Khi panel ra quyết định.
- `appeal_escalated` — Nếu ứng viên escalate lên Founder.
- `appeal_closed` — Khi appeal hoàn toàn đóng.

Audit log PHẢI lưu trữ 10 năm theo Policy 10 (Data Retention). Không được xóa hoặc sửa audit log dưới bất kỳ hình thức nào.

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
