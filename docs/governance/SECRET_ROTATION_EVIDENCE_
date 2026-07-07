# SECRET ROTATION EVIDENCE — 2026-07-07

> **Trạng thái:** Cần Founder action — key cũ đã bị xóa khỏi code, key mới phải được set qua `wrangler secret`.
> **Phạm vi:** `apps/api` (nai-api Worker).

---

## 1. EVIDENCE_SIGNING_KEY (SEC-P0-3)

### Sai trước
- Giá trị `"dev-evidence-key-change-in-prod"` commit thẳng vào `apps/api/wrangler.jsonc` → `vars`.
- Có trong git history → coi như đã leak.

### Đã fix
- Xóa khỏi `vars` trong wrangler.jsonc.
- Helper `resolveEvidenceSigningKey(env)`:
  - Production: bắt buộc có `env.EVIDENCE_SIGNING_KEY` (set qua secret), throw nếu thiếu.
  - Development: fallback `"dev-evidence-key-DO-NOT-USE-IN-PROD"` chỉ khi `ENVIRONMENT === 'development'`.
- 2 site dùng key đã đổi sang helper.

### Cần Founder làm (BLOCKER trước deploy production)

```bash
# 1. Tạo key mới (32+ bytes, base64)
openssl rand -base64 48

# 2. Set cho production
wrangler secret put EVIDENCE_SIGNING_KEY --env production
# (paste key mới)

# 3. Set cho preview/staging
wrangler secret put EVIDENCE_SIGNING_KEY --env preview
# (paste key mới hoặc key riêng)

# 4. Verify
wrangler secret list --env production | grep EVIDENCE_SIGNING_KEY
```

### Quan trọng — re-sign evidence cũ

Evidence đã ký bằng key cũ sẽ không verify được bằng key mới. Hai lựa chọn:
1. **Khuyến nghị:** giữ key cũ chỉ cho read-verify (đặt tên `EVIDENCE_SIGNING_KEY_LEGACY`), key mới cho sign mới. Code hiện tại chỉ dùng 1 key — cần Founder quyết.
2. Re-sign toàn bộ evidence cũ (batch job) — phức tạp hơn.

**Founder quyết:** chọn phương án 1 hay 2 trước deploy.

---

## 2. GEN1_ADMIN_KEY (P1-5)

### Trạng thái
- Forward qua `X-Admin-Key` header tới Gen1 gateway (HTTPS — encrypted in transit).
- Gen1 FROZEN — không thể đổi sang signed token/service binding mà không sửa Gen1.

### Đã fix
- Audit logging mỗi admin-authenticated proxy call (`gen1_admin_proxy_call` event).
- Comment rõ ràng về migration path.

### Cần Founder làm
- Đảm bảo `GEN1_ADMIN_KEY` set qua `wrangler secret put GEN1_ADMIN_KEY` (không commit).
- Rotate key cũ nếu từng leak.
- Khi Gen1 unfrozen: migrate sang Cloudflare service binding hoặc signed short-lived token.

---

## 3. RESEND_API_KEY (P1-1)

### Trạng thái
- Dùng cho magic-link email và welcome email.
- Đã có trong `apps/auth` và `apps/api` qua `wrangler secret put RESEND_API_KEY`.

### Cần Founder làm
- Verify `RESEND_API_KEY` đã set cho cả `nai-auth` và `nai-api` Workers.
- Magic-link route sẽ trả 503 `email_service_not_configured` nếu thiếu key ở production.

---

## 4. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (P1-1)

### Trạng thái
- OAuth callback đã implement đầy đủ (tạo user, link account, session).
- Cần Google OAuth credentials thật.

### Cần Founder làm
```bash
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
```
- Google Cloud Console: OAuth client, authorized redirect URI = `https://auth.nguyenai.net/v1/auth/oauth/google/callback`.

---

## 5. VNPay / Stripe keys

### Cần Founder làm
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — set qua wrangler secret cho `nai-api`.
- Verify `VNPAY_PAY_URL` đã đổi sang production URL (`https://sandbox.vnpayment.vn/...` → `https://vnpayment.vn/...`).

---

## Tóm tắt Founder action items

| Secret | Worker | Lệnh | Ưu tiên |
|---|---|---|---|
| EVIDENCE_SIGNING_KEY | nai-api | `wrangler secret put EVIDENCE_SIGNING_KEY` | P0 BLOCKER |
| GEN1_ADMIN_KEY | nai-api | `wrangler secret put GEN1_ADMIN_KEY` | P1 |
| RESEND_API_KEY | nai-auth, nai-api | `wrangler secret put RESEND_API_KEY` | P1 |
| GOOGLE_CLIENT_ID | nai-auth | `wrangler secret put GOOGLE_CLIENT_ID` | P1 |
| GOOGLE_CLIENT_SECRET | nai-auth | `wrangler secret put GOOGLE_CLIENT_SECRET` | P1 |
| VNPAY_HASH_SECRET | nai-api | `wrangler secret put VNPAY_HASH_SECRET` | P1 |
| STRIPE_SECRET_KEY | nai-api | `wrangler secret put STRIPE_SECRET_KEY` | P1 |
| STRIPE_WEBHOOK_SECRET | nai-api | `wrangler secret put STRIPE_WEBHOOK_SECRET` | P1 |
