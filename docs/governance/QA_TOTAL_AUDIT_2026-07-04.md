# QA TOTAL AUDIT — Nguyen AI Computer (nguyenai.net)

> **Auditor:** AI QA Specialist — Chief Inspector
> **Ngày:** 2026-07-04
> **Scope:** TOTAL — 7 apps × 49 packages × 110 endpoints × 108 pages × 30+ governance docs
> **Phương pháp:** Đọc governance binding docs, đối chiếu code thực tế (HEAD), tìm logic gaps, vẽ bản đồ hệ thống
> **Lưu ý:** Working tree corrupt lần 3 (142 files differ from HEAD). Audit dùng `git show HEAD:` cho mọi file.

---

## TÓM TẮT EXECUTIVE

| Hạng mục | Con số | Verdict |
|---|---|---|
| Governance docs binding | 30+ docs, 50+ forbidden rules | ✅ Exist |
| Apps | 7 (web, console, edu, invest, admin, auth, api) | ✅ |
| Packages | 49 @nai/* + 1 product-catalog | ⚠️ 17 real, 33 stubs |
| API endpoints | 110 (35 main + 60 scholarship + 15 auth) | ⚠️ Missing 25+ contract endpoints |
| Frontend pages | 108 (54 web + 11 console + 25 edu + 43 invest) | ⚠️ 12 violations |
| Scholarship flow | 8 sprints, 60 endpoints, 101 tests | ✅ Structure solid |
| Brand naming lock | 21 banned patterns, audit script | ⚠️ Not wired to CI |
| Clone contamination | 6 files in HEAD | ⚠️ In architecture docs (allowed) |
| Sprint 0 Exit Gate | NOT PASSED | 🔴 |

**Code structure is AMBITIOUS but has LOGIC GAPS across governance contracts.**

---

## 🔴 P0 — CRITICAL LOGIC GAPS (Blockers — buộc team dev fix từ đầu)

### P0-1: 25+ Missing Contract Endpoints

**Contract:** IDENTITY_AND_TENANCY_RFC §6, ENTITLEMENT_API_RFC §3, PROOF_AND_CERTIFICATION_RFC §3

| Missing Set | Required | Actual | Gap |
|---|---|---|---|
| Identity (magic-link, passkey, org, sessions, me/delete) | 14 | 5 | 9 missing |
| Proof/Certification (proofs, certificates, review queue) | 8 | 0 | 8 missing |
| Entitlement write (service-auth grant/revoke/recalculate) | 3 | 0 | 3 missing |
| Investor private room (document download, audit) | 5+ | 0 | 5+ missing |

**Impact:** Identity lifecycle incomplete (no account deletion = GDPR violation). No proof/certification system (Academy can't issue certificates). No service-auth entitlement writes (billing can't grant entitlements programmatically).

**Action:** Team dev phải implement từng set theo contract, KHÔNG được invent endpoints ngoài contract.

### P0-2: No Idempotency Keys on Write Endpoints

**Contract:** ENTITLEMENT_API_RFC §5 — "Without idempotency_key, write endpoints return 400"

**Reality:** 0/35 write endpoints require idempotency_key.

**Impact:** Duplicate writes on retry (double-charge, double-grant, double-award).

**Action:** Add `idempotency_key` field to ALL write endpoints, return 400 if missing.

### P0-3: Missing Audit Logs on 30+ Write Operations

**Contract:** ENTITLEMENT_API_RFC §6, INVESTOR_ACCESS_POLICY §8

**Reality:** Only 5 endpoints have audit logs (command, memory, payment). 30+ scholarship write endpoints + approval endpoints have NO audit log.

**Impact:** No audit trail for scholarship decisions, forum moderation, entitlement changes. Violates governance.

**Action:** Add `audit()` call to EVERY write operation.

### P0-4: Investor Private Pages Have NO Server-Side Auth

**Contract:** INVESTOR_ACCESS_POLICY §2 — "noindex, robots.txt, URL obscurity are NOT access control"

**Reality:** apps/invest has NO middleware.ts. All 10 private pages (`/private/*`) rely on noindex only. Anyone who knows URL can access cap table, financial model, contracts.

**Impact:** Legal compliance violation. Cap table/financial data exposed to anyone with URL.

**Action:** Create `apps/invest/src/middleware.ts` with server-side auth + `invest:private-read` permission check + audit log.

### P0-5: Console Middleware is Placeholder (Cookie-Only Auth)

**Contract:** IDENTITY_AND_TENANCY_RFC §2.4 — "Cookie existence alone treated as authenticated — FORBIDDEN"

**Reality:** `apps/console/src/middleware.ts` line 7: "TODO: Replace placeholder session check with real auth logic". Only checks cookie existence, does NOT validate with auth.nguyenai.net.

**Action:** Replace placeholder with real session validation via auth service.

### P0-6: localStorage Used for Business State (FORBIDDEN)

**Contract:** IDENTITY_AND_TENANCY_RFC §2.4, AGENTS.md

**Reality:**
- `apps/console/src/lib/storage.ts` — localStorage helper used by 4 React components
- `apps/edu/src/components/react/ProgressTracker.tsx` — learning progress in localStorage

**Impact:** Business state (commands, history, learning progress) can be manipulated client-side.

**Action:** Replace localStorage with server-side API calls. localStorage only for UI preferences.

### P0-7: Missing Email Template #5 (Báo cáo tiến độ)

**Contract:** EDU_MASTER_PLAN_V4 §XXVII — 5 email templates required

**Reality:** Code has 5 templates but WRONG set:
- ✅ scholarship_application_submitted (→ #1 Thông báo hồ sơ mới)
- ✅ scholarship_review_request (→ #2 Hồ sơ đủ điều kiện xét)
- ✅ scholarship_cosponsorship (→ #3 Hồ sơ cần đồng tài trợ)
- ✅ scholarship_decision (→ #4 Quyết định)
- ❌ scholarship_entitlement_granted (NOT in V4 contract — extra)
- ❌ MISSING: scholarship_progress (→ #5 Báo cáo tiến độ)

**Impact:** No progress report email sent to investors after scholarship awarded. Violates V4 contract.

**Action:** Add `scholarship_progress` template. Send after each learning milestone or monthly.

### P0-8: No Investor Pre-Email Checks (Opt-in, Expiry, Suspended)

**Contract:** EDU_MASTER_PLAN_V4 §XXVII — "Nhà đầu tư chỉ nhận email khi đã xác minh, có vai trò hợp lệ, đã bật nhận email, chưa hết hạn quyền, không bị đình chỉ"

**Reality:** `createReview()` sends email to investor WITHOUT checking:
- Investor access grant valid (not expired) ❌
- Investor not suspended ❌
- Investor opted in to email ❌

**Action:** Add pre-send checks: verify access grant, check suspended status, check opt-in preference.

---

## ⚠️ P1 — Logic Gaps (Should fix before production)

### P1-1: Pricing Defined in @nai/contracts (FORBIDDEN)

**Contract:** PRICING_CATALOG_OWNERSHIP.md — "Copying catalog files by hand is FORBIDDEN"

**Reality:** `@nai/contracts/src/tier.ts` defines `TIER_CONFIGS` with hardcoded pricing (basic=999, pro=2999) that CONFLICTS with `@nai/product-catalog` (nguyen-personal=299K VND).

**Action:** Remove pricing from @nai/contracts. Read from @nai/product-catalog only.

### P1-2: 15 Data Classes Not Defined in Code

**Contract:** DATA_CLASSIFICATION_AND_RETENTION.md — 15 data classes with retention schedule

**Reality:** No package defines the 15 data classes (account, session, organization, machine_state, evidence, academy_progress, proof, certificate, investor_profile, data_room_document, audit_log, billing, preference, fact, semantic, procedural).

**Action:** Define data classes + retention schedule in @nai/audit or @nai/policy-engine.

### P1-3: 4 Entitlement Categories Missing

**Contract:** ENTITLEMENT_MODEL.md — 6 categories (machine, academy, cert, sme, marketplace, investor)

**Reality:** Only 2 categories defined (machine, academy). Missing: cert, sme, marketplace, investor.

**Action:** Add 4 missing entitlement categories to @nai/product-catalog/entitlements.json.

### P1-4: 2 Commercial Objects Missing

**Contract:** PRODUCT_BOUNDARY_CONTRACT.md — 5 objects

**Reality:** 3/5 present (machine.plan, academy.pass, cert.fee). Missing: sme.deployment, marketplace.purchase.

**Action:** Add 2 missing commercial objects to prices.json (even if "future — not live").

### P1-5: @nai/proof Package Does NOT Exist

**Contract:** PROOF_AND_CERTIFICATION_RFC.md — certificate ID format `NGAI-{PROGRAM}-{YEAR}-{SEQUENCE}-{CHECKSUM}` with SHA-256

**Reality:** No @nai/proof package. No certificate ID generation logic. No SHA-256 checksum.

**Action:** Create @nai/proof package with certificate ID generation per contract.

### P1-6: 12 Policy Routes Don't Match EDU_MASTER_PLAN_V4

**Contract:** V4 specifies routes like `docs.nguyenai.net/scholarships/program-terms`

**Reality:** Routes are `edu.nguyenai.net/scholarship/policies/[id]` (generic numbered IDs, wrong domain, wrong path structure).

**Action:** Either move policy pages to docs app, or update V4 contract to match actual routes.

### P1-7: Edu App is Vietnamese-Only (No Bilingual)

**Contract:** AGENTS.md — bilingual routes (VI + EN) with hreflang

**Reality:** apps/edu has `<html lang="vi">` hardcoded, no English pages, hreflang references `/en` but no EN pages exist.

**Action:** Add English versions of all 25 edu pages, or update contract to allow edu VI-only.

### P1-8: No Rate Limiting on Main API (34 endpoints)

**Contract:** ENTITLEMENT_API_RFC §3.1 — 60 req/min per IP

**Reality:** Scholarship routes have rate limiting. Main API (34 endpoints) has NO rate limiting.

**Action:** Add rate limiting middleware to main API.

### P1-9: Brand Audit Script NOT Wired to CI

**Claim:** "CI Gate — fails build if banned brand names are found"

**Reality:** `tools/audit-brand-naming-lock.sh` exists but is NOT referenced in `.github/workflows/deploy.yml`.

**Action:** Add brand audit step to CI workflow.

### P1-10: Investor Disclosure Wording NOT Approved

**Contract:** INVESTOR_ACCESS_POLICY §6.1-6.2

**Reality:** `apps/invest/src/components/Disclosure.astro` uses non-approved wording ("Financial projections are hypotheses..." instead of "Thông tin trên website không cấu thành lời chào bán chứng khoán...").

**Action:** Replace with approved disclosure wording per contract.

---

## 📊 MAP HỆ THỐNG (Bản đồ logic)

### Architecture Layers
```
Layer 1: computer.iai.one (Gen1 — FROZEN, reference only)
Layer 2: maytinhai.org (Gen2 — FROZEN, reference only)
Layer 3: nguyenai.net (Nguyen AI — independent backend)
Layer 4: edu.nguyenai.net (Academy + Scholarship)
```

### Subdomains (9)
| Subdomain | App | Status |
|---|---|---|
| nguyenai.net | apps/web | ✅ 54 pages, bilingual |
| app.nguyenai.net | apps/console | ⚠️ 11 pages, placeholder auth |
| edu.nguyenai.net | apps/edu | ⚠️ 25 pages, VI-only |
| invest.nguyenai.net | apps/invest | 🔴 43 pages, private NO auth |
| docs.nguyenai.net | (Phase 2) | ❌ Not built |
| status.nguyenai.net | (Phase 2) | ❌ Not built |
| admin.nguyenai.net | apps/admin | ❌ Phase 2 placeholder |
| api.nguyenai.net | apps/api | ✅ 95 endpoints |
| auth.nguyenai.net | apps/auth | ✅ 15 endpoints |

### Package Status (50)
- **Real (17):** approval, audit, auth, billing, compass, conductor, contracts, email, entitlement, evidence, harness, policy-engine, policy-fga, prism, relic, runtime-sdk, scholarship
- **Stubs (33):** wrappers for external tools (aqueduct, armada, artisan, atlas, beacon, bulwark, etc.)
- **product-catalog:** Real, contains plans.json + entitlements.json + prices.json + models.json

### Endpoint Inventory (110 total)
| Worker | Endpoints | Contract Required | Gap |
|---|---|---|---|
| Main API | 35 | 35+ | Missing rate limiting, audit logs |
| Scholarship | 60 | 58 | +2 (export, retention) ✅ |
| Auth | 15 | 14+ | Missing 9 identity endpoints |
| Proof/Cert | 0 | 8 | 🔴 All missing |
| Entitlement write | 0 | 3 | 🔴 All missing |
| Investor private | 0 | 5+ | 🔴 All missing |

### Scholarship Flow (end-to-end)
```
apply → verify(email/phone/identity) → wish → submit
  → investor review → vote → sponsor → council decision
  → award → entitlement → cohort → learning paths
  → suspend → restore → revoke
  → waitlist → offer → withdraw
  → decline
  → export data (GDPR) → retention sweep
```
**Flow is COMPLETE** (22 E2E steps, 43 assertions PASS).
**Gap:** No progress report email after award (P0-7).

### Email Flow
| # | Template | Trigger | Recipient | Status |
|---|---|---|---|---|
| 1 | application_submitted | submitApplication | applicant | ✅ |
| 2 | review_request | createReview | investor | ⚠️ No pre-checks |
| 3 | cosponsorship | createSponsorship | applicant | ✅ |
| 4 | decision | awardScholarship/decline | applicant | ✅ |
| 5 | entitlement_granted | grantEntitlement | applicant | ✅ (extra, not in V4) |
| 6 | progress_report | (after milestones) | investor | ❌ MISSING |

### Forbidden Rules Compliance
| Rule | Status |
|---|---|
| No agent loop in repos | ✅ |
| No pricing in repos (except product-catalog) | ❌ @nai/contracts has pricing |
| No session issuance (except auth) | ✅ |
| No certificate ID generation (except proof) | ✅ (no proof package = no violation) |
| No browser model provider calls | ✅ |
| No localStorage business state | ❌ Console + Edu |
| No investor qualification redefinition | ✅ |
| No clone contamination in hero/pricing/CTA | ✅ (only in architecture docs) |
| Cookie existence = auth | ❌ Console placeholder |
| Client-side route guard as only gate | ❌ Invest private pages |

---

## 📋 DANH SÁCH FIX BUỘC TEAM DEV LÀM TỪ ĐẦU

### Phase 1: P0 Critical (Must fix before any production deploy)
1. Implement 9 missing identity endpoints (magic-link, passkey, org, sessions, me/delete)
2. Implement 8 proof/certification endpoints
3. Implement 3 service-auth entitlement write endpoints
4. Add idempotency_key to ALL 35 write endpoints
5. Add audit logs to 30+ write operations
6. Create invest middleware with server-side auth + audit
7. Replace console placeholder middleware with real auth
8. Remove localStorage business state (console + edu)
9. Add scholarship_progress email template + send logic
10. Add investor pre-email checks (access, suspended, opt-in)

### Phase 2: P1 High (Should fix before production)
11. Remove pricing from @nai/contracts
12. Define 15 data classes + retention schedule
13. Add 4 missing entitlement categories
14. Add 2 missing commercial objects
15. Create @nai/proof package with certificate ID format
16. Fix 12 policy routes to match V4 contract (or update contract)
17. Add English versions of edu pages (or update contract)
18. Add rate limiting to main API
19. Wire brand audit script to CI
20. Replace investor disclosure with approved wording

---

## QUY TẮC QA BINDING CHO TEAM DEV

(Xem file riêng: `docs/governance/QA_BINDING_RULES_FOR_DEV_TEAM.md`)

---

**Auditor:** AI QA Specialist — Chief Inspector
**Ngày:** 2026-07-04
**Method:** Independent audit — read 30+ governance docs, verified HEAD content, traced logic across 7 apps + 49 packages + 110 endpoints
