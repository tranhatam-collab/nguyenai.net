# GO-LIVE AUDIT AFTER FIX — 2026-07-07

> **Mục đích:** Audit toàn bộ sau khi fix P0/P1. Đỏ trước, xanh sau.

---

## RED — chưa đạt go-live

### R1. Secrets chưa set (P0 BLOCKER)

8 secrets cần Founder set qua `wrangler secret put` trước deploy production. **EVIDENCE_SIGNING_KEY là P0 BLOCKER** — API sẽ throw ở production nếu thiếu. Xem `SECRET_ROTATION_EVIDENCE_2026-07-07.md`.

### R2. Google Search Console verification (P0)

`apps/web/public/google-site-verification.txt` chứa placeholder `PENDING_FOUNDER_ACTION_REPLACE_WITH_REAL_CODE_FROM_GOOGLE_SEARCH_CONSOLE`. Founder phải lấy mã thật từ GSC. Không có mã thật → không verify ownership → không submit sitemap → SEO crawl bị chậm.

### R3. invest SSR — chưa audit live (P0)

`apps/invest` dùng Cloudflare adapter (SSR/hybrid). Build không tạo static HTML. Audit build không check được:
- Open Graph tags (og:title, og:description, og:url, og:image, og:locale)
- hreflang reciprocal + x-default=VI
- canonical
- sitemap.xml hợp lệ
- robots.txt

**Cần:** deploy preview → live audit với `curl` hoặc browser.

### R4. E2E user flow chưa verify

Build green ≠ user flow works. Chưa đi user flow thật:
- Đăng ký → verify email → login → dùng AI Computer → logout
- Đăng ký học bổng → submit → review → approve
- Investor login → private room → payment
- Chat/stream proxy qua Gen1

**Cần:** Founder hoặc QA đi user flow thật sau deploy preview.

### R5. Dependency waiver (P1)

`@astrojs/cloudflare` 11.x và `astro` 4.x có high vulns (miniflare/undici/ws) — chỉ dev/build time, không runtime. Waiver ghi nhận, deferred sang sprint sau. Không block go-live nhưng phải track.

### R6. KV namespace RATE_LIMIT chưa tạo

`apps/api/wrangler.jsonc` có binding `RATE_LIMIT` với `id: "REPLACE_WITH_KV_NAMESPACE_ID"`. Founder phải tạo KV namespace:
```bash
wrangler kv namespace create RATE_LIMIT
# paste id vào wrangler.jsonc
```
Nếu không tạo, rate limiter fallback in-memory (per-instance, không durable) — vẫn hoạt động nhưng yếu hơn.

---

## GREEN — đã đạt

### G1. Security P0 (5/5) — audit PASS

`tools/audit-security-p0.ts` → 13/13 checks PASS. Xem `SECURITY_P0_FIX_EVIDENCE_2026-07-07.md`.

### G2. SEO build audit (web + edu) — PASS

`tools/audit-seo-build.ts` → 142 files, 0 errors:
- `<html lang>` matches route locale (vi cho /, en cho /en/)
- hreflang reciprocal (vi + en + x-default)
- x-default points to VI root (không EN)
- no /en/en/* double-prefix
- canonical present
- title + meta description present
- Open Graph đầy đủ (og:title, desc, url, image, locale)
- noindex pages (login) skip hreflang/OG đúng

### G3. Typecheck — PASS

- apps/api: 0 errors
- apps/auth: 0 errors
- packages/@nai/scholarship: 0 errors

### G4. Build — PASS

- apps/web: 54 pages
- apps/edu: 142 HTML files
- apps/invest: SSR _worker.js

### G5. Unit test — PASS

packages/@nai/scholarship: 64 assertions PASS (bao gồm SQLi guard 12 assertions).

### G6. Brand naming lock — PASS (giữ nguyên từ trước)

`tools/audit-brand-naming-lock.sh` — không có banned names.

---

## Verdict

**KHÔNG ĐỦ điều kiện go-live production** cho đến khi:

1. ✅ R1: Founder set 8 secrets (đặc biệt EVIDENCE_SIGNING_KEY)
2. ✅ R2: Founder thay Google verification code thật
3. ✅ R3: Live audit invest sau deploy preview
4. ✅ R4: E2E user flow verify
5. ✅ R6: Founder tạo RATE_LIMIT KV namespace

R5 (dependency waiver) không block go-live.

**Sau khi R1-R4, R6 xong → Founder sign `FOUNDER_RELEASE_SIGNOFF_PACKET_2026-07-07.md` → go-live.**
