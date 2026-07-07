# SECURITY P0 FIX EVIDENCE — 2026-07-07

> **Trạng thái:** 5/5 security P0 đã fix và verify.
> **Phạm vi:** nguyenai.net monorepo.
> **Ngày:** 2026-07-07

---

## Tóm tắt

| Mã | Lỗi | Fix | Verify |
|---|---|---|---|
| SEC-P0-1 | SQL injection (tên cột nối chuỗi vào UPDATE) | Whitelist cột + regex validate + `assertAllowedColumn` | Unit test 12 assertions PASS, SAST audit PASS |
| SEC-P0-2 | Passkey bypass (không verify chữ ký WebAuthn) | Tắt toàn bộ `/passkey/*` route, trả 503 | Audit PASS: route trả 503, không còn TODO verify |
| SEC-P0-3 | `EVIDENCE_SIGNING_KEY` hardcode trong wrangler.jsonc | Xóa khỏi vars, dùng `wrangler secret put`, helper `resolveEvidenceSigningKey` | Audit PASS: không còn secret trong config |
| SEC-P0-4 | Auth middleware không dừng handler khi 401 | `requireAuth`/`requireAdmin` trả Response, handler `return` Response | Audit PASS: `instanceof Response` check, không còn bare `return;` |
| SEC-P0-5 | XSS (innerHTML với dữ liệu API) | Thay `innerHTML` bằng DOM construction + `textContent` | Audit PASS: không còn innerHTML với cert data |

---

## SEC-P0-1: SQL injection trong d1-store.ts

**File:** `packages/@nai/scholarship/src/d1-store.ts`

**Sai trước:** 13 hàm update dùng `fields.push(\`${toSnake(k)} = ?\`)` với `k` từ `Object.entries(patch)`. Attacker controlling patch keys có thể inject tên cột hoặc SQL fragment.

**Fix:**
- Thêm `ALLOWED_COLUMNS: Record<string, ReadonlySet<string>>` — whitelist 13 bảng với đầy đủ cột hợp lệ (lấy từ migration 004_scholarship.sql).
- Thêm `COLUMN_NAME_RE = /^[a-z][a-z0-9_]*$/` — defense in depth, chỉ cho phép lowercase ascii + digit + underscore.
- Thêm `assertAllowedColumn(table, column)` — throw nếu column không hợp lệ hoặc không trong whitelist.
- 13 hàm update (updateApplication, updateVerification, updateWish, updateSponsorship, updateInvestorProfile, updateForumPost, updateDocument, updateComment, updateReport, updateCouncilDecision, updateWaitlistEntry, updateEntitlement, updateCohort) đều dùng `assertAllowedColumn`.

**Verify:**
- Unit test `testSqlInjectionGuard` (12 assertions): chấp nhận cột hợp lệ, reject 8 injection attempts (`status = 'x'; DROP TABLE...`, `status') OR 1=1; --`, v.v.), reject cột không trong whitelist, reject bảng không tồn tại.
- `npx tsx src/test.ts` → 64 passed, 0 failed.
- `tools/audit-security-p0.ts` → SEC-P0-1: 3/3 checks PASS.

---

## SEC-P0-2: Passkey bypass

**File:** `apps/auth/src/index.ts`

**Sai trước:** `/v1/auth/passkey/verify` có `// TODO: verify WebAuthn assertion signature` — mọi assertion đều được chấp nhận, login được với bất kỳ credential_id nào.

**Fix (hướng an toàn nhanh per Founder directive):**
- 4 route passkey (`/enroll`, `/verify`, `GET /passkeys`, `DELETE /passkeys/:id`) đều trả 503 với message rõ ràng: "Passkey ... temporarily disabled until WebAuthn verification is complete."
- Re-enable chỉ sau khi implement đầy đủ: verify challenge, origin, rpId, counter, user handle, signature + chống replay + audit event.

**Verify:** `tools/audit-security-p0.ts` → SEC-P0-2: 2/2 checks PASS (route trả 503, không còn TODO).

---

## SEC-P0-3: Hardcoded evidence signing key

**File:** `apps/api/wrangler.jsonc`, `apps/api/src/index.ts`

**Sai trước:** `"EVIDENCE_SIGNING_KEY": "dev-evidence-key-change-in-prod"` commit thẳng vào `vars` của wrangler.jsonc.

**Fix:**
- Xóa `EVIDENCE_SIGNING_KEY` khỏi `vars`.
- Thêm `resolveEvidenceSigningKey(env)` helper: dùng secret từ env nếu có; fallback dev-only key chỉ khi `ENVIRONMENT === 'development'`; throw nếu thiếu ở production.
- 2 site dùng key (`apps/api/src/index.ts:610, 693`) đổi từ `c.env.EVIDENCE_SIGNING_KEY ?? 'dev-evidence-key'` sang `resolveEvidenceSigningKey(c.env)`.
- Comment trong wrangler.jsonc hướng dẫn: `wrangler secret put EVIDENCE_SIGNING_KEY --env production`.

**Verify:** `tools/audit-security-p0.ts` → SEC-P0-3: 2/2 checks PASS.

**Cần Founder làm (xem SECRET_ROTATION_EVIDENCE):** rotate key cũ, set secret mới qua wrangler.

---

## SEC-P0-4: Auth middleware không dừng handler

**File:** `apps/api/src/investor-routes.ts`

**Sai trước:** `requireAuth()` gọi `c.json({error}, 401)` nhưng discard return value, rồi `return null`. Handler `if (!session) return;` trả undefined — 401 không được gửi, handler tiếp tục chạy.

**Fix:**
- `requireAuth` trả `{user_id, role} | Response` — trả `c.json({error:'unauthorized'}, 401)` (Response) khi thiếu session.
- `requireAdmin` trả `{user_id, role} | Response` — propagate 401 Response, hoặc trả 403 Response nếu không phải admin.
- 20 handler đổi `if (!session) return;` → `if (session instanceof Response) return session;` — đảm bảo Response được trả và handler dừng.

**Verify:** `tools/audit-security-p0.ts` → SEC-P0-4: 3/3 checks PASS. Typecheck API PASS.

---

## SEC-P0-5: XSS trong verify.astro

**File:** `apps/edu/src/pages/verify.astro`

**Sai trước:** `result.innerHTML = \`...${cert.id}...${cert.holder}...${cert.trackTitle}...\`` — dữ liệu API đổ thẳng vào innerHTML, attacker có thể inject `<script>` qua certificate holder name.

**Fix:**
- Thay toàn bộ innerHTML bằng DOM construction: `createElement`, `appendChild`, `textContent`.
- 4 hàm: `showLoading`, `showValid`, `showInvalid`, `showError` — đều dùng `textContent` cho mọi trường dữ liệu API (id, holder, trackTitle, issuedDate).
- `<script>alert(1)</script>` trong cert.holder sẽ hiển thị như text, không thực thi.

**Verify:** `tools/audit-security-p0.ts` → SEC-P0-5: 2/2 checks PASS. Build edu PASS.

---

## Audit script

`tools/audit-security-p0.ts` — chạy `npx tsx tools/audit-security-p0.ts` → 13/13 checks PASS, SECURITY P0 AUDIT PASSED.

## Điểm tích cực giữ nguyên

- PBKDF2 600K iterations (OWASP 2026 compliant).
- TOTP/MFA thật, không dev bypass.
- Cookie an toàn (HttpOnly, Secure, SameSite=Lax).
- CSRF token verification.
- Parameterized D1 queries ở `apps/api/d1-audit-store.ts` và `apps/auth/db.ts`.
- CORS giới hạn `*.nguyenai.net`.
- Không còn secret trong source (sau SEC-P0-3).
