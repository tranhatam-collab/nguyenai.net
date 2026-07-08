# NGUYEN AI (nguyenai.net) — KẾ HOẠCH ĐỘC LẬP HOÀN CHỈNH

**Ngày:** 2026-07-08 · **Trạng thái:** ACTIVE PLAN
**Repo:** nguyenai.net (monorepo pnpm, độc lập) · **Nhánh:** main

## Nguyên tắc tối cao

nguyenai.net là dự án PUBLIC độc lập hoàn toàn. KHÔNG đụng tới Gen 1 (computer.iai.one) và Gen 2 (maytinhai.org). Không import code, không gọi API runtime, không phụ thuộc hạ tầng.

## Phase 0 — Khóa độc lập (ĐÃ HOÀN TẤT 2026-07-08)

- [x] Thêm audit:independence (AI upstream riêng + no Gen2 fetch) vào audit:all + CI
- [x] Archive 3 repo lẻ (nguyenai-console, nguyenai-invest, nguyenai-api-gateway)
- [x] Rà nguyenai-api-gateway cũ — xác nhận AI Gateway mới dùng upstream riêng
- [x] Gate G0: audit:all xanh gồm independence test

## Phase 1 — External services + Deploy (cần Founder)

1. Neon Postgres: tạo project nguyenai-net, lấy DATABASE_URL
2. Cloudflare secrets: DATABASE_URL, AUTH_SECRET, RESEND_API_KEY, STRIPE_SECRET_KEY, AI_PROVIDER_API_KEY
3. Chạy migrations lên Neon + D1
4. Deploy: api + auth (Workers), web/app/academy/invest/admin (Pages)

## Phase 2 — Product thật (tuần 3-5)
## Phase 3 — Cộng đồng + SEO scale (tuần 6-8)
## Phase 4 — Hardening + vận hành (tuần 9-10)
