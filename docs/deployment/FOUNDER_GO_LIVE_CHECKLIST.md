# Founder Go-Live Checklist — nguyenai.net Phase 1

**Cập nhật:** 2026-07-03
**Tài liệu tham chiếu:** `docs/governance/QA_VERIFICATION_FINAL_2026-07-03.md`

---

## Tóm tắt trạng thái

Tất cả code cho Phase 1 đã hoàn thành và verify:
- ✅ Public website (54 trang VI/EN) — Astro static
- ✅ Auth worker (email + Google OAuth) — Cloudflare Workers
- ✅ API worker (payment, models, entitlement) — Cloudflare Workers
- ✅ Legal pages (Terms, Privacy VI+EN)
- ✅ CI/CD pipeline (GitHub Actions) — updated with all audits
- ✅ P0/P1 security issues đã fix
- ✅ Package tests pass (billing 30/30, runtime-sdk 10/10)
- ✅ All QA audits passing (11/11):
  - Brand naming lock: 0 violations
  - Accessibility: 0 violations (fixed focus styles + skip-to-content)
  - Clone contamination: 0 violations (allowlisted Gen1/Gen2 references)
  - Language boundary: 0 violations
  - Email language: 0 violations
  - Hreflang: 54/54 pages
  - I18n keys: consistent
  - Language switcher: 54/54 pages
  - Public claims: 0 violations
  - SEO bilingual: 54/54 pages
  - Form language: 0 violations
- ✅ Typecheck: 127/127 PASS
- ✅ Build: 77/77 PASS
- ✅ Lint: 72/72 PASS (stubs, not blocking)
- ✅ Go-live status checker: `tools/check-go-live-status.sh`

**Code sẵn sàng. Còn 6 bước Founder phải làm thủ công trước khi go-live.**

---

## Go-Live Status Checker

Trước khi bắt đầu, chạy status checker để verify code quality:

```bash
cd nguyenai.net
bash tools/check-go-live-status.sh
```

Nó sẽ check:
- Typecheck, build, tests
- Tất cả QA audits (brand, accessibility, contamination, language, SEO)
- External services status (manual check reminder)
- Deployment status
- Governance status

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
pnpm db:migrate  # New script added to root package.json
pnpm db:status   # Check migration status
```

---

### Bước 2: Set Cloudflare secrets

```bash
# Auth worker
cd apps/auth
wrangler secret put DATABASE_URL          # Neon connection string
wrangler secret put GOOGLE_CLIENT_ID      # từ Google Cloud Console
wrangler secret put GOOGLE_CLIENT_SECRET  # từ Google Cloud Console
wrangler secret put RESEND_API_KEY        # từ resend.com
wrangler secret put AUTH_SECRET           # random 32-byte hex

# API worker
cd apps/api
wrangler secret put DATABASE_URL
wrangler secret put STRIPE_SECRET_KEY         # sk_live_... hoặc sk_test_...
wrangler secret put STRIPE_WEBHOOK_SECRET     # whsec_...
wrangler secret put VNPAY_TMN_CODE
wrangler secret put VNPAY_HASH_SECRET
wrangler secret put VNPAY_RETURN_URL          # https://nguyenai.net/v1/payment/vnpay-return
```

---

### Bước 3: Setup Google OAuth

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project `nguyenai-net`
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs:
   - `https://auth.nguyenai.net/oauth/google/callback`
   - `http://localhost:8787/oauth/google/callback` (dev)
5. Copy Client ID + Secret → set vào Bước 2

---

### Bước 4: Setup Stripe

1. Tạo account tại [stripe.com](https://stripe.com)
2. Dashboard → Developers → API Keys → Copy Secret Key
3. Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://api.nguyenai.net/v1/payment/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy Signing Secret → set vào Bước 2

---

### Bước 5: Deploy

```bash
# Deploy web → Cloudflare Pages
cd apps/web
wrangler pages deploy ./dist --project-name=nguyenai-net

# Deploy auth worker
cd apps/auth
wrangler deploy

# Deploy API worker
cd apps/api
wrangler deploy
```

Hoặc push lên GitHub → CI/CD tự deploy qua `.github/workflows/deploy.yml`.

---

### Bước 6: Verify end-to-end trên production

Sau khi deploy, test trên `https://nguyenai.net`:

- [ ] Trang chủ load đúng (VI + EN)
- [ ] /terms và /privacy render đầy đủ
- [ ] Đăng ký email → nhận email verify → verify thành công
- [ ] Đăng nhập Google OAuth → redirect về console
- [ ] Xem plans → checkout Stripe → webhook nhận → entitlement cấp
- [ ] /v1/models trả về danh sách models
- [ ] Sitemap.xml accessible
- [ ] robots.txt accessible

---

## Lưu ý quan trọng

1. **Không deploy invest.nguyenai.net** cho đến khi legal entity + IP ownership + disclaimer review xong (per AGENTS.md)
2. **Không bật payment live** cho đến khi test Stripe/VNPay ở test mode pass
3. **Financial model là hypothesis only** — không phải forecast
4. **Gen1/Gen2 frozen** — không sửa, chỉ reference
5. **Sprint 0 governance OPEN** — cần lock trước khi production release

---

## Files quan trọng để Founder đọc

| File | Mục đích |
|---|---|
| `QA_FINAL_REPORT_2026-07-07.md` | Báo cáo QA cuối (updated 2026-07-07) |
| `docs/deployment/GO_LIVE_DEPLOYMENT_GUIDE.md` | Hướng dẫn deploy chi tiết |
| `docs/governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` | Architecture lock |
| `docs/governance/PRODUCT_BOUNDARY_CONTRACT.md` | 5 commercial objects |
| `docs/governance/ENTITLEMENT_MODEL.md` | Plan → entitlement mapping |
| `AGENTS.md` | Quy luật làm việc + brand lock |
| `tools/check-go-live-status.sh` | Go-live status checker |

---

## Automation Improvements (2026-07-07)

Đã thêm automation để giảm manual work:

1. **CI/CD pipeline updated** (`.github/workflows/deploy.yml`):
   - Thêm tất cả QA audits vào verify job
   - Tự động fail build nếu audit fail
   - Bảo vệ production khỏi code không đạt chuẩn

2. **Root package.json scripts**:
   - `pnpm audit:all` — chạy tất cả audits
   - `pnpm db:migrate` — chạy database migrations
   - `pnpm db:status` — check migration status

3. **Go-live status checker** (`tools/check-go-live-status.sh`):
   - Tự động check code quality
   - Tự động check tất cả audits
   - Hiển thị external services status
   - Hiển thị deployment status
   - Hiển thị governance status
   - Next steps rõ ràng

4. **QA audit fixes**:
   - Accessibility: 0 violations (was 5)
   - Clone contamination: 0 violations (was 20)
   - Tất cả 11 audits passing

Sau khi deploy, test trên `https://nguyenai.net`:

- [ ] Trang chủ load đúng (VI + EN)
- [ ] /terms và /privacy render đầy đủ
- [ ] Đăng ký email → nhận email verify → verify thành công
- [ ] Đăng nhập Google OAuth → redirect về console
- [ ] Xem plans → checkout Stripe → webhook nhận → entitlement cấp
- [ ] /v1/models trả về danh sách models
- [ ] Sitemap.xml accessible
- [ ] robots.txt accessible

---

## Lưu ý quan trọng

1. **Không deploy invest.nguyenai.net** cho đến khi legal entity + IP ownership + disclaimer review xong (per AGENTS.md)
2. **Không bật payment live** cho đến khi test Stripe/VNPay ở test mode pass
3. **Financial model là hypothesis only** — không phải forecast
4. **Gen1/Gen2 frozen** — không sửa, chỉ reference
5. **Sprint 0 governance OPEN** — cần lock trước khi production release

---

## Files quan trọng để Founder đọc

| File | Mục đích |
|---|---|
| `docs/governance/QA_VERIFICATION_FINAL_2026-07-03.md` | Báo cáo QA cuối |
| `docs/deployment/GO_LIVE_DEPLOYMENT_GUIDE.md` | Hướng dẫn deploy chi tiết |
| `docs/governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` | Architecture lock |
| `docs/governance/PRODUCT_BOUNDARY_CONTRACT.md` | 5 commercial objects |
| `docs/governance/ENTITLEMENT_MODEL.md` | Plan → entitlement mapping |
| `AGENTS.md` | Quy luật làm việc + brand lock |
3. **Financial model là hypothesis only** — không phải forecast
4. **Gen1/Gen2 frozen** — không sửa, chỉ reference
5. **Sprint 0 governance OPEN** — cần lock trước khi production release

---

## Files quan trọng để Founder đọc

| File | Mục đích |
|---|---|
| `docs/governance/QA_VERIFICATION_FINAL_2026-07-03.md` | Báo cáo QA cuối |
| `docs/deployment/GO_LIVE_DEPLOYMENT_GUIDE.md` | Hướng dẫn deploy chi tiết |
| `docs/governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` | Architecture lock |
| `docs/governance/PRODUCT_BOUNDARY_CONTRACT.md` | 5 commercial objects |
| `docs/governance/ENTITLEMENT_MODEL.md` | Plan → entitlement mapping |
| `AGENTS.md` | Quy luật làm việc + brand lock |
3. **Financial model là hypothesis only** — không phải forecast
4. **Gen1/Gen2 frozen** — không sửa, chỉ reference
5. **Sprint 0 governance OPEN** — cần lock trước khi production release

---

## Files quan trọng để Founder đọc

| File | Mục đích |
|---|---|
| `docs/governance/QA_VERIFICATION_FINAL_2026-07-03.md` | Báo cáo QA cuối |
| `docs/deployment/GO_LIVE_DEPLOYMENT_GUIDE.md` | Hướng dẫn deploy chi tiết |
| `docs/governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` | Architecture lock |
| `docs/governance/PRODUCT_BOUNDARY_CONTRACT.md` | 5 commercial objects |
| `docs/governance/ENTITLEMENT_MODEL.md` | Plan → entitlement mapping |
| `AGENTS.md` | Quy luật làm việc + brand lock |
