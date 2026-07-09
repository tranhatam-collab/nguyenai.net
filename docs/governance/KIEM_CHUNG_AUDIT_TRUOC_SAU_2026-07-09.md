# KIỂM CHỨNG ĐỘC LẬP — BÁO CÁO AUDIT 2026-07-09 CÓ ĐÚNG SỰ THẬT KHÔNG?

**Ngày kiểm chứng:** 2026-07-09 (Claude — kiểm chứng độc lập trên repo thực tế)
**Đối tượng:** `QA_AI_NGUYEN_TRAINING_GATEWAY_AUDIT_2026-07-09.md` + `PHAN_QUYET_CHIEN_LUOC_CHO_NGUYENAI_NET_2026-07-09.md` (commit `7b5af2b`)
**Mục đích:** Founder duyệt build Phase 1–11.

## PHÁN QUYẾT: BÁO CÁO TRUNG THỰC — KHỚP THỰC TẾ, ĐỦ ĐIỀU KIỆN DUYỆT BUILD (kèm 4 điều chỉnh)

| # | Tuyên bố trong báo cáo 2026-07-09 | Kiểm chứng thực tế | Kết quả |
|---|---|---|---|
| 1 | 2 file báo cáo đã tạo + commit | Tồn tại, commit `7b5af2b` | ✅ ĐÚNG |
| 2 | Foundation tồn tại: model-gateway, output-guard, training-matrix, model-policy | 4 gói có thật, code thật (282–404 dòng/gói); route model-gateway đã MOUNT (`index.ts:107,1261`) | ✅ ĐÚNG |
| 3 | Independence lock enforce (audit:independence) | Có trong package.json + audit:all + CI `deploy.yml:61`; `proxyToGen1` bị khóa `LEGACY_BRIDGE_ENABLED` (mặc định TẮT → 404); `GEN1_GATEWAY_URL` + `EVIDENCE_SIGNING_KEY` đã gỡ khỏi vars | ✅ ĐÚNG (kèm 2 lỗ hổng script — xem dưới) |
| 4 | /v1/chat đi provider trực tiếp, không qua proxyToGen1 | `/v1/chat` (dòng 558) → `prismChat` → gọi thẳng api.openai.com / api.anthropic.com | ✅ ĐÚNG |
| 5 | Frontend không gọi thẳng provider | 0 kết quả grep provider URL trong 4 app | ✅ ĐÚNG |
| 6 | Training gateway CHƯA tích hợp vào luồng chat | Đúng — `prismChat` KHÔNG gọi output-guard/identity-guard/training-matrix; các gói guard tồn tại nhưng đứng ngoài luồng chat | ✅ ĐÚNG |
| 7 | Language purity FAIL trong UI tiếng Việt | **ĐÃ LỖI THỜI — nay PASS**: `audit-vietnamese-purity-build.ts` = "0 forbidden terms"; menu build đã Việt hóa (Tác nhân, Siêu ứng dụng, Máy Tính AI Nguyễn) | 🟡 Đúng tại thời điểm audit, nay đã fix |
| 8 | Single-model survival chưa implement | Đúng — không có survival/degraded/minimal trong fallback.ts, model-policy, prism | ✅ ĐÚNG |
| 9 | Thiếu E2E, audit scripts, policies | Đúng — 10/14 gói lõi chưa có (training-gateway, model-router, agent-matrix, identity-guard, language-guard, data-classifier, receipt-engine, fallback-router, model-health, provider-adapters, self-learning); 2/10 audit script có; 12 E2E chưa có | ✅ ĐÚNG |
| 10 | Exit gate FAIL — không được claim "verified" | Đúng và trung thực | ✅ ĐÚNG |

## SO SÁNH TRƯỚC–SAU (tiến bộ thật, xác minh được)

| Hạng mục | 2026-07-08 (kiểm chứng hôm qua) | 2026-07-09 (hôm nay) |
|---|---|---|
| 6 route mới (gateway/fallback/incidents/self-heal/notifications/approvals) | Code chết — KHÔNG mount | ✅ ĐÃ mount (`index.ts:107-112`) |
| /v1/chat | Proxy thẳng Gen1 | ✅ prism → provider trực tiếp, tier check + evidence |
| Cầu Gen1 | Bật mặc định, 8 route | ✅ Khóa mặc định (`LEGACY_BRIDGE_ENABLED`) |
| Gen1 trong nội dung web public | 8 vị trí trong pages.ts + phát hành trên dist | ✅ 0 trong pages.ts, 0 trong dist |
| Root `src/` (nguồn sự thật thứ hai) | Tồn tại, chứa Gen1 | ✅ ĐÃ XÓA |
| EVIDENCE_SIGNING_KEY trong git (P0-3 audit 07/07) | Lộ trong vars | ✅ Đã gỡ, chuyển secret |
| Thuần Việt UI build | FAIL (Command Center, Model Mesh…) | ✅ PASS 0 từ cấm |
| Gate độc lập trong CI | Chưa có | ✅ deploy.yml bước 61 |

## 4 ĐIỀU BÁO CÁO KIA CHƯA PHÁT HIỆN (điều kiện kèm khi duyệt build)

1. **Gate độc lập có ĐIỂM MÙ:** check #5 chỉ quét `apps/*/src/data/*.ts` — bỏ sót `.astro` và `.mdx`. Thực tế Gen1/Gen2 còn sót tại: `apps/invest/src/pages/moat.astro:22`, `roadmap.astro:30`, `private/data-room.astro:19`, `private/technical-audit.astro:14`, `apps/edu/src/content/lessons/track-01-lesson-01.mdx:36`. Gate đang PASS ẢO trên phạm vi hẹp. → Mở rộng scan sang `src/pages`, `src/content`, include `.astro/.mdx` (giữ allowlist cho trang investor disclosure có chủ đích theo AGENTS.md).
2. **Script gate chạy CỰC CHẬM:** check #2 grep `packages/@nai` không exclude node_modules → mất ~18 phút mới xong trên máy local (đã đo thực tế; kết quả cuối: **PASS, exit 0**). CI sẽ chậm/tốn phút build tương tự. → Thêm `--exclude-dir=node_modules --exclude-dir=dist` (giảm xuống vài giây). Lưu ý: PASS này là PASS trên phạm vi hẹp của check #5 — các vị trí Gen1 sót ở mục 1 vẫn ngoài vùng quét.
3. **Route tiếng Việt CHƯA đổi:** lệnh Founder PHASE 0.3 (`/ai-computer/ → /may-tinh-ai-nguyen/`…) chưa làm — route vẫn tiếng Anh; công cụ purity không kiểm route. → Đưa vào Phase 0/1 kèm redirect 301.
4. **Trang VI của invest vẫn render mô tả tiếng Anh** (vd `moat.astro` desc EN trên trang VI) — thuộc phạm vi language boundary chưa quét tới app invest ở mức build.
5. **Trang `/demo` công khai LỘ KỸ THUẬT NỘI BỘ** (`apps/web/src/pages/demo.astro:17,24` + bản EN): công bố nguyên văn "Response từ provider trực tiếp (OpenAI/Anthropic/Google)" và tên biến môi trường "LEGACY_BRIDGE_ENABLED" ra public. Vi phạm trực tiếp PUBLIC_TECH_DISCLOSURE_BOUNDARY trong phán quyết Founder (không lộ routing, provider, cấu hình nội bộ) và làm lộ danh tính provider trên giao diện người dùng — ngược nguyên tắc "người dùng chỉ thấy AI Nguyễn". → Viết lại nội dung /demo theo ngôn ngữ trải nghiệm (không tên provider, không tên biến), chuyển chi tiết kỹ thuật vào tài liệu nội bộ/investor room có phân quyền.

## KHUYẾN NGHỊ DUYỆT

**DUYỆT BUILD Phase 1–11** theo kế hoạch chiến lược, với thứ tự ưu tiên:
1. (P0 – 1 ngày) Sửa 2 lỗ hổng gate độc lập (điểm mù + treo) trước — vì mọi phase sau dựa vào gate này để chứng minh.
2. (P0) Nối `output-guard` + `identity-guard` vào luồng `prismChat` (`/v1/chat`, `/v1/stream`) — hiện danh tính AI Nguyễn CHƯA được cưỡng chế trên bất kỳ response nào.
3. (P0) Route Việt hóa + gỡ Gen1 sót trong invest/edu content.
4. Tiếp tục Phase 2–11 như kế hoạch (10 gói còn thiếu, survival mode, 12 E2E, 10 audit script, báo cáo thật không TBD).

**Điều kiện claim cuối (giữ nguyên):** chỉ được viết "AI Nguyễn Training Gateway verified" khi toàn bộ exit gate pass với log thật.
