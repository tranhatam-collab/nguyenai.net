# Nguyen AI — Admin Approval Matrix

- **Status:** BINDING POLICY
- **Date:** 2026-07-07
- **Owner:** Founder

---

## 1. Purpose

Define actions that require Admin or Founder approval before execution.

---

## 2. Approval matrix

| Action | Admin approval | Founder approval | Notes |
|---|---:|---:|---|
| Deploy preview | Yes | No | Required for self-heal changes |
| Deploy production | Yes | Optional/Policy | Second approval required after preview |
| Rotate secret | Yes | Yes for production secrets | Never by autonomous agent alone |
| Enable F3 fallback | Yes | Optional | Sensitive user data |
| Enable F4 fallback | Yes | Yes if prolonged | Emergency mode |
| Send sensitive data to fallback | Yes | Optional | Requires data classification |
| Grant investor private access | Yes | Optional | Must follow investor policy |
| Revoke investor private access | Yes | Optional | Audit required |
| Grant scholarship | Yes | Optional | Never autonomous |
| Revoke scholarship | Yes | Optional | Never autonomous |
| Issue certificate | Yes | Optional | Proof/evidence required |
| Revoke certificate | Yes | Optional | Audit required |
| Mutate user data | Yes | Optional | Purpose and trace required |
| Delete user data | Yes | Optional | Must follow retention policy |
| Delete or update audit log | Forbidden | Forbidden | Append-only only |
| Change pricing | Yes | Yes | Commercial policy |
| Change investment terms | Yes | Yes | Legal/compliance |
| Change privacy policy | Yes | Yes | Legal/compliance |
| Bulk email | Yes | Optional | Transactional only unless approved |
| Disable security control | Yes | Yes | Requires incident id |

---

## 3. Approval record fields

Every approval record must include:

- `approval_id`;
- requested action;
- requester type (`user`, `admin`, `agent`, `system`);
- requester id;
- affected resource;
- data class;
- risk level;
- incident id if applicable;
- proposed command or diff;
- test evidence;
- approval status;
- approver id;
- approval time;
- expiry time;
- audit event id.

---

## 4. Rejection rule

A rejected approval must block the action. A new approval request may be created only with a materially changed plan and must reference the rejected approval id.
