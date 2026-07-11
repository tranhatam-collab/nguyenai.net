# Known Limitations — nguyenai.net (release scope)

**Ngày:** 2026-07-11  
**Commit tham chiếu:** xem `git rev-parse HEAD` tại thời điểm sign-off  
**Không claim:** “không còn lỗi”, “không thể bị hack”, “AI Owner OS runtime-ready”

---

## Blockers Founder (P0 — không thể đóng bằng code alone)

1. **`MAIL_IAI_ONE_API_KEY`** (optional primary) — khi thiếu, **`RESEND_API_KEY` temporary fallback** đã set trên auth+api (62d57, 2026-07-11). Probe + register welcome path dùng Resend.
2. **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`** — OAuth Google chưa set → E2E OAuth chưa chạy.
3. **`STRIPE_*` / `VNPAY_*`** — checkout + webhook E2E chưa.
4. **LLM provider keys** — `/v1/chat` live dùng mock khi thiếu key.
5. **Founder sign-off / Sprint 0 lock** — governance OPEN.
6. **Invest legal gate** — site đã deploy; Founder quyết định public claim.

## Engineering đã đóng / giảm rủi ro (2026-07-11)

- Session: D1 + cookie HttpOnly; `AUTH_SECRET` ký HMAC cookie (không JWT).
- Entitlement + approval: D1 khi `env.DB` có (không còn InMemory mặc định trên API có D1).
- Language invest VI body P2: repo sạch; cần deploy để live khớp.
- QA loop / go-live smoke: repo gates PASS khi chạy.
- **Account lock:** `wrangler.jsonc` auth+api → D1 `nguyenai-identity` (`704f85cb…`) + RATE_LIMIT KV trên **62d57** (không còn f3f9).
- **D1 prod schema:** backup `.audit-evidence/d1-backup-2026-07-11/` + migration `migrations/d1/0005_schema_gap_from_reference.sql` → **53 tables** trên 62d57 (gồm `investor_access_grants`, incidents, self_heal, …).
- Auth deploy `fff5bec8…` + API `ca87cf37…` trên 62d57; production-smoke **11/11 PASS** (2026-07-11).

## Rủi ro còn lại (P1/P2)

| Rủi ro | Mitigation tạm |
|--------|----------------|
| Monitoring/uptime chưa chứng minh | Cloudflare dashboard + manual smoke |
| Backup/restore D1 chưa drill | Export D1 trước migration lớn |
| Scholarship schema chưa đủ 28 bảng | Core tables only |
| EN invest pages = stub “coming soon” | VI là source of truth |
| Passkey routes 503 | WebAuthn chưa hoàn tất |
| Neon Postgres chưa provision | D1 edge là primary hiện tại |

## Định nghĩa “xong 100%” trong phạm vi release

Chỉ khi: P0 Founder secrets set + E2E register→verify→login→pay→chat PASS + live evidence + monitoring tối thiểu + Founder sign-off + tài liệu này được cập nhật “closed”.
