# Nhật ký quyết định quản trị — Nguyễn AI

## QD-2026-07-16-01: AI Provider Single Source

Nguyen AI chỉ sử dụng `aiagent.iai.one` làm AI Provider Gateway. Nguyen AI không giữ hoặc gọi trực tiếp OpenAI, Anthropic hoặc Google provider keys. Identity, entitlement, billing, evidence, audit và product data vẫn thuộc Nguyen AI.

Decision đầy đủ: `docs/governance/AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md`.
Build order: Team AI Provider → provider exit gate → Team Nguyen AI Dev → QA-only master backlog.

## QD-2026-07-08-01: Độc lập hoàn toàn khỏi Gen1/Gen2

> **Provider routing superseded 2026-07-16:** Khoản direct OpenAI/Anthropic/Google trong decision lịch sử này được thay bởi QD-2026-07-16-01. `aiagent.iai.one` chỉ được dùng theo AI Provider Gateway contract mới.

**Người quyết định:** Trần Hà Tâm (Founder)
**Ngày:** 2026-07-08
**Căn cứ:** Kế hoạch độc lập hoàn toàn 2026-07-08, V2.0 2026-07-06

### Quyết định

1. **Đảo provider chain:** `/v1/chat` và `/v1/stream` đi qua `@nai/prism` với direct provider (OpenAI/Anthropic/Google), không qua `proxyToGen1`.
2. **Cầu chuyển tiếp tắt mặc định:** `LEGACY_BRIDGE_ENABLED` không set (= false). Các route `/v1/gen1/*` trả 404.
3. **Gỡ `GEN1_GATEWAY_URL` khỏi `wrangler.jsonc`:** Chỉ set qua `wrangler secret put` khi cần failoff.
4. **Mount 8 route file:** 6 file trong `routes/` + `scholarship-routes.ts` + `investor-routes.ts` — toàn bộ đã được kết nối vào `index.ts`.
5. **Gỡ Gen1/Gen2 khỏi nội dung công khai:** 13 vi phạm trong `apps/web/src/data/pages.ts` đã sửa.
6. **Cách ly `src/` gốc cũ:** Chuyển vào `docs/legacy/root-site-2026-07/`.

### Liên quan đến Founder Architecture Amendment 2026-07-02

Amendment nói: "Bất kỳ thay thế nào cho Gen 1/Gen 2 authority yêu cầu Founder architecture decision riêng + migration plan + compatibility contract."

Quyết định này **là** Founder architecture decision đó. Migration plan là Kế hoạch độc lập hoàn toàn 2026-07-08. Compatibility contract: `LEGACY_BRIDGE_ENABLED=true` + `GEN1_GATEWAY_URL` secret → Gen1 adapter vẫn hoạt động khi cần failoff.

### Trạng thái

- **Đã thi công:** WI-1.1, WI-1.2, WI-1.3, WI-2.1, WI-2.2, WI-2.3, WI-2.5 (home title)
- **Đang thi công:** WI-2.4 (thuần ngữ), WI-3 (lớp bằng chứng)
- **Chưa thi công:** WI-1.4 (cấp secrets — cần Founder chạy `wrangler secret put`), WI-4 (bảo mật), WI-5 (kiểm chứng)
