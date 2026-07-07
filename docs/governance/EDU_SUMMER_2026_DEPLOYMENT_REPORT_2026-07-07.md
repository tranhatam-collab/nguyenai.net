# Edu Summer 2026 Deployment Report

**Date:** 2026-07-07
**Task:** Thêm số điện thoại hỗ trợ + Tạo trang chương trình hè 2026 + Deploy
**Status:** ✅ DEPLOYED (có chỉnh sửa cần làm)

---

## ✅ Đã hoàn thành

### 1. Thêm số điện thoại hỗ trợ vào edu.nguyenai.net

**Files đã sửa:**
- `apps/edu/src/pages/index.astro` — Hero section
- `apps/edu/src/pages/about.astro` — Section "Liên hệ"
- `apps/edu/src/pages/summer-2026.astro` — Section "Liên hệ hỗ trợ"

**Nội dung hiện tại:**
```
📱 Hotline: 0989660750
💬 Zalo: 0989660750
```

**Vấn đề:** Hiện tại đang hiển thị 2 dòng riêng biệt (Hotline và Zalo). Người dùng muốn gộp thành 1 dòng: "Hotline/Zalo: 0989660750"

---

### 2. Tạo trang chương trình hè 2026

**File:** `apps/edu/src/pages/summer-2026.astro`

**Nội dung:** Bài dài đầy đủ về chương trình hè 2026 bao gồm:
- Vì sao chương trình được xây dựng
- Chương trình dành cho ai
- 8 lĩnh vực trọng tâm
- Hình thức học (trực tuyến + Đà Lạt)
- Học bổng tháng 7/2026
- Điều quan trọng cần nói rõ (không hứa việc làm)
- Sau chương trình người học cần có gì
- Ai nên đăng ký sớm
- Đăng ký (CTA → /apply)
- Liên hệ hỗ trợ

**Link:** https://edu.nguyenai.net/summer-2026

---

### 3. Deploy lên Cloudflare Pages

**Project:** `nguyenai-edu` (đã có sẵn với domain edu.nguyenai.net)

**Deploy URL:** https://6dd37467.nguyenai-edu-64n.pages.dev

**Custom domain:** https://edu.nguyenai.net (đã cấu hình sẵn)

**Build status:** ✅ PASS

**Commits:**
- `119ea97` — feat(edu): add hotline/Zalo support + summer 2026 program page
- `25ea0aa` — fix(edu): update phone icon from 📞 to 📱 for hotline

---

## ⚠️ Cần chỉnh sửa (Chưa làm)

### 1. Gộp hotline và zalo thành 1 dòng

**Yêu cầu:** Thay vì 2 dòng riêng biệt:
```
📱 Hotline: 0989660750
💬 Zalo: 0989660750
```

Thành 1 dòng:
```
📱 Hotline/Zalo: 0989660750
```

**Files cần sửa:**
- `apps/edu/src/pages/index.astro` (line 44-53)
- `apps/edu/src/pages/about.astro` (line 95-106)
- `apps/edu/src/pages/summer-2026.astro` (line 283-294)

**Lý do chưa làm:** Emoji bị encoding issue khi dùng edit tool, người dùng nói "thôi khỏi"

---

## 📝 Bài đăng mạng xã hội (Đã chuẩn bị)

### Facebook/Zalo/LinkedIn

```
Hè 2026, Nguyễn AI Edu mở chuỗi chương trình học, làm thêm, định hướng việc làm và hỗ trợ khởi nghiệp cho sinh viên toàn quốc.

Chương trình dành cho sinh viên sắp ra trường, đã ra trường, người trẻ muốn học thêm, làm thêm, đổi hướng nghề nghiệp hoặc bắt đầu xây dựng con đường tự chủ bằng trí tuệ nhân tạo, công nghệ và khởi nghiệp.

Học trực tuyến toàn quốc.
Trải nghiệm trực tiếp tại Đà Lạt, Lâm Đồng khi có lịch tổ chức.

Nội dung tập trung vào:
• Sử dụng trí tuệ nhân tạo cho học tập và công việc
• Xây dựng hồ sơ năng lực cá nhân
• Tìm việc, làm thêm, thực tập và làm dự án thật
• Sáng tạo nội dung và xây dựng thương hiệu cá nhân
• Phát triển thương hiệu địa phương, thương hiệu quốc gia
• Khởi nghiệp nhỏ, kinh doanh số và vận hành dự án
• Định hướng nghề nghiệp mới để tự do hơn, chủ động hơn

Tháng 7/2026 ưu tiên 11 suất học bổng đầu tiên cho mỗi nhóm chương trình.
Ưu tiên người đăng ký sớm, đặc biệt là những bạn mang họ Nguyễn.

Sau khi hết suất học bổng, người học có thể chọn các chương trình miễn phí, chương trình hỗ trợ một phần hoặc các khóa học có phí.

Đây không phải lời hứa việc làm chắc chắn. Đây là một cơ hội học thật, làm thật, tạo hồ sơ thật, sản phẩm thật và mở ra hướng đi mới cho những người sẵn sàng nghiêm túc với tương lai của mình.

📱 Hotline/Zalo: 0989660750

👉 Đăng ký ngay: https://edu.nguyenai.net/summer-2026

#NguyenAI #NguyenAIEdu #HocBong #KhoiNghiep #AI #TriTueNhanTao #SinhVien #LamThem #DaLat #LamDong #HocOnline #KyNangMoi #Nguyen #CongDongNguyen
```

### Twitter/X

```
Hè 2026 — Nguyễn AI Edu mở chuỗi chương trình học, làm thêm, khởi nghiệp cho sinh viên toàn quốc.

✅ Học AI, xây dựng hồ sơ năng lực
✅ Tìm việc, làm thêm, thực tập thật
✅ Khởi nghiệp nhỏ, kinh doanh số
✅ 11 suất học bổng tháng 7/2026
✅ Học trực tuyến + trải nghiệm Đà Lạt

📱 Hotline/Zalo: 0989660750

👉 Đăng ký: https://edu.nguyenai.net/summer-2026

#NguyenAI #AI #Startup #Scholarship #Vietnam
```

### Instagram

```
🎓 Hè 2026 — Nguyễn AI Edu mở chuỗi chương trình học, làm thêm, khởi nghiệp cho sinh viên toàn quốc.

Học AI, xây dựng hồ sơ năng lực, tìm việc, làm thêm, khởi nghiệp nhỏ.

📍 Học trực tuyến toàn quốc
📍 Trải nghiệm trực tiếp tại Đà Lạt
📍 11 suất học bổng tháng 7/2026

📱 Hotline/Zalo: 0989660750

Link trong bio 👆

#NguyenAI #NguyenAIEdu #HocBong #KhoiNghiep #AI #SinhVien #DaLat #Vietnam
```

---

## 🔗 Links

- **Trang chủ:** https://edu.nguyenai.net
- **Trang chương trình hè 2026:** https://edu.nguyenai.net/summer-2026
- **Trang đăng ký:** https://edu.nguyenai.net/apply
- **Deploy URL:** https://6dd37467.nguyenai-edu-64n.pages.dev

---

## 📋 Action Items cho team khác

1. **Gộp hotline và zalo thành 1 dòng** trong 3 files:
   - `apps/edu/src/pages/index.astro`
   - `apps/edu/src/pages/about.astro`
   - `apps/edu/src/pages/summer-2026.astro`

2. **Rebuild và deploy** sau khi sửa

3. **Đăng bài** lên Facebook, LinkedIn, Zalo với bài đăng đã chuẩn bị ở trên

---

## 📊 Summary

| Item | Status |
|------|--------|
| Thêm số điện thoại vào web | ✅ Done (cần chỉnh sửa format) |
| Tạo trang /summer-2026 | ✅ Done |
| Deploy lên Cloudflare Pages | ✅ Done |
| Gộp hotline/zalo thành 1 dòng | ⏳ Pending (giao team khác) |
| Đăng bài mạng xã hội | ⏳ Pending (giao team khác) |

---

**Generated by:** Devin AI
**Date:** 2026-07-07
