# BRAND UI TOKENS LOCK — BỘ MÀU GIAO DIỆN THỐNG NHẤT NGUYỄN AI

**Ngày:** 2026-07-09 · **Trạng thái:** DRAFT — chờ Founder duyệt trên bản preview local
**Phạm vi:** apps/web, apps/edu, apps/invest (console là app nội bộ, theme riêng, không thuộc lock này)

## 1. Bảng màu duy nhất (giá trị đã đồng nhất sẵn trong cả 3 app)

| Token | Giá trị | Vai trò |
|---|---|---|
| `--heritage-dark` | `#7A2212` | Đỏ sẫm di sản — header, nền hero |
| `--ink` | `#4A1D14` | Nâu mực — chữ trên nền SÁNG |
| `--heritage-red` | `#A6260C` | Đỏ nhấn — link/nút trên nền SÁNG |
| `--gold` | `#FFB810` | Vàng — nhấn trên nền TỐI |
| `--burnt-orange` `#E55B09` / `--sun-orange` `#F48B0D` | | Gradient phụ |
| `--surface` | `#FFFAF0` | Nền kem — card, section sáng |
| `--light-cream` | `#FFFACC` | Kem đậm — dải section xen kẽ |
| `--muted` | `#8A6B5E` | Chữ phụ trên nền SÁNG |
| `--white` | `#FFFFFF` | Nền trang + chữ trên nền TỐI |

## 2. QUY TẮC GHÉP MÀU (phần bị vi phạm — nay khóa cứng)

| Bề mặt | Chữ chính | Chữ phụ | Nhấn/link | CẤM |
|---|---|---|---|---|
| **TỐI** (heritage-dark / hero gradient) | `white` | `white/75–85` | `gold` | ❌ ink, muted, heritage-red (chữ tối/đỏ trên nền tối) |
| **SÁNG** (white / surface / cream) | `ink` | `muted` | `heritage-red` | ❌ gold làm chữ nội dung (vàng trên trắng không đủ tương phản), ❌ white |

## 3. HERO CHUẨN HỆ THỐNG (1 kiểu duy nhất — theo trang chủ nguyenai.net)

```css
background:
  radial-gradient(circle at 82% 16%, rgba(255,184,16,.18), transparent 28rem),
  radial-gradient(circle at 12% 82%, rgba(229,91,9,.22), transparent 22rem),
  linear-gradient(135deg, var(--heritage-dark), var(--ink) 78%);
color: var(--white);
```
Class: `.hero` (web) · `.academy-hero` (edu) · `.nai-hero` (invest) — cùng một định nghĩa.

## 4. MENU 3 GẠCH CHUẨN (đồng nhất 3 site)

- Icon: 3 gạch ngang, SVG 24×24, stroke 2, bo tròn đầu nét.
- Nút: vùng chạm ≥ 44×44px, màu chữ `gold`, viền `gold/55%`, nền `gold/12%`, hover `gold/22%`, bo góc 0.5rem.
- Panel mở: nền `heritage-dark`, link chữ trắng, hover nền `white/10`, viền trên `white/20`.
- A11y: `aria-label` song ngữ, `aria-controls`, `aria-expanded` cập nhật khi bấm.
- Breakpoint: web < 960px · edu < 768px (md) · invest < 1024px (lg) — theo mật độ menu từng site.

## 5. CÁC FIX ĐÃ ÁP DỤNG TRONG ĐỢT NÀY (chờ duyệt trên preview)

| Vị trí | Trước (lỗi) | Sau |
|---|---|---|
| edu `/` + `/en/` hero | Nền đỏ sẫm + chữ nâu sẫm (không đọc được — ảnh Founder gửi) | `.academy-hero` gradient + chữ trắng, nhấn vàng, nút outline sáng |
| edu section "Cách học" (VI+EN) | Nền đỏ sẫm + chữ tối | Nền kem `#FFFACC` + chữ tối (đúng cặp) |
| edu hộp hotline (about, summer-2026 VI+EN) | Nền đỏ sẫm + chữ đỏ | Nền kem + chữ như cũ |
| invest `/` + `/en/` hero | Nền TRẮNG + tiêu đề vàng + chữ phụ nâu (ngược chuẩn, tương phản kém) | `.nai-hero` tối + chữ trắng — đồng bộ trang chủ web |
| web menu mobile | KHÔNG có nút 3 gạch (menu tràn dòng) | Nút 3 gạch chuẩn mục 4 + panel dọc |
| edu `pages/en/` | 5 file rác trùng lặp (`summer`, `summer-202`, `summer-2026.`, …) | Đã xoá |

## 6. Điều kiện áp dụng production

1. Founder duyệt trên preview local (web + edu + invest, desktop + mobile).
2. Build 3 app xanh, audit thuần Việt + độc lập vẫn PASS.
3. Sau duyệt: nâng lock này thành BINDING, đưa quy tắc mục 2 vào audit script (kiểm tra không có `text-academy-text|text-ink|text-academy-muted|text-ink-muted` bên trong phần tử có nền tối).
