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

> 3 bài đăng dưới đây phối hợp trước sau với bài web: bài 1 dành cho sinh viên sắp ra trường, bài 2 dành cho người muốn làm thêm/đổi hướng nghề nghiệp, bài 3 dành cho người yêu thích AI và khởi nghiệp.

### Bài 1: Dành cho sinh viên sắp ra trường

```
Có một mùa hè rất quan trọng với sinh viên sắp ra trường.

Đó không chỉ là mùa nghỉ cuối cùng trước khi bước vào đời sống nghề nghiệp. Đó còn là thời gian để chuẩn bị lại hồ sơ, học thêm một năng lực mới, làm thử một dự án, hiểu rõ hơn mình có thể làm gì và muốn đi theo hướng nào.

Hè 2026, Nguyễn AI Edu mở chuỗi chương trình học tập, thực hành, định hướng việc làm, làm thêm và khởi nghiệp cho sinh viên toàn quốc.

Học trực tuyến từ mọi tỉnh thành.
Một số hoạt động trực tiếp sẽ được tổ chức tại Đà Lạt, tỉnh Lâm Đồng khi có lịch phù hợp.

Chương trình dành cho những bạn muốn:

• dùng trí tuệ nhân tạo cho học tập và công việc;
• xây dựng hồ sơ năng lực cá nhân;
• tìm việc, làm thêm, thực tập hoặc tham gia dự án thật;
• sáng tạo nội dung và xây dựng thương hiệu cá nhân;
• thử sức với khởi nghiệp nhỏ, kinh doanh số, thương hiệu địa phương;
• chuẩn bị nghiêm túc hơn cho tương lai nghề nghiệp.

Tháng 7 năm 2026, Nguyễn AI Edu ưu tiên các suất học bổng đầu tiên cho người đăng ký sớm. Ưu tiên người mang họ Nguyễn, yêu thích trí tuệ nhân tạo, công nghệ, giáo dục, khởi nghiệp và mong muốn tạo ra giá trị thật.

Một mùa hè có thể trôi qua rất nhanh.
Nhưng nếu bắt đầu đúng, nó có thể trở thành điểm rẽ.

Đăng ký tại edu.nguyenai.net.

#NguyenAI #NguyenAIEdu #HocBong #KhoiNghiep #AI #TriTueNhanTao #SinhVien #DaLat #Vietnam
```

### Bài 2: Dành cho người muốn làm thêm, tìm việc, đổi hướng nghề nghiệp

```
Bạn đang tìm việc?
Bạn muốn làm thêm trong mùa hè?
Bạn đã ra trường nhưng vẫn chưa thấy rõ con đường tiếp theo?
Bạn muốn học thêm trí tuệ nhân tạo để mở ra một hướng nghề nghiệp mới?

Nguyễn AI Edu mở chương trình hè 2026 dành cho sinh viên, người mới ra trường và người trẻ muốn xây dựng năng lực làm việc trong thời đại mới.

Chúng tôi không xem làm thêm chỉ là một công việc tạm thời. Nếu được hướng dẫn đúng, làm thêm có thể trở thành một phần của hồ sơ năng lực. Một dự án nhỏ cũng có thể giúp bạn hiểu cách làm việc, cách trình bày, cách nhận phản hồi và cách tạo ra giá trị.

Các hướng thực hành gồm:

• hồ sơ năng lực cá nhân;
• tìm việc và thực tập;
• làm thêm theo dự án;
• hỗ trợ nội dung, truyền thông, nghiên cứu, cộng đồng;
• sử dụng trí tuệ nhân tạo cho công việc;
• xây dựng thương hiệu cá nhân;
• khởi nghiệp nhỏ và kinh doanh số;
• phát triển sản phẩm, thương hiệu địa phương, thương hiệu Việt Nam.

Chương trình học trực tuyến toàn quốc.
Một số hoạt động trực tiếp được tổ chức tại Đà Lạt, Lâm Đồng khi có lịch.

Tháng 7 năm 2026 ưu tiên người đăng ký trước.
Ưu tiên người mang họ Nguyễn và những người có tinh thần học thật, làm thật, tạo sản phẩm thật.

Theo dõi và đăng ký tại edu.nguyenai.net.

#NguyenAI #NguyenAIEdu #ViecLam #LamThem #ThucTap #AI #KhoiNghiep #Nguyen #Vietnam
```

### Bài 3: Dành cho người yêu thích trí tuệ nhân tạo và khởi nghiệp

```
Trí tuệ nhân tạo không chỉ dành cho người làm công nghệ.

Một sinh viên có thể dùng trí tuệ nhân tạo để học tốt hơn.
Một người trẻ có thể dùng trí tuệ nhân tạo để xây hồ sơ năng lực.
Một người sáng tạo có thể dùng trí tuệ nhân tạo để viết, nghiên cứu, lập kế hoạch và xây nội dung.
Một người muốn khởi nghiệp có thể dùng trí tuệ nhân tạo để thử ý tưởng, hiểu khách hàng, xây trang giới thiệu, tạo sản phẩm nhỏ và kiểm tra thị trường.

Hè 2026, Nguyễn AI Edu mở chuỗi chương trình học tập và thực hành cho những người trẻ yêu thích trí tuệ nhân tạo, công nghệ, khởi nghiệp, thương hiệu cá nhân, thương hiệu địa phương và sản phẩm Việt Nam.

Chương trình hướng đến:

• học để làm được việc;
• làm để tạo sản phẩm;
• tạo sản phẩm để xây hồ sơ;
• xây hồ sơ để mở ra cơ hội;
• dùng trí tuệ nhân tạo để tăng năng lực con người, không thay thế tư duy con người.

Học trực tuyến toàn quốc.
Trải nghiệm trực tiếp tại Đà Lạt, Lâm Đồng khi chương trình mở lịch.

Tháng 7 năm 2026 có các suất học bổng ưu tiên cho người đăng ký sớm. Sau khi hết học bổng, người học có thể chọn chương trình miễn phí còn mở, chương trình hỗ trợ một phần hoặc khóa học có phí trên edu.nguyenai.net.

Ưu tiên người mang họ Nguyễn.
Chào đón những người trẻ nghiêm túc, có khát vọng học tập, làm việc, khởi nghiệp và tạo giá trị thật.

Đăng ký tại edu.nguyenai.net.

#NguyenAI #NguyenAIEdu #AI #TriTueNhanTao #KhoiNghiep #CongNghe #SangTao #DaLat #Vietnam
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
