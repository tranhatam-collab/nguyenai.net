# FOUNDER BRAND NAMING LOCK — 2026-07-04

> **Trạng thái:** BINDING — Khóa chuẩn đặt tên cho toàn bộ hệ thống Nguyen AI.
> **Quyền:** Founder-only. Mọi thay đổi cần Founder decision riêng.
> **Phạm vi:** Tất cả repo, tất cả app, tất cả doc, tất cả UI, tất cả SEO, tất cả code identifier.
> **Ngày khóa:** 2026-07-04

---

## 1. Chuẩn tên (LOCKED)

### Tiếng Việt (có dấu)

| Loại | Tên chuẩn | Ghi chú |
|---|---|---|
| Thương hiệu mẹ | **Nguyễn AI** | Có dấu |
| Sản phẩm lõi | **Máy Tính AI Nguyễn** | Có dấu |
| Product surfaces | **Nguyễn AI Edu**, **Nguyễn AI Invest**, **Nguyễn AI Docs**, **Nguyễn AI Academy**, **Nguyễn AI Scholarships**, **Nguyễn AI Forum** | Có dấu |

### Tiếng Anh (không dấu)

| Loại | Tên chuẩn | Ghi chú |
|---|---|---|
| Master brand | **Nguyen AI** | Không dấu |
| Core product | **Nguyen AI Computer** | Không dấu |
| Product surfaces | **Nguyen AI Edu**, **Nguyen AI Invest**, **Nguyen AI Docs**, **Nguyen AI Academy**, **Nguyen AI Scholarships**, **Nguyen AI Forum** | Không dấu |

### Code identifier (lowercase ASCII)

| Loại | Identifier | Ghi chú |
|---|---|---|
| Domain | `nguyenai.net` | lowercase |
| Code scope | `@nai/*` | lowercase, ASCII — code identifier, KHÔNG phải public brand |
| Code identifier | `nguyenai` | lowercase |
| Slug / route | `nguyen-ai-computer`, `nguyen-ai-edu` | lowercase, hyphen-separated |
| Package names | `@nai/scholarship`, `@nai/email`, `@nai/audit` | code only, không hiển thị public |

### Sub-domains

| Sub-domain | Product surface |
|---|---|
| `nguyenai.net` | Public brand + product |
| `app.nguyenai.net` | AI Computer Console |
| `admin.nguyenai.net` | Administration |
| `docs.nguyenai.net` | Nguyen AI Docs |
| `invest.nguyenai.net` | Nguyen AI Invest |
| `edu.nguyenai.net` | Nguyen AI Edu — cổng tuyển sinh, học bổng, chương trình, truyền thông giáo dục |
| `academy.nguyenai.net` | Nguyen AI Academy — cổng học tập sau đăng nhập, bài học, bài thi, chứng nhận, hồ sơ học tập |
| `status.nguyenai.net` | Service status |
| `api.nguyenai.net` | API gateway |
| `auth.nguyenai.net` | Auth service |

### 3.8.1. edu.nguyenai.net và academy.nguyenai.net — phân vai (LOCKED 2026-07-07)

Founder quyết định: **giữ cả hai**, phân vai rõ ràng.

| Tên miền | Vai trò |
|---|---|
| `edu.nguyenai.net` | Trang tuyển sinh, học bổng, chương trình, truyền thông giáo dục (public-facing) |
| `academy.nguyenai.net` | Cổng học tập sau đăng nhập, bài học, bài thi, chứng nhận, hồ sơ học tập (gated) |

`edu.nguyenai.net` là cổng công khai giới thiệu chương trình học, học bổng và tuyển sinh. `academy.nguyenai.net` là nơi người học đã đăng nhập vào học, làm bài thi và nhận chứng nhận. Hai tên miền không thay thế nhau.

---

## 2. Danh sách tên CẤM (banned)

**Tuyệt đối không dùng trong bất kỳ context nào** (public, internal, code, doc, UI, SEO):

| Tên cấm | Lý do |
|---|---|
| `Nguyen Computer AI` | Sai thứ tự. Chuẩn: Nguyen AI Computer |
| `Nguyen Ai Computer` | Sai hoa thường. Chuẩn: Nguyen AI Computer |
| `NguyenAI` | Dính liền. Chuẩn: Nguyen AI (có khoảng trắng) |
| `Nguyễn.AI` | Dấu chấm giữa. Không dùng |
| `Nguyên AI` | Sai chính tả họ. Phải là Nguyễn (có g) |
| `AI Nguyen` | Cấm làm public brand hoặc product surface. Ngoại lệ Founder 2026-07-07: chỉ được dùng làm assistant/model identity string trong policy trả lời "who are you", không được dùng làm thương hiệu public. |
| `AI Nguyễn` | Cấm làm public brand hoặc product surface. Ngoại lệ Founder 2026-07-07: chỉ được dùng làm assistant/model identity string trong policy trả lời "bạn là ai", không được dùng làm thương hiệu public. |
| `Nguyen Artificial Intelligence` | Quá dài, không phải brand name |
| `NAI` làm thương hiệu public | Chỉ dùng làm code scope nội bộ (@nai/*), không hiển thị public |
| `NAI Edu` | Dùng code scope làm public brand. Chuẩn: Nguyen AI Edu |
| `NAI Invest` | Dùng code scope làm public brand. Chuẩn: Nguyen AI Invest |
| `NAI Computer` | Dùng code scope làm public brand. Chuẩn: Nguyen AI Computer |
| `Máy Tính AI Nguyễn` sai dấu | Phải có đầy đủ dấu tiếng Việt |

### Ghi chú về `@nai/*`

`@nai` là **code scope** nội bộ (package namespace), tương đương `@nguyenai` trong code.
- ĐƯỢC dùng: `@nai/scholarship`, `@nai/email`, `@nai/audit` (code identifier, lowercase ASCII)
- KHÔNG ĐƯỢC dùng: "NAI Scholarship", "NAI Email", "NAI Audit" trong UI/doc/public
- Khi hiển thị public: phải dùng "Nguyen AI Scholarships", "Nguyen AI Email Service", v.v.

---

## 3. Quy tắc đặt tên mới

### 3.1. Product surfaces mới

Mọi product surface mới dưới thương hiệu Nguyen AI phải:
1. Đặt tên theo format: `Nguyen AI [Surface Name]` (English) / `Nguyễn AI [Tên Surface]` (Vietnamese)
2. Trình Founder duyệt trước khi publish
3. Cập nhật vào danh sách product surfaces trong file này

### 3.2. Models (AI Computer models)

Models máy tính AI phải đặt tên theo format:
- Vietnamese: `Máy Tính AI Nguyễn [Model Name]`
- English: `Nguyen AI Computer [Model Name]`
- Code identifier: `nguyen-ai-computer-[model]` (lowercase, hyphen)

### 3.3. Applications / tools

Applications và tools trong AI Computer phải:
- Đặt tên rõ ràng, không trùng với thương hiệu thị trường
- Code identifier: lowercase ASCII, hyphen-separated
- Display name: theo chuẩn tiếng Việt (có dấu) hoặc tiếng Anh (không dấu)

### 3.4. Agent team

Agent team đã locked trong AGENTS.md:
- Nguyen Guide, Nguyen Researcher, Nguyen Archivist, Nguyen Verifier,
  Nguyen Family Steward, Nguyen Founder, Nguyen Business Operator,
  Nguyen Global Connector, Nguyen Guardian

### 3.5. Plans (gói subscription)

Plans đã locked trong AGENTS.md:
- Nguyen Start, Nguyen Personal, Nguyen Family, Nguyen Creator,
  Nguyen Founder, Nguyen Business, Nguyen Chapter, Nguyen Enterprise/Dedicated

### 3.6. Scholarship programs / học bổng

- Display name: "Nguyen AI Scholarships — [Program Name]"
- Code identifier: `nguyen-ai-scholarship-[program]`
- Mọi program mới cần Founder approval

### 3.7. Investment / Invest

- Display name: "Nguyen AI Invest"
- Vietnamese: "Nguyễn AI Invest"
- Mọi gói đầu tư, term sheet, cap table name phải sync với chuẩn này
- Financial model là hypothesis only, không phải forecast

### 3.8. Academy / học tập

- Display name: "Nguyen AI Academy"
- Vietnamese: "Nguyễn AI Academy"
- Mọi khóa học, certification, learning path mới cần Founder approval

---

## 4. SEO rules

### 4.1. Title tags

- Vietnamese: `Nguyễn AI — [Page Title]`
- English: `Nguyen AI — [Page Title]`
- Product pages: `Nguyen AI Computer — [Model/Page]`

### 4.2. Meta description

- Phải chứa brand name chuẩn (Nguyễn AI / Nguyen AI)
- Không chứa tên cấm

### 4.3. Slug / URL

- lowercase ASCII, hyphen-separated
- `nguyen-ai-computer`, `nguyen-ai-edu`, `nguyen-ai-invest`
- Không dùng `nguyenai-computer` (dính liền) trong slug công khai

### 4.4. hreflang

- Vietnamese: `vi` (hoặc `vi-VN`) — dùng tên có dấu
- English: `en` — dùng tên không dấu
- x-default: **tiếng Việt (Vietnamese root)** — LOCKED 2026-07-07 per Founder decision.
  Tiếng Việt là ngôn ngữ gốc, người dùng Việt Nam là cộng đồng khởi nguồn.
  Bản tiếng Anh là bản quốc tế hóa, không phải bản mặc định thay thế tiếng Việt.
  Mọi app (`nguyenai.net`, `edu.nguyenai.net`, `invest.nguyenai.net`, v.v.)
  phải đặt `x-default` trỏ về bản tiếng Việt.

### 4.5. Audit HTML build (LOCKED 2026-07-07)

Mọi app phải được audit trên **HTML build thật** trong `dist/`, không chỉ kiểm
source. Audit source mà không kiểm build sẽ pass ảo vì lỗi rendering, hreflang
sai, lang attribute sai, Open Graph thiếu chỉ xuất hiện sau khi Astro render.
CI phải chạy audit trên `dist/**/*.html`.

### 4.5. Sitemap

- Public routes only
- Private routes: noindex, nofollow, noarchive, excluded from sitemap

---

## 5. CI enforcement

### 5.1. Audit script

File: `tools/audit-brand-naming-lock.sh`

Script này:
1. Scan tất cả file trong repo (trừ `.git/`, `node_modules/`, `.turbo/`, dist/)
2. Tìm các tên cấm (Section 2)
3. Nếu tìm thấy → exit 1, in ra danh sách vi phạm
4. Nếu không tìm thấy → exit 0

### 5.2. Build gate

Build phải fail nếu audit script trả về exit 1.
Thêm vào CI pipeline và pre-commit hook.

### 5.3. Exceptions

Các file sau được miễn (không audit):
- `docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md` (file này — chứa tên cấm làm ví dụ)
- `tools/audit-brand-naming-lock.sh` (script itself — chứa pattern tên cấm)
- `node_modules/`, `.git/`, `.turbo/`, `dist/`, `.next/`, `.astro/`
- File binary (ảnh, font, v.v.)

---

## 6. Approval workflow

### 6.1. Tên mới cần Founder approval

| Loại | Ví dụ | Approval |
|---|---|---|
| Product surface mới | "Nguyen AI Health" | Founder |
| Model máy mới | "Nguyen AI Computer Pro" | Founder |
| Application / tool mới | "Nguyen AI Code" | Founder |
| Agent mới | "Nguyen Historian" | Founder |
| Plan mới | "Nguyen Team" | Founder |
| Scholarship program mới | "Nguyen AI Scholarship — Tech" | Founder |
| Khóa học mới | "Nguyen AI Academy — AI Basics" | Founder |
| Gói đầu tư mới | "Nguyen AI Invest — Seed Round" | Founder |
| Route quan trọng | `/nguyen-ai-computer-pro` | Founder |
| Command Pack mới | "Nguyen AI Office Pack" | Founder |
| Phòng cộng đồng mới | "Nguyen Chapter — Hanoi" | Founder |

### 6.2. Quy trình

1. Dev team đề xuất tên → tạo PR với tag `brand-naming`
2. Founder review + approve/reject
3. Nếu approved → cập nhật vào file này + AGENTS.md
4. Merge PR

---

## 7. Migration từ trạng thái hiện tại

### 7.1. Vi phạm cần fix ngay

Audit ban đầu sẽ tìm và fix:
- Tên cấm trong docs, UI, code strings
- "NguyenAI" (dính liền) → "Nguyen AI"
- "NAI" dùng làm public brand → "Nguyen AI"
- Sai dấu tiếng Việt → sửa dấu
- "Nguyen Computer AI" → "Nguyen AI Computer"

### 7.2. Code identifier

- `@nai/*` scope: GIỮ NGUYÊN (code identifier, lowercase ASCII, không phải public brand)
- `nguyenai` code identifier: GIỮ NGUYÊN
- Khi display public: dùng "Nguyen AI" không dùng "NAI"

### 7.3. Package display names

Khi package có display name (package.json `name` field là code, nhưng `description` hoặc README là display):
- Code name: `@nai/scholarship` (giữ)
- Display/README: "Nguyen AI Scholarships" (sửa)

---

## 8. Source of truth

File này là **source of truth** cho branding.
- AGENTS.md brand lock section phải reference file này
- Mọi brand doc khác (BRAND_CHARTER, BRAND_CODEX, FINAL_BRAND_SYSTEM) phải sync
- Nếu xung đột: file này override

---

**Founder signature:** Approved 2026-07-04
**Lock status:** BINDING — không thay đổi без Founder decision
**Next review:** Khi Founder yêu cầu
