# Founder Action Packet — 2026-07-17

**Repo:** `nguyenai.net`
**HEAD được verify:** `cca4d43f856bf9dcc79be5aece855da9b28d4771` (sẽ có commit mới sau packet này)
**Verdict hiện tại:** **HOLD** — code P0 đã đóng phần lớn; Founder/Ops/Legal gates còn mở.

---

## 1. Việc ĐÃ XONG (code-level, verify được)

| ID | Việc | Verify |
|---|---|---|
| P0-1 | `JWT_SECRET` không có runtime consumer; cleanup instructions trong `set-wrangler-secrets.sh` | `audit:secrets:production` static PASS |
| P0-3 | Webhook replay: `D1ReplayStore` thay in-memory `Map`; migration 0009 | `audit:production-durability` PASS |
| P0-4 | Subscription store: `D1SubscriptionStore` thay in-memory; migration 0009 | `audit:production-durability` PASS |
| P0-5 | VNPay refund: fail-closed + HMAC-SHA512 signing; không fake success | `audit:production-durability` PASS |
| P0-6 | PayOS refund: fail-closed; không fallback mock | `audit:production-durability` PASS |
| P0-8 | AI Provider authenticated journey E2E: 14/14 PASS | `tests/e2e/ai-provider-authenticated-journey-e2e.ts` |
| P0-9 | Certificate verify/issue/revoke endpoints (D1-backed, audit trail) | `apps/api/src/edu-routes.ts` |
| OP-P0-04 | Production durability audit CI gate | `tools/audit-production-durability.mjs` |
| P0-7 (prior) | Mock blocked in production; 503 khi thiếu gateway key | `audit:production-durability` PASS |

---

## 2. Việc CÒN LOCK — cần Founder/Ops/Legal

### 2.1 P0-2: Production commerce secrets (Founder/Ops)

**Bắt buộc trước khi bật commerce:**

Ít nhất MỘT nhóm secret hoàn chỉnh phải được set trên Cloudflare production:

| Nhóm | Secrets | Merchant |
|---|---|---|
| PayOS/VietQR | `PAY_GATEWAY_API_KEY` + `PAY_NAI_HMAC` | KASAN JSC |
| Stripe | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | VIET CAN NEW CORP |
| VNPay | `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` | Vietnam domestic |

**Non-secret vars (đã trong wrangler.jsonc):** `VNPAY_PAY_URL`, `VNPAY_RETURN_URL`, `PAY_GATEWAY_BASE_URL`, `PAY_GATEWAY_TENANT_CODE`, `PAY_GATEWAY_SITE_CODE`, `PAY_GATEWAY_PROVIDER`, `PAY_GATEWAY_CALLBACK_BASE`.

**Founder action:**
1. Chọn merchant(s) sẽ go-live.
2. Set secret values qua `wrangler secret put` hoặc dashboard.
3. Verify `pnpm audit:secrets:production` PASS.
4. Nếu KHÔNG bật commerce: checkout/API/claims phải bị tắt rõ ràng (feature flag).

### 2.2 P0-1 (remaining): Xóa `JWT_SECRET` khỏi dashboard (Founder)

Code đã clean. Nhưng nếu `JWT_SECRET` đã set trên Cloudflare dashboard, Founder phải xóa thủ công:
1. Dashboard → Workers & Pages → API Worker → Settings → Variables and Secrets.
2. Tìm `JWT_SECRET`, xóa.
3. Làm tương tự cho Auth Worker.
4. Re-run `pnpm audit:secrets:production` → PASS.

### 2.3 P0-7: Authz production E2E (Team 1 + QA)

**Test plan bắt buộc trước commercial GO:**

| Test | Steps | Pass criteria |
|---|---|---|
| Email registration | register → verify email → D1 session created | session tồn tại trong D1, cookie hợp lệ |
| Login + logout | login → access private route → logout → retry private route | private route 401 sau logout |
| Session expiry | login → wait TTL → access private route | 401 sau expiry |
| Token replay | capture cookie → replay sau revoke | 401 |
| Google OAuth repeat | OAuth login lần 1 → logout → OAuth login lần 2 | Không tạo duplicate identity; state/nonce validate |
| Role isolation | user A tenant X → try access tenant Y data | 403 cross-tenant |
| Admin role | admin → access admin endpoint | 200; non-admin → 403 |
| Cookie/CORS/CSRF | browser test across subdomains | origin ngoài allowlist bị chặn; CSRF token validate |

**Evidence yêu cầu:** SHA, deployment ID, timestamp, command, output, journey, rollback.

### 2.4 P0-10: Monitoring / restore / rollback / legal (Team 6 + Founder + Legal)

| ID | Việc | Owner | DoD |
|---|---|---|---|
| SRE-P0-01 | Structured logs + traces + metrics | Team 6 | Correlation IDs, dashboards cho auth/payment/provider/job/error/latency/cost |
| SRE-P0-02 | Alert test | Team 6 | Synthetic failure → alert → acknowledge → incident record |
| SRE-P0-03 | D1/R2 backup + restore drill | Team 6 | Restore vào isolated env, integrity check pass, RTO/RPO record |
| SRE-P0-04 | Rollback drill | Team 6 + 0 | Rollback exact deployment không xóa production data |
| LEGAL-P0-01 | Merchant/entity/IP/refund/privacy/disclosure review | Founder + Legal | Written decision + public copy approved |
| RELEASE-P0-01 | Six critical production journeys | Team 0 + all | Auth, payment, AI, workflow, Edu cert, refund/incident pass trên cùng deployment |
| RELEASE-P0-02 | Founder release verdict | Founder | Signed GO/BETA/HOLD gắn exact SHA + deployment IDs |

---

## 3. Migration bắt buộc khi deploy

```sql
-- 0009_webhook_replay_and_subscriptions.sql
-- Phải apply trên production D1 trước khi bật commerce
pnpm wrangler d1 migrations apply nai-production --remote
```

---

## 4. CI gates mới (đã thêm)

- `pnpm audit:production-durability` — fail nếu phát hiện in-memory store, fake refund, mock fallback trong production path.
- Đã thêm vào `audit:all` và deploy workflow.

---

## 5. Phán quyết

**Code P0 đã đóng phần lớn.** Các việc còn lại là **external gates** — Founder, Ops, Legal, QA production E2E. Không được claim "operational" hoặc "go-live" cho đến khi:

1. Commerce secrets set (hoặc commerce OFF rõ ràng).
2. `JWT_SECRET` xóa khỏi dashboard.
3. Authz production E2E pass với evidence.
4. Monitoring/restore/rollback drill pass.
5. Legal review done.
6. Founder sign-off gắn SHA + deployment ID.

**Founder cần ra quyết định:** GO / BETA / HOLD.
