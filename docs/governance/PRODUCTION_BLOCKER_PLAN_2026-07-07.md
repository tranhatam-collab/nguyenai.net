# PRODUCTION BLOCKER PLAN — 2026-07-07

> **Trạng thái:** BINDING — Kế hoạch fix chặn production cho nguyenai.net.
> **Quyền:** Founder-locked. Thay đổi cần Founder decision.
> **Phạm vi:** Tất cả app trong monorepo nguyenai.net (web, edu, invest, console, api, auth).
> **Ngày khóa:** 2026-07-07

---

## 1. Phán quyết hiện trạng

| Gate | Trạng thái |
|---|---|
| Technical Gates (typecheck/lint/build) | PASS |
| Language Audit (source) | PASS sau vòng fix mới nhất |
| Go-live SEO, Brand, Bilingual, Image Audit (HTML build) | **FAIL** |
| Security Production Gate | **FAIL** |
| Production Release | **BLOCKED** |
| Founder Final Sign-off | **NOT ALLOWED** |

Lý do: build xanh không đồng nghĩa production an toàn. Còn 5 lỗi bảo mật P0
và 7 lỗi go-live P0 (SEO, thương hiệu, song ngữ, hình ảnh). Audit tự động cũ
pass ảo vì chỉ kiểm source, không kiểm HTML build thật.

---

## 2. Quyết định Founder đã khóa (2026-07-07)

1. **x-default** của toàn bộ hệ Nguyễn AI phải trỏ về bản **tiếng Việt**.
   Tiếng Việt là ngôn ngữ gốc; bản tiếng Anh là quốc tế hóa.
2. **edu.nguyenai.net** và **academy.nguyenai.net** giữ cả hai, phân vai:
   - `edu.nguyenai.net` — cổng tuyển sinh, học bổng, chương trình, truyền thông giáo dục (public).
   - `academy.nguyenai.net` — cổng học tập sau đăng nhập, bài học, bài thi, chứng nhận (gated).
3. **Google Search Console** — Founder phải lấy mã thật, không để placeholder.
4. **Không ra production nếu còn P0** (bảo mật hoặc SEO/brand/bilingual/image).

---

## 3. Bản đồ lỗi cần sửa

### Nhóm A — 5 lỗi bảo mật P0 (chặn production)

| Mã | Lỗi | Tệp | Phán quyết |
|---|---|---|---|
| SEC-P0-1 | SQL injection (tên cột nối chuỗi vào UPDATE) | `packages/@nai/scholarship/src/d1-store.ts` | Chặn production |
| SEC-P0-2 | Passkey bypass (không verify chữ ký WebAuthn) | `apps/auth/src/index.ts` | Chặn production |
| SEC-P0-3 | `EVIDENCE_SIGNING_KEY` hardcode trong wrangler.jsonc | `apps/api/wrangler.jsonc` | Chặn production |
| SEC-P0-4 | Auth middleware không dừng handler khi 401 | `apps/api/src/investor-routes.ts` | Chặn production |
| SEC-P0-5 | XSS (innerHTML với dữ liệu API) | `apps/edu/src/pages/verify.astro` | Chặn production |

### Nhóm B — 7 lỗi go-live P0 (chặn go-live)

| Mã | App | Lỗi | Phán quyết |
|---|---|---|---|
| SEO-P0-1 | web | Google verification placeholder | Chặn go-live |
| EDU-P0-1 | edu | Trang EN gắn `lang="vi"` | Chặn go-live |
| EDU-P0-2 | edu | hreflang sai, sinh `/en/en/*` | Chặn go-live |
| EDU-P0-3 | edu | x-default trỏ EN thay vì VI | Chặn go-live |
| EDU-P0-4 | edu | Trang VI dùng title/mô tả tiếng Anh | Chặn go-live |
| INVEST-P0-1 | invest | Không có Open Graph | Chặn go-live |
| INVEST-P0-2 | invest | robots khai sitemap nhưng sitemap không tồn tại | Chặn go-live |

### Nhóm C — 6 lỗi P1 (fix trước launch)

| Mã | Lỗi |
|---|---|
| P1-1 | OAuth/magic-link stub, route vẫn mở, fail âm thầm |
| P1-2 | API thiếu security headers (CSP, HSTS, X-Frame-Options...) |
| P1-3 | Thiếu rate limit trên `/v1/chat`, `/v1/stream`, payment |
| P1-4 | Auth rate limit in-memory, reset mỗi Worker cold start |
| P1-5 | Admin key forward plaintext sang Gen1 gateway |
| P1-6 | 30 lỗ hổng dev/build dependency (9 high) |

---

## 4. Thứ tự thi công

### Phase 0 — Governance Lock (exit: brand lock + SEO spec updated, không conflict)
- Cập nhật `FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md` (x-default=VI, edu subdomain, audit HTML build).
- Cập nhật `docs/seo/NGUYEN_AI_SEO_SPEC.md` (x-default=VI).
- Tạo file này.

### Phase 1 — Fix 5 Security P0 (exit: 0 security P0)
- SEC-P0-1: whitelist cột trong d1-store.ts.
- SEC-P0-2: tắt `/passkey/*` (trả 503) cho đến khi implement WebAuthn đầy đủ.
- SEC-P0-3: xóa secret khỏi wrangler.jsonc, dùng `wrangler secret put`.
- SEC-P0-4: `requireAuth`/`requireAdmin` trả Response, handler `return` Response.
- SEC-P0-5: verify.astro dùng `textContent`, không `innerHTML` với dữ liệu API.

### Phase 2 — Fix 7 Go-live P0 (exit: 0 go-live P0)
- SEO-P0-1: thay Google verification placeholder (cần Founder mã thật — chờ).
- EDU-P0-1..4: sửa edu layout (lang động, hreflang đúng, x-default VI, title/desc VI).
- INVEST-P0-1: thêm Open Graph đầy đủ cho invest VI/EN + og:image.
- INVEST-P0-2: đảm bảo sitemap.xml sinh ra ở build, sửa robots.txt trỏ đúng.

### Phase 3 — Fix Launch P1 (exit: 0 P1 hoặc Founder waiver)
- P1-1: implement OAuth functions thật (table đã có) + magic-link email gửi thật qua @nai/email (nếu RESEND_API_KEY có) hoặc tắt route.
- P1-2: thêm security headers middleware cho API.
- P1-3: thêm rate limit (KV-backed) cho chat/stream/payment/auth/investor/scholarship/verify.
- P1-4: chuyển auth rate limit sang KV.
- P1-5: ký internal token thay vì forward admin key plaintext.
- P1-6: bump `astro` ≥5.18.1, `@astrojs/cloudflare` ≥12.6.6.

### Phase 4 — Upgrade Audit (exit: audit kiểm HTML build thật)
- Sửa audit script kiểm `dist/**/*.html` thay vì chỉ source.
- Thêm audit SEO build, hreflang build, OG build, language build, security build.

### Phase 5 — Verify (exit: tất cả gate PASS)
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm audit:*`.

### Phase 6 — Report (exit: báo cáo đầy đủ)
- `QA_PRODUCTION_BLOCKER_FIX_REPORT_2026-07-07.md`
- `QA_GOLIVE_SEO_BRAND_BILINGUAL_AUDIT_AFTER_FIX_2026-07-07.md`
- `SECURITY_P0_FIX_EVIDENCE_2026-07-07.md`
- `SECRET_ROTATION_EVIDENCE_2026-07-07.md`
- `FOUNDER_RELEASE_SIGNOFF_PACKET_2026-07-07.md`

---

## 5. Exit gate cuối

| Gate | Trạng thái cần đạt |
|---|---|
| Security P0 | 0 |
| SEO P0 | 0 |
| Brand P0 | 0 |
| Bilingual P0 | 0 |
| Image P0 | 0 |
| Invest P0 | 0 |
| Edu P0 | 0 |
| API P1 | 0 hoặc waiver |
| Dependency high runtime | 0 |
| Test | PASS |
| Build | PASS |
| HTML build audit | PASS |
| Live audit | PASS |
| Founder sign-off | Chỉ sau tất cả gate |

Chỉ khi các điều kiện trên đạt mới được ghi "Ready for Founder Production Sign-off".

---

## 6. Kỷ luật bắt buộc

- Không làm thêm tính năng mới.
- Không deploy production.
- Không xin Founder sign-off khi còn P0.
- Không báo "go-live ready" khi còn P0.
- Không chỉ kiểm source — phải kiểm HTML build thật.
- Không chỉ kiểm web — phải kiểm web, edu, invest, console, api, auth.
- Không chỉ kiểm tiếng Việt — phải kiểm cả VI và EN.
- Không trộn ngôn ngữ.
- Không để x-default trỏ bản tiếng Anh.
- Không để sitemap, hreflang, canonical hoặc Open Graph giả.
