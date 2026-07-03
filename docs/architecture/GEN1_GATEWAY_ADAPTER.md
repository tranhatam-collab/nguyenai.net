# Gen1 Gateway Adapter — nguyenai.net → aiagent.iai.one

**Ngày:** 2026-07-03
**Upstream:** `https://aiagent-iai-one-api-prod.tranhatam.workers.dev`
**Status:** Adapter deployed, verified proxy working

---

## Architecture

Per Founder Architecture Amendment (AGENTS.md):
- Gen1 (`aiagent.iai.one`) = FROZEN reference, không sửa
- Nguyen AI sở hữu backend riêng, adapter kết nối tới Gen1
- Adapter không phải source of truth (entitlement, billing, audit vẫn là Nguyen AI)

```
User → api.nguyenai.net (apps/api) → Gen1 Gateway Adapter → aiagent.iai.one (FROZEN)
```

---

## Gen1 API surface (đã probe)

| Endpoint | Method | Status | Mô tả |
|---|---|---|---|
| `/v1/health` | GET | ✅ 200 | Health check |
| `/v1/models` | GET | ✅ 200 | 3 models: iris-3, pulse-3, echo-mini |
| `/v1/tos` | GET | ✅ 200 | Terms of Service |
| `/v1/tos/accept` | POST | ✅ 200 | Accept TOS (cần sessionId) |
| `/v1/quota` | GET | ✅ 200 | Quota check (anonymous: 3 requests) |
| `/v1/chat` | POST | ⚠️ 500 | Chat (upstream LLM chưa cấu hình trong Gen1) |
| `/v1/stream` | POST | ⚠️ 500 | Streaming chat (same) |
| `/v1/workflows` | POST | ✅ | Workflow creation (cần name) |

Gen1 tiers: FREE DEMO, FREE BYOK, STARTER ($9), PRO ($29), BUILDER ($79), BUSINESS ($199), PREMIUM ($499), ENTERPRISE.

---

## Adapter routes trong apps/api

| Nguyen AI route | Gen1 upstream | Mô tả |
|---|---|---|
| `POST /v1/chat` | `/v1/chat` | Chat proxy |
| `POST /v1/stream` | `/v1/stream` | Streaming chat proxy (SSE) |
| `GET /v1/gen1/models` | `/v1/models` | Gen1 native models |
| `GET /v1/gen1/health` | `/v1/health` | Gen1 upstream health |
| `GET /v1/gen1/quota` | `/v1/quota` | Gen1 quota cho session |
| `GET /v1/gen1/tos` | `/v1/tos` | Gen1 Terms of Service |
| `POST /v1/gen1/tos/accept` | `/v1/tos/accept` | Accept Gen1 TOS |
| `POST /v1/workflows` | `/v1/workflows` | Workflow proxy |

---

## Session mapping

Gen1 yêu cầu `X-Session-Id` header. Adapter synthesize deterministic ID:

| Nguyen AI session | Gen1 sessionId |
|---|---|
| Logged in | `nai-{tenant_id}-{session_id[:8]}` |
| Anonymous | `nai-anon-{IP[:12]}` |

TOS acceptance persist cho cùng IP/user.

---

## Configuration

`apps/api/wrangler.jsonc`:
```jsonc
{
  "vars": {
    "GEN1_GATEWAY_URL": "https://aiagent-iai-one-api-prod.tranhatam.workers.dev"
  }
}
```

Optional: `GEN1_ADMIN_KEY` (wrangler secret) cho admin endpoints.

---

## Verification (2026-07-03)

```bash
# Gen1 health qua adapter
curl http://localhost:8787/v1/gen1/health
# → {"status":"ok","version":"2.0.0","environment":"production"}

# Gen1 models qua adapter
curl http://localhost:8787/v1/gen1/models
# → 3 models (iris-3, pulse-3, echo-mini)

# TOS accept
curl -X POST http://localhost:8787/v1/gen1/tos/accept \
  -H "Content-Type: application/json" \
  -d '{"blocks":["platform-tos","api-terms","data-processing"]}'
# → {"success":true,"sessionId":"nai-anon-::1"}

# Chat proxy (Gen1 upstream LLM chưa cấu hình → 500)
curl -X POST http://localhost:8787/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}],"model":"iai-one/iris-3"}'
# → error code 1101 (Gen1 upstream issue, không phải adapter)
```

---

## Known issues

1. **Gen1 chat/stream trả 500 (error 1101)** — upstream LLM provider chưa cấu hình trong Gen1 worker. Gen1 FROZEN, không sửa. Cần Founder set LLM API keys trong Gen1 worker secrets.
2. **Gen1 quota: anonymous 3 requests** — cần upgrade tier hoặc BYOK để tăng quota.
3. **Adapter chưa map Nguyen AI plan → Gen1 tier** — hiện gửi `X-Tier: free-demo`. Cần mapping: nguyen-start → free-demo, nguyen-personal → starter, v.v.
