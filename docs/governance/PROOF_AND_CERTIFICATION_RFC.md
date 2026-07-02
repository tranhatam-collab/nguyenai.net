# Nguyen AI — Proof and Certification RFC

- **Status:** BINDING — Sprint 0 Governance (Sprint 0.5 — approved early, not waiting for Sprint 4)
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ENTITLEMENT_MODEL.md`, `AUDIT_EVENT_REGISTRY.md`, `IDENTITY_AND_TENANCY_RFC.md`

---

## 1. Purpose

Define the proof and certification system for Nguyen AI Academy. This RFC locks the proof object, evidence references, rubric, attempt, reviewer, AI-assisted review, human review, certificate, revocation, public verification, privacy, API, audit events, and error codes.

---

## 2. Core concepts

### 2.1 Proof object

A proof object is a submission by a user demonstrating mastery of a program.

```json
{
  "proof_id": "uuid",
  "user_id": "uuid",
  "program_id": "string",
  "attempt_id": "string",
  "submitted_at": "ISO8601",
  "status": "submitted | under_review | ai_reviewed | human_reviewed | approved | rejected | revoked",
  "evidence_refs": ["evidence_id_1", "evidence_id_2"],
  "rubric_scores": { ... },
  "ai_review": { ... } | null,
  "human_review": { ... } | null,
  "certificate_id": "string" | null
}
```

### 2.2 Evidence references

Evidence is stored immutably. A proof object references evidence by ID.

```json
{
  "evidence_id": "uuid",
  "proof_id": "uuid",
  "type": "file | url | text | screenshot | recording",
  "content_hash": "sha256",
  "storage_uri": "r2://proof-evidence/{evidence_id}",
  "uploaded_at": "ISO8601",
  "expires_at": "ISO8601" | null
}
```

Evidence content is never inlined in the proof object. Only references + hashes.

### 2.3 Rubric

A rubric defines scoring criteria for a program.

```json
{
  "rubric_id": "string",
  "program_id": "string",
  "version": "string",
  "criteria": [
    { "name": "accuracy", "weight": 0.4, "pass_threshold": 0.7 },
    { "name": "completeness", "weight": 0.3, "pass_threshold": 0.6 },
    { "name": "clarity", "weight": 0.3, "pass_threshold": 0.6 }
  ],
  "overall_pass_threshold": 0.7
}
```

### 2.4 Attempt

A user may attempt certification for a program. Attempts are tracked.

```json
{
  "attempt_id": "uuid",
  "user_id": "uuid",
  "program_id": "string",
  "attempt_number": 1,
  "started_at": "ISO8601",
  "submitted_at": "ISO8601" | null,
  "status": "in_progress | submitted | completed | expired",
  "proof_id": "uuid" | null
}
```

Attempt limits are governed by `ENTITLEMENT_MODEL.md` (`academy.cert.attempts`). Preview attempts are limited to 1 (`academy.preview.proof_submission_limit`).

### 2.5 Reviewer

A reviewer is either AI-assisted or human.

```json
{
  "reviewer_id": "uuid" | "ai-service",
  "reviewer_type": "ai | human",
  "reviewed_at": "ISO8601",
  "decision": "approve | reject | request_changes",
  "scores": { ... },
  "notes": "string"
}
```

### 2.6 AI-assisted review

AI review is a first pass. It scores against the rubric and flags areas for human attention.

- AI review does NOT issue certificates.
- AI review results are advisory.
- Human reviewer sees AI review before making final decision.
- AI review model + version are logged.

### 2.7 Human review

Human review is the final authority for certificate issuance.

- Must be performed by a certified reviewer (`reviewer.certified = true`).
- May approve, reject, or request changes.
- Decision is final (subject to revocation).
- Reviewer identity is logged in audit.

### 2.8 Certificate

A certificate is issued after human review approval.

```json
{
  "certificate_id": "NGAI-OPR-2026-000001-8F2C",
  "user_id": "uuid",
  "program_id": "string",
  "proof_id": "uuid",
  "issued_at": "ISO8601",
  "issued_by": "uuid",
  "status": "active | revoked",
  "revoked_at": "ISO8601" | null,
  "revoked_reason": "string" | null
}
```

### 2.8.1 Certificate ID format (LOCKED)

```
NGAI-{PROGRAM}-{YEAR}-{SEQUENCE}-{CHECKSUM}
```

- `NGAI` — fixed prefix
- `{PROGRAM}` — program code (e.g., `OPR` for Operator, `ARC` for Archivist)
- `{YEAR}` — 4-digit year
- `{SEQUENCE}` — 6-digit zero-padded sequence (per program per year)
- `{CHECKSUM}` — 4-char hex checksum (deterministic, NOT Math.random())

Example: `NGAI-OPR-2026-000001-8F2C`

Checksum algorithm: SHA-256 of `{PROGRAM}-{YEAR}-{SEQUENCE}` → first 4 hex chars (uppercase). This is a integrity check, not a security token.

### 2.9 Revocation

A certificate may be revoked by a certified reviewer or admin.

- Revocation requires `reason` (string, min 20 chars).
- Revocation is logged as `certificate_revoked` in audit.
- Revoked certificates remain in registry (status = `revoked`) — never deleted.
- Public verification shows "revoked" status.

### 2.10 Public verification

Anyone may verify a certificate by ID without authentication.

```
GET /v1/certificates/{certificate_id}
  → 200 { certificate_id, program_id, issued_at, status, user_display_name }
  → 404 { not_found }
```

- Does NOT expose `user_id`, email, or PII.
- `user_display_name` is opt-in by the certificate holder.
- Response is cacheable (CDN, 1 hour).

### 2.11 Privacy

- Evidence content is private (only reviewer + user can see).
- Proof object metadata is visible to user + reviewer.
- Certificate public verification shows only: certificate_id, program, issued_at, status, opt-in display name.
- User may request certificate be hidden from public verification (status remains `active` but `public_visible = false`).

---

## 3. API

### 3.1 User endpoints (session-authenticated)

```
POST /v1/me/proofs
  Body: { program_id, evidence_refs: [...], attempt_id }
  Auth: valid session + academy.pass or academy.preview
  Audit: proof_submitted
  → 201 { proof_id, status: "submitted" }

GET /v1/me/proofs
  → 200 [ { proof_id, program_id, status, submitted_at } ]

GET /v1/me/proofs/{proof_id}
  → 200 { proof_id, status, rubric_scores, ai_review, human_review, certificate_id }

GET /v1/me/certificates
  → 200 [ { certificate_id, program_id, issued_at, status } ]
```

### 3.2 Reviewer endpoints (reviewer-authenticated)

```
GET /v1/review/queue
  → 200 [ { proof_id, user_id, program_id, submitted_at, ai_review } ]

POST /v1/review/{proof_id}/decision
  Body: { decision: "approve" | "reject" | "request_changes", scores, notes }
  Auth: reviewer session + reviewer.certified
  Audit: certificate_issued (if approve) or proof_submitted update
  → 200 { proof_id, decision, certificate_id? }
```

### 3.3 Public endpoints

```
GET /v1/certificates/{certificate_id}
  → 200 { certificate_id, program_id, issued_at, status, user_display_name? }
  → 404 { not_found }
```

### 3.4 Admin endpoints (service-authenticated)

```
POST /v1/internal/certificates/{certificate_id}/revoke
  Body: { reason, revoked_by }
  Auth: service (admin key)
  Audit: certificate_revoked
  → 200 { revoked_at }
```

---

## 4. Audit events

| Event type | When |
|---|---|
| `proof_submitted` | User submits proof |
| `certificate_issued` | Reviewer approves + certificate generated |
| `certificate_revoked` | Admin or reviewer revokes certificate |

All events include: `user_id`, `proof_id`, `program_id`, `registry_version`, `trace_id`.

---

## 5. Error codes

| Code | Meaning |
|---|---|
| 400 | Invalid body, missing evidence_refs, invalid attempt |
| 401 | No valid session |
| 403 | No academy.pass (and not in preview), or reviewer not certified |
| 404 | Proof or certificate not found |
| 409 | Attempt already submitted, or duplicate proof |
| 429 | Attempt limit exceeded |

---

## 6. Preview mode

During Academy Limited Preview (`academy.preview.enabled = true`):

- `academy.preview.proof_submission_limit = 1` — user may submit 1 proof
- `academy.preview.certificate = false` — no certificate issued for preview proofs
- Preview proofs are marked `preview = true`
- Preview proofs cannot be converted to certificates without Academy Pass + cert fee

---

## 7. Change log

| Date | Change |
|---|---|
| 2026-07-02 | Initial RFC — proof object, evidence, rubric, attempt, review, certificate, revocation, public verify, privacy, API, audit, errors, preview |
