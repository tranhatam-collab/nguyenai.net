# Nguyen AI — Final Brand System V2.0

- **Status:** FOUNDER LOCKED — BINDING, overrides all prior brand docs
- **Date:** 2026-07-02
- **Owner:** Founder
- **Supersedes:** `NGUYEN_AI_BRAND_CHARTER.md` (color section), `NGUYEN_AI_BRAND_CODEX.md` (color section), `NAI_BRAND_IDENTITY_DESIGN_PROMPT.md` (color + logo section)

> **FOUNDER LOCK:** Logo mới thay thế toàn bộ biểu tượng vòm đỏ–cam cũ và những phương án NAI thử nghiệm trước đó. Bảng màu thương hiệu chính được cập nhật theo logo này. Logo là nguồn sự thật cao nhất.

---

## 1. Logo — biểu tượng được khóa

### 1.1 Mô tả

Vòng vô cực chứa chữ N + AI, kèm các điểm ảnh số.

### 1.2 Ý nghĩa

| Yếu tố | Ý nghĩa |
|---|---|
| Vòng vô cực | Trí tuệ liên tục học, vận hành và phát triển |
| N | Nguyễn — bản sắc và điểm vào cộng đồng |
| AI | Trí tuệ nhân tạo và Máy Tính AI |
| Hai vòng giao nhau | Con người và AI, cá nhân và cộng đồng phối hợp |
| Điểm ảnh | Dữ liệu, điện toán đám mây, mở rộng số và khả năng tự nâng cấp |

### 1.3 Tên thương hiệu

| Vai trò | Giá trị |
|---|---|
| Tên tiếng Việt | Nguyễn AI |
| Tên tiếng Anh | Nguyen AI |
| Tên sản phẩm | Nguyen AI Computer |
| Mã nhận diện | NAI |
| Domain | nguyenai.net |

### 1.4 Nền logo đầy đủ màu

- **Chỉ được đặt trên nền trắng tuyệt đối #FFFFFF**
- KHÔNG sử dụng trên: nền tối, nền ảnh, nền chuyển màu, phát sáng, bóng đổ, hiệu ứng ba chiều, khung huy hiệu

### 1.5 Biến thể logo

| Biến thể | Nền | Màu logo |
|---|---|---|
| Đầy đủ màu | #FFFFFF trắng | Full color (navy/blue/teal) |
| Đơn sắc navy | Trong suốt | #072B5C |
| Đơn sắc đen | Trong suốt | #11233D hoặc #000000 |
| Đơn sắc trắng | Nền tối | #FFFFFF |

### 1.6 Quy tắc bắt buộc

KHÔNG sử dụng:
- nền tối cho logo đầy đủ màu
- nền ảnh
- nền chuyển màu
- phát sáng
- bóng đổ
- hiệu ứng ba chiều
- khung huy hiệu
- thay đổi vị trí điểm ảnh
- đổi màu tùy ý
- bóp méo hình vô cực

---

## 2. Bảng màu chính thức mới (V2.0)

> **Override:** Bảng màu đỏ di sản–vàng đồng (V1.0) bị thay thế. Bảng màu mới được lấy từ logo Founder đã phê duyệt.

### 2.1 Primary palette (LOCKED)

| Token | Hex | RGB | Role |
|---|---|---|---|
| deep-navy | #072B5C | 7, 43, 92 | Knowledge, technology, trust, hero background |
| royal-blue | #0D62C6 | 13, 98, 198 | Primary accent, links, focus |
| sky-blue | #159EE4 | 21, 158, 228 | Secondary accent, highlights |
| cyan | #22BDC9 | 34, 189, 201 | Tertiary accent, AI/intelligence |
| teal | #18A9AD | 24, 169, 173 | Trust accent, success state |
| ink | #11233D | 17, 35, 61 | Primary text |
| white | #FFFFFF | 255, 255, 255 | Light surface, logo background |

### 2.2 Extended palette (UI states)

| Token | Hex | Role |
|---|---|---|
| muted | #5B7A9E | Secondary text |
| surface | #FFFFFF | Card surface |
| border | rgba(17, 35, 61, 0.12) | Hairline border |
| success | #18A9AD (teal) | Success state |
| warning | #159EE4 (sky-blue) | Warning state |
| error | #0D62C6 (royal-blue) | Error state |
| info | #072B5C (deep-navy) | Info state |
| light-bg | #F0F5FA | Light section background |

### 2.3 Gradient

- Hero gradient: `linear-gradient(135deg, #072B5C 0%, #11233D 100%)` — deep-navy to ink
- Accent gradient: `linear-gradient(135deg, #0D62C6 0%, #22BDC9 100%)` — royal-blue to cyan (for premium badges only)
- NEVER use rainbow, neon, or old red-gold gradients

### 2.4 Color rules

- Primary background: white
- Primary text: ink
- Hero background: deep-navy
- Primary accent: royal-blue
- Secondary accent: sky-blue
- Tertiary accent: cyan
- Trust accent: teal
- Logo full-color: ONLY on white #FFFFFF
- All pairs must pass WCAG 2.2 AA contrast (≥ 4.5:1 for text)

### 2.5 Contrast verification

| Pair | Foreground | Background | Ratio | Pass? |
|---|---|---|---|---|
| Body text | #11233D (ink) | #FFFFFF (white) | ~14:1 | YES |
| Hero text | #FFFFFF (white) | #072B5C (deep-navy) | ~11:1 | YES |
| Link | #0D62C6 (royal-blue) | #FFFFFF (white) | ~6:1 | YES |
| Muted text | #5B7A9E (muted) | #FFFFFF (white) | ~4.6:1 | YES |
| Accent on dark | #22BDC9 (cyan) | #072B5C (deep-navy) | ~6:1 | YES |

---

## 3. Typography (không đổi từ V1.0)

| Role | Family | Weights | Fallback |
|---|---|---|---|
| UI sans | Be Vietnam Pro | 400, 500, 700 | Inter, system-ui, sans-serif |
| Editorial serif | Noto Serif | 400, 700 | Georgia, serif |
| Mono | JetBrains Mono | 400, 500 | SFMono-Regular, Consolas, monospace |

---

## 4. Tài sản đã xuất

### 4.1 Logo

| File | Mô tả |
|---|---|
| `logo-primary.svg` | Logo đầy đủ màu, nền trắng |
| `logo-transparent.svg` | Logo nền trong suốt |
| `logo-horizontal.svg` | Logo ngang cho website |
| `logo-vertical.svg` | Logo dọc cho tài liệu |
| `logo-mono-navy.svg` | Đơn sắc navy #072B5C |
| `logo-mono-black.svg` | Đơn sắc đen #11233D |
| `logo-mono-white.svg` | Đơn sắc trắng #FFFFFF |

### 4.2 Favicon

| File | Size |
|---|---|
| `favicon-16x16.png` | 16×16 |
| `favicon-32x32.png` | 32×32 |
| `favicon-48x48.png` | 48×48 |
| `favicon-64x64.png` | 64×64 |
| `favicon.ico` | Multi-res |
| `apple-touch-icon.png` | 180×180 |
| `android-chrome-192x192.png` | 192×192 |
| `android-chrome-512x512.png` | 512×512 |
| `icon-1024x1024.png` | 1024×1024 |
| `site.webmanifest` | Web manifest |

### 4.3 Open Graph

| File | Size | Usage |
|---|---|---|
| `og-default.png` | 1200×630 | Website chính |
| `og-invest.png` | 1200×630 | Invest page |
| `og-academy.png` | 1200×630 | Academy page |

### 4.4 Brand tokens

| File | Mô tả |
|---|---|
| `colors.json` | Bảng màu V2.0 |
| `typography.json` | Font system |
| `spacing.json` | Spacing scale |
| `brand-manifest.json` | Brand manifest V2.0 |
| `brand-tokens.css` | CSS custom properties |

---

## 5. Quy tắc hệ thống dùng chung

Bốn hệ thống phải sử dụng **một nguồn tài sản thương hiệu dùng chung**, không lưu bốn bản logo khác nhau:

- `nguyenai.net`
- `app.nguyenai.net`
- `academy.nguyenai.net`
- `invest.nguyenai.net`

**Shared asset source:** `brand/nguyenai/` (monorepo root)

Mỗi hệ thống reference assets từ nguồn chung, không copy riêng.

---

## 6. Naming rules (không đổi)

Approved:
- Nguyễn AI (Vietnamese)
- Nguyen AI (English)
- Nguyen AI Computer (product category)
- nguyenai (code identifier)
- nguyenai.net (domain)
- NAI (short code)

FORBIDDEN:
- Nguyên AI, AI Nguyen, NguyenAI, Nguyễn.AI, Nguyen Artificial Intelligence, NAI Network

---

## 7. Change log

| Date | Version | Change | By |
|---|---|---|---|
| 2026-07-02 | V2.0 | FOUNDER LOCK — new logo (infinity + N + AI + pixels), new color palette (navy/blue/teal), supersedes V1.0 red-gold | Founder |
