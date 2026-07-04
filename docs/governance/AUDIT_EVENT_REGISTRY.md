# Nguyen AI — Audit Event Registry

- **Status:** BINDING — Sprint 0 Governance
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `IDENTITY_AND_TENANCY_RFC.md`, `DATA_CLASSIFICATION_AND_RETENTION.md`, `ENTITLEMENT_API_RFC.md`

---

## 1. Purpose

Replace ad-hoc audit CHECK constraints with a **versioned event registry**. Every audit event type is defined here with a stable ID, schema, and version. The database migration inserts these as an enum-like check table, preventing unknown event types from being inserted.

---

## 2. Registry version

- **Registry version:** `2026-07-02.1`
- **Total event types:** 38
- **Breaking change policy:** Adding new event types is non-breaking. Removing or renaming requires a new registry version + migration.

---

## 3. Event types (38)

### 3.1 Identity events (12)

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 1 | `login_success` | User logged in successfully | success | user_id, session_id, ip |
| 2 | `login_failure` | Login attempt failed | failure | user_id (if known), ip, reason |
| 3 | `logout` | User logged out | success | user_id, session_id |
| 4 | `session_revoked` | Session revoked by admin or user | success | user_id, session_id, revoked_by |
| 5 | `session_expired` | Session expired naturally | success | user_id, session_id |
| 6 | `passkey_registered` | Passkey/WebAuthn credential registered | success | user_id, credential_id |
| 7 | `passkey_removed` | Passkey credential removed | success | user_id, credential_id |
| 8 | `mfa_enrolled` | MFA TOTP enrolled | success | user_id, method |
| 9 | `mfa_removed` | MFA removed | success | user_id, method |
| 10 | `api_key_created` | API key created | success | user_id, key_id |
| 11 | `api_key_revoked` | API key revoked | success | user_id, key_id, revoked_by |
| 12 | `account_deletion_requested` | User requested account deletion | success | user_id, reference_code |

### 3.2 Authorization events (6)

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 13 | `role_changed` | User role changed | success | user_id, old_role, new_role, changed_by |
| 14 | `permission_granted` | Permission granted to user | success | user_id, permission, granted_by |
| 15 | `permission_revoked` | Permission revoked from user | success | user_id, permission, revoked_by |
| 16 | `org_member_added` | Member added to org/tenant | success | org_id, user_id, added_by |
| 17 | `org_member_removed` | Member removed from org/tenant | success | org_id, user_id, removed_by |
| 18 | `access_denied` | Access denied to resource | denied | user_id, resource, reason |

### 3.3 Entitlement events (5)

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 19 | `entitlement_granted` | Entitlement granted to user | success | user_id, entitlement_key, source |
| 20 | `entitlement_updated` | Entitlement updated | success | user_id, entitlement_key, old_value, new_value |
| 21 | `entitlement_revoked` | Entitlement revoked | success | user_id, entitlement_key, revoked_by |
| 22 | `entitlement_expired` | Entitlement expired naturally | success | user_id, entitlement_key |
| 23 | `entitlement_recalculated` | Entitlement recalculated by system | success | user_id, trigger |

### 3.4 Approval events (4)

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 24 | `approval_requested` | Sensitive action approval requested | success | user_id, action, request_id |
| 25 | `approval_granted` | Approval granted | success | request_id, approved_by |
| 26 | `approval_denied` | Approval denied | denied | request_id, denied_by, reason |
| 27 | `sensitive_action_executed` | Sensitive action executed after approval | success | user_id, action, request_id |

### 3.5 Command & runtime events (5)

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 28 | `command_executed` | Command executed by runtime | success | user_id, command_id, agent, model |
| 29 | `command_failed` | Command execution failed | failure | user_id, command_id, error |
| 30 | `command_cancelled` | Command cancelled by user or system | success | user_id, command_id, cancelled_by |
| 31 | `tool_called` | Tool invoked by agent | success | user_id, tool_name, result |
| 32 | `workflow_completed` | Workflow completed | success | user_id, workflow_id |

### 3.6 Academy & certification events (4)

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 33 | `academy_lesson_completed` | User completed a lesson | success | user_id, lesson_id, track_id |
| 34 | `proof_submitted` | Proof/certification attempt submitted | success | user_id, program_id, attempt_id |
| 35 | `certificate_issued` | Certificate issued after review | success | user_id, certificate_id, program_id |
| 36 | `certificate_revoked` | Certificate revoked | success | certificate_id, revoked_by, reason |

### 3.7 Billing & investor events (2)

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 37 | `payment_received` | Payment received for plan/product | success | user_id, amount, currency, invoice_id |
| 38 | `investor_room_accessed` | Investor private room accessed | success | user_id, room_id, ip |

### 3.8 Scholarship events (24) — per EDU_MASTER_PLAN_V4 §XXXIV

| ID | Event type | Description | Result | Required fields |
|---|---|---|---|---|
| 39 | `scholarship_application_created` | Scholarship application created | success | user_id, program_code |
| 40 | `scholarship_application_updated` | Application fields updated | success | user_id, fields[] |
| 41 | `identity_verification_started` | Email/phone/identity verification started | success | user_id, type |
| 42 | `identity_verification_completed` | Verification completed | success | user_id, type |
| 43 | `investor_access_granted` | Investor granted access to applications | success | investor_id, scope |
| 44 | `investor_access_revoked` | Investor access revoked | success | investor_id, reason |
| 45 | `scholarship_profile_viewed` | Investor viewed applicant profile | success | investor_id, application_id |
| 46 | `wish_shared_with_investors` | Wish visibility set to investors_only | success | user_id, wish_id |
| 47 | `wish_publication_requested` | Applicant requested public publication | success | user_id, wish_id |
| 48 | `wish_publication_approved` | Admin approved wish publication | success | admin_id, wish_id |
| 49 | `wish_publication_rejected` | Admin rejected wish publication | success | admin_id, wish_id, reason |
| 50 | `scholarship_review_submitted` | Investor submitted review | success | reviewer_id, application_id |
| 51 | `scholarship_vote_submitted` | Council member voted | success | voter_id, decision |
| 52 | `conflict_of_interest_declared` | Reviewer declared conflict | success | reviewer_id, conflict_type |
| 53 | `scholarship_awarded` | Scholarship awarded to applicant | success | application_id, program_code |
| 54 | `scholarship_declined` | Scholarship offer declined | success | application_id, reason |
| 55 | `sponsorship_committed` | Sponsor committed funds | success | sponsor_id, amount |
| 56 | `sponsorship_paid` | Sponsorship payment completed | success | sponsor_id, sponsorship_id |
| 57 | `scholarship_enrollment_activated` | Enrolled in program | success | application_id, program_code |
| 58 | `forum_post_submitted` | Forum post submitted for moderation | success | user_id, post_id |
| 59 | `forum_post_approved` | Moderator approved post | success | moderator_id, post_id |
| 60 | `forum_post_rejected` | Moderator rejected post | success | moderator_id, post_id, reason |
| 61 | `complaint_submitted` | User submitted complaint | success | user_id, target_id |
| 62 | `appeal_submitted` | Applicant submitted appeal | success | user_id, application_id, type |

---

## 4. Schema

Every audit event MUST contain:

```sql
event_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
event_type        TEXT NOT NULL,  -- must exist in registry
registry_version  TEXT NOT NULL,  -- '2026-07-02.1'
user_id           UUID,
tenant_id         UUID,
session_id        TEXT,
actor_id          UUID,           -- who performed the action
actor_role        TEXT,
resource          TEXT,           -- affected resource
result            TEXT NOT NULL,  -- success | failure | denied
metadata          JSONB,
ip_address        INET,
user_agent        TEXT,
trace_id          TEXT,
timestamp         TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

## 5. Registry enforcement

Instead of a hardcoded `CHECK` constraint, the migration creates:

```sql
CREATE TABLE audit_event_registry (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL UNIQUE,
  registry_version TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert all 38 event types
INSERT INTO audit_event_registry (event_type, registry_version, description) VALUES
  ('login_success', '2026-07-02.1', 'User logged in successfully'),
  ('login_failure', '2026-07-02.1', 'Login attempt failed'),
  ... (all 38);

-- FK constraint: audit_log.event_type must exist in registry
ALTER TABLE audit_log
  ADD CONSTRAINT fk_audit_event_type
  FOREIGN KEY (event_type) REFERENCES audit_event_registry(event_type);
```

This replaces the enum CHECK constraint. New event types can be added via INSERT into registry (non-breaking). Removing/renaming requires new registry version + migration.

---

## 6. Archive plan

- **Hot store:** D1 (edge, last 30 days, queryable)
- **Warm store:** Postgres (Neon, last 7 years, queryable)
- **Cold archive:** R2 (immutable, 7+ years, batch export)
- **Archive trigger:** Events older than 30 days → R2 batch export, then delete from D1 (keep in Postgres)

---

## 7. Test requirements

- All 38 event types must insert successfully
- Unknown event type must be rejected (FK violation)
- Registry version must be recorded per event
- Append-only: UPDATE and DELETE must fail (triggers)
- Cross-tenant query must require SUPER_ADMIN + audit-read permission

---

## 8. Change log

| Date | Version | Change |
|---|---|---|
| 2026-07-02 | 2026-07-02.1 | Initial registry — 38 event types |
