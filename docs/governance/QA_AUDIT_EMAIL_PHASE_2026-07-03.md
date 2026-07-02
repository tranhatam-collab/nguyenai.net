# QA AUDIT — Email Phase

**Date:** 2026-07-03
**Scope:** `@nai/email` package + email wiring into auth + approval
**Commit:** `8455b3d feat(email): add @nai/email package with 20 transactional templates`
**Auditor:** Devin (automated)

---

## Báo cáo đỏ (chưa xong / sai / chưa verify)

### R1 — CRITICAL: Email verification flow bị đứt

**Vấn đề:** Endpoint `/v1/auth/register` generate `verification_token` (UUID) và gửi trong welcome email, NHƯNG:

1. Token **không được lưu vào DB** → không có cách nào verify token đó là hợp lệ.
2. **Không có endpoint `/v1/auth/verify-email`** (hoặc tương tự) để user submit token.
3. Login flow (`apps/auth/src/index.ts:405`) yêu cầu `email_verified = true`, nhưng không có cách nào set `email_verified = true`.

**Hậu quả:** User register → nhận email với link verify → click link → 404 (không có endpoint). User không thể login. Toàn bộ auth flow bị block ở production.

**Verify:** `grep -n "app\.post\|app\.get" apps/auth/src/index.ts` — không có route verify-email. `grep -n "verification_token" apps/auth/src/index.ts` — token chỉ được generate, không lưu.

**Fix cần thiết:**
- Thêm column `verification_token` + `verification_expires_at` vào table `users` (migration 003).
- Lưu token khi register.
- Thêm endpoint `POST /v1/auth/verify-email` nhận token, check expiry, set `email_verified = true`.
- Hoặc: tạm thời auto-verify trong development (đã có precedent ở code cũ đã bị thay).

### R2 — MEDIUM: Approval email hardcoded approver + luôn mock

**Vấn đề:** `packages/@nai/approval/src/index.ts:158-161`:
- `createEmailService({ ENVIRONMENT: 'development' })` → luôn dùng MockEmailClient, không bao giờ gửi email thật kể cả production.
- `user_email: 'approver@nguyenai.net'` → hardcoded, không lấy approver thật từ approval policy/DB.

**Hậu quả:** Approval request không bao giờ đến approver thật. Email feature "wired" nhưng không functional.

**Fix cần thiết:**
- Truyền env từ caller (Worker context) vào approval package, không hardcode.
- Lấy approver email từ approval policy hoặc membership table.

### R3 — LOW: RESEND_API_KEY chưa được khai báo

**Vấn đề:** `RESEND_API_KEY` không có trong `wrangler.jsonc` của auth hay api. Code đọc `c.env.RESEND_API_KEY` nhưng env var đó không tồn tại → `createEmailService` fallback sang MockEmailClient.

**Lưu ý:** Đây có thể là intentional (secret sẽ set bằng `wrangler secret put`). Nhưng cần ghi chú deploy checklist.

**Fix cần thiết:** Thêm vào deploy checklist: `wrangler secret put RESEND_API_KEY` cho cả `nai-auth` và `nai-api`.

### R4 — LOW: 20/38 audit events chưa có email mapping

**Vấn đề:** `AUDIT_EVENT_TO_TEMPLATE` map 18/38 audit events. 20 event còn lại không có email template (vd: `session_revoked`, `password_changed`, `mfa_disabled`, `data_exported`, `access_denied`...).

**Đánh giá:** Có thể intentional — không phải event nào cũng cần email. Nhưng cần confirm event nào nên có email, event nào chỉ log.

---

## Báo cáo xanh (đã xong + verify)

### G1 — @nai/email package: 20 templates, 8 categories

**Verify:**
```
grep -c "id: '" packages/@nai/email/src/templates.ts → 20
grep "category:" packages/@nai/email/src/templates.ts | sort | uniq -c:
  3 academy, 3 approval, 2 authorization, 1 billing,
  3 entitlement, 5 identity, 1 investor, 2 security
  = 20 total ✓
```

**Templates:**
| Category | Count | Templates |
|----------|-------|-----------|
| identity | 5 | welcome, email_verification, passkey_registered, mfa_enrolled, api_key_created |
| security | 2 | login_alert, account_deletion_requested |
| approval | 3 | approval_requested, approval_granted, approval_denied |
| entitlement | 3 | entitlement_granted, entitlement_revoked, entitlement_expired |
| academy | 3 | proof_submitted, certificate_issued, certificate_revoked |
| authorization | 2 | role_changed, org_member_added |
| billing | 1 | payment_received |
| investor | 1 | investor_access_granted |

### G2 — Tests pass

**Verify:** `pnpm --filter @nai/email test` → 10/10 tests PASS, 40 template renders (20 × VI/EN).

```
✓ Test 1: 20 templates exist
✓ Test 2: 40 template renders (20 templates × 2 locales) all valid
✓ Test 3: MockEmailClient captures sends
✓ Test 4: EN template renders English
✓ Test 5: Audit event mapping covers 18 events
✓ Test 6: All 8 categories present
✓ Test 7: Dev service uses MockEmailClient
✓ Test 8: Certificate ID format in template
✓ Test 9: Account deletion reference code
✓ Test 10: HTML email has proper structure
```

### G3 — Build pass

**Verify:** `pnpm build` → 52/52 tasks successful, exit 0.

### G4 — Full test suite pass

**Verify:** `pnpm test` → 61/61 tasks successful (FULL TURBO cache).

### G5 — Contamination audit pass

**Verify:** `grep -ri "iai-one|IAI.ONE|AIAGENT|maytinhai|Máy Tính AI|computer.iai" packages/@nai/email/` → No matches found.

### G6 — Brand compliance

**Verify:** Mỗi template HTML chứa:
- `Nguyễn AI` (Vietnamese) hoặc `Nguyen AI` (English)
- `nguyenai.net` (domain)
- `hello@nguyenai.net` (support email)
- Footer với copyright + automated email notice

### G7 — Bilingual support

**Verify:** Mỗi template có 2 variant VI + EN, render đúng ngôn ngữ theo `ctx.locale`. Test 4 verify EN render, Test 2 verify cả 40 renders.

### G8 — HTML email structure

**Verify:** Test 10 check:
- `<!DOCTYPE html>` present
- `<html>` tag present
- `</html>` closing tag
- Brand name present
- Domain present
- Automated notice present
- Inline CSS (email-client compatible)
- Responsive `@media (max-width:480px)` query
- Brand color palette (#A6260C, #FFB810, #FFFAF0, #4A1D14)

### G9 — Workers-compatible

**Verify:** `client.ts` dùng `fetch()` trực tiếp, không dùng Node.js SDK. `MockEmailClient` cho test. `createEmailService(env)` factory pattern giống Workers env binding.

### G10 — Wiring verified

**Verify:**
- `apps/auth/src/index.ts:345-355` — welcome email gửi sau register
- `packages/@nai/approval/src/index.ts:155-168` — approval_requested email gửi sau request
- `apps/auth/package.json` — `@nai/email` dependency added
- `packages/@nai/approval/package.json` — `@nai/email` dependency added
- `apps/api/package.json` — `@nai/email` dependency added
- `tests/e2e/package.json` — `@nai/email` dependency added

---

## Trạng thái todo

| # | Task | Status |
|---|------|--------|
| 1 | Audit existing email infrastructure | ✅ completed |
| 2 | Set up @nai/email package | ✅ completed |
| 3 | Create 20 email templates | ✅ completed |
| 4 | Wire email triggers to auth + approval | ✅ completed (có gap R1, R2) |
| 5 | Test email rendering + send flow | ✅ completed |
| 6 | Frontend audit (thin pages) | ⏸ pending (không thuộc email phase) |
| 7 | Build + test + commit | ✅ completed |

---

## Verdict

**Email phase: FUNCTIONAL FOR TEMPLATES + TESTS, BLOCKED FOR PRODUCTION AUTH FLOW.**

- Package `@nai/email` đạt chất lượng: 20 templates, bilingual, brand-compliant, Workers-compatible, 10 tests pass.
- **NHƯNG** auth verification flow bị đứt (R1) → user không thể login sau register. Đây là blocker production.
- Approval email wiring có gap (R2) → không functional trong production.
- Cần fix R1 trước khi deploy. R2 cần fix trước khi approval flow go-live.

**Priority fix order:**
1. R1 — Email verification endpoint + token storage (CRITICAL, block auth)
2. R2 — Dynamic approver + env passthrough (MEDIUM, block approval email)
3. R3 — Deploy checklist cho RESEND_API_KEY (LOW, ops)
4. R4 — Confirm 20 unmapped events (LOW, product decision)
