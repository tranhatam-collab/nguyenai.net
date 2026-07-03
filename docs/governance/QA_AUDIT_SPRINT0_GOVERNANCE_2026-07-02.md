# QA AUDIT — Sprint 0 Governance Lock (7 tài liệu)

> **Auditor:** Trần Hà Tâm
> **Ngày audit:** 2026-07-02
> **Phương pháp:** Đọc độc lập + cross-reference giữa 7 file + Founder Verdict + AGENTS.md + verify code/data thực tế
> **Files audit:**
> - `governance/ECOSYSTEM_SOURCE_OF_TRUTH.md` (237 dòng)
> - `governance/BRAND_SURFACE_MATRIX.md` (171 dòng)
> - `governance/PRODUCT_BOUNDARY_CONTRACT.md` (201 dòng)
> - `governance/IDENTITY_AND_TENANCY_RFC.md` (357 dòng)
> - `governance/ENTITLEMENT_MODEL.md` (272 dòng)
> - `governance/DATA_CLASSIFICATION_AND_RETENTION.md` (367 dòng)
> - `governance/INVESTOR_ACCESS_POLICY.md` (364 dòng)
> - `Maytinhai.com/NGUYEN_AI_FOUNDER_VERDICT_2026-07-02.md` (605 dòng — tham chiếu)
> - `nguyenai.net/AGENTS.md` (tham chiếu)

---

## TÓM TẮT EXECUTIVE

| Hạng mục | Kết quả |
|---|---|
| 7 tài liệu tồn tại, có cấu trúc, có change log | ✅ PASS |
| Nội bộ từng file nhất quán | ⚠️ 5/7 PASS, 2/7 có gap |
| Cross-reference giữa 7 file | ❌ 3 mâu thuẫn nghiêm trọng |
| Khớp với Founder Verdict | ⚠️ 1 mâu thuẫn (AGENTS.md override) |
| Khớp với code/data thực tế | ❌ 2 mâu thuẫn P0 (plans.json, audit schema) |
| Completeness (có thiếu contract/document không) | ❌ Thiếu 2 tài liệu critical |
| Binding clauses (locked, forbidden, must) | ✅ Có đủ, rõ ràng |

**Verdict:** ⚠️ **NỀN MÓNG TỐT NHƯNG CHƯA KHÓA ĐƯỢC. 3 mâu thuẫn cross-reference + 2 mâu thuẫn data thực tế phải resolve trước khi coi Sprint 0 là "locked".**

---

## 🔴 P0 — CRITICAL (mâu thuẫn data/code thực tế)

### P0-1: `plans.json` contradicts ENTITLEMENT_MODEL.md §3 — Founder/Chapter academy_pass

**Mức:** P0 — Source of truth contradiction
**Files:** `ENTITLEMENT_MODEL.md §3` vs `packages/product-catalog/plans.json`

**ENTITLEMENT_MODEL.md §3 nói:**
```
| Founder | ... | academy.pass = included | ... |
| Chapter | ... | academy.pass = included for members | ... |
```

**`plans.json` thực tế:**
```json
nguyen-founder: academy_pass = false
nguyen-chapter: academy_pass = false
```

**`entitlements.json` thực tế:**
```json
nguyen-founder: "academy.pass": false
nguyen-chapter: "academy.pass": false
```

**Hậu quả:** ENTITLEMENT_MODEL §10 nói `packages/product-catalog/` là "single source of truth" cho pricing. Nhưng chính source of truth lại contradict entitlement model. Dev team không biết: Founder plan có Academy Pass hay không?

**Fix:** Hoặc:
- (A) Sửa `plans.json` + `entitlements.json`: `nguyen-founder.academy_pass = true`, `nguyen-chapter.academy_pass = true`
- (B) Sửa `ENTITLEMENT_MODEL.md §3`: Founder/Chapter không include Academy Pass

Founder quyết định. Sau khi quyết, sync cả 3 file.

---

### P0-2: D1 audit schema thiếu 21 event types — INSERT sẽ fail khi Gen1/Academy/Investor gọi

**Mức:** P0 — Audit log sẽ mất events critical
**Files:** `migrations/001_identity_access.d1.sql:129-138` vs `DATA_CLASSIFICATION_AND_RETENTION.md §11.2`

**D1 schema CHECK cho phép 19 event types.**
**DATA_CLASSIFICATION §11.2 define 34 event types.**
**21 types MISSING trong D1 schema:**

```
account_deletion_completed, approval_rejected,
certificate_issued, certificate_revoked,
command_completed, command_failed, command_submitted,
investor_access_granted, investor_access_requested, investor_access_revoked,
investor_document_downloaded, investor_document_viewed,
memory_deleted, memory_exported, memory_written,
private_route_denied,
proof_reviewed, proof_submitted,
vault_deleted, vault_downloaded, vault_uploaded
```

**Hậu quả:** Khi Gen 1 gọi `logAuditEvent({event_type: 'command_submitted'})` → INSERT fail với `CHECK constraint failed`. Audit log mất toàn bộ command/vault/memory/investor/proof events — những events critical nhất cho security.

**Fix:** Thêm 21 event types vào D1 schema CHECK constraint, hoặc bỏ CHECK entirely (rely on app-level validation).

---

### P0-3: AGENTS.md FOUNDER OVERRIDE mâu thuẫn ECOSYSTEM_SOURCE_OF_TRUTH.md §2.1

**Mức:** P0 — Governance contradiction
**Files:** `ECOSYSTEM_SOURCE_OF_TRUTH.md §2.1, §2.2` vs `nguyenai.net/AGENTS.md` (FOUNDER OVERRIDE 2026-07-02)

**ECOSYSTEM_SOURCE_OF_TRUTH §2.1:**
> "Gen 1 is the **only** runtime. No repo may spin up its own command/agent execution engine."

**ECOSYSTEM_SOURCE_OF_TRUTH §2.2:**
> "Gen 2 is the **only** entitlement and billing authority. No repo may hardcode its own pricing, plan, or entitlement definition."

**AGENTS.md FOUNDER OVERRIDE:**
> "nguyenai.net sở hữu backend riêng độc lập. Gen1 (computer.iai.one) và Gen2 (maytinhai.org) đóng băng (reference only, không sửa, không deploy)."

**Mâu thuẫn:**
- ECOSYSTEM_SOURCE_OF_TRUTH nói Gen 1 là runtime duy nhất → AGENTS.md nói Gen 1 frozen, build backend riêng
- ECOSYSTEM_SOURCE_OF_TRUTH nói Gen 2 là entitlement authority duy nhất → AGENTS.md nói Gen 2 frozen
- Auth Worker hiện tại là backend riêng của nguyenai.net — đúng theo AGENTS.md, sai theo ECOSYSTEM_SOURCE_OF_TRUTH

**Hậu quả:** Dev team không biết: entitlement đến từ Gen 2 (frozen) hay từ nguyenai.net backend (mới)? Nếu Gen 2 frozen, ai serve `GET /v1/entitlements`?

**Fix:** Founder issue formal amendment cập nhật ECOSYSTEM_SOURCE_OF_TRUTH.md để phản ánh FOUNDER OVERRIDE. Hoặc revoke FOUNDER OVERRIDE. Không thể có 2 tài liệu binding nói trái nhau.

---

## 🟡 P1 — HIGH (gap/thiếu tài liệu)

### P1-1: Thiếu tài liệu contract cho Proof/Verify service

**Mức:** P1 — Critical service không có contract
**Files:** ECOSYSTEM_SOURCE_OF_TRUTH §2.5, PRODUCT_BOUNDARY_CONTRACT §6

ECOSYSTEM_SOURCE_OF_TRUTH §2.5 define "Shared Proof / Verify Service" owns:
- proof submission, rubric scoring, certificate issuance/registry/revocation/verify, evidence references

PRODUCT_BOUNDARY_CONTRACT §6 list endpoints:
```
/v1/proofs, /v1/certificates
```

**Nhưng không có tài liệu dedicated nào define:**
- API contract đầy đủ (request/response schema)
- Certificate ID format (Founder Verdict §13 nói `NGUYENAI-{PROGRAM}-{YEAR}-{SEQUENCE}-{CHECKSUM}` nhưng không tài liệu governance nào lock điều này)
- Rubric schema
- Proof submission workflow
- Evidence reference format
- Verify endpoint public contract

**Fix:** Tạo `PROOF_AND_CERTIFICATION_RFC.md` trong Sprint 1 hoặc đầu Sprint 4.

---

### P1-2: Thiếu tài liệu contract cho Entitlement service API

**Mức:** P1 — Entitlement service không có API spec đầy đủ
**Files:** ENTITLEMENT_MODEL.md §6

ENTITLEMENT_MODEL §6 define 3 GET endpoints:
```
GET /v1/entitlements
GET /v1/entitlements/{key}
GET /v1/plans
GET /v1/usage
```

**Nhưng thiếu:**
- `POST /v1/entitlements` (grant) — ai gọi? Admin? System?
- `DELETE /v1/entitlements/{id}` (revoke)
- `PUT /v1/entitlements/{id}` (update)
- Webhook/event khi entitlement thay đổi (push notification cho relying parties)
- Response schema chi tiết (§6 chỉ cho ví dụ, không có JSON Schema)

**Fix:** Mở rộng ENTITLEMENT_MODEL §6 hoặc tạo `ENTITLEMENT_API_RFC.md`.

---

### P1-3: ECOSYSTEM_SOURCE_OF_TRUTH §1 diagram thiếu academy.iai.one và Proof/Verify service

**Mức:** P1 — Architecture diagram incomplete
**File:** `ECOSYSTEM_SOURCE_OF_TRUTH.md §1`

§1 diagram show:
- Nguyen AI brand layer (4 surfaces)
- Gen 1, Gen 2
- Shared Identity Service

**Thiếu trong diagram:**
- `academy.iai.one` (Shared Academy engine) — có trong §4 domain map nhưng không trong diagram
- Shared Proof / Verify Service — §2.5 define nhưng không trong diagram

**Fix:** Cập nhật diagram thêm 2 boxes.

---

### P1-4: Không ai own `packages/product-catalog/` — không repo nào declare ownership

**Mức:** P1 — Ownership gap
**Files:** ECOSYSTEM_SOURCE_OF_TRUTH §3, ENTITLEMENT_MODEL §10

ENTITLEMENT_MODEL §10 nói pricing lives in `packages/product-catalog/`. ECOSYSTEM_SOURCE_OF_TRUTH §3 map repo→layer nhưng không mention `packages/product-catalog/` thuộc repo nào.

**Thực tế:** `packages/product-catalog/` exists trong `nguyenai.net` repo. Nhưng:
- Nếu Gen 2 là "only entitlement and billing authority" (ECOSYSTEM_SOURCE_OF_TRUTH §2.2), catalog nên ở Gen 2?
- Nhưng AGENTS.md nói Gen 2 frozen → catalog phải ở nguyenai.net?
- Nếu catalog ở nguyenai.net, các repo khác (console, academy, invest) consume nó như nào? NPM package? Git submodule? Copy?

**Fix:** Declare ownership trong ECOSYSTEM_SOURCE_OF_TRUTH §3: "`packages/product-catalog/` owned by `nguyenai.net` repo, published as `@nai/product-catalog` NPM package, consumed by all repos."

---

### P1-5: BRAND_SURFACE_MATRIX §7 nói "remediation log must be committed" — nhưng không có

**Mức:** P1 — Missing deliverable
**File:** `BRAND_SURFACE_MATRIX.md §7`

§7 nói:
> "The classification must be recorded in a remediation log committed alongside the fix."

**Thực tế:** `find . -name "*remediation*log*"` → 0 results. Không có remediation log.

**Fix:** Tạo `docs/governance/BRAND_REMEDIATION_LOG.md` classify 18 occurrences.

---

### P1-6: DATA_CLASSIFICATION §12 mention "recovery alias" nhưng không define

**Mức:** P1 — Undefined concept
**File:** `DATA_CLASSIFICATION_AND_RETENTION.md §12`

§12 nói:
> "Confirmation email sent to the (now-deleted) email address's recovery alias"

**Vấn đề:** "Recovery alias" không được define ở bất kỳ đâu trong 7 tài liệu. Là gì? Email forwarding? Alias trong Identity service? User có thể set nó khi nào?

**Fix:** Define "recovery alias" trong IDENTITY_AND_TENANCY_RFC §6.3 (`POST /v1/me`) hoặc bỏ concept.

---

## 🟢 P2 — MEDIUM

### P2-1: ENTITLEMENT_MODEL §3 "limited preview" không define

**File:** `ENTITLEMENT_MODEL.md §3`

Start (Free) plan: `academy.pass = false (limited preview only)`

"Limited preview" là gì? 5 bài đầu? 1 track? 30 ngày? Không define.

**Fix:** Define "limited preview" = `academy.lessons.limit = 5` + `academy.tracks.enabled = ["free-intro"]` (đã có trong entitlements.json nhưng không sync với doc).

---

### P2-2: IDENTITY_AND_TENANCY_RFC §13 "open questions" có 4 items critical nhưng chưa lock

**File:** `IDENTITY_AND_TENANCY_RFC.md §13`

4 open questions:
1. Passkey library — affects security implementation
2. Cloudflare Access for admin — affects auth architecture
3. Audit store (D1/Postgres/R2) — affects data architecture
4. Refresh token mechanism — affects session security

RFC nói "these are implementation choices, not contract choices" — đúng, nhưng P0-3 (MFA dev bypass) cho thấy implementation choice có thể tạo security hole.

**Fix:** Lock 4 choices trước Sprint 2 implementation.

---

### P2-3: INVESTOR_ACCESS_POLICY §12 hreflang — Option A vs B chưa decide

**File:** `INVESTOR_ACCESS_POLICY.md §12`

> "Option B is the minimum required for Wave 2 release. Option A is required for full bilingual SEO."

Không có decision recorded. Option A hay B?

**Fix:** Record decision: "Option B cho Wave 2, Option A cho Wave 3."

---

### P2-4: INVESTOR_ACCESS_POLICY §6.3 nói Disclosure.astro "must be replaced" — không có deadline

**File:** `INVESTOR_ACCESS_POLICY.md §6.3`

> "The current `Disclosure.astro` short form ... is not the approved wording and must be replaced."

Không nói khi nào, ai làm, trong sprint nào.

**Fix:** Add to Sprint 1 hoặc Sprint 5 task list.

---

### P2-5: PRODUCT_BOUNDARY_CONTRACT §6 list `/v1/commands` nhưng không RFC nào define command contract

**File:** `PRODUCT_BOUNDARY_CONTRACT.md §6`

§6 list:
```
Command runtime contract: /v1/commands, /v1/jobs
```

Founder Verdict §6.3 define:
```
POST /v1/commands
GET  /v1/commands/:id
GET  /v1/jobs/:id
POST /v1/jobs/:id/cancel
```

**Nhưng không có dedicated `COMMAND_RUNTIME_RFC.md`** define request/response schema, auth requirements, rate limiting, error codes.

**Fix:** Tạo `COMMAND_RUNTIME_RFC.md` trước Sprint 3.

---

## ✅ VERIFIED PASS (7/7 tài liệu)

| # | Tài liệu | Cấu trúc | Binding clauses | Change log | Internal consistency |
|---|---|---|---|---|---|
| 1 | ECOSYSTEM_SOURCE_OF_TRUTH | ✅ 13 sections | ✅ "locked", "may NOT" | ✅ | ⚠️ diagram thiếu 2 services |
| 2 | BRAND_SURFACE_MATRIX | ✅ 10 sections | ✅ "prohibited", "must" | ✅ | ✅ |
| 3 | PRODUCT_BOUNDARY_CONTRACT | ✅ 10 sections | ✅ "forbidden", "may not" | ✅ | ✅ |
| 4 | IDENTITY_AND_TENANCY_RFC | ✅ 14 sections | ✅ "locked", "forbidden" | ✅ | ✅ |
| 5 | ENTITLEMENT_MODEL | ✅ 12 sections | ✅ "locked", "forbidden" | ✅ | ⚠️ "limited preview" undefined |
| 6 | DATA_CLASSIFICATION_AND_RETENTION | ✅ 14 sections | ✅ "locked", "forbidden" | ✅ | ⚠️ "recovery alias" undefined |
| 7 | INVESTOR_ACCESS_POLICY | ✅ 16 sections | ✅ "locked", "forbidden" | ✅ | ✅ |

---

## CROSS-REFERENCE MATRIX (mâu thuẫn giữa các file)

| # | File A | File B | Mâu thuẫn | Mức |
|---|---|---|---|---|
| 1 | ENTITLEMENT_MODEL §3 | plans.json | Founder/Chapter academy_pass = included vs false | 🔴 P0 |
| 2 | DATA_CLASSIFICATION §11.2 | D1 schema | 34 event types vs 19 allowed (21 missing) | 🔴 P0 |
| 3 | ECOSYSTEM_SOURCE_OF_TRUTH §2.1 | AGENTS.md | Gen 1 = only runtime vs Gen 1 frozen | 🔴 P0 |
| 4 | ECOSYSTEM_SOURCE_OF_TRUTH §1 diagram | §4 domain map | Diagram thiếu academy.iai.one + Proof service | 🟡 P1 |
| 5 | ECOSYSTEM_SOURCE_OF_TRUTH §3 | ENTITLEMENT_MODEL §10 | Không declare ownership của product-catalog | 🟡 P1 |
| 6 | PRODUCT_BOUNDARY_CONTRACT §6 | (no doc) | Command runtime contract không có RFC | 🟡 P1 |
| 7 | ECOSYSTEM_SOURCE_OF_TRUTH §2.5 | (no doc) | Proof/Verify service không có RFC | 🟡 P1 |
| 8 | BRAND_SURFACE_MATRIX §7 | (no file) | Remediation log không tồn tại | 🟡 P1 |
| 9 | DATA_CLASSIFICATION §12 | (no definition) | "Recovery alias" không define | 🟡 P1 |
| 10 | ENTITLEMENT_MODEL §3 | (no definition) | "Limited preview" không define | 🟢 P2 |
| 11 | INVESTOR_ACCESS_POLICY §12 | (no decision) | Hreflang Option A vs B chưa decide | 🟢 P2 |

---

## FIX PRIORITY ORDER

```
HOTFIX (trước khi coi Sprint 0 "locked"):
  P0-1: Sync plans.json + entitlements.json với ENTITLEMENT_MODEL §3
        → Founder quyết: Founder/Chapter có Academy Pass hay không?
  P0-2: Thêm 21 event types vào D1 schema CHECK
  P0-3: Founder amendment cho ECOSYSTEM_SOURCE_OF_TRUTH vs AGENTS.md

P1 (trước Sprint 2):
  P1-1: Tạo PROOF_AND_CERTIFICATION_RFC.md
  P1-2: Mở rộng ENTITLEMENT_MODEL §6 thành full API spec
  P1-3: Cập nhật ECOSYSTEM_SOURCE_OF_TRUTH §1 diagram
  P1-4: Declare ownership của packages/product-catalog/
  P1-5: Tạo BRAND_REMEDIATION_LOG.md
  P1-6: Define "recovery alias" hoặc bỏ concept

P2 (trước public release):
  P2-1: Define "limited preview" cho Start plan
  P2-2: Lock 4 open questions trong IDENTITY_AND_TENANCY_RFC §13
  P2-3: Record hreflang decision
  P2-4: Add Disclosure.astro replacement deadline
  P2-5: Tạo COMMAND_RUNTIME_RFC.md trước Sprint 3
```

---

## SPRINT 0 EXIT GATE RE-ASSESSMENT

Sprint 0 exit gate (từ Founder Verdict §7):
1. ✅ "Không còn repo nào tự định nghĩa lại bản chất Gen 1/Gen 2" — PASS (ECOSYSTEM_SOURCE_OF_TRUTH khóa)
2. ❌ "Không còn pricing duplicated không kiểm soát" — FAIL (plans.json contradict ENTITLEMENT_MODEL)
3. ⚠️ "Không còn auth placeholder được xem như production design" — PARTIAL (RFC lock OK, nhưng auth Worker có 4 P0 security bugs — xem QA_AUDIT_AUTH_WORKER)

**Verdict Sprint 0:** ⚠️ **2/3 exit gates PASS, 1/3 FAIL. Sprint 0 chưa thể coi là "locked" cho đến khi P0-1 (plans.json sync) được resolve.**

---

**Auditor:** AI QA Specialist — Chief Inspector
**Ngày:** 2026-07-02
**Verdict:** ⚠️ **NỀN MÓNG TỐT, 3 P0 PHẢI RESOLVE TRƯỚC KHI LOCK SPRINT 0**
