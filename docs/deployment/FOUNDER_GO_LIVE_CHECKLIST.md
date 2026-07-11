# Founder Go-Live Checklist — nguyenai.net Phase 1

**Cập nhật:** 2026-07-10  
**10/10 framework:** `docs/governance/GO_LIVE_10_POINT_FRAMEWORK_2026-07-10.md`  
**Evidence:** `docs/governance/QA_AUDIT_EVIDENCE_2026-07-10.md`

---

## Tóm tắt trạng thái

**Repo (Phase 0):** ALL GREEN khi `pnpm go-live:check` → exit 0  
**Production 10/10:** CHƯA — cần Founder secrets + deploy + persistence + sign-off

| Gate | Lệnh | Kỳ vọng |
|------|------|---------|
| Ordered build | `pnpm build:go-live` | exit 0 |
| Full gate | `pnpm go-live:check` | exit 0 |
| Audits | `pnpm audit:all` | 14/14 |
| Post-build SEO | `pnpm audit:seo-build` | 0 errors |

Code đã verify 2026-07-10:
- ✅ Build 90/90, typecheck 0 errors, test 150/150
- ✅ 14/14 audits + accessibility 0 violations
- ✅ Independence lock, security P0, brand V3.0 surfaces
- ✅ API routes: `/v1/scholarship`, `/v1/investor`, session-auth regression

**Còn 6 bước Founder phải làm thủ công (Phase 1–2).**

---

## Go-Live Status Checker

```bash
cd nguyenai.net
pnpm go-live:check
```

---

## 6 BƯỚC FOUNDER PHẢI LÀM

### Bước 1: Provision Neon PostgreSQL

```bash
# Tạo account tại neon.tech
# Tạo project mới: nguyenai-net
# Copy connection string: postgresql://user:pass@host/db?sslmode=require
```

Run migrations:
```bash
cd nguyenai.net
pnpm db:migrate
pnpm db:status
```

---

### Bước 2: Set Cloudflare secrets

```bash
# Auth worker
cd apps/auth
wrangler secret put DATABASE_URL
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put AUTH_SECRET

# API worker
cd apps/api
wrangler secret put DATABASE_URL
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put VNPAY_TMN_CODE
wrangler secret put VNPAY_HASH_SECRET
wrangler secret put VNPAY_RETURN_URL
```

Account production: `CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e`

---

### Bước 3: Setup Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → project `nguyenai-net`
2. OAuth 2.0 Client ID
3. Redirect: `https://auth.nguyenai.net/oauth/google/callback`
4. Copy Client ID + Secret → Bước 2

---

### Bước 4: Setup Stripe

1. [stripe.com](https://stripe.com) → API keys
2. Webhook: `https://api.nguyenai.net/v1/payment/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

### Bước 5: Deploy (6 projects)

| Project | Domain |
|---------|--------|
| `nai-web` | nguyenai.net |
| `nguyenai-edu` | edu.nguyenai.net |
| `nguyenai-console` | app.nguyenai.net |
| `nguyenai-invest` | invest.nguyenai.net (sau legal review) |
| `nguyenai-api-gateway` | api.nguyenai.net |
| auth worker | auth.nguyenai.net |

```bash
CLOUDFLARE_ACCOUNT_ID=62d57eaa548617aeecac766e5a1cb98e wrangler pages deploy ./dist \
  --project-name=nai-web --branch=main
```

Hoặc push `main` → CI/CD `.github/workflows/deploy.yml`

---

### Bước 6: Verify end-to-end trên production

- [ ] Trang chủ VI + EN
- [ ] /terms, /privacy
- [ ] Email register → verify
- [ ] Google OAuth → console
- [ ] Plans → Stripe checkout → entitlement
- [ ] `api.nguyenai.net/health` → 200
- [ ] `edu.nguyenai.net/og-default.png` → 200
- [ ] sitemap.xml, robots.txt

---

## Lưu ý quan trọng

1. **Không deploy invest.nguyenai.net** trước legal entity + IP + disclaimer review
2. **Payment live** chỉ sau test mode pass
3. **Gen1/Gen2 frozen** — reference only
4. **Sprint 0 governance OPEN** — lock trước production release

---

## Files quan trọng

| File | Mục đích |
|---|---|
| `docs/governance/GO_LIVE_10_POINT_FRAMEWORK_2026-07-10.md` | Thang 10/10 + thứ tự thi công |
| `docs/governance/QA_AUDIT_EVIDENCE_2026-07-10.md` | Bằng chứng audit |
| `docs/deployment/GO_LIVE_DEPLOYMENT_GUIDE.md` | Deploy chi tiết |
| `MASTER_PROJECT_PLAN_2026-07-07.md` | Tổng kế hoạch |
| `tools/check-go-live-status.sh` | Go-live gate |
