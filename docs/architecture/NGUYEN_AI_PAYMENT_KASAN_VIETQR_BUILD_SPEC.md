# NGUYEN AI — PAYMENT: KASAN + VietQR qua pay.iai.one

> **Ngày:** 2026-07-07 · **Trạng thái:** Code IMPLEMENTED (chờ secrets + provider_accounts để go-live).
> **Founder directive:** "Dùng Công Ty Cổ Phần Hành Trình Kasan và checkout bằng VietQR code chuyển khoản ngân hàng."

---

## 1. Quyết định

| Hạng mục | Giá trị |
|---|---|
| **Merchant of record** | CÔNG TY CỔ PHẦN HÀNH TRÌNH KASAN (KASAN JSC) |
| **Rail** | VietQR chuyển khoản ngân hàng (VND) |
| **Gateway** | pay.iai.one → provider `payos` (canonical, F10 lock) |
| **Currency** | VND (integer) |
| **VAT** | 10% do KASAN JSC phát hành (đã có sẵn `computeVat` trong `@nai/billing`) |
| Stripe / VNPay direct | Giữ code, KHÔNG phải rail VN chính. VietQR đi qua `payos`. |

### ⚠️ Settlement phải về KASAN, KHÔNG về TTP
pay.iai.one mặc định: tenant không có `provider_accounts` row → settle về **global PayOS = V1 Thành Tâm Phát**. Để tiền về **KASAN**, bắt buộc:
1. Tạo **PayOS merchant riêng cho KASAN** (link tài khoản ngân hàng KASAN → VietQR trả về STK này).
2. Đăng ký thành **`provider_accounts` row cho tenant `nguyenai`** (`dedicated_prov=1`).

---

## 2. 🔴 Thông tin pháp nhân KASAN — Founder xác nhận (chưa verify local)

| Trường | Giá trị |
|---|---|
| Tên | CÔNG TY CỔ PHẦN HÀNH TRÌNH KASAN | 
| MST | `__________` ⏳ |
| Ngân hàng / STK | `__________` ⏳ (session trước nhắc ACB `30051378` — **CHƯA verify, đừng dùng tới khi confirm**) |
| Chủ TK | (đúng tên pháp nhân KASAN) ⏳ |
| PayOS Client ID / Secret | `A...` / `E...` ⏳ (tạo PayOS merchant KASAN) |

> KHÔNG hard-code STK chưa verified. Sai STK = tiền về sai pháp nhân.

---

## 3. Đã implement (code)

### `packages/@nai/billing/src/index.ts`
- `Gateway` type thêm `'payos'`.
- `createPayOsCheckout(env, req, price)` → POST `pay.iai.one/internal/checkout-session` (x-api-key + x-idempotency-key), trả `authorize_url` = trang VietQR `pay.payos.vn`.
- `verifyPayOsWebhook(env, rawBody, sigHex)` → HMAC-SHA256 hex, constant-time.
- `parsePayOsWebhook(body)` → paid gate `payment.completed | order.paid`.

### `apps/api/src/index.ts`
- Import 3 hàm trên; Env bindings `PAY_IAI_ONE_*` + `PAY_NAI_HMAC`.
- `POST /v1/payment/checkout` thêm nhánh `gateway === 'payos'` (VND-only). **Không** log `payment_received` tại checkout (tiền chưa về).
- `POST /v1/payment/webhook` (mới) → verify HMAC (`x-iai-signature`, fallback `x-webhook-signature`) → `generateInvoice(result, true)` (KASAN VAT 10%) → audit `payment_received` (metadata `merchant: KASAN_JSC`, `event_id`).

### `apps/api/wrangler.jsonc`
- Vars: `PAY_IAI_ONE_BASE_URL/TENANT_CODE/SITE_CODE/PROVIDER/CALLBACK_BASE`.

---

## 4. Canonical contract (LIVE-verified qua dsts/tramsaigon)

```
POST https://pay.iai.one/internal/checkout-session
Headers: x-api-key: <PAY_IAI_ONE_API_KEY>   x-idempotency-key: <internal_order_id>
Body: { tenant_code:"nguyenai", site_code:"nguyenai", provider:"payos",
        internal_order_id, amount:<int VND>, currency:"VND", billing_cycle:"one_time",
        description, email, full_name, callback_url, success_url, cancel_url, metadata }
→ 200 { checkout_url:"https://pay.payos.vn/web/...", provider_order_id|payment_session_id }
```
Webhook → `callback_url` = `https://api.nguyenai.net/v1/payment/webhook`, HMAC-SHA256 hex, header `x-iai-signature`, fields `order_id`/`event_id`/`event_type`.

---

## 5. 🚦 Go-live checklist (Founder / pay.iai.one side)

- [ ] Xác nhận pháp nhân KASAN §2 (MST, STK, chủ TK).
- [ ] Tạo PayOS merchant KASAN (link TK ngân hàng KASAN).
- [ ] Đăng ký tenant `nguyenai` + site `nguyenai` ở pay.iai.one → mint `PAY_IAI_ONE_API_KEY`.
- [ ] Tạo `provider_accounts` row cho tenant `nguyenai` trỏ PayOS KASAN (`dedicated_prov=1`) → **settle về KASAN**.
- [ ] `wrangler secret put PAY_IAI_ONE_API_KEY` (worker `nguyenai-api-gateway`).
- [ ] `PAY_NAI_HMAC = openssl rand -hex 32` → `wrangler secret put PAY_NAI_HMAC` **và** đăng ký cùng giá trị làm webhook_secret ở pay.iai.one.
- [ ] Deploy → smoke test: `POST /v1/payment/checkout {gateway:"payos", currency:"VND", price_id}` → nhận `authorize_url` = pay.payos.vn.
- [ ] Test webhook → xác nhận audit `payment_received` (merchant KASAN_JSC).

## 6. Signoff packet — cập nhật đề xuất
- Bước 3.5 E2E: "Payment checkout (Stripe test mode)" → **"VietQR (pay.iai.one/PayOS) → tiền về KASAN"**.
- Bước 3.1 secrets: thêm `PAY_IAI_ONE_API_KEY`, `PAY_NAI_HMAC`.
