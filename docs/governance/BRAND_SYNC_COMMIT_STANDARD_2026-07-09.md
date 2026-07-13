# BRAND SYNC COMMIT STANDARD — CHUẨN COMMIT ĐỒNG BỘ THƯƠNG HIỆU

**Ngày:** 2026-07-09 · **Trạng thái:** BINDING theo chỉ đạo Founder ("không thể làm sai lệch hoài như vậy được nữa")
**Áp dụng cho:** MỌI người/AI agent commit vào repo nguyenai.net — không ngoại lệ.
**Nguồn chuẩn:** `BRAND_UI_TOKENS_LOCK_2026-07-09.md` (bộ màu) · `FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md` (tên) · `AGENTS.md`

---

## 1. NGUYÊN TẮC GỐC

> **Thương hiệu là code, không phải ý kiến.** Mọi giá trị màu, tên gọi, kiểu hero, kiểu menu
> đã được khóa trong token và audit script. Muốn khác chuẩn → phải sửa LOCK trước (cần Founder
> duyệt), không được sửa giao diện trước.

## 2. BA TẦNG CƯỠNG CHẾ (đã cài, tự động chạy)

| Tầng | Khi nào chạy | Công cụ | Chặn gì |
|---|---|---|---|
| 1. **Pre-commit** (máy dev) | Mỗi lần `git commit` chạm file giao diện | `lefthook.yml` → `tools/audit-ui-tokens.ts` + `tools/audit-brand-naming-lock.sh` | Commit bị TỪ CHỐI ngay tại máy nếu vi phạm |
| 2. **CI verify** (GitHub) | Mỗi push/PR | `.github/workflows/deploy.yml` — bước "Brand UI tokens audit" + 13 audit khác | PR không merge được nếu đỏ |
| 3. **audit:all** (QA) | Trước mọi go-live | `pnpm audit:all` (đã gồm `audit:ui-tokens`) | Không go-live nếu đỏ |

## 3. QUY TẮC GIAO DIỆN BỊ KHÓA (audit-ui-tokens.ts kiểm tự động)

- **R1/R2 — Cặp màu:** Nền TỐI (`bg-academy-header`, `.academy-hero`, `.nai-hero`, `.hero`, `invest-header`, panel menu) chỉ được chứa chữ `white`/`white/xx` + nhấn `gold`. CẤM `text-ink*`, `text-academy-text`, `text-academy-muted` trong vùng nền tối (trừ element con có nền sáng cục bộ: `bg-gold`, `bg-*-card`, `bg-*-cream`...).
- **R3 — Hero chuẩn:** 3 site public phải giữ đúng 1 định nghĩa hero gradient heritage (`.hero`/`.academy-hero`/`.nai-hero`). Xoá/sửa gradient = FAIL.
- **R4 — Menu 3 gạch:** mọi `button#menu-toggle` phải đủ `aria-label` + `aria-controls` + `aria-expanded`; icon 3 gạch SVG 24px; nút vàng viền vàng theo lock mục 4.
- **Tên thương hiệu:** danh sách tên cấm trong FOUNDER_BRAND_NAMING_LOCK — pre-commit chặn.

## 4. CHUẨN NỘI DUNG COMMIT

1. **Commit message** dạng: `type(scope): mô tả` — ví dụ `fix(edu): hero dùng chữ trắng trên nền heritage theo BRAND_UI_TOKENS_LOCK`.
2. Commit chạm **màu/token/hero/menu** phải ghi rõ tham chiếu lock trong message: `[brand-lock]`.
3. Commit **thay đổi chính LOCK** (giá trị token, quy tắc cặp màu, tên chuẩn): bắt buộc tag `[founder-approval]` + link quyết định Founder. Không có → reviewer từ chối.
4. Không commit trực tiếp giá trị hex mới vào component — mọi màu mới phải vào token (`:root` global.css / tailwind config) trước, có tên, có vai trò.

## 5. QUY TRÌNH KHI AUDIT CHẶN COMMIT

```
Commit bị chặn → đọc dòng ✗ (file:dòng + quy tắc R1-R4)
  → Sửa theo bảng cặp màu trong BRAND_UI_TOKENS_LOCK mục 2
  → KHÔNG được sửa audit script để "cho qua" (sửa script = thay đổi LOCK = cần Founder)
  → commit lại
```

## 6. CÀI ĐẶT CHO DEV MỚI (bắt buộc trong onboarding)

```bash
pnpm install            # cài deps
npx lefthook install    # kích hoạt pre-commit hook — BẮT BUỘC, thiếu bước này coi như chưa onboard
pnpm audit:ui-tokens    # tự kiểm trước khi bắt đầu làm giao diện
```

## 7. LỊCH SỬ VI PHẠM ĐÃ DẪN TỚI CHUẨN NÀY (để hiểu vì sao khóa)

- 2026-07-09: hero edu chữ nâu sẫm trên nền đỏ sẫm không đọc được (Founder phát hiện qua ảnh chụp production); hero invest chữ vàng trên nền trắng; web thiếu menu 3 gạch; 5 file rác trong `pages/en/`. → Toàn bộ đã fix cùng ngày, chuẩn này ra đời để chặn tái diễn từ gốc.
