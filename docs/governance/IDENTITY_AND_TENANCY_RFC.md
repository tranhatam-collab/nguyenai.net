# Nguyen AI — Identity and Tenancy RFC

- **Status:** BINDING — Sprint 0 Governance Lock
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `PRODUCT_BOUNDARY_CONTRACT.md`, `ENTITLEMENT_MODEL.md`

---

## 1. Goal

Define the single shared identity, session, tenancy, and authorization contract for the entire Nguyen AI ecosystem. No repo may implement its own auth, session, role, or tenant model.

---

## 2. Identity service

### 2.1 Domain

`auth.nguyenai.net` — dedicated Identity Provider (IdP).

`app.nguyenai.net`, `academy.nguyenai.net`, `invest.nguyenai.net`, `admin.nguyenai.net`, `api.nguyenai.net` are **relying parties (clients)**, not identity providers.

### 2.2 Protocol

- OIDC / OAuth 2.1 Authorization Server
- Authorization Code flow + PKCE for web clients
- Passkey (WebAuthn) preferred for primary authentication
- Email magic link as fallback
- Optional OAuth social login (Google, Apple) — not required for MVP
- MFA required for: admin, investor_qualified, data_room_member, super_admin
- Server-side session store (not JWT-only, not client-side)

### 2.3 Session requirements (locked)

A valid session must have:

- server-side session ID (opaque, random, ≥128 bits)
- issuer = `auth.nguyenai.net`
- audience = the relying party (e.g. `app.nguyenai.net`)
- subject = user_id
- tenant / organization context
- role(s)
- device / session metadata
- issued_at, expires_at
- rotation on refresh
- revocable
- HttpOnly, Secure, SameSite=Lax (or Strict for admin)
- CSRF token paired with session

### 2.4 Forbidden session patterns

- Cookie existence alone treated as authenticated
- localStorage as session authority
- Client-side route guard as the only gate
- Shared secret hardcoded in source
- JWT signed with a key embedded in the client
- Session without expiry
- Session without revocation path

---

## 3. Roles (locked)

```
PUBLIC                 — unauthenticated
USER                   — basic account, no entitlement
MEMBER                 — belongs to an organization
STUDENT                — holds Academy Pass
FOUNDER                — holds Founder plan
BUSINESS_MEMBER        — belongs to a Business plan org
CHAPTER_MEMBER         — belongs to a Chapter plan org
INVESTOR_APPLICANT     — requested investor access, not yet qualified
QUALIFIED_INVESTOR     — passed qualification
DATA_ROOM_MEMBER       — granted private room access
REVIEWER               — may review academy submissions / proofs
OPERATOR               — may operate AI Computer on behalf of org
ADMIN                  — org admin
SUPER_ADMIN            — platform admin
```

A role is **not** a blanket permission. Every sensitive action must also check a permission (see §4).

---

## 4. Permissions (locked)

Permissions are scoped strings. They are checked server-side on every request.

### 4.1 Permission catalog

```
machine:read          — view AI Computer instance
machine:operate       — submit commands
memory:read           — read memory entries
memory:write          — write memory entries
vault:upload          — upload to Data Vault
vault:download        — download from Data Vault
academy:learn         — access lessons
academy:submit        — submit quiz / proof
academy:review        — review submissions
cert:request          — request certification attempt
cert:issue            — issue certificate (Proof service only)
cert:revoke           — revoke certificate
invest:request        — submit investor interest
invest:private-read   — read private investor content
invest:financial-read — read financial model
invest:download       — download data room documents
admin:user-manage     — manage users in org
admin:access-revoke   — revoke access grants
admin:billing-manage  — manage billing
admin:audit-read      — read audit logs
```

### 4.2 Audience / app permission matrix

| App | Allowed roles | Notes |
|---|---|---|
| `app.nguyenai.net` | USER, OPERATOR, ADMIN, SUPER_ADMIN | requires `machine:operate` for command submission |
| `academy.nguyenai.net` | STUDENT, REVIEWER, ADMIN, SUPER_ADMIN | requires `academy:learn` for lessons, `academy:submit` for quiz |
| `invest.nguyenai.net/private` | QUALIFIED_INVESTOR, DATA_ROOM_MEMBER, ADMIN, SUPER_ADMIN | requires `invest:private-read`; financial pages require `invest:financial-read` |
| `admin.nguyenai.net` | ADMIN, SUPER_ADMIN | requires `admin:*` permissions |

A session for `app.nguyenai.net` does **not** automatically grant access to `invest.nguyenai.net/private`. Audience and role must match.

---

## 5. Tenancy model

### 5.1 Entities

```
User
  ├── belongs to → Organization (0..n)
  ├── holds → Entitlement (0..n)
  ├── has → Session (0..n)
  └── has → Membership (0..n)

Organization
  ├── has → Members (1..n)
  ├── has → Plan (1)
  ├── has → Machine Instances (0..n)
  └── has → Entitlement scope (1)

Membership
  ├── user_id
  ├── org_id
  ├── role (within org)
  └── permissions (within org)
```

### 5.2 Tenant isolation

- Every data record that belongs to a user or org must carry `tenant_id` (org_id or user_id for personal scope).
- Every API request must resolve `tenant_id` from the session and filter by it server-side.
- Client-supplied `tenant_id`, `user_id`, or `org_id` in request bodies must be **ignored** for authorization decisions; they may only be used as hints, never as authority.
- Cross-tenant reads require an explicit, audited admin permission.

---

## 6. Identity contract (API)

All endpoints are served by `auth.nguyenai.net` (or proxied via `api.nguyenai.net`).

### 6.1 Session

```
GET  /v1/session
  → 200 { user_id, tenant_id, roles[], permissions[], expires_at, device }
  → 401 if no valid session

POST /v1/logout
  → 204 (revokes current session server-side)
```

### 6.2 Authentication

```
POST /v1/auth/magic-link
  body: { email, redirect_uri }
  → 202 (sends email)

POST /v1/auth/magic-link/verify
  body: { token }
  → 200 { session_id, expires_at }  (sets HttpOnly cookie)

POST /v1/auth/passkey/register-begin
POST /v1/auth/passkey/register-finish
POST /v1/auth/passkey/authenticate-begin
POST /v1/auth/passkey/authenticate-finish

POST /v1/auth/oauth/{provider}/begin
GET  /v1/auth/oauth/{provider}/callback
```

### 6.3 User

```
GET  /v1/me
  → 200 { user_id, email, name, locale, organizations[], entitlements[] }

POST /v1/me
  body: { name?, locale? }
  → 200 updated profile

POST /v1/me/delete
  → 202 (initiates deletion workflow per DATA_CLASSIFICATION_AND_RETENTION.md)
```

### 6.4 Organization / membership

```
GET  /v1/organizations
POST /v1/organizations
GET  /v1/organizations/{id}
POST /v1/organizations/{id}/members
DELETE /v1/organizations/{id}/members/{user_id}
POST /v1/organizations/{id}/members/{user_id}/role
```

### 6.5 MFA

```
POST /v1/auth/mfa/enroll
POST /v1/auth/mfa/verify
POST /v1/auth/mfa/disable
```

### 6.6 Session management

```
GET  /v1/sessions
  → list active sessions for current user
DELETE /v1/sessions/{id}
  → revoke a specific session
POST /v1/sessions/revoke-all
  → revoke all sessions for current user (logout everywhere)
```

---

## 7. Token & cookie spec

### 7.1 Cookie

```
Name:    nguyenai_session
Attributes:
  HttpOnly
  Secure
  SameSite=Lax        (Strict for admin.nguyenai.net)
  Path=/
  Domain=.nguyenai.net  (so it works across subdomains)
  Max-Age=3600         (1 hour access window)
```

Refresh token (if used) is a separate, rotated, HttpOnly cookie with longer Max-Age and server-side revocation list.

### 7.2 Access token (for API calls)

- Short-lived (≤15 min) JWT or opaque token
- Audience-scoped (e.g. `aud: app.nguyenai.net`)
- Contains: `sub`, `tenant_id`, `roles`, `permissions`, `aud`, `iss`, `exp`, `iat`, `jti`
- Never stored in localStorage
- Refreshed via the session cookie, not by the client reading a stored token

---

## 8. Audit log

Every identity event must be written to an immutable audit store:

```
event_id, timestamp, user_id, session_id, event_type,
actor_ip, user_agent, target, result, metadata
```

Event types: `login_success`, `login_failure`, `logout`, `session_revoked`,
`passkey_registered`, `mfa_enrolled`, `role_changed`, `permission_granted`,
`permission_revoked`, `org_member_added`, `org_member_removed`,
`account_deletion_requested`, `access_denied`.

Audit logs are append-only and retained per `DATA_CLASSIFICATION_AND_RETENTION.md`.

---

## 9. Rate limiting & risk control

- Login attempts: max 5 per 15 min per email + IP; lock for 30 min after 5 failures.
- Magic link: max 3 per hour per email.
- Passkey auth: max 10 per 15 min per IP.
- Account recovery: max 3 per 24h per email.
- Suspicious behavior (impossible travel, new device + new IP) triggers step-up MFA.

---

## 10. Account recovery & deletion

### 10.1 Recovery

- Passkey loss → email magic link + step-up MFA
- Email loss → admin-assisted recovery (SUPER_ADMIN only, audited)
- No recovery without identity proof

### 10.2 Deletion

- User-initiated via `POST /v1/me/delete`
- Triggers the deletion workflow in `DATA_CLASSIFICATION_AND_RETENTION.md`
- Propagates to: Gen 1 memory/vault, Gen 2 entitlement/billing, Proof certificates (marked revoked, not erased), audit logs (retained per policy)
- Must complete within 30 days
- User receives confirmation email when complete

---

## 11. Integration checklist for each repo

Before any repo may call itself "auth-connected", it must:

- [ ] Remove its own login form / middleware placeholder
- [ ] Redirect unauthenticated users to `auth.nguyenai.net/auth?redirect=...`
- [ ] Accept the `nguyenai_session` cookie only as input to a server-side session check
- [ ] Call `GET /v1/session` server-side on every protected request
- [ ] Enforce audience match (reject sessions issued for a different app)
- [ ] Enforce role + permission checks server-side
- [ ] Never store the session token in localStorage
- [ ] Provide a logout button that calls `POST /v1/logout` and clears the cookie
- [ ] Log all access-denied events to the audit store

---

## 12. Forbidden implementations (locked)

- `nguyenai-console` middleware that accepts any cookie value
- `nguyenai-academy` login that links to a placeholder SSO URL without real callback handling
- `nguyenai-invest` private pages served as static HTML with no server-side auth
- Any repo that defines its own role enum
- Any repo that defines its own permission enum
- Any repo that issues its own session

---

## 13. Open questions (to resolve in Sprint 1 implementation)

1. Exact passkey library / WebAuthn server library (to be benchmarked).
2. Whether to use Cloudflare Access for `admin.nguyenai.net` internal staging or build full custom auth.
3. Whether the audit store is Cloudflare D1, Postgres, or R2 + index.
4. Whether refresh tokens are rotating cookies or server-side session extension.

These are implementation choices, not contract choices. The contract in this document is locked.

---

## 14. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-02 | Initial lock | Founder |
