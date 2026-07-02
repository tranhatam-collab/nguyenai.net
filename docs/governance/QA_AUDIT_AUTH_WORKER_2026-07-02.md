# QA AUDIT — Auth Worker (apps/auth) + D1 Identity Schema

> **Auditor:** AI QA Specialist — Chief Inspector (36+ năm kinh nghiệm, khó tính nhất)
> **Ngày audit:** 2026-07-02
> **Phương pháp:** Code review độc lập + rebuild + 28 E2E test tự chạy + cross-reference RFC
> **Repo:** `/Users/tranhatam/Documents/Devnewproject/nguyenai.net`
> **Files audit:** `apps/auth/src/index.ts`, `apps/auth/src/db.ts`, `apps/auth/src/d1-audit-store.ts`, `migrations/001_identity_access.d1.sql`, `packages/@nai/auth/src/index.ts`, `packages/@nai/audit/src/index.ts`, `apps/auth/wrangler.jsonc`
> **RFC tham chiếu:** `IDENTITY_AND_TENANCY_RFC.md`, `DATA_CLASSIFICATION_AND_RETENTION.md`, `ECOSYSTEM_SOURCE_OF_TRUTH.md`

---

## TÓM TẮT EXECUTIVE

| Hạng mục | Kết quả verify độc lập |
|---|---|
| Build claim (96.89 KiB, D1 binding) | ✅ PASS — verify lại `wrangler deploy --dry-run` |
| 17 E2E test claims | ✅ PASS — chạy lại 28 test độc lập, tất cả pass |
| Audit append-only (UPDATE/DELETE blocked) | ✅ PASS — trigger SQLite chặn cả 2 |
| Password hashing (PBKDF2 + constant-time) | ✅ PASS — code đúng |
| Cookie spec (HttpOnly, Secure, SameSite, Domain) | ✅ PASS — khớp RFC §7.1 |
| SQL injection | ✅ PASS — toàn bộ parameterized |
| CORS restriction | ✅ PASS — chỉ *.nguyenai.net + localhost |
| Session revocation | ✅ PASS — revoked session bị reject |

**Nhưng phát hiện 4 lỗi P0 + 6 lỗi P1 + 4 lỗi P2 mà báo cáo tự khen đã bỏ qua.**

**Verdict:** Auth Worker là **dev prototype tốt**, không phải production-ready. Có 1 lỗi IDOR (Insecure Direct Object Reference) cho phép user A revoke API key của user B — đây là lỗi security nghiêm trọng.

---

## 🔴 P0 — CRITICAL (block production)

### P0-1: IDOR trên DELETE /auth/api-keys/:id — User A có thể revoke API key của User B

**Mức:** P0 Security — Insecure Direct Object Reference
**File:** `apps/auth/src/index.ts:565-586`

```typescript
app.delete('/auth/api-keys/:id', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const keyId = c.req.param('id');
  await revokeApiKey(c.env.DB, keyId);  // ← KHÔNG CHECK key có thuộc user không!
  ...
});
```

**Tấn công:** User A đăng nhập, lấy session, gọi `DELETE /auth/api-keys/{key_id_của_user_B}`. Worker chỉ check session hợp lệ, không check `key.user_id === session.user_id`. API key của user B bị revoke.

**Fix:**
```typescript
app.delete('/auth/api-keys/:id', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  const keyId = c.req.param('id');
  // Check ownership trước khi revoke
  const key = await findApiKeyById(c.env.DB, keyId);
  if (!key || key.user_id !== session.user_id) {
    return c.json({ error: 'not found' }, 404);  // không leak tồn tại
  }
  await revokeApiKey(c.env.DB, keyId);
  ...
});
```

**Assignee:** Backend team
**ETA:** 15 phút

---

### P0-2: Không có rate limiting — Vi phạm RFC §9

**Mức:** P0 Security — Brute force possible
**File:** `apps/auth/src/index.ts` (toàn bộ file)

RFC §9 yêu cầu:
- Login attempts: max 5 per 15 min per email + IP; lock 30 min sau 5 failures
- Magic link: max 3 per hour per email
- Passkey auth: max 10 per 15 min per IP
- Account recovery: max 3 per 24h per email

**Thực tế:** KHÔNG có rate limiting ở bất kỳ endpoint nào. Attacker có thể brute force password không giới hạn.

**Fix:** Thêm D1-based rate limiter hoặc Cloudflare Rate Limiting binding:
```typescript
// Ví dụ: check login attempts
const recentFailures = await countRecentLoginFailures(db, email, ip, 15 * 60);
if (recentFailures >= 5) {
  return c.json({ error: 'too many attempts, try again later' }, 429);
}
```

**Assignee:** Backend team
**ETA:** 2 giờ

---

### P0-3: MFA dev bypass — ANY 6-digit code accepted khi ENVIRONMENT=development

**Mức:** P0 Security — MFA bypass nếu config sai
**File:** `apps/auth/src/index.ts:477-491`

```typescript
if (c.env.ENVIRONMENT === 'development' && /^\d{6}$/.test(code)) {
  await verifyMfaFactor(c.env.DB, mfa_id);
  return c.json({ verified: true, mfa_id });
}
return c.json({ error: 'TOTP verification not yet implemented in production mode' }, 501);
```

**Vấn đề:** Nếu `ENVIRONMENT` bị set nhầm thành `"development"` trên production (đã xảy ra trong nhiều incident thực tế), MFA bị bypass hoàn toàn — bất kỳ 6 chữ số nào cũng pass.

**Fix:** Wire thư viện `otpauth` ngay. Không chấp nhận "dev mode bypass" trong code production:
```typescript
import { Secret, TOTP } from 'otpauth';
const totp = new TOTP({ secret: new Secret({ base32: factor.secret }), ... });
const delta = totp.validate({ token: code, window: 1 });
if (delta === null) return c.json({ error: 'invalid code' }, 400);
await verifyMfaFactor(c.env.DB, mfa_id);
```

**Assignee:** Backend team
**ETA:** 1 giờ

---

### P0-4: CSRF token được generate nhưng KHÔNG BAO GIỜ verify

**Mức:** P0 Security — CSRF protection non-functional
**File:** `apps/auth/src/index.ts:312` (generate), toàn bộ POST/DELETE endpoints (không check)

Login response trả về `csrf_token`, schema có field `csrf_token` trong sessions table, nhưng:
- `POST /auth/logout` — không check CSRF
- `DELETE /auth/api-keys/:id` — không check CSRF
- `POST /auth/mfa/enroll` — không check CSRF
- `POST /auth/mfa/verify` — không check CSRF
- `POST /auth/api-keys` — không check CSRF

**Tấn công:** Attacker tạo trang web với form submit đến `auth.nguyenai.net/auth/api-keys`, nạn nhân đã đăng nhập sẽ tạo API key cho attacker mà không cần biết (CSRF). SameSite=Lax cookie chặn một số trường hợp nhưng không phải tất cả (GET requests, top-level navigation).

**Fix:** Thêm CSRF middleware cho tất cả state-changing endpoints:
```typescript
app.use('/auth/*', async (c, next) => {
  if (c.req.method === 'POST' || c.req.method === 'DELETE' || c.req.method === 'PUT') {
    const session = c.get('session');
    if (session) {
      const csrfHeader = c.req.header('X-CSRF-Token');
      if (csrfHeader !== session.csrf_token) {
        return c.json({ error: 'csrf token mismatch' }, 403);
      }
    }
  }
  await next();
});
```

**Assignee:** Backend team
**ETA:** 30 phút

---

## 🟡 P1 — HIGH (fix trước production)

### P1-1: Thiếu /v1/ version prefix — Vi phạm RFC §6

**File:** `apps/auth/src/index.ts` toàn bộ routes

RFC §6 specify:
- `GET /v1/session`
- `POST /v1/auth/magic-link`
- `POST /v1/logout`
- `GET /v1/me`

Worker implement:
- `GET /auth/session`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

**Thiếu `/v1/` prefix.** Khi contract lock có version, tất cả relying parties sẽ gọi `/v1/session` nhưng Worker serve `/auth/session` → 404.

**Fix:** Đổi tất cả routes thành `/v1/auth/*`, `/v1/session`, `/v1/me`, etc.

---

### P1-2: Thiếu 15+ endpoints theo RFC §6

RFC specify ~25 endpoints. Worker implement 11. Missing:

| Endpoint | RFC section | Mức độ |
|---|---|---|
| `POST /v1/auth/magic-link` | §6.2 | P1 — fallback auth |
| `POST /v1/auth/magic-link/verify` | §6.2 | P1 |
| `POST /v1/auth/passkey/register-begin` | §6.2 | P1 — WebAuthn |
| `POST /v1/auth/passkey/register-finish` | §6.2 | P1 |
| `POST /v1/auth/passkey/authenticate-begin` | §6.2 | P1 |
| `POST /v1/auth/passkey/authenticate-finish` | §6.2 | P1 |
| `POST /v1/auth/oauth/{provider}/begin` | §6.2 | P2 — optional |
| `GET /v1/auth/oauth/{provider}/callback` | §6.2 | P2 |
| `POST /v1/me` (update profile) | §6.3 | P1 |
| `POST /v1/me/delete` (account deletion) | §6.3 | P1 — GDPR/PDPD |
| `GET /v1/organizations` | §6.4 | P1 |
| `POST /v1/organizations` | §6.4 | P1 |
| `POST /v1/organizations/{id}/members` | §6.4 | P1 |
| `DELETE /v1/organizations/{id}/members/{user_id}` | §6.4 | P1 |
| `POST /v1/auth/mfa/disable` | §6.5 | P1 |
| `GET /v1/sessions` (list active sessions) | §6.6 | P1 |
| `DELETE /v1/sessions/{id}` (revoke specific) | §6.6 | P1 |
| `POST /v1/sessions/revoke-all` (logout everywhere) | §6.6 | P1 |

**Note:** Báo cáo claim "11 routes" nhưng RFC require ~25. Đây không phải "done" — là 44% coverage.

---

### P1-3: Audit schema CHECK constraint thiếu event types từ DATA_CLASSIFICATION_AND_RETENTION.md §11.2

**File:** `migrations/001_identity_access.d1.sql:129-138`

Schema CHECK cho phép 19 event types. Nhưng `DATA_CLASSIFICATION_AND_RETENTION.md §11.2` liệt kê thêm:

```
account_deletion_completed, memory_written, memory_deleted, memory_exported,
vault_uploaded, vault_downloaded, vault_deleted,
command_submitted, command_completed, command_failed,
approval_granted, approval_rejected,
proof_submitted, proof_reviewed, certificate_issued, certificate_revoked,
investor_access_requested, investor_access_granted, investor_access_revoked,
investor_document_viewed, investor_document_downloaded,
private_route_denied
```

**Hậu quả:** Khi Gen 1, Academy, Investor service gọi `logAuditEvent()` với các event types này, INSERT sẽ fail với `CHECK constraint failed`. Audit log sẽ mất events critical.

**Fix:** Thêm tất cả event types từ RFC vào CHECK constraint, hoặc bỏ CHECK constraint entirely (rely on app-level validation).

---

### P1-4: Session rotation không implement

**File:** `apps/auth/src/db.ts` — field `rotated_at` tồn tại nhưng không có logic rotation

RFC §2.3 require "rotation on refresh". Hiện tại: session tạo → không bao giờ rotate → tồn tại đến khi expire hoặc revoke.

**Fix:** Implement session rotation trên mỗi N requests hoặc sau khoảng thời gian nhất định.

---

### P1-5: Email verification không wire

**File:** `apps/auth/src/index.ts:196-268` — register set `email_verified=0` nhưng:
- Login không check `email_verified`
- Không có endpoint gửi verification email
- Không có endpoint verify email

**Hậu quả:** Bất kỳ email nào cũng có thể đăng ký và login ngay, không cần verify email tồn tại. Spam/abuse vector.

---

### P1-6: PBKDF2 iterations thấp (100,000 vs OWASP 600,000+)

**File:** `packages/@nai/auth/src/index.ts:101`

```typescript
const PBKDF2_ITERATIONS = 100_000;
```

OWASP 2026 khuyến nghị PBKDF2-SHA256 ≥ 600,000 iterations. 100,000 là quá thấp cho production.

**Fix:** Tăng lên 600,000. Verify function đã đọc iterations từ stored hash nên backward-compatible.

---

## 🟢 P2 — MEDIUM (fix trước beta)

### P2-1: Email enumeration qua register endpoint

`POST /auth/register` trả 409 "email already registered" → attacker biết email tồn tại. Login đúng (same error cho wrong email/password) nhưng register leak.

**Trade-off:** UX cần 409 để user biết đã đăng ký. Acceptable nhưng nên rate limit register endpoint.

---

### P2-2: Không có expired session cleanup

Sessions expired nhưng `revoked_at IS NULL` vẫn nằm trong DB. Không có cron job dọn dẹp. Theo thời gian, table phình to.

**Fix:** Thêm scheduled cleanup hoặc Cloudflare Cron Trigger.

---

### P2-3: D1 explicitly temporary — schema comment nói "will migrate to Neon Postgres"

**File:** `migrations/001_identity_access.d1.sql:3`

```sql
-- Target: Cloudflare D1 (edge, temp) — will migrate to Neon Postgres for production
```

Toàn bộ queries dùng SQLite syntax. Khi migrate sang Postgres, cần rewrite nhiều query. AGENTS.md confirm: "DB: Neon PostgreSQL (primary) + D1 (edge)".

**Risk:** Migration debt. Acceptable cho dev nhưng cần plan migration.

---

### P2-4: AGENTS.md FOUNDER OVERRIDE mâu thuẫn ECOSYSTEM_SOURCE_OF_TRUTH.md

**Mâu thuẫn:**

| Tài liệu | Nói gì |
|---|---|
| `ECOSYSTEM_SOURCE_OF_TRUTH.md §2.1` | "Gen 1 is the **only** runtime. No repo may spin up its own command/agent execution engine." |
| `ECOSYSTEM_SOURCE_OF_TRUTH.md §2.2` | "Gen 2 is the **only** entitlement and billing authority." |
| `AGENTS.md` (FOUNDER OVERRIDE 2026-07-02) | "nguyenai.net sở hữu backend riêng độc lập. Gen1 và Gen2 đóng băng (reference only, không sửa, không deploy)." |

**Phân tích:** AGENTS.md override cho phép nguyenai.net build backend riêng, trái với governance lock nói Gen 1 là runtime duy nhất và Gen 2 là entitlement authority duy nhất.

**Hậu quả:** Auth Worker hiện tại là backend riêng của nguyenai.net. Nếu theo ECOSYSTEM_SOURCE_OF_TRUTH, auth phải là shared service `auth.nguyenai.net` (đúng), nhưng entitlement/billing phải đến từ Gen 2. Nếu Gen 2 frozen, ai serve entitlement?

**Recommendation:** Founder cần issue formal amendment cập nhật ECOSYSTEM_SOURCE_OF_TRUTH.md để phản ánh FOUNDER OVERRIDE. Một tài liệu nói "Gen 1 là runtime duy nhất", tài liệu khác nói "Gen 1 frozen, build backend riêng" — dev team không biết theo cái nào.

---

## ✅ VERIFIED PASS (10/10)

| # | Claim | Verify method | Kết quả |
|---|---|---|---|
| 1 | Build 96.89 KiB | `wrangler deploy --dry-run` | ✅ 96.89 KiB / gzip 23.34 KiB |
| 2 | D1 binding `DB` | wrangler output | ✅ `env.DB (nai-identity) D1 Database` |
| 3 | 17 E2E tests | Chạy lại 28 test độc lập | ✅ 28/28 pass |
| 4 | Register + duplicate detection | curl test #2, #3 | ✅ 201 + 409 |
| 5 | Login + wrong password | curl test #4, #5 | ✅ 200 + 401 |
| 6 | Session + me with cookie | curl test #6, #7 | ✅ 200 |
| 7 | MFA enroll + verify | curl test #8, #9 | ✅ 201 + 200 |
| 8 | API key create + list | curl test #10, #11 | ✅ 201 + 200 |
| 9 | Audit log | curl test #12 | ✅ 3 events |
| 10 | Logout + revoked session | curl test #13-16 | ✅ 204 + 401 |
| 11 | Append-only audit | D1 UPDATE/DELETE attempt | ✅ ABORT both |
| 12 | Fake cookie rejected | curl test #20 | ✅ 401 |
| 13 | Short password rejected | curl test #21 | ✅ 400 |
| 14 | Invalid email rejected | curl test #22 | ✅ 400 |
| 15 | Non-existent email (no leak) | curl test #23 | ✅ 401 (same as wrong password) |
| 16 | Unauthenticated MFA/API key/audit | curl test #24-26 | ✅ 401 all |
| 17 | CORS evil origin | curl test #27 | ✅ No ACAO header |
| 18 | CORS nguyenai origin | curl test #28 | ✅ ACAO reflected |
| 19 | Password hashing PBKDF2 | Code review | ✅ PBKDF2 + constant-time |
| 20 | Cookie spec | Header capture | ✅ HttpOnly, Secure, SameSite=Lax, Domain=.nguyenai.net |

---

## FIX PRIORITY ORDER

```
HOTFIX (trước khi deploy bất cứ đâu):
  P0-1: IDOR DELETE /auth/api-keys/:id — thêm ownership check (15 phút)
  P0-2: Rate limiting — D1-based hoặc CF Rate Limiting binding (2 giờ)
  P0-3: MFA dev bypass — wire otpauth library (1 giờ)
  P0-4: CSRF token verification — thêm middleware (30 phút)

P1 (trước beta):
  P1-1: /v1/ prefix cho tất cả routes (1 giờ)
  P1-2: Implement missing 15+ endpoints (3-5 ngày)
  P1-3: Audit schema CHECK — thêm event types (15 phút)
  P1-4: Session rotation (4 giờ)
  P1-5: Email verification flow (4 giờ)
  P1-6: PBKDF2 iterations 100K → 600K (5 phút)

P2 (trước public release):
  P2-1: Rate limit register endpoint (30 phút)
  P2-2: Expired session cleanup cron (1 giờ)
  P2-3: D1 → Neon Postgres migration plan (1 ngày)
  P2-4: Founder amendment cho ECOSYSTEM_SOURCE_OF_TRUTH (Founder decision)
```

---

## VERIFICATION CHECKLIST SAU FIX

```bash
# 1. IDOR fix
curl -s -X DELETE $BASE/auth/api-keys/{key_cua_user_khac} -H "Cookie: $COOKIE"
# → 404 (not 204)

# 2. Rate limiting
for i in $(seq 1 6); do curl -s -o /dev/null -w "%{http_code} " -X POST $BASE/auth/login ...; done
# → 401 401 401 401 401 429

# 3. MFA production
curl -s -X POST $BASE/auth/mfa/verify -d '{"mfa_id":"...","code":"000000"}'
# → 400 "invalid code" (không phải 200 với any code)

# 4. CSRF
curl -s -X POST $BASE/auth/logout -H "Cookie: $COOKIE"
# → 403 (thiếu X-CSRF-Token header)

# 5. /v1/ prefix
curl -s $BASE/v1/session -H "Cookie: $COOKIE"
# → 200

# 6. Audit event types
wrangler d1 execute nai-identity --local --command "INSERT INTO audit_log (event_id, event_type, result) VALUES ('test', 'memory_written', 'success')"
# → success (không fail CHECK)
```

---

**Auditor:** AI QA Specialist — Chief Inspector
**Ngày:** 2026-07-02
**Verdict:** ⚠️ **DEV PROTOTYPE TỐT — KHÔNG PRODUCTION-READY. 4 lỗi P0 phải fix trước bất kỳ deploy nào.**
