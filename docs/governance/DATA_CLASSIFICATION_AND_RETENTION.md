# Nguyen AI — Data Classification and Retention Policy

- **Status:** BINDING — Sprint 0 Governance Lock
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `IDENTITY_AND_TENANCY_RFC.md`, `ENTITLEMENT_MODEL.md`
- **Legal basis:** Vietnam PDPD 91/2025/QH15, GDPR-aligned principles

---

## 1. Purpose

Lock how data is classified, where it may live, how long it is kept, and how it is deleted. This policy governs Gen 1, Gen 2, all four Nguyen AI repos, the Identity service, and the Proof service.

---

## 2. Data classes (locked)

| Class | Examples | Default visibility | Tenant scope | Retention |
|---|---|---|---|---|
| `public` | marketing copy, public docs, public certs | world | n/a | until unpublished |
| `account` | email, name, locale, password hash (if any), passkey creds | owner | user | per §6 |
| `session` | session id, refresh token, device metadata | owner | user | 1h access / 30d refresh |
| `organization` | org name, member list, plan | org members | org | per §6 |
| `machine_state` | instance config, command history, job state | owner + org | user or org | per §6 |
| `memory` | preference, fact, semantic, procedural memory | owner | user | per §7 |
| `vault_object` | uploaded files, derived chunks, embeddings | owner | user | per §7 |
| `evidence` | command evidence, trace, approval records | owner + admin | user or org | per §6 |
| `academy_progress` | enrollment, lesson status, attempts, scores | owner | user | per §6 |
| `proof` | proof submissions, rubric results | owner + reviewer | user | per §6 |
| `certificate` | certificate record, verify URL | public verify; full record owner + admin | user | per §6 |
| `investor_profile` | qualification data, NDA, access grant | owner + admin | user | per §6 |
| `data_room_document` | investor docs, cap table, financial model | qualified investors with grant | investor scope | per §6 |
| `audit_log` | identity events, access events, admin actions | admin | tenant | per §6 |
| `billing` | invoices, payment method tokens | owner + admin | user or org | per legal requirement |

---

## 3. Visibility model (locked)

### 3.1 Privacy-by-default (locked)

- Living-person data is **private by default**.
- Family trees are **private until published** by the owner.
- Family documents are **private until approved** by the owner.
- AI cannot confirm bloodline or royal descent. Any claim must carry an evidence label and dispute status.

### 3.2 Visibility levels

```
owner                 — only the owner
household             — owner + members of the household group
family_group_id       — owner + members of a family group
chapter               — owner + members of a chapter
organization          — owner + members of an org
invited_collaborator  — owner + explicitly invited users
public                — world
```

### 3.3 "Family" is not an authorization role

`family_group_id` is a **group membership**, not a role. Access requires:
- explicit group membership
- purpose
- consent version
- allowed actions
- expiry
- geographic restriction (if any)
- downstream sharing flag
- revocation path

---

## 4. Storage zones (locked)

| Data class | Primary store | Replica / index | Backup |
|---|---|---|---|
| `public` | static site / CDN | n/a | git |
| `account` | Identity Postgres | — | encrypted snapshot |
| `session` | Identity Postgres + Redis (or KV) | — | none (short-lived) |
| `organization` | Gen 2 Postgres | — | encrypted snapshot |
| `machine_state` | Gen 1 Postgres | — | encrypted snapshot |
| `memory` | Gen 1 Postgres (metadata) + Qdrant (derived vectors) | — | per §7 |
| `vault_object` | R2 (bytes) + Gen 1 Postgres (metadata) + Qdrant (derived vectors) | — | per §7 |
| `evidence` | Gen 1 Postgres + R2 (artifacts) | — | append-only |
| `academy_progress` | Gen 2 / Academy Postgres | — | encrypted snapshot |
| `proof` | Proof service Postgres | — | append-only |
| `certificate` | Proof service Postgres | public verify index | append-only |
| `investor_profile` | Investor service Postgres | — | encrypted snapshot |
| `data_room_document` | R2 (bytes, encrypted) + Investor service Postgres (metadata) | — | encrypted snapshot |
| `audit_log` | append-only Postgres / R2 | — | append-only |
| `billing` | Gen 2 Postgres | — | encrypted snapshot |

### 4.1 Source-of-truth rule

- PostgreSQL = canonical metadata, ACL, source records.
- R2 = canonical file bytes.
- Qdrant = **derived** retrieval index only. It is never the source of truth. If Qdrant is lost, it can be rebuilt from Postgres + R2.
- Audit store = immutable, append-only.

### 4.2 No dual-write of embeddings in MVP

Embeddings live in Qdrant only. pgvector may be used for metadata filtering, but embeddings are not dual-written to both pgvector and Qdrant in MVP unless a clear need is documented.

---

## 5. Tenant isolation in vector store

### 5.1 Standard tier

Shared Qdrant collections, partitioned by:

```
tenant_id
user_id
computer_instance_id
data_class
region
privacy_level
source_id
```

Every query must include `tenant_id` and `user_id` filters, enforced server-side. Client-supplied filters are hints only.

### 5.2 Enterprise / dedicated

- namespace per customer
- collection per customer (if needed)
- database or region per customer (if contracted)
- customer-managed key (if contracted)

### 5.3 Forbidden

- Client passing `user_id` as the sole filter
- A global `user_{userId}_memory` collection per user (collection explosion)
- Cross-tenant search without explicit admin audit

---

## 6. Retention schedule (locked)

| Data class | Default retention | Extension | Deletion trigger |
|---|---|---|---|
| `account` | while active + 30 days post-deletion request | legal hold | user request or admin |
| `session` | 1h access / 30d refresh | none | expiry or revoke |
| `organization` | while org active + 90 days | legal hold | org dissolution |
| `machine_state` | while instance active + 90 days | none | instance deletion |
| `evidence` | 7 years | legal hold | per policy |
| `academy_progress` | while account active + 1 year | none | account deletion |
| `proof` | 7 years | legal hold | per policy |
| `certificate` | permanent (revoked, not erased) | n/a | never erased; revocation only |
| `investor_profile` | while access active + 3 years | legal hold | user request or expiry |
| `data_room_document` | per access grant expiry | legal hold | grant expiry or revoke |
| `audit_log` | 7 years | legal hold | per policy |
| `billing` | per legal requirement (≥5 years) | legal hold | per law |

---

## 7. Memory and Vault retention (special rules)

### 7.1 No Infinity default

Memory retention must **not** default to Infinity. Each memory type has a default retention:

| Memory type | Default retention | User-configurable |
|---|---|---|
| preference | 365 days | yes, up to "do not remember" |
| fact | 365 days | yes |
| semantic | 180 days | yes |
| procedural | 365 days | yes |

### 7.2 User controls

- "Do not remember" mode: stops new memory writes for a session or permanently.
- Review queue: user can see and delete memory entries.
- Export: user can export all memory entries.
- Selective deletion: user can delete a single entry.
- Bulk deletion: user can delete all entries of a type or all entries.

### 7.3 Deletion propagation

`deleteMemory(userId, memoryId)` must propagate to:
- Postgres metadata row
- Qdrant vector(s)
- cached RAG responses referencing it
- derived summaries referencing it
- backup lifecycle (next backup cycle excludes it)

`deleteAll(userId)` must propagate to all of the above for all of the user's memory and vault objects.

### 7.4 Vault object deletion

`deleteVaultObject(userId, objectId)` must propagate to:
- R2 bytes
- Postgres metadata
- Qdrant derived vectors
- derived chunks
- cached RAG responses
- derived summaries
- backup lifecycle

---

## 8. Roots / genealogy data (special rules)

### 8.1 No global collection of raw records

A single `global_roots` collection of raw records is **prohibited**. It violates privacy-by-default.

### 8.2 Required split

```
roots_private_records     — private per user, never cross-tenant searchable
roots_consent_shared      — shared only with explicit, recorded consent
roots_public_sources      — public records (historical, deceased, public)
roots_reference_index     — reference / citation index, no PII of living persons
```

Only `roots_public_sources` and `roots_consent_shared` may be searched cross-tenant.

### 8.3 Provenance per chunk

Every chunk in roots collections must carry:

```
provided_by          — user or source id
consent_status       — none | family | public
living_status        — living | deceased | unknown
source_class         — user_upload | public_record | licensed | derived
evidence_label       — primary | secondary | inferred | disputed
dispute_status       — none | contested | resolved
retention            — per class
deletion_dependency  — what depends on this chunk
```

---

## 9. Ingestion security (locked)

All uploaded content (Data Vault, Academy proof artifacts, investor documents) is **untrusted content**.

### 9.1 Required controls

- content sanitization (active content removed)
- malware scan
- prompt-injection classifier
- source trust score
- tool execution isolation (retrieved content cannot override system policy)
- URL fetch allowlist (no arbitrary outbound fetch from ingestion)
- SSRF protection
- citation grounding (every retrieved chunk cites its source)
- chunk-level ACL (every chunk inherits the visibility of its parent object)
- data-exfiltration tests in CI

### 9.2 Forbidden

- Treating uploaded documents as trusted system input
- Allowing retrieved content to issue tool calls
- Fetching arbitrary URLs from ingestion pipelines
- Storing embeddings without the parent object's ACL

---

## 10. Data residency

- Default region: Cloudflare Workers global + Postgres primary in Singapore (APAC).
- SME / Enterprise customers may contract for a specific region.
- Investor data room documents may be pinned to a specific region per legal requirement.
- No data crosses a region boundary without a documented legal basis.

---

## 11. Audit log (locked)

### 11.1 Schema

```
event_id          — uuid
timestamp         — iso8601
event_type        — see §11.2
actor_user_id     — who caused the event
actor_session_id  — session that caused it
actor_ip
user_agent
target_type       — user | org | machine | memory | vault | proof | cert | investor | data_room
target_id
result            — success | denied | error
metadata          — jsonb
```

### 11.2 Event types

```
login_success, login_failure, logout, session_revoked,
passkey_registered, mfa_enrolled, role_changed, permission_granted,
permission_revoked, org_member_added, org_member_removed,
account_deletion_requested, account_deletion_completed,
memory_written, memory_deleted, memory_exported,
vault_uploaded, vault_downloaded, vault_deleted,
command_submitted, command_completed, command_failed,
approval_granted, approval_rejected,
proof_submitted, proof_reviewed, certificate_issued, certificate_revoked,
investor_access_requested, investor_access_granted, investor_access_revoked,
investor_document_viewed, investor_document_downloaded,
private_route_denied, access_denied
```

### 11.3 Rules

- Append-only. No updates, no deletes (except by legal hold release, itself audited).
- Retained 7 years.
- Admin-readable with `admin:audit-read` permission.
- Personal data inside audit logs is retained per legal basis (legitimate interest for security); deletion requests do not erase audit logs.

---

## 12. Account deletion workflow (locked)

```
User requests deletion via POST /v1/me/delete
        ↓
Identity service marks account as `deletion_requested`
        ↓
Email confirmation sent (must click within 24h)
        ↓
On confirmation:
  - Identity service revokes all sessions
  - Gen 2 cancels active subscriptions (no auto-renew)
  - Gen 1 deletes memory + vault objects (per §7)
  - Academy deletes progress (per §6)
  - Proof service revokes certificates (not erased)
  - Investor service revokes access grants
  - Audit logs retained per §6
  - Billing records retained per legal requirement
        ↓
Account record set to `deletion_completed` after 30 days
        ↓
Confirmation email sent to the (now-deleted) email address's recovery alias
```

### 12.1 Recovery window

- 30 days from request to completion.
- During this window, the user may cancel the deletion request.
- After completion, the account cannot be recovered.

---

## 13. Forbidden data patterns

- Storing API keys, model provider keys, or tool credentials in client-visible code or localStorage
- Storing session tokens in localStorage
- Storing PII in Qdrant (only derived vectors + non-PII metadata)
- Storing investor documents as static public HTML
- Storing `Math.random()`-generated certificate IDs as authoritative
- Storing progress in memory runtime (must be persistent)
- Cross-tenant queries without admin audit
- Backups without encryption
- Audit logs that can be edited or deleted by any user (including super_admin)

---

## 14. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-02 | Initial lock | Founder |
