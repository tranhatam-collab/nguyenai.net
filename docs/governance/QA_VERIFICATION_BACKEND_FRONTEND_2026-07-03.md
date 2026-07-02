# QA VERIFICATION — Backend + Frontend Audit Report

> **Auditor:** AI QA Specialist — Chief Inspector (36+ năm, khó tính nhất)
> **Ngày:** 2026-07-03
> **Báo cáo được verify:** `docs/governance/QA_AUDIT_BACKEND_FRONTEND_2026-07-03.md` (commit `1a30744`)
> **Phương pháp:** Verify độc lập từng claim đỏ + xanh, tìm thêm issues

---

## TÓM TẮT

| Hạng mục | Claim | Verify độc lập | Verdict |
|---|---|---|---|
| R1 — Email verification đứt | CRITICAL | ✅ CONFIRMED + phát hiện thêm | 🔴 |
| R2 — API Worker InMemoryStore | CRITICAL | ✅ CONFIRMED + phát hiện thêm | 🔴 |
| R3 — Typecheck fail 5 packages | HIGH | ✅ CONFIRMED (3 thiếu tsconfig, 2 có tsconfig) | 🟡 |
| R4 — 39/47 packages stub | HIGH | ✅ CONFIRMED (36 stub 20 dòng, gateway-sdk 0 dòng) | 🟡 |
| R5 — 4 app dirs trống | HIGH | ✅ CONFIRMED (console/admin/academy/invest — no src) | 🟡 |
| R6 — 33/50 pages thin | MEDIUM | ✅ CONFIRMED (33 pages <5KB) | 🟢 |
| G1 — Build 52/52 | PASS | ✅ VERIFIED | ✅ |
| G2 — Tests 61/61 | PASS | ✅ VERIFIED | ✅ |

**Phát hiện NEW issues không trong báo cáo: 4 lỗi security P0/P1 mới**

---

## 🔴 RED ITEMS — VERIFIED

### R1: Email verification flow đứt — CONFIRMED + phức tạp hơn báo cáo

**Báo cáo nói:** "Không có endpoint verify-email, token không lưu DB"

**Verify thực tế:**
- ✅ Không có `/auth/verify-email` endpoint — confirmed
- ✅ Không có `email_verification_tokens` table — confirmed
- ✅ `email_verified` field tồn tại trong schema (default 0)
- ✅ Login check `email_verified` ở line 405: `if (!user.email_verified) return 403`

**NHƯNG phát hiện thêm (báo cáo không nói):**
- Register set `email_verified=0` nhưng **không gửi verification email**
- User đăng ký → không bao giờ verify được → **KHÔNG LOGIN ĐƯỢC VÀO LÚC NÀO**
- Đây không chỉ là "flow đứt" — là **deadlock toàn bộ user onboarding**
- Mọi user mới đều bị khóa ở login: `403 "email not verified"`

**Mức thực:** CRITICAL+ — toàn bộ onboarding broken, không chỉ "đứt flow"

---

### R2: API Worker InMemoryStore — CONFIRMED + nghiêm trọng hơn

**Báo cáo nói:** "API Worker không có D1 binding — dùng InMemoryStore"

**Verify thực tế:**
- ✅ `wrangler.jsonc` chỉ có R2 binding (AUDIT_ARCHIVE), không có D1 — confirmed
- ✅ 3 InMemoryStore: audit, entitlement, approval — confirmed
- ✅ Data mất khi restart — confirmed

**NHƯNG phát hiện thêm (báo cáo không nói):**
- `resolveSessionFromCookie()` là **stub trả về null luôn** (line 312-316)
- TODO comment: "call auth.nguyenai.net /v1/session with the cookie"
- **Mọi endpoint cần session đều trả 401** — API Worker hoàn toàn non-functional
- `GET /v1/entitlements` → 401, `POST /v1/approvals` → 401, `GET /v1/usage` → 401
- Chỉ `GET /v1/plans` và `GET /health` hoạt động (không cần session)

**Mức thực:** CRITICAL+ — API Worker là **dead code** trong dev, không chỉ "data mất khi restart"

---

### R3: Typecheck fail 5 packages — CONFIRMED nhưng sai chi tiết

**Báo cáo nói:** "5 packages: contracts, gateway-sdk, runtime-sdk thiếu tsconfig; policy-fga, email có type errors"

**Verify thực tế:**
- ✅ contracts: tsconfig.json MISSING — confirmed
- ✅ gateway-sdk: tsconfig.json MISSING — confirmed (và 0 dòng code!)
- ✅ runtime-sdk: tsconfig.json MISSING — confirmed
- ⚠️ policy-fga: tsconfig.json EXISTS (báo cáo nói "có type errors" — đúng nhưng không phải thiếu tsconfig)
- ⚠️ email: tsconfig.json EXISTS (tương tự)

**Sửa lại:** 3 packages thiếu tsconfig, 2 packages có tsconfig nhưng type errors. Báo cáo gộp nhầm.

---

### R4: 39/47 packages stub — CONFIRMED + worse

**Verify thực tế:**
- 36 packages: đúng 20 dòng (stub template)
- gateway-sdk: **0 dòng** (hoàn toàn trống — worse than stub)
- 8 packages có logic: approval(432), policy-engine(471), entitlement(475), auth(487), audit(495), runtime-sdk(643), email(1125), contracts(3145)
- policy-fga: 283 dòng (có logic nhưng 0 test)

**Tất cả 47 packages: 0 test files.** Không phải "39 stub" — là **47/47 không có test**.

---

### R5: 4 app dirs trống — CONFIRMED

- apps/console: no src dir
- apps/admin: no src dir
- apps/academy: no src dir
- apps/invest: no src dir

---

### R6: 33/50 pages thin — CONFIRMED

33 pages <5KB. Largest thin page: academy (4910 B). Smallest: contact (4413 B).

---

## 🔴 NEW ISSUES — Không trong báo cáo

### NEW-P0-1: IDOR trên Approval — User bất kỳ approve/deny approval của user khác

**Mức:** P0 Security
**File:** `apps/api/src/index.ts:229-255`, `packages/@nai/approval/src/index.ts:172`

```typescript
app.post('/v1/approvals/:id/approve', async (c) => {
  const session = c.get('session');
  if (!session) return 401;
  const id = c.req.param('id');
  await approveRequest(id, session.user_id);  // ← KHÔNG CHECK approval thuộc user/tenant nào
});
```

`approveRequest()` chỉ check `status === 'pending'`, không check `approval.user_id === session.user_id` hoặc `approval.tenant_id === session.tenant_id`.

**Tấn công:** User A request approval. User B (bất kỳ) approve/deny approval của A.

**Fix:** Check ownership + permission `admin:access-revoke` hoặc role ADMIN trước khi approve/deny.

---

### NEW-P0-2: Entitlement escalation — User tự chọn plan qua query param

**Mức:** P0 Security — Privilege escalation
**File:** `apps/api/src/index.ts:173`

```typescript
const planId = (c.req.query('plan') ?? 'nguyen-start') as PlanId;
const ent = await resolveEntitlements(session.user_id, session.tenant_id, planId);
```

**Tấn công:** User trên Start plan gọi `GET /v1/entitlements?plan=nguyen-enterprise` → nhận entitlements của Enterprise plan. `as PlanId` cast không validate.

**Fix:** Đọc plan từ session/DB, không từ query param. Hoặc validate `planId` thuộc user's active subscription.

---

### NEW-P1-1: API Worker hoàn toàn non-functional — session luôn null

**Mức:** P1 (đã note trong R8 nhưng underestimate)
**File:** `apps/api/src/index.ts:312-316`

```typescript
async function resolveSessionFromCookie(_cookie: string): Promise<Session | null> {
  // TODO: call auth.nguyenai.net /v1/session with the cookie
  return null;  // ← LUÔN trả null
}
```

**Hậu quả:** Mọi endpoint cần auth trả 401. API Worker là dead code. Báo cáo ghi R8 "LOW" — sai mức, nên là **P1 HIGH**.

---

### NEW-P1-2: 47/47 packages không có test — báo cáo nói "39 stub"

**Mức:** P1 — Test coverage = 0%
**File:** Tất cả `packages/@nai/*/`

Báo cáo nói "39/47 packages là stub" nhưng **thực tế 47/47 không có test files**. Kể cả 8 packages có logic (auth, audit, entitlement, approval, contracts, runtime-sdk, email, policy-fga) — 0 test.

**Fix:** Viết test cho 8 packages có logic trước. Stub packages có thể skip.

---

## ✅ GREEN ITEMS — VERIFIED

| # | Claim | Verify | Kết quả |
|---|---|---|---|
| G1 | Build 52/52 | `pnpm build` | ✅ 52/52 FULL TURBO |
| G2 | Tests 61/61 | `pnpm test` | ✅ 61/61 FULL TURBO |
| G7 | Security: HttpOnly+Secure cookie, CSRF, rate limit, IDOR fix, MFA, PBKDF2 | Code review trước | ✅ (nhưng IDOR mới trên approval) |

**Note G2:** 61/61 tasks pass nhưng **0 test files trong 47 packages**. Tests chỉ ở e2e-tests + catalog + web. "61 tasks" ≠ "code coverage tốt".

---

## VERDICT TỔNG

| Hạng mục | Báo cáo gốc | Verify độc lập |
|---|---|---|
| R1 Email verification | CRITICAL | ✅ Confirmed + **deadlock toàn onboarding** |
| R2 API InMemoryStore | CRITICAL | ✅ Confirmed + **API hoàn toàn non-functional** |
| R3 Typecheck | HIGH | ✅ Confirmed (sửa chi tiết: 3 thiếu tsconfig, 2 type errors) |
| R4 Stub packages | HIGH (39/47) | ✅ Confirmed + **47/47 không test** |
| R5 App dirs trống | HIGH | ✅ Confirmed |
| R6 Thin pages | MEDIUM (33/50) | ✅ Confirmed |
| **NEW-P0-1** | Không có | 🔴 **IDOR Approval** |
| **NEW-P0-2** | Không có | 🔴 **Entitlement escalation** |
| **NEW-P1-1** | R8 LOW | 🟡 **API dead code — nên là P1** |
| **NEW-P1-2** | R4 HIGH | 🟡 **47/47 không test, không phải 39** |

**Verdict:** Báo cáo gốc **chính xác về 6/6 red items** nhưng **underestimate severity** R1 (deadlock) + R2 (dead code). **Phát hiện 2 P0 security mới** (IDOR approval + entitlement escalation) mà báo cáo bỏ qua. R8 nên nâng từ LOW lên P1.

**Tổng issues:** 6 red (confirmed) + 2 P0 mới + 2 P1 nâng mức = **10 issues cần fix, 4 P0**.

---

**Auditor:** AI QA Specialist — Chief Inspector
**Ngày:** 2026-07-03
