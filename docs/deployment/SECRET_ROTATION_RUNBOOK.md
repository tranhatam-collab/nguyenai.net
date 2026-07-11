# Secret Rotation Runbook — nguyenai.net

**Ngày:** 2026-07-11  
**Phạm vi:** Workers `nguyenai-auth`, `nguyenai-api-gateway`  
**Account:** `62d57eaa548617aeecac766e5a1cb98e` (Anhhatam)

---

## 1. AUTH_SECRET (session cookie HMAC)

**Không phải JWT_SECRET.** Auth dùng session opaque trong D1; `AUTH_SECRET` ký cookie `nguyenai_session=<session_id>.<hmac>`.

| Worker | Bắt buộc |
|--------|----------|
| `nguyenai-auth` | Có — ký cookie khi login |
| `nguyenai-api-gateway` | Có — cùng giá trị để verify |

### Rotate

```bash
# Tạo secret mới + put cả hai worker (cùng giá trị)
pnpm secrets:wrangler
# hoặc thủ công:
# openssl rand -hex 32 | wrangler secret put AUTH_SECRET  (trong apps/auth rồi apps/api)
```

Sau rotate:

1. Cookie đã ký bằng secret cũ → verify fail → user phải login lại (legacy UUID cookie vẫn được chấp nhận trong cửa sổ migration).
2. Không cần wipe D1 sessions trừ khi nghi lộ session_id.
3. Ghi audit: ai rotate, khi nào, lý do.

### Nếu lộ

Rotate **ngay** — không chờ test. Không gửi secret qua chat.

---

## 2. EVIDENCE_SIGNING_KEY

Worker: `nguyenai-api-gateway` only.

```bash
openssl rand -hex 32 | (cd apps/api && wrangler secret put EVIDENCE_SIGNING_KEY)
```

Evidence pack cũ ký bằng key cũ sẽ không verify với key mới — archive trước nếu cần.

---

## 3. Founder third-party secrets (không generate trong repo)

| Secret | Worker | Rotate nơi |
|--------|--------|------------|
| `GOOGLE_CLIENT_ID/SECRET` | auth | Google Cloud Console |
| `RESEND_API_KEY` | auth + api | Resend dashboard |
| `STRIPE_SECRET_KEY` | api | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | api | Stripe webhook endpoint |
| `OPENAI/ANTHROPIC/GOOGLE_AI` | api | Provider console |

Không dùng chung một secret cho nhiều mục đích.

---

## 4. Verify sau rotate

```bash
curl -sS https://auth.nguyenai.net/health   # auth_secret_configured: true
curl -sS https://api.nguyenai.net/health
pnpm go-live:live
```
