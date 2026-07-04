# 05 — Hội đồng đánh giá (Council)

**Phiên bản:** 1.1.0
**Ngày hiệu lực:** 2026-07-04
**Trạng thái:** BINDING
**Thẩm quyền:** Founder

## Mục đích

Tài liệu này định nghĩa thành phần Council, nhiệm kỳ, định mức quorum, ngưỡng biểu quyết, quy tắc recusal, tần suất họp, yêu cầu biên bản, và nghĩa vụ minh bạch. Mọi điều khoản là BINDING.

## Thành phần Council (Council Composition)

1. Council PHẢI có từ **5 đến 9 members** (per `COUNCIL_CONFIG.size`).
2. Bầu chọn: Founder bổ nhiệm (appoint). Founder CÓ THỂ thay thế bất kỳ lúc nào.
3. Thành phần PHẢI đa dạng: kỹ thuật, giáo dục, cộng đồng, tài chính, pháp lý.
4. Ít nhất 1 member PHẢI có chuyên môn pháp lý (legal expertise).
5. Ít nhất 1 member PHẢI có chuyên môn giáo dục (education expertise).
6. KHÔNG ĐƯỢC có quá 2 members từ cùng một tổ chức. NGHIÊM CẤM.

## Nhiệm kỳ (Term Limits)

1. Nhiệm kỳ: **2 năm** (24 tháng) kể từ ngày bổ nhiệm.
2. Có thể gia hạn (renewable) 1 lần. Tổng tối đa 4 năm.
3. Sau 4 năm, member PHẢI nghỉ tối thiểu 1 năm trước khi được bổ nhiệm lại.
4. Founder CÓ THễ remove member bất kỳ lúc nào với lý do ghi rõ.
5. Member CÓ THỂ từ chức (resign) với thông báo trước 30 ngày.
6. Nếu member bị remove hoặc từ chức, Founder PHẢI bổ nhiệm thay thế trong 60 ngày.

## Định mức Quorum (Quorum)

1. Quorum PHẢI đạt **60%** số members hiện tại để họp hợp lệ.
2. Ví dụ: 5 members → quorum = 3. 9 members → quorum = 6 (làm tròn lên).
3. Nếu không đạt quorum, cuộc họp KHÔNG HỢP LỆ. BẮT BUỘC hủy.
4. Quorum PHẢI duy trì trong suốt cuộc họp. Nếu member rời giữa chừng, PHẢI kiểm tra lại quorum.
5. Remote participation (video call) CÓ THỂ counted toward quorum. YÊU CẦU camera on.

## Ngưỡng biểu quyết (Voting Thresholds)

| Loại quyết định | Ngưỡng | Ghi chú |
|----------------|--------|---------|
| Approve scholarship | Simple majority (≥ 50%) | Tối thiểu 3/5 |
| Deny scholarship | Simple majority (≥ 50%) | Tối thiểm 3/5 |
| Waitlist | 1-2 approve votes | Borderline |
| Policy amendment | Simple majority (≥ 50%) | + Founder approval |
| **Revocation of scholarship** | **2/3 supermajority** | BẮT BUỘC |
| **Removal of council member** | **2/3 supermajority** | + Founder approval |
| **Permanent ban of user** | **2/3 supermajority** | BẮT BUỘC |

- Vote PHẢI ghi rõ: `approve` / `deny` / `abstain`.
- Abstain KHÔNG ĐƯỢC counted toward majority.
- Founder CÓ THỂ override bất kỳ vote nào (Founder Override authority).

## Quy tắc Recusal (Recusal Rules)

### 5 trường hợp xung đột lợi ích

1. **Họ hàng gia đình (Family):** Quan hệ huyết thống, hôn nhân, nuôi dưỡng.
2. **Quan hệ công việc (Employment):** Công việc hiện tại hoặc trong 2 năm qua.
3. **Quan hệ đầu tư (Investment):** Đầu tư, cổ phần, hoặc thương mại chung.
4. **Tranh chấp pháp lý (Legal Dispute):** Đang hoặc đã có tranh chấp pháp lý.
5. **Quan hệ đối tác (Partnership):** Đối tác thương mại, mentorship, hoặc cộng tác.

### Hậu quả xung đột

- Member PHẢI recuse (tự rút lui) khỏi bầu chọn. BẮT BUỘC.
- Member PHẢI recuse khỏi thảo luận về ứng viên đó. BẮT BUỘC.
- Member PHẢI khai báo công khai xung đột. YÊU CẦU.
- Xung đột PHẢI ghi vào audit log. BẮT BUỘC.
- Nếu member không khai báo và bị phát hiện: Founder SHALL remove member. NGHIÊM CẤM.

## Tần suất họp (Meeting Frequency)

1. Council PHẢI họp **hàng tháng** (monthly). BẮT BUỘC.
2. Cuộc họp hàng tháng PHẢI diễn ra trong tuần đầu tiên của tháng.
3. Council PHẢI họp bổ sung (ad-hoc) khi có revocation decision. YÊU CẦU.
4. Cuộc họp PHẢI có agenda gửi trước 48 giờ. BẮT BUỘC.
5. Nếu không có agenda, cuộc họp KHÔNG HỢP LỆ.
6. Founder CÓ THỂ triệu tập họp khẩn cấp (emergency meeting) bất kỳ lúc nào.

## Yêu cầu biên bản (Minutes Requirements)

1. Mọi cuộc họp PHẢI có biên bản (minutes). BẮT BUỘC.
2. Biên bản PHẢI bao gồm: ngày, attendees, agenda, thảo luận, votes, decisions.
3. Biên bản PHẢI được lưu trong 10 năm (per `DATA_CLASSIFICATION_AND_RETENTION.md`).
4. Biên bản PHẢI được approve bởi Council trong cuộc họp tiếp theo. YÊU CẦU.
5. Biên bản KHÔNG ĐƯỢC sửa sau khi approve. NGHIÊM CẤM.
6. Biên bản SHALL được lưu trong `audit_log` class.

## Nghĩa vụ minh bạch (Transparency Obligations)

1. Council decisions PHẢI công khai (aggregate, ẩn PII). BẮT BUỘC.
2. Quarterly report PHẢI nộp Founder. BẮT BUỘC.
3. Annual report PHẢI công khai trên `docs.nguyenai.net`. YÊU CẦU.
4. Conflict of interest declarations PHẢI công khai (ẩn tên ứng viên). YÊU CẦU.
5. Council member identities CÓ THỂ ẩn (anonymized) nếu có rủi ro an toàn.
6. Founder CÓ THỂ yêu cầu Council công khai bất kỳ thông tin nào.
7. KHÔNG ĐƯỢC che giấu quyết định quan trọng. NGHIÊM CẤM.

## Scoring Rubric (7 tiêu chí)

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

## Vai trò Council Member

1. Đọc hồ sơ ứng viên đầy đủ trước họp. BẮT BUỘC.
2. Kiểm tra xung đột lợi ích và khai báo. BẮT BUỘC.
3. Thảo luận với council trong cuộc họp. YÊU CẦU.
4. Bầu chọn: `approve` / `deny` / `abstain`. BẮT BUỘC.
5. Công bố quyết định theo quy trình. YÊU CẦU.
6. Duy trì bảo mật hồ sơ. NGHIÊM CẤM leak.

---
*Tiêu liệu này là BINDING. Sửa đổi yêu cầu Founder decision.*
