# Nguyen AI — Investor Access Policy

- **Status:** BINDING — Sprint 0 Governance Lock
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `IDENTITY_AND_TENANCY_RFC.md`, `DATA_CLASSIFICATION_AND_RETENTION.md`

---

## 1. Purpose

Lock the rules for who may access `invest.nguyenai.net/private/*`, how access is granted, how it expires, how it is revoked, and how every access is audited. The investor private room is **not** a static HTML page protected by `noindex`. It is a server-gated, qualified, expiring, audited workspace.

---

## 2. Hard rules (locked)

1. `noindex`, `robots.txt`, and URL obscurity are **not** access control.
2. Private pages must require server-side authentication.
3. Private pages must require a valid `invest.private-read` permission.
4. Financial pages must additionally require `invest:financial-read`.
5. Document downloads must additionally require `invest:download`.
6. Every private page view and every document download must be audited.
7. Access must be **expiring** and **revocable**.
8. Anonymous users must never receive private content, even as static HTML.
9. Shared URLs must never be sufficient to access private content.
10. The data room must not be built as a static public bundle.

---

## 3. Access flow (locked)

```
[Unauthenticated visitor]
        ↓
Public investor pages (thesis, ecosystem, request access)
        ↓
User submits request-access form (real backend, not e.preventDefault)
        ↓
Email verification
        ↓
Identity / company information collected
        ↓
Qualification questionnaire
        ↓
Consent + disclosure acceptance (versioned)
        ↓
Manual or automated review by ADMIN / SUPER_ADMIN
        ↓
If approved: access grant created with expiry
        ↓
MFA login required
        ↓
Scoped private-room session (audience = invest.nguyenai.net/private)
        ↓
Audit every document view / download
        ↓
Grant expires or is revoked → access removed immediately
```

---

## 4. Qualification (locked)

### 4.1 Who must qualify

Every individual requesting private room access must complete qualification. No waived access, no shared credentials, no "trusted partner" bypass.

### 4.2 Qualification criteria

Qualification is based on the jurisdiction-appropriate test. The questionnaire captures:

- jurisdiction (Vietnam / Singapore / US / other)
- investor type (individual / entity)
- accredited / professional / eligible investor status per jurisdiction
- income or net worth evidence (self-attested, with audit trail)
- investment experience
- relationship to the Nguyen AI ecosystem
- intended investment size range
- NDA acceptance

### 4.3 Qualification record

```
qualification_id
user_id
jurisdiction
investor_type
status              — pending | qualified | rejected | expired
submitted_at
reviewed_at
reviewed_by
qualification_version  — the questionnaire version used
expires_at          — qualification is valid for 12 months
evidence_refs       — proofs attached
```

### 4.4 Re-qualification

- Qualification expires after 12 months.
- Re-qualification requires a new questionnaire + review.
- A rejected applicant may not re-apply for 90 days.

---

## 5. Access grant object (locked)

```
grant_id                — uuid
user_id
investor_profile_id
room_scope              — list of private room scopes (e.g. ["cap-table", "financial-model"])
document_scope          — list of document ids or "all-in-scope"
issued_at
expires_at              — max 90 days from issue
revoked_at              — null until revoked
approved_by
qualification_version
disclosure_version      — the disclosure version accepted
nda_status              — signed | pending
watermark_id            — per-view watermark seed
download_allowed        — boolean
```

### 5.1 Grant rules

- Maximum grant duration: 90 days.
- Grant may be revoked at any time by ADMIN / SUPER_ADMIN.
- Grant may be revoked by the user (self-revoke).
- On expiry or revocation, all sessions scoped to the private room are terminated.
- A new grant requires a new qualification if the previous qualification has expired.

---

## 6. Disclosure versioning (locked)

The disclosure text shown to investors is **versioned**. The grant records which version was accepted.

### 6.1 Approved disclosure (Vietnamese)

> Thông tin trên website không cấu thành lời chào bán chứng khoán, cam kết lợi nhuận hoặc tư vấn đầu tư.

### 6.2 Approved disclosure (English)

> Information on this website does not constitute an offer to sell securities, a commitment to returns, or investment advice.

### 6.3 Required disclaimer on every investor page

Every public and private investor page must display the disclosure in both VI and EN, with the version label. The current `Disclosure.astro` short form ("Financial projections are hypotheses, not commitments. Legal entity and IP ownership pending.") is **not** the approved wording and must be replaced.

### 6.4 Disclosure version record

```
disclosure_version    — e.g. "2026-07-02-v1"
text_vi
text_en
effective_at
superseded_at
```

A grant's `disclosure_version` must match a currently-effective disclosure. If the disclosure is updated, existing grants remain valid until expiry, but new grants require the new version.

---

## 7. Document security (locked)

### 7.1 Storage

- Private documents live in R2, encrypted at rest.
- Metadata (title, version, scope) lives in the Investor service Postgres.
- Documents are **never** built into the static site bundle.

### 7.2 Serving

- Documents are served via signed, short-lived URLs (≤5 min).
- Each view generates a per-view watermark (user email + timestamp + grant_id).
- Download requires `invest:download` permission and is audited.
- Copy / print policy is enforced via document viewer configuration where possible.
- Document version is recorded; only the current approved version is served.

### 7.3 Forbidden

- Static HTML containing real cap table, financial model, or contract data
- Public CDN URLs for private documents
- Long-lived signed URLs
- Documents without watermark
- Downloads without audit

---

## 8. Audit log (locked)

Every private room event is audited per `DATA_CLASSIFICATION_AND_RETENTION.md` §11. Investor-specific events:

```
investor_access_requested
investor_access_granted
investor_access_revoked
investor_access_expired
investor_document_viewed     — includes document_id, grant_id, ip, watermark
investor_document_downloaded — includes document_id, grant_id, ip
investor_qualification_submitted
investor_qualification_approved
investor_qualification_rejected
investor_qualification_expired
investor_disclosure_accepted — includes disclosure_version
investor_nda_signed
private_route_denied         — when an unauthenticated or unauthorized user attempts a private route
```

Audit logs are retained 7 years and are admin-readable with `admin:audit-read`.

---

## 9. Private route middleware (locked)

Every request to `/private/*` must pass through server-side middleware that:

1. Resolves the session from the `nguyenai_session` cookie via `GET /v1/session`.
2. Rejects if no session → 302 to `auth.nguyenai.net/auth?redirect=...`.
3. Checks audience = `invest.nguyenai.net/private`.
4. Checks `invest:private-read` permission.
5. For `/private/financial-model`, additionally checks `invest:financial-read`.
6. Checks the user has a non-expired, non-revoked grant.
7. Checks the requested scope is in `room_scope`.
8. Writes an audit event for the access.
9. Sets `X-Robots-Tag: noindex, nofollow, noarchive` and `<meta name="robots" content="noindex, nofollow, noarchive">`.
10. Serves the page.

### 9.1 Forbidden middleware patterns

- Accepting any cookie value as authenticated
- Client-side route guards as the only gate
- Static HTML served for `/private/*` without server-side checks
- No expiry check
- No audit

---

## 10. Request-access form (locked)

The form at `/request-access` must:

1. Submit to a real backend (`POST /v1/investor-interest`).
2. Store the submission in the Investor service Postgres.
3. Send an email verification to the submitted email.
4. On verification, create a `qualification_id` and redirect to the qualification questionnaire.
5. Not use `e.preventDefault()` with a client-side "thank you" as the only behavior.

### 10.1 Form fields

```
full_name
email
company (optional)
jurisdiction
intended_investment_size_range
message (optional)
consent_to_contact
```

### 10.2 Forbidden

- Forms that do not submit
- Forms that store data in localStorage
- Forms that email via a client-side API key
- Forms without consent checkbox
- Forms without rate limiting (max 3 per 24h per email)

---

## 11. Headers (locked)

### 11.1 Public pages

```
X-Robots-Tag: index, follow
```

(Fix the current typo `X-X-Robots-Tag` in `public/_headers:10`.)

### 11.2 Private pages

```
X-Robots-Tag: noindex, nofollow, noarchive
Cache-Control: no-store, no-cache, must-revalidate, private
Content-Security-Policy: default-src 'self'; ... (no external hosts for private pages)
```

### 11.3 Sitemap

- Generate a sitemap listing **only public pages**.
- Private pages must not appear in any sitemap.
- `robots.txt` must `Disallow: /private/`.

---

## 12. Hreflang (locked)

The current `InvestLayout.astro:49` emits `<link rel="alternate" hreflang="en" href="https://invest.nguyenai.net/en/...">` but no `/en/` pages are built. This must be fixed by either:

- **Option A:** Build a 1:1 `/en/` mirror of all 23 pages.
- **Option B:** Remove the `hreflang="en"` alternate links until `/en/` exists.

Option B is the minimum required for Wave 2 release. Option A is required for full bilingual SEO.

---

## 13. Currency policy (locked)

- Functional currency: VND.
- Reporting currency for investor materials: USD allowed, with:
  - functional currency stated
  - reporting currency stated
  - exchange-rate assumption
  - source date of the rate
  - VND equivalent shown
  - model version stated
- The financial model page must not present USD figures as if they were the canonical currency without the above context.

---

## 14. Roles and permissions for investor room

| Role | Permission | What it allows |
|---|---|---|
| PUBLIC | none | public investor pages only |
| INVESTOR_APPLICANT | `invest:request` | submit request-access form |
| QUALIFIED_INVESTOR | `invest:private-read` | view private pages (non-financial) |
| QUALIFIED_INVESTOR | `invest:financial-read` | view financial model page |
| QUALIFIED_INVESTOR | `invest:download` | download data room documents |
| DATA_ROOM_MEMBER | `invest:private-read` + `invest:financial-read` + `invest:download` | full data room access |
| ADMIN | `admin:access-revoke` | revoke grants, review qualifications |
| SUPER_ADMIN | all | everything |

A session for `app.nguyenai.net` does **not** grant access to `invest.nguyenai.net/private`. Audience and role must match.

---

## 15. Release gate for investor site

Before `invest.nguyenai.net` may be deployed publicly (Wave 2):

- [ ] Public pages: forms submit to real backend
- [ ] Public pages: disclosure uses approved VI/EN wording with version label
- [ ] Public pages: hreflang fixed (Option A or B)
- [ ] Public pages: sitemap generated with only public pages
- [ ] Public pages: `X-Robots-Tag: index, follow` (typo fixed)
- [ ] Private routes: server-side middleware with session + permission + grant + expiry + audit
- [ ] Private routes: no static HTML bundle for private content
- [ ] Documents: R2 + signed URLs + watermark + audit
- [ ] Qualification: questionnaire + review + versioned disclosure
- [ ] Access grant: max 90 days, revocable, audited
- [ ] No real cap table / bank / term sheet data in public HTML
- [ ] Currency policy applied to financial model page
- [ ] npm audit high = 0

---

## 16. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-02 | Initial lock | Founder |
