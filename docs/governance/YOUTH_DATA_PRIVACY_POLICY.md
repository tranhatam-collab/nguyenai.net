# CHÍNH SÁCH QUYỀN RIÊNG TƯ NGƯỜI HỌC

**Trạng thái:** BINDING · **Ngày:** 2026-07-14
**Nguồn:** Hiến chương Điều 7 + PHASE 9 phán quyết Founder (consent, phân loại, biên nhận, <18 tuổi) + DATA_CLASSIFICATION_AND_RETENTION.md

---

## 1. NGUYÊN TẮC CỐT LÕI (KHÓA)

1.1. Hồ sơ người học **riêng tư mặc định** — chỉ công khai từng trường khi người học bật.
1.2. Thu thập theo mục đích — có consent, thời hạn, thu hồi.
1.3. Xuất và xóa dữ liệu là quyền bắt buộc có.
1.4. Mọi truy cập hồ sơ bởi doanh nghiệp/chuyên gia đều ghi audit log.
1.5. Doanh nghiệp chỉ thấy trường người học cho phép khi ứng tuyển.

## 2. PHÂN LOẠI DỮ LIỆU NGƯỜI HỌC (KHÓA — 4 NHÓM)

| Nhóm | Ví dụ | Quyền truy cập |
|---|---|---|
| **Công khai** (khi người học bật) | Tên hiển thị, hồ sơ năng lực, sản phẩm, chứng nhận | Ai cũng xem được |
| **Hạn chế** | Email, số điện thoại, hồ sơ học tập chi tiết | Người học + mentor + admin + doanh nghiệp (khi ứng tuyển) |
| **Riêng tư** | Đánh giá đầu vào, bản đồ 90 ngày, nhật ký học | Người học + mentor được phân công + admin |
| **Nhạy cảm** | CMND, thông tin thanh toán, dữ liệu sức khỏe, <18 tuổi | Chỉ admin + mã hóa — không hiển thị giao diện |

## 3. CONSENT (KHÓA)

3.1. **Đăng ký:** người học đồng ý điều khoản + chính sách riêng tư khi đăng ký.
3.2. **Từng trường:** người học bật/tắt công khai từng trường riêng (không all-or-nothing).
3.3. **Doanh nghiệp:** khi ứng tuyển, người học chọn trường nào doanh nghiệp được xem.
3.4. **Thu hồi:** người học rút consent bất kỳ lúc nào — dữ liệu chuyển về riêng tư trong 24h.
3.5. **Xuất dữ liệu:** người học yêu cầu xuất toàn bộ dữ liệu (JSON) trong 7 ngày.
3.6. **Xóa dữ liệu:** người học yêu cầu xóa tài khoản — soft-delete 30 ngày rồi xóa cứng (trừ biên nhận đã cấp — giữ mã tra cứu nhưng ẩn tên).

## 4. NGƯỜI DƯỚI 18 TUỔI (KHÓA)

4.1. Cần xác nhận người giám hộ (email/SMS + đồng ý văn bản).
4.2. Không hiển thị thông tin liên lạc công khai.
4.3. Không tham gia chương trình Đà Lạt không có người giám hộ đồng hành hoặc ủy quyền.
4.4. Dữ liệu nhạy cảm mã hóa thêm一层 — không hiển thị trên giao diện.
4.5. Không gửi email marketing trực tiếp — gửi qua người giám hộ.

## 5. TÁC NHÂN AI VÀ DỮ LIỆU (KHÓA — PHASE 9)

5.1. **8 tác nhân/người học** qua Cổng huấn luyện AI Nguyễn với identity + output guard.
5.2. **Danh tính:** tác nhân biết người học là ai, cấp quyền theo vai trò.
5.3. **Kiểm đầu ra:** mọi output tác nhân qua output guard — không lộ dữ liệu riêng tư khác người.
5.4. **Biên nhận:** mọi tương tác tác nhân ghi biên nhận — ai hỏi, hỏi gì, trả lời gì, lúc nào.
5.5. **Hành động nhạy cảm** (xóa, sửa hồ sơ, nộp sản phẩm) cần duyệt + biên nhận.
5.6. Dữ liệu tương tác với AI tuân theo Codex Nguyễn AI — không dùng dữ liệu người học để huấn luyện mô hình công khai.

## 6. TRUY CẬP HỒ SƠ (KHÓA)

6.1. **Admin:** truy cập toàn bộ — nhưng mọi truy cập ghi audit log.
6.2. **Mentor:** chỉ xem hồ sơ người học được hướng dẫn.
6.3. **Doanh nghiệp:** chỉ xem trường người học cho phép khi ứng tuyển.
6.4. **Người học khác:** chỉ xem trường công khai.
6.5. **QA:** truy cập đọc (không sửa) cho audit — ghi audit log.

## 7. MÃ HÓA VÀ LƯU TRỮ (KHÓA)

7.1. Trường liên lạc (email, số điện thoại) mã hóa trong database.
7.2. Dữ liệu nhạy cảm (CMND, thanh toán) mã hóa thêm一层.
7.3. Soft-delete mặc định — job xóa cứng chạy định kỳ cho dữ liệu đã qua thời hạn giữ.
7.4. Mọi bảng có created_at + updated_at.
7.5. Backup theo DATA_CLASSIFICATION_AND_RETENTION.md.

## 8. BIÊN NHẬN VÀ KIỂM CHỨNG (KHÓA)

8.1. Mọi truy cập hồ sơ riêng tư sinh biên nhận: ai truy cập · xem gì · lúc nào · lý do.
8.2. Người học xem được biên nhận truy cập hồ sơ mình.
8.3. Biên nhận tra cứu tại `/xac-minh/`.

## 9. CẤM (KHÓA)

9.1. Cấm bán/cho dữ liệu người học cho bên thứ ba.
9.2. Cấm dùng dữ liệu người học để huấn luyện mô hình công khai.
9.3. Cấm truy cập hồ sơ không ghi audit log.
9.4. Cấm hiển thị thông tin liên lạc người dưới 18 công khai.
9.5. Cấm từ chối yêu cầu xuất/xóa dữ liệu của người học.

---
**Hiệu lực:** File này khóa chính sách riêng tư. Mọi thay đổi cần Founder duyệt.
