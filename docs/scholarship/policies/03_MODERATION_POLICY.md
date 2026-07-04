# 03 — Quy trình kiểm duyệt nội dung

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder + Council + Moderator Team

## Mục đích

Tài liệu này định nghĩa danh mục nội dung cấm, quy trình báo cáo, phạm vi thẩm quyền moderator, thang leo thang xử phạt, quyền appeal, quy tắc xử lý vi phạm tái phạm, giới hạn moderation tự động, và yêu cầu audit logging. Mọi điều khoản là BINDING.

## 7 danh mục nội dung cấm (Prohibited Content Categories)

1. **Nội dung sai sự thật và lừa đảo (Misinformation & Fraud):** Thông tin sai lệch cố ý, lừa đảo, giả mạo danh tính. NGHIÊM CẤM.
2. **Nội dung thù ghét và phân biệt đối xử (Hate & Discrimination):** Thù ghét dựa trên huyết thống, dòng họ, vùng miền, giới tính, tôn giáo, tình trạng hôn nhân. NGHIÊM CẤM.
3. **Bạo lực và đe dọa (Violence & Threats):** Đe dọa cá nhân, nhóm, hoặc tổ chức. Khuyến khích bạo lực. NGHIÊM CẤM.
4. **Quấy rối và xúc phạm (Harassment & Personal Attack):** Quấy rối, xúc phạm, công kích cá nhân. BẮT BUỘC remove.
5. **Nội dung không phù hợp người chưa thành niên (Minor Safety):** Nội dung người lớn tiếp cận trẻ em, hoặc nội dung không phù hợp tuổi. NGHIÊM CẤM.
6. **Thông tin cá nhân trái phép (Unauthorized PII):** Thông tin cá nhân của người thứ ba chưa có đồng ý. BẮT BUỘC remove.
7. **Vi phạm bản quyền và tài nguyên trái phép (Copyright & Resource Abuse):** Vi phạm bản quyền, spam, quảng cáo không phép, malware, phishing, khai thác tài nguyên trái phép. BẮT BUỘC remove.

## Quy trình báo cáo (Reporting Workflow)

1. **Bất kỳ user nào** có thể report post/comment.
2. Report PHẢI chọn 1 trong 7 danh mục: `misinformation`, `hate_discrimination`, `violence_threats`, `harassment`, `minor_safety`, `unauthorized_pii`, `copyright_abuse`.
3. Report PHẢI kèm mô tả (description) tối thiểu 20 ký tự.
4. Moderator PHẢI review report trong 72 giờ.
5. Action: `actioned` (xóa/ẩn) hoặc `dismissed`. PHẢI ghi lý do.
6. Reporter nhận notification kết quả.
7. Nếu `actioned`, tác giả nội dung nhận notification + lý do.

## Phạm vi thẩm quyền Moderator (Moderator Authority Scope)

1. Moderator CÓ THỂ: ẩn (hide), xóa (delete), cảnh cáo (warn), ban tài khoản.
2. Moderator KHÔNG ĐƯỢC: sửa nội dung của user, truy cập PII ngoài forum, xóa account vĩnh viễn (yêu cầu Council approval).
3. Moderator PHẢI tuân thủ escalation ladder. KHÔNG ĐƯỢC bỏ bước.
4. Moderator PHẢI khai báo xung đột lợi ích trước khi xử lý report liên quan đến người quen.
5. Founder có quyền override bất kỳ moderator decision nào.

## Thang leo thang xử phạt (Escalation Ladder)

| Cấp | Hành động | Điều kiện | Thời gian |
|----|-----------|-----------|-----------|
| 1 | Warning (Cảnh cáo) | Vi phạm lần đầu, nhẹ | Vĩnh viễn trong hồ sơ |
| 2 | Hide content (Ẩn nội dung) | Vi phạm lần 2 hoặc nội dung nghiêm trọng | Nội dung ẩn |
| 3 | Temporary ban (Ban tạm) | Vi phạm lần 3 hoặc vi phạm nghiêm trọng | 7-30 ngày |
| 4 | Permanent ban (Ban vĩnh viễn) | Vi phạm lần 4 hoặc vi phạm cực nghiêm trọng | Vĩnh viễn |

- Cấp 1-2: Moderator PHẢI thực hiện. BẮT BUỘC.
- Cấp 3: Moderator CÓ THỂ thực hiện, PHẢI báo Council.
- Cấp 4: YÊU CẦU Council vote 2/3 majority. Moderator KHÔNG ĐƯỢC tự quyết.

## Quyền Appeal (Appeal Rights)

1. Tác giả nội dung CÓ THỂ appeal trong 14 ngày sau notification.
2. Appeal PHẢI kèm lý do (tối thiểu 50 ký tự).
3. Council PHẢI review appeal trong 14 ngày.
4. Council decision là final. KHÔNG ĐƯỢC appeal lần 2.
5. Nếu appeal thành công, nội dung SHALL được khôi phục.
6. Nếu appeal thất bại, quyết định ban đầu SHALL được giữ nguyên.

## Quy tắc vi phạm tái phạm (Repeat Offender Rules)

1. Vi phạm lần 1: Warning. Ghi audit log.
2. Vi phạm lần 2 (trong 90 ngày): Hide content + warning escalated.
3. Vi phạm lần 3 (trong 90 ngày): Temporary ban 7-30 ngày.
4. Vi phạm lần 4 (trong 180 ngày): Permanent ban. YÊU CẦU Council vote.
5. Vi phạm nghiêm trọng (hate, violence, minor safety): Bỏ qua thang, ban trực tiếp. NGHIÊM CẤM.

## Giới hạn Moderation tự động (Automated Moderation Limits)

1. Auto-filter CÓ THỂ quét nội dung khi submit (spam, malware, PII detection).
2. Auto-filter KHÔNG ĐƯỢC ban tài khoản. Chỉ flag cho moderator review.
3. Auto-filter KHÔNG ĐƯỢC xóa nội dung vĩnh viễn. Chỉ ẩn tạm (shadow hide).
4. Auto-filter decisions PHẢI được moderator confirm trong 48 giờ.
5. Nếu moderator không confirm, nội dung SHALL được khôi phục tự động.
6. Auto-filter PHẢI ghi log mọi action với model version và confidence score.
7. False positive rate PHẢI được monitor. Nếu > 5%, PHẢI report Founder.

## Yêu cầu Audit Logging (Audit Logging Requirements)

1. Mọi moderation decision PHẢI ghi vào audit log. BẮT BUỘC.
2. Audit log PHẢI bao gồm: timestamp, moderator ID, action, target, reason, category.
3. Audit log SHALL được lưu 10 năm (per `DATA_CLASSIFICATION_AND_RETENTION.md`).
4. Event types: `moderation_approved`, `moderation_rejected`, `moderation_warned`, `moderation_banned`, `complaint_submitted`, `complaint_resolved`, `appeal_submitted`, `appeal_resolved`.
5. Audit log KHÔNG ĐƯỢC sửa hoặc xóa. NGHIÊM CẤM.
6. Founder CÓ THỂ audit moderation decisions bất kỳ lúc nào.
7. Quarterly moderation report PHẢI nộp Council. BẮT BUỘC.

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
