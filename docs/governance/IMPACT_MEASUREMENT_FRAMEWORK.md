# KHUNG ĐO LƯỜNG TÁC ĐỘNG

**Trạng thái:** BINDING · **Ngày:** 2026-07-14
**Nguồn:** PHẦN VIII kế hoạch cũ + Hiến chương Điều 10 (chỉ số pilot 90 ngày) + PHASE 13 phán quyết Founder (10 báo cáo)

---

## 1. NGUYÊN TẮC ĐO LƯỜNG (KHÓA)

1.1. **Đo bằng kết quả thật** — đăng ký, học, sản phẩm, việc làm, dự án. KHÔNG đo bằng lượt theo dõi.
1.2. **Số thật, có bằng chứng** — mọi số liệu có nguồn tra cứu được (biên nhận, hồ sơ, audit log).
1.3. **Nói thẳng cái chưa đạt** — báo cáo ghi cả đạt và chưa đạt, không tô hồng.
1.4. **Đo định kỳ** — hằng tuần (dashboard) + hằng giai đoạn (báo cáo tổng).

## 2. 4 NHÓM CHỈ SỐ (KHÓA)

### 2.1. Nhóm Người Học
| Chỉ số | Mục tiêu pilot 90 ngày | Đo bằng |
|---|---|---|
| Số người đăng ký | 100 | Đăng ký thật trên hệ thống |
| Hoàn thành onboarding | 80% | Đi trọn 10 bước Bước 1→10 |
| Hoàn thành sản phẩm | ≥60 | Sản phẩm mức ≥2 có biên nhận |
| Hoàn thành Cấp 1 | ≥40 | Chứng nhận Căn Bản |
| Vào Cấp 2 | ≥20 | Chứng nhận Nghề |

### 2.2. Nhóm Doanh Nghiệp
| Chỉ số | Mục tiêu pilot | Đo bằng |
|---|---|---|
| Doanh nghiệp xác minh | ≥10 | Đăng ký + xác minh mã số thuế |
| Dự án thật giao | ≥20 | Brief có 9 trường + biên nhận |
| Việc làm đăng | ≥15 | Tin tuyển dụng xác minh |
| Người học có việc | ≥10 | Biên nhận hoàn thành việc |

### 2.3. Nhóm Giáo Dục
| Chỉ số | Mục tiêu pilot | Đo bằng |
|---|---|---|
| Mentor hoạt động | ≥20 | Có ≥1 nhóm + chấm rubric |
| Chương trình Đà Lạt | 1 | 7 ngày + nghiệm thu |
| Học bổng cấp | 11 suất | Quy trình 9 bước PHASE 8 |
| Chứng nhận tra cứu | 100% | `/xac-minh/` hoạt động |

### 2.4. Nhóm Xã Hội
| Chỉ số | Mục tiêu pilot | Đo bằng |
|---|---|---|
| Sản phẩm cộng đồng | ≥5 | Dự án cộng đồng có nghiệm thu |
| Người học từ nông thôn | ≥20 | Hồ sơ ghi khu vực |
| Người học họ Nguyễn | ≥30 | Hồ sơ ghi họ (ưu tiên ban đầu) |
| Cựu học viên quay lại | ≥5 | Giao việc/hướng dẫn lớp sau |

## 3. 10 BÁO CÁO (KHASE 13 — KHÓA DANH MỤC)

| # | Báo cáo | Tần suất | Nguồn dữ liệu |
|---|---|---|---|
| 1 | Báo cáo đăng ký + onboarding | Hằng tuần | `users` + `learner_profiles` |
| 2 | Báo cáo học tập + hoàn thành | Hằng tuần | `submissions` + `reviews` |
| 3 | Báo cáo sản phẩm + biên nhận | Hằng tuần | `products` + `verification_records` |
| 4 | Báo cáo dự án | Hằng 2 tuần | `projects` + `project_members` |
| 5 | Báo cáo việc làm | Hằng 2 tuần | `jobs` + `applications` |
| 6 | Báo cáo mentor | Hằng tháng | `mentor_sessions` |
| 7 | Báo cáo học bổng | Hằng tháng | `scholarships` |
| 8 | Báo cáo offline + Đà Lạt | Theo đợt | `offline_cohorts` + `attendance` |
| 9 | Báo cáo riêng tư + audit | Hằng tháng | `audit_logs` |
| 10 | Báo cáo tác động tổng 90 ngày | Cuối pilot | Tổng hợp 1-9 |

## 4. DASHBOARD TÁC ĐỘNG (KHÓA)

4.1. Dashboard công khai tại `/tac-dong/` — hiển thị chỉ số nhóm 2.1-2.4 (số thật, cập nhật hằng tuần).
4.2. Dashboard nội bộ (admin) — chi tiết hơn, có audit log + cảnh báo.
4.3. Dashboard không hiển thị thông tin nhận diện cá nhân.

## 5. FINAL EXIT GATE — CHỈ SỐ PILOT (KHÓA)

Chỉ khi đủ toàn bộ:
- 100 người học onboard · 80% hoàn thành onboarding · ≥60 sản phẩm · ≥20 dự án thật · ≥10 doanh nghiệp · ≥20 mentor · biên nhận hoạt động · quy trình học bổng hoạt động · 1 hoạt động Đà Lạt

...team mới được viết: **"Tuổi Trẻ Tương Lai và Người Trẻ Làm is operational as a complete education, practice, employment and entrepreneurship ecosystem."**

## 6. CẤM (KHÓA)

6.1. Cấm báo cáo số không có bằng chứng tra cứu được.
6.2. Cấm ẩn số chưa đạt — phải ghi rõ cái gì chưa đạt và lý do.
6.3. Cấm đếm bot/ảo vào chỉ số người học.
6.4. Cấm báo cáo "hoàn thành" khi chưa qua exit gate.

---
**Hiệu lực:** File này khóa khung đo lường. Mọi thay đổi chỉ số cần Founder duyệt.
