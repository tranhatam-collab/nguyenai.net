# Verify Security & Privacy Audit — 2026-07-11 (Updated 2026-07-13)

**FINAL VERDICT: PARTIAL PASS** — email verify flow hardened + live; certificate verify product remains Phase 2.

## 0. Critical product clarification (P0)

The URL under review:

`https://nguyenai.net/verify?token=<uuid>`

is **not** a public certificate / evidence verification page.

| Attribute | Actual (today) | QA assumed (certificate product) |
|-----------|----------------|----------------------------------|
| Purpose | **Email account activation** after register | Public proof that a certificate is valid/revoked |
| Token class | **One-time secret** (email link) | Public `verification_id` |
| API | `POST /v1/auth/verify-email` `{ token }` | `GET /v1/verify/:verificationId` |
| After use | Token cleared; reuse → invalid | Record remains readable as valid/revoked/expired |
| UI | Auth worker `/verify` → login CTA | Public status card (ĐÃ XÁC MINH / THU HỒI / …) |
| Certificate product | Separate: `edu.nguyenai.net/verify` **placeholder** | Required for that product |

**Do not** treat successful Resend welcome delivery as proof that a **certificate verification** product is live.

## 1. Token design decision (LOCKED for email flow)

**Classification:** `email_verification_secret` (one-time, sensitive).

Required controls (email flow):

| Control | Status 2026-07-11 |
|---------|-------------------|
| TTL (24h) | ✅ already |
| One-time (cleared on success) | ✅ already |
| Store hash not raw in D1 | ✅ **implemented this pass** (SHA-256; legacy plaintext accepted once) |
| Strip token from URL after load | ✅ **history.replaceState** on auth + web redirect |
| `Referrer-Policy: no-referrer` | ✅ auth verify response + meta |
| `Cache-Control: no-store` | ✅ |
| `noindex,nofollow,noarchive` | ✅ |
| No token in title/OG/JSON-LD | ✅ (page title has no token) |
| No raw token in audit metadata | ✅ audit metadata = `{ flow: 'email_verify' }` only |
| Generic error (anti-enumeration) | ✅ UI generic message |
| Invalidate exposed tokens | ✅ provided UUID already **used** → API 400 |

**Still open (email flow):**

- Prefer POST body exchange without token lingering in first navigation referrer from email client (email clients still put token in first GET — inherent to email links; mitigate with short TTL + hash at rest + strip after load).
- Rate-limit `/v1/auth/verify-email` by IP (not yet dedicated).
- Do not log raw query strings in Cloudflare/analytics (ops config).

## 2. Public certificate verification product (SEPARATE backlog)

If Founder wants QA Phase 2–3 “ĐÃ XÁC MINH / THU HỒI / HẾT HẠN” UX:

1. New public id: `verification_id` (not auth email token).
2. Routes: `/xac-minh/:verificationId` + `/en/verify/:verificationId`.
3. API: `GET /v1/verify/:verificationId` with allowlisted public fields only.
4. Source of truth: certificate table + signature/hash — **edu verify is currently placeholder**.
5. Privacy allowlist per repo living-person defaults.

**Status:** NOT STARTED as production product. edu UI explicitly says placeholder.

## 3. Live evidence (honest)

| Probe | Result |
|-------|--------|
| Auth verify page loads | HTTP **200** (HTML shell) |
| API with provided token | **400** already used — not a valid live “certificate valid” demo |
| Browser JS end-state | **Not** captured in this audit environment as full E2E screenshot pack |
| XSS via innerHTML on verify page | Mitigated: result uses `textContent` / `createElement` (no API HTML) |

## 4. What must NOT be claimed

- “Verify live pass”
- “Go-live hoàn tất”
- “Token an toàn tuyệt đối” (email link tokens remain URL-borne by design)
- “Certificate verification production-ready”

## 5. Immediate engineering done this pass

1. Hash email verification tokens at rest.
2. Harden verify HTML headers + strip query after read.
3. Baseline + this audit document.
4. Clarify two products: **email verify** vs **certificate verify**.

## 6. Exit gate (from QA command)

`READY FOR FOUNDER GO-LIVE SIGN-OFF` = **PARTIAL** — email verify flow live + hardened; certificate verify = Phase 2.  
`FINAL VERDICT` = **PARTIAL PASS** (updated 2026-07-13: OAuth flow fixed, all 6 sites live, CI/CD green).

## 7. Updates 2026-07-13

- Google OAuth `redirect_uri_mismatch` FIXED — redirect_uri now matches Google Console URI 17.
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` set as Worker secrets.
- `JWT_SECRET` rotated (64-byte random, set as Worker secret).
- All 6 sites live + responding correctly.
- CI/CD: 20 audits PASS + 7/7 deploy jobs PASS.
- Email verify URL changed to path-based `/verify/:token` (prevents MIME quoted-printable mangling).
- Verify page served from `auth.nguyenai.net` (not `nguyenai.net`).
