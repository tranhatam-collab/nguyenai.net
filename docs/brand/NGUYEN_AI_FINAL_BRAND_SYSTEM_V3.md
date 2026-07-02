# Nguyen AI — Final Brand System Arch V3.0

- **Status:** FOUNDER LOCKED — BINDING, overrides all prior brand docs
- **Version:** Arch V3.0
- **Date:** 2026-07-02
- **Owner:** Founder
- **Supersedes:** V2.0 (infinity logo), V1.0 (red-gold codex), all NAI trial variants

> **FOUNDER LOCK:** Logo Arch V3.0 thay thế phương án vòng vô cực N + AI (V2.0), các mẫu NAI thử nghiệm và mọi biểu tượng chưa được Founder phê duyệt trước đó.

---

## 1. Logo — biểu tượng được khóa

### 1.1 Mô tả

Biểu tượng vòm ánh sáng nhiều lớp (arch of light), mặt trời trung tâm (rising sun), đường chân trời mở (open horizon), đi cùng chữ NGUYEN AI trên nền trắng.

### 1.2 Ý nghĩa

| Yếu tố | Ý nghĩa |
|---|---|
| Vòm nhiều lớp | Các thế hệ, các lớp trí tuệ, cấu trúc Gen 1 – Gen 2 – Nguyen AI |
| Mặt trời trung tâm | Nguồn sáng, trí tuệ, khả năng khai mở và định hướng |
| Cổng mở | Lối bước vào Máy Tính AI, tri thức và năng lực vận hành |
| Đường chân trời | Hành trình từ cội nguồn đến tương lai |
| Dải địa hình | Nền tảng thực tế: con người, gia đình, doanh nghiệp, cộng đồng |
| Màu đỏ–cam–vàng | Năng lượng, quyết tâm, trí tuệ, sức sống, tinh thần đoàn kết |
| Nền trắng | Minh bạch, trung lập, khả năng ứng dụng trong mọi bối cảnh |

### 1.3 Tên thương hiệu

| Vai trò | Giá trị |
|---|---|
| Tên tiếng Việt | Nguyễn AI |
| Tên tiếng Anh | Nguyen AI |
| Tên sản phẩm | Nguyen AI Computer |
| Mã nhận diện nội bộ | NAI |
| Tên miền | nguyenai.net |

### 1.4 Nền logo đầy đủ màu

- **Chỉ được đặt trên nền trắng tuyệt đối #FFFFFF**
- KHÔNG sử dụng trên: nền tối, nền ảnh, nền chuyển màu, phát sáng, bóng đổ, hiệu ứng ba chiều, khung huy hiệu

### 1.5 Biến thể logo

| Biến thể | Nền | Màu logo |
|---|---|---|
| Đầy đủ màu | #FFFFFF trắng | Full color (red/orange/gold) |
| Đơn sắc nâu | Trong suốt | #4A1D14 (ink) |
| Đơn sắc đen | Trong suốt | #000000 |
| Đơn sắc trắng | Nền tối | #FFFFFF |

### 1.6 Quy tắc bắt buộc

KHÔNG sử dụng:
- nền tối cho logo đầy đủ màu
- nền ảnh
- nền chuyển màu
- hiệu ứng phát sáng
- bóng đổ
- hiệu ứng ba chiều
- khung huy hiệu
- thay đổi hình học
- đổi màu tùy ý
- bóp méo tỷ lệ
- tách riêng các lớp màu
- dùng ảnh chụp màn hình làm logo production

### 1.7 Lưu ý production

Bộ PNG hiện đã được chuẩn hóa từ mẫu Founder chọn. Trước khi đăng ký nhãn hiệu, in khổ lớn hoặc khắc vật liệu, cần dựng lại SVG vector thủ công chuẩn hình học.

---

## 2. Bảng màu chính thức (Arch V3.0)

> **Override:** Bảng màu V2.0 (navy/blue/teal) bị thay thế hoàn toàn.

### 2.1 Primary palette (LOCKED)

| Token | Hex | RGB | Role |
|---|---|---|---|
| heritage-dark | #7A2212 | 122, 34, 18 | Hero background, header, footer, deep structure |
| heritage-red | #A6260C | 166, 38, 12 | Primary action, links, focus |
| burnt-orange | #E55B09 | 229, 91, 9 | Secondary accent, hover |
| sun-orange | #F48B0D | 244, 139, 13 | Highlight, energy |
| gold | #FFB810 | 255, 184, 16 | Premium accent, eyebrow, focus outline |
| light-cream | #FFFACC | 255, 250, 204 | Editorial surface, warm background |
| ink | #4A1D14 | 74, 29, 20 | Primary text |
| white | #FFFFFF | 255, 255, 255 | Light surface, logo background |

### 2.2 Extended palette (UI states)

| Token | Hex | Role |
|---|---|---|
| muted | #8A6B5E | Secondary text |
| surface | #FFFAF0 | Card surface (warm) |
| border | rgba(74, 29, 20, 0.12) | Hairline border |
| success | #F48B0D (sun-orange) | Success state |
| warning | #FFB810 (gold) | Warning state |
| error | #A6260C (heritage-red) | Error state |
| info | #7A2212 (heritage-dark) | Info state |

### 2.3 Gradient

- Hero gradient: `linear-gradient(135deg, #7A2212 0%, #4A1D14 100%)` — heritage-dark to ink
- Accent gradient: `linear-gradient(135deg, #A6260C 0%, #FFB810 100%)` — heritage-red to gold (premium badges only)
- NEVER use V2.0 navy/blue/teal gradients or V1.0 red-bronze gradients

### 2.4 Color rules

- Primary background: white
- Primary text: ink
- Hero background: heritage-dark
- Primary accent: heritage-red
- Secondary accent: burnt-orange
- Highlight: sun-orange
- Premium accent: gold
- Editorial surface: light-cream
- Logo full-color: ONLY on white #FFFFFF
- All pairs must pass WCAG 2.2 AA contrast (≥ 4.5:1 for text)

### 2.5 Contrast verification

| Pair | Foreground | Background | Ratio | Pass? |
|---|---|---|---|---|
| Body text | #4A1D14 (ink) | #FFFFFF (white) | ~9:1 | YES |
| Hero text | #FFFFFF (white) | #7A2212 (heritage-dark) | ~9:1 | YES |
| Link | #A6260C (heritage-red) | #FFFFFF (white) | ~6:1 | YES |
| Gold on dark | #FFB810 (gold) | #7A2212 (heritage-dark) | ~7:1 | YES |
| Muted text | #8A6B5E (muted) | #FFFFFF (white) | ~4.6:1 | YES |

---

## 3. Typography (không đổi)

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
| `logo-primary-vertical-white-3200x3600.png` | Logo dọc nền trắng (3200×3600) |
| `logo-mark-primary-white-3200x2400.png` | Logo biểu tượng nền trắng (3200×2400) |
| `logo-primary-horizontal-white.png` | Logo ngang cho website (3600×1200) |
| `logo-mark-transparent-2400.png` | Logo biểu tượng nền trong suốt (2400×2375) |
| `logo-lockup-vertical-transparent-2400.png` | Logo dọc nền trong suốt (2400×3429) |
| `logo-mark-mono-brown.png` | Đơn sắc nâu #4A1D14 |
| `logo-mark-mono-black.png` | Đơn sắc đen |
| `logo-mark-mono-white.png` | Đơn sắc trắng |

### 4.2 Favicon

| File | Size |
|---|---|
| `icon-16x16.png` | 16×16 |
| `icon-32x32.png` | 32×32 |
| `icon-48x48.png` | 48×48 |
| `icon-64x64.png` | 64×64 |
| `icon-180x180.png` | 180×180 |
| `icon-192x192.png` | 192×192 |
| `icon-512x512.png` | 512×512 |
| `icon-1024x1024.png` | 1024×1024 |
| `favicon.ico` | Multi-res |
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
| `colors.json` | Bảng màu V3.0 |
| `typography.json` | Font system |
| `spacing.json` | Spacing scale |
| `brand-manifest.json` | Brand manifest V3.0 |
| `brand-tokens.css` | CSS custom properties |

---

## 5. Quy tắc hệ thống dùng chung

Bốn hệ thống phải sử dụng **một nguồn tài sản thương hiệu dùng chung**, không lưu bốn phiên bản logo khác nhau:

- `nguyenai.net`
- `app.nguyenai.net`
- `academy.nguyenai.net`
- `invest.nguyenai.net`

**Shared asset source:** `brand/nguyenai/` (monorepo root)

---

## 6. Naming rules (không đổi)

Approved:
- Nguyễn AI (Vietnamese)
- Nguyen AI (English)
- Nguyen AI Computer (product category)
- nguyenai (code identifier)
- nguyenai.net (domain)
- NAI (internal code)

FORBIDDEN:
- Nguyên AI, AI Nguyen, NguyenAI, Nguyễn.AI, Nguyen Artificial Intelligence, NAI Network

---

## 7. Change log

| Date | Version | Change | By |
|---|---|---|---|
| 2026-07-02 | V1.0 | Initial brand codex (red-gold palette) | Founder |
| 2026-07-02 | V2.0 | Infinity logo + navy/blue/teal palette | Founder |
| 2026-07-02 | V3.0 | FOUNDER LOCK — Arch of light logo + red/orange/gold/cream palette, supersedes V2.0 | Founder |
