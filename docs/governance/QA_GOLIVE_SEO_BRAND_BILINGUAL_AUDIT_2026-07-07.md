# QA AUDIT GO-LIVE — SEO · THƯƠNG HIỆU · SONG NGỮ · HÌNH ẢNH

**Ngày:** 2026-07-07
**Chuẩn gốc:** Tiếng Việt là ngôn ngữ gốc (x-default → VI). Tiếng Anh là ngôn ngữ quốc tế thứ 2.
**Chuẩn thương hiệu:** `docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md`
**Phương pháp:** Chạy 11 audit tự động (`pnpm audit:all` — 11/11 PASS) + kiểm tra thủ công trên HTML build mới nhất (build lại toàn bộ trước khi audit, 77/77 task PASS).

> ⚠️ **Kết luận tổng:** Các audit tự động PASS nhưng KHÔNG bắt được lỗi thật trên HTML build.
> Kiểm tra thủ công phát hiện **7 lỗi P0 (chặn go-live), 9 lỗi P1, 8 lỗi P2**.
> **KHÔNG go-live edu và invest cho đến khi fix xong toàn bộ P0.**
> apps/web (nguyenai.net) đạt chuẩn tốt nhất — chỉ còn 1 lỗi P0 (Google verification placeholder).

---

## BẢNG TỔNG HỢP

| App | Domain | Trạng thái SEO | Lỗi P0 | Lỗi P1 | Lỗi P2 |
|---|---|---|---|---|---|
| apps/web | nguyenai.net | 🟡 Gần đạt | 1 | 2 | 2 |
| apps/edu | edu.nguyenai.net | 🔴 KHÔNG ĐẠT | 4 | 3 | 2 |
| apps/invest | invest.nguyenai.net | 🔴 KHÔNG ĐẠT | 2 | 4 | 3 |
| apps/console | app.nguyenai.net | 🟢 Đạt (noindex đúng thiết kế) | 0 | 0 | 1 |

---

## P0 — CHẶN GO-LIVE (7 lỗi, buộc fix 100%)

### P0-1. [WEB] Google Search Console verification là placeholder
- **File:** `apps/web/public/google-site-verification.txt`
- Nội dung hiện tại: `google-site-verification: nguyenai.net (placeholder — replace with actual verification code...)`
- **Hậu quả:** Không verify được Search Console → không submit sitemap, không theo dõi index.
- **Fix:** Lấy mã verification thật từ Google Search Console (việc thủ công của Founder), thay file.

### P0-2. [EDU] Toàn bộ trang EN bị gắn `lang="vi"`
- **File:** `apps/edu/src/layouts/AcademyLayout.astro:21` — `<html lang="vi">` hardcode.
- **Bằng chứng build:** `dist/en/about/index.html` → `<html lang="vi">`.
- **Hậu quả:** Google hiểu sai ngôn ngữ trang EN; vi phạm chuẩn song ngữ.
- **Fix:** Thêm prop `locale` vào layout, render `lang={locale}` (giống web/invest).

### P0-3. [EDU] Cụm hreflang hỏng hoàn toàn trên trang EN
- **File:** `apps/edu/src/layouts/AcademyLayout.astro:29-32` — sinh hreflang từ `Astro.url.pathname` thô.
- **Bằng chứng build** (`dist/en/about/index.html`):
  - `hreflang="vi"` → `https://edu.nguyenai.net/en/about/` (SAI — đây là URL EN)
  - `hreflang="en"` → `https://edu.nguyenai.net/en/en/about/` (URL KHÔNG TỒN TẠI)
  - `x-default` → URL EN (SAI — chuẩn gốc là VI)
- **Hậu quả:** Google bỏ qua toàn bộ tín hiệu song ngữ; nguy cơ index nhầm/duplicate.
- **Fix:** Chuẩn hoá pathname (strip `/en` trước khi ghép), x-default LUÔN trỏ về URL tiếng Việt.

### P0-4. [EDU] Trang tiếng Việt mang title + meta description tiếng Anh
- **Bằng chứng build:**
  - `/` → title `Nguyen AI Academy`, desc `Free AI learning for Nguyen AI subscribers — 10 tracks...` (EN 100%)
  - `/about` → title `About — Nguyen AI Academy`, desc EN 100%
  - `/certification` → title `Certification — ...`, desc EN 100%
- **Nguồn lỗi:** default props EN trong `AcademyLayout.astro:11-13` + các trang VI không truyền title/description tiếng Việt.
- **Hậu quả:** Vi phạm trực tiếp chuẩn "Tiếng Việt là gốc"; kết quả tìm kiếm VI hiển thị tiếng Anh.
- **Fix:** Viết title/description tiếng Việt cho TỪNG trang VI; default của layout phải là VI.

### P0-5. [EDU] Open Graph hỏng + thiếu — share link ra ngoài bị trắng
- **File:** `apps/edu/src/layouts/AcademyLayout.astro:40`
- `og:url` dùng thuộc tính `href=` thay vì `content=` → tag VÔ HIỆU.
- `og:title` bị lặp suffix: `About — Nguyen AI Academy — Nguyen AI Academy`.
- **KHÔNG có** `og:image`, **KHÔNG có** `twitter:card` trên toàn bộ edu.
- **Fix:** Sửa `href=` → `content=`; bỏ lặp suffix; thêm `og:image` (tái dùng `og-academy.png` đã có ở `apps/web/public/`) + twitter card, theo đúng khối SEO của `apps/web/src/layouts/BaseLayout.astro:74-87`.

### P0-6. [INVEST] Không có bất kỳ Open Graph / Twitter tag nào
- **File:** `apps/invest/src/layouts/InvestLayout.astro` — head chỉ có title/description/robots/canonical/hreflang.
- **Hậu quả:** Share trang invest cho nhà đầu tư (use case chính!) → không ảnh, không title chuẩn.
- **Fix:** Thêm đủ og:title/description/url/site_name/image (`og-invest.png` đã có sẵn ở web/public) + twitter card.

### P0-7. [INVEST] robots.txt khai báo sitemap nhưng sitemap KHÔNG tồn tại
- **Bằng chứng:** `apps/invest/dist/` không có `sitemap.xml`, trong khi `robots.txt` khai `Sitemap: https://invest.nguyenai.net/sitemap.xml`.
- Nguyên nhân: invest chạy SSR toàn phần, không có bước sinh sitemap.
- **Fix:** Sinh sitemap tĩnh cho các trang public VI+EN (kèm hreflang như `apps/web/dist/sitemap-vi.xml` đang làm đúng), đặt vào `apps/invest/public/`.

### Liên quan P0 — [EDU] robots.txt trỏ sai tên sitemap
- `apps/edu/dist/robots.txt` khai `Sitemap: .../sitemap-index.xml` nhưng file thật là `sitemap.xml`. Fix cùng đợt P0 (sửa 1 dòng trong `apps/edu/public/robots.txt`).

---

## P1 — BUỘC FIX TRƯỚC LAUNCH (9 lỗi)

### P1-1. [EDU] Sitemap không có URL tiếng Anh nào + chứa trang không nên index
- 37 URL toàn VI, 0 URL `/en/*`; chứa `/login`, `/verify` (trang chức năng — nên loại khỏi sitemap + noindex).
- URL dạng `/about` (không trailing slash) trong khi canonical là `/about/` — không khớp.

### P1-2. [EDU] Phủ song ngữ thiếu 7 trang
- EN chỉ có: index, about, apply, certification, scholarship, tracks.
- **Thiếu bản EN:** programs, lessons, forum, room, investor-room, login, verify.
- Quyết định cần chốt: trang nào là app-only (không cần EN, gắn noindex) vs trang public (bắt buộc có EN).

### P1-3. [EDU] Trộn ngôn ngữ trong UI tiếng Việt
- Nav VI: "Trang chủ" đứng cạnh "Tracks" (EN); brand hiển thị "Nguyen AI Academy" trên trang VI — theo lock phải là **"Nguyễn AI Academy"** (có dấu); desc VI trang /apply dùng "Nguyen AI Edu" thay vì "Nguyễn AI Edu".

### P1-4. [INVEST] Trang VI hiển thị nav hoàn toàn tiếng Anh
- **File:** `InvestLayout.astro:74` render `{link.label}` (EN) cho mọi locale, dù đã có sẵn `link.vi`.
- **Fix:** `{isEn ? link.label : link.vi}`.

### P1-5. [INVEST] Title sai chuẩn lock trên trang VI
- Hiện tại: `Investment Thesis — Luận điểm đầu tư | invest.nguyenai.net` — EN đứng trước trên trang VI + domain nhét vào title.
- **Chuẩn lock 4.1:** VI: `Nguyễn AI — [Tiêu đề]` / EN: `Nguyen AI — [Title]`. Trang VI phải để tiếng Việt đứng trước, bỏ suffix domain.

### P1-6. [INVEST] Meta description trang VI viết bằng tiếng Anh
- `apps/invest/src/pages/index.astro:10` (và các trang VI khác dùng chung description EN).
- **Fix:** Viết description VI riêng cho từng trang VI.

### P1-7. [INVEST] EN thiếu trang scholarship + nav không localize link
- `pages/en/` có 12 trang, thiếu `scholarship.astro` (VI có 13). Nav Scholarship href hardcode `/scholarship` kể cả trên trang EN.

### P1-8. [WEB] hreflang không đồng nhất toàn hệ thống
- web dùng `vi-VN`, edu + invest dùng `vi`. Google chấp nhận cả hai nhưng chuẩn thương hiệu phải đồng nhất **một** giá trị trên mọi surface. **Khuyến nghị:** thống nhất `vi` (+ `en`, `x-default`→VI) toàn hệ.

### P1-9. [WEB] Title một số trang VI chưa theo lock + trộn ngôn ngữ
- `/academy` → `Academy — Đào tạo và certification` (thiếu brand, lẫn từ EN "certification").
- `/invest` → trộn 2 separator `—` và `|` trong cùng title; trang chủ dùng `|` trong khi các trang khác dùng `—`.
- Trang VI dùng brand "Nguyen AI Computer" (không dấu) — theo lock 4.1 VI cần cân nhắc `Máy Tính AI Nguyễn` / `Nguyễn AI —`. **Cần Founder chốt mẫu title VI chuẩn 1 lần**, sau đó áp toàn bộ 27 trang VI.

---

## P2 — FIX SAU LAUNCH / CẦN FOUNDER QUYẾT (8 mục)

1. **[LOCK] Xung đột x-default:** Lock 4.4 ghi `x-default: English` nhưng chỉ đạo Founder mới nhất + code web đều là **VI gốc**. → Cập nhật `FOUNDER_BRAND_NAMING_LOCK` mục 4.4 thành `x-default: Vietnamese` (cần Founder ký), tránh dev sau này "sửa ngược".
2. **[LOCK] Domain edu.nguyenai.net chưa có trong bảng sub-domain của lock** (lock chỉ có `academy.nguyenai.net`). → Founder chốt: thêm `edu.nguyenai.net` vào lock hoặc hợp nhất về academy.
3. **[EDU/INVEST] Bộ icon thương hiệu không đồng nhất:** web có đủ icon PNG 16→1024 + apple-touch + manifest; edu/invest chỉ có `favicon.svg`. → Đồng bộ bộ icon từ web sang.
4. **[INVEST] Logo là chữ "N" text** thay vì logo mark chuẩn (`logo-mark.svg`). → Dùng logo asset chuẩn brand.
5. **[INVEST] SSR toàn phần** — trang public nên `prerender = true` để SEO ổn định, không phụ thuộc worker.
6. **[INVEST] hreflang dùng `.replace('/en','')`** — thay chuỗi đầu tiên bất kỳ, dễ vỡ với path chứa "/en" ở giữa. Dùng regex `^/en(/|$)`.
7. **[WEB] Thiếu `og:locale`** (`vi_VN` / `en_US` + `og:locale:alternate`) — tăng chất lượng share bilingual.
8. **[CONSOLE] `lang="vi"` hardcode** — chấp nhận được vì noindex, nhưng nên sửa cùng đợt.

---

## LỖ HỔNG QUY TRÌNH (buộc fix để không tái diễn)

1. **Audit tự động đang PASS ảo:** 11/11 audit PASS trong khi build thật có 7 lỗi P0. Nguyên nhân: script chỉ kiểm tra source + "layout inheritance", không kiểm tra HTML dist. → **Buộc nâng cấp** `audit-hreflang.ts`, `audit-seo-bilingual.ts` để parse HTML trong `dist/` (kiểm tra: lang attr đúng locale, hreflang không chứa `/en/en/`, x-default→VI, og:image tồn tại, og tag dùng `content=`), thêm vào CI gate.
2. **Node version:** pnpm 11.9 yêu cầu Node ≥22.13, máy đang mặc định Node 20 → thêm `.nvmrc` (`v22`) + `engines.node` vào root `package.json`, pin trong CI.

---

## NHỮNG GÌ ĐÃ ĐẠT CHUẨN (giữ nguyên làm mẫu)

- ✅ **apps/web:** `lang` đúng theo locale; hreflang + canonical + **x-default→VI** đúng chỉ đạo; sitemap index tách `sitemap-vi.xml`/`sitemap-en.xml` kèm `xhtml:link` hreflang từng URL (mẫu chuẩn cho edu/invest); og:image + twitter card đầy đủ; JSON-LD Organization/WebSite/Product song ngữ ("Nguyễn AI" VI / "Nguyen AI" EN); webmanifest chuẩn brand.
- ✅ **Hình ảnh:** 0/54 (web) và 0/175 (edu) ảnh thiếu `alt`.
- ✅ **Brand naming lock:** 0 vi phạm tên cấm trên toàn repo.
- ✅ **Console:** noindex + robots Disallow toàn bộ — đúng thiết kế cho app xác thực.
- ✅ **27/27 trang web có cặp song ngữ VI/EN + language switcher.**

---

## THỨ TỰ THI CÔNG ĐỀ XUẤT

| Bước | Việc | Phạm vi |
|---|---|---|
| 1 | Fix P0-2 → P0-5 (edu layout: lang, hreflang, og, title/desc VI) | `AcademyLayout.astro` + 11 trang VI edu |
| 2 | Fix P0-6, P0-7 (invest og + sitemap) + robots edu | `InvestLayout.astro`, `apps/invest/public/`, `apps/edu/public/robots.txt` |
| 3 | Fix P1-1 → P1-7 (sitemap EN, phủ song ngữ, nav localize, title/desc VI) | edu + invest |
| 4 | Founder chốt: mẫu title VI chuẩn (P1-9), x-default trong lock (P2-1), domain edu (P2-2), mã Google verification (P0-1) | Quyết định Founder |
| 5 | Đồng nhất hreflang `vi` toàn hệ (P1-8) + og:locale + icon set (P2) | cả 4 app |
| 6 | Nâng cấp audit scripts kiểm tra dist HTML + pin Node, đưa vào CI | tools/ + CI |
| 7 | Build lại → chạy lại toàn bộ audit → QA re-verify trên dist → go-live | toàn repo |

---

**Điều kiện GO-LIVE ALL:** 7/7 P0 fixed + 9/9 P1 fixed + audit scripts nâng cấp xanh trên dist HTML + Founder ký 4 quyết định ở Bước 4.

**Người lập:** Claude (QA Audit tự động + kiểm tra thủ công trên build 2026-07-07)
