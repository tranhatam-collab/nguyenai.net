# Go-Live Deployment Guide — nguyenai.net

**Status:** Ready for Founder execution
**Date:** 2026-07-03

## Prerequisites (Founder action required)

### 1. Cloudflare account
- Account ID: lấy từ Cloudflare dashboard
- API Token: cần permissions: Workers Scripts:Edit, Pages:Edit, D1:Edit, R2:Edit, Zone:Edit
- Domain nguyenai.net phải được add vào Cloudflare (nameservers pointed)

### 2. Google OAuth credentials
- Tạo project tại https://console.cloud.google.com
- APIs & Services → Credentials → Create OAuth 2.0 Client ID
- Authorized redirect URI: `https://auth.nguyenai.net/v1/auth/oauth/google/callback`
- Lưu Client ID + Client Secret

### 3. Stripe account
- Test mode: https://dashboard.stripe.com/test
- Lấy Secret Key (sk_test_...) + Webhook Secret (whsec_...)
- Webhook endpoint: `https://api.nguyenai.net/v1/payment/webhook/stripe`
- Events: checkout.session.completed, invoice.paid

### 4. VNPay/PayOS account
- VNPay sandbox: https://sandbox.vnpayment.vn
- Lấy TMN Code + Hash Secret
- Return URL: `https://api.nguyenai.net/v1/payment/vnpay/return`

## Secrets to set (GitHub Actions + Wrangler)

### GitHub Actions secrets (Settings → Secrets and variables → Actions)
```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
```

### Wrangler secrets (per Worker)
```bash
# Auth worker
cd apps/auth
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# API worker
cd apps/api
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put VNPAY_TMN_CODE
wrangler secret put VNPAY_HASH_SECRET
```

## Custom domains setup (Cloudflare dashboard)

### Web (Cloudflare Pages)
- Project: `nai-web`
- Custom domain: `nguyenai.net`
- Custom domain: `www.nguyenai.net` (redirect to nguyenai.net)

### API Worker
- Route: `api.nguyenai.net/*` → `nai-api`
- Or: Workers → nai-api → Triggers → Custom Domains → `api.nguyenai.net`

### Auth Worker
- Route: `auth.nguyenai.net/*` → `nai-auth`
- Or: Workers → nai-auth → Triggers → Custom Domains → `auth.nguyenai.net`

## Deployment steps

### Step 1: First-time manual deploy
```bash
# From repo root
pnpm install

# Deploy web to Cloudflare Pages
cd apps/web
pnpm build
npx wrangler pages deploy dist --project-name=nai-web

# Deploy API worker
cd ../api
npx wrangler deploy

# Deploy Auth worker
cd ../auth
npx wrangler deploy
```

### Step 2: Set secrets
```bash
cd apps/auth
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

cd ../api
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put VNPAY_TMN_CODE
npx wrangler secret put VNPAY_HASH_SECRET
```

### Step 3: Configure custom domains
- Cloudflare Pages → nai-web → Custom domains → Add `nguyenai.net`
- Workers → nai-api → Custom domains → Add `api.nguyenai.net`
- Workers → nai-auth → Custom domains → Add `auth.nguyenai.net`

### Step 4: Run D1 migrations
```bash
cd apps/auth
npx wrangler d1 migrations apply nai-identity --remote

cd ../api
npx wrangler d1 migrations apply nai-identity --remote
```

### Step 5: Push to main (CI/CD takes over)
```bash
git push origin main
```

## Post-deploy verification

### Health checks
```bash
curl https://nguyenai.net/ | head -5
curl https://api.nguyenai.net/health
curl https://auth.nguyenai.net/health
```

### OAuth flow test
1. Visit `https://auth.nguyenai.net/v1/auth/oauth/google/begin`
2. Should return `{ authorize_url: "https://accounts.google.com/..." }`
3. Follow URL → Google login → callback → session cookie

### Payment flow test
1. POST `https://api.nguyenai.net/v1/payment/checkout` with `{ price_id: "academy-pass", gateway: "vnpay", currency: "VND" }`
2. Should return VNPay authorize URL
3. Follow URL → VNPay sandbox → return → payment result

## CI/CD pipeline

File: `.github/workflows/deploy.yml`

Triggers on push to `main`:
1. **verify** job: typecheck + build + test
2. **deploy-web** job: deploy to Cloudflare Pages
3. **deploy-api** job: deploy API worker + secrets
4. **deploy-auth** job: deploy Auth worker + secrets

## Rollback

### Cloudflare Pages
- Pages → nai-web → Deployments → select previous → Rollback

### Workers
- Workers → nai-api → Deployments → select previous → Rollback
- Workers → nai-auth → Deployments → select previous → Rollback

## Monitoring (TODO — not yet implemented)

- Cloudflare Analytics: built-in for Pages + Workers
- Error tracking: add Sentry or Cloudflare Workers Analytics
- Uptime: configure status.nguyenai.net (Cloudflare Pages status page or BetterStack)
- Audit log: D1-backed, queryable via /v1/audit

## Open items (Founder action)

1. **VIET CAN NEW CORP formation** — đang process, chưa có EIN. USD wire tạm thời không nhận. Stripe test mode OK.
2. **IP agreement execution** — template có sẵn, cần sign.
3. **Data room populate** — platform chưa chọn (Google Drive hoặc Notion).
4. **Production Stripe** — chuyển từ test mode sang live khi sẵn sàng.
5. **Production VNPay** — chuyển từ sandbox sang live khi sẵn sàng.
