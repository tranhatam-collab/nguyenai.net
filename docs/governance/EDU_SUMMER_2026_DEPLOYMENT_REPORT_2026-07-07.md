# Edu Summer 2026 Deployment Report

**Date:** 2026-07-07
**Task:** Audit + sửa lỗi SEO/brand + tạo trang EN + deploy edu.nguyenai.net
**Status:** ✅ DEPLOYED và verified trên custom domain

---

## Báo cáo audit (đỏ trước, xanh sau)

### 🔴 Lỗi phát hiện khi audit bản deploy trước

| # | Lỗi | File | Nguyên nhân |
|---|---|---|---|
| R1 | Emoji hỏng (U+FFFD) | index.astro, about.astro, summer-2026.astro | Encoding bị break khi edit tool xử lý emoji 📱 |
| R2 | Hotline/Zalo 2 dòng | 3 files | Báo cáo trước tự thừa nhận chưa gộp, giao "team khác" |
| R3 | Không có bản EN | `/en/summer-2026.astro` | Layout tạo hreflang `en` → `/en/summer-2026` nhưng file không tồn tại → 404, vi phạm AGENTS.md SEO rules |
| R4 | Sitemap thiếu routes | sitemap.xml.ts | `/summer-2026`, `/apply`, toàn bộ `/en/` routes không có |
| R5 | Deploy sai account | Cloudflare | Deploy vào account Tranhatam (`f3f9e76...`) thay vì Anhhatam (`62d57ea...`) → custom domain 404 |

### ✅ Đã fix

| # | Fix | Cách |
|---|---|---|
| R1 | Thay emoji hỏng bằng HTML entity `&#128241;` | Python script, 3 files |
| R2 | Gộp Hotline + Zalo thành 1 dòng "Hotline/Zalo: 0989660750" | 3 files |
| R3 | Tạo `apps/edu/src/pages/en/summer-2026.astro` (292 dòng, bản EN đầy đủ) | New file |
| R4 | Thêm `/summer-2026`, `/apply`, `/en/*` routes vào sitemap | Edit sitemap.xml.ts |
| R5 | Deploy đúng account `62d57eaa548617aeecac766e5a1cb98e` | `CLOUDFLARE_ACCOUNT_ID` env var |

---

## Files đã thay đổi

### Modified
- `apps/edu/src/pages/index.astro` — fix emoji + gộp Hotline/Zalo
- `apps/edu/src/pages/about.astro` — fix emoji + gộp Hotline/Zalo
- `apps/edu/src/pages/summer-2026.astro` — fix emoji + gộp Hotline/Zalo
- `apps/edu/src/pages/sitemap.xml.ts` — thêm summer-2026, apply, EN routes
- `AGENTS.md` — thêm Cloudflare deployment accounts table (lesson learned)

### New
- `apps/edu/src/pages/en/summer-2026.astro` — bản English đầy đủ (292 dòng)

---

## Verification (chạy thật, không đoán)

### Build
```bash
pnpm --filter @nai/edu build
# ✓ Completed in 272ms
# [build] Server built in 2.59s
# [build] Complete!
```

### Brand audit
```bash
bash tools/audit-brand-naming-lock.sh
# === BRAND NAMING AUDIT PASSED ===
# 0 violations found. All naming follows FOUNDER_BRAND_NAMING_LOCK.
```

### Sitemap
```bash
grep "summer-2026\|apply" apps/edu/dist/sitemap.xml
# https://edu.nguyenai.net/summer-2026
# https://edu.nguyenai.net/apply
# https://edu.nguyenai.net/en/summer-2026
# https://edu.nguyenai.net/en/apply
```

### Live site verify (custom domain `edu.nguyenai.net`)

| URL | HTTP | Hotline/Zalo 1 dòng | hreflang |
|---|---|---|---|
| `/summer-2026/` | 200 | ✅ | vi + en + x-default |
| `/en/summer-2026/` | 200 | ✅ | vi + en + x-default |
| `/` (index) | 200 | ✅ | — |
| `/about/` | 200 | ✅ | — |

### Deploy info

- **Account:** Anhhatam@gmail.com (`62d57eaa548617aeecac766e5a1cb98e`)
- **Project:** `nguyenai-edu`
- **Deploy URL:** https://8bd2b593.nguyenai-edu.pages.dev
- **Custom domain:** https://edu.nguyenai.net
- **Build status:** ✅ PASS

---

## SEO compliance (per AGENTS.md)

| Rule | Status |
|---|---|
| Vietnamese root `/` | ✅ |
| English root `/en/` | ✅ |
| Reciprocal hreflang | ✅ (vi ↔ en) |
| Self-referencing hreflang | ✅ |
| x-default → Vietnamese | ✅ |
| Canonical URL | ✅ |
| No query-string language switching | ✅ |
| Sitemap includes all public routes | ✅ |
| OG + Twitter cards | ✅ |
| `lang` attribute correct | ✅ (vi/en) |

---

## Brand compliance (per FOUNDER_BRAND_NAMING_LOCK)

| Rule | Status |
|---|---|
| Brand audit pass | ✅ 0 violations |
| "Nguyễn AI Edu" (VI) | ✅ |
| "Nguyen AI Edu" (EN) | ✅ |
| No banned names | ✅ |

---

## Bài đăng mạng xã hội

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

## Links

- **Trang chủ:** https://edu.nguyenai.net
- **Trang chương trình hè 2026 (VI):** https://edu.nguyenai.net/summer-2026
- **Trang chương trình hè 2026 (EN):** https://edu.nguyenai.net/en/summer-2026
- **Trang đăng ký:** https://edu.nguyenai.net/apply
- **Sitemap:** https://edu.nguyenai.net/sitemap.xml

---

## Action items còn lại

1. **Đăng bài mạng xã hội** lên Facebook, LinkedIn, Zalo với bài đăng đã chuẩn bị
2. **Submit sitemap** lên Google Search Console (nếu chưa)
3. **Verify các project Cloudflare khác** (web, console, invest, api) đang ở account nào — cập nhật vào AGENTS.md

---

**Generated by:** Devin AI
**Date:** 2026-07-07
