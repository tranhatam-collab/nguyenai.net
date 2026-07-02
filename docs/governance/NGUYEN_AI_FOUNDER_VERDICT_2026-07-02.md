# Nguyen AI Ecosystem — Founder Verdict on 4-Repo Audit

- **Date:** 2026-07-02
- **Status:** BINDING GOVERNANCE DOCUMENT
- **Supersedes:** ad-hoc P0 list in `NGUYEN_AI_ECOSYSTEM_AUDIT_4_REPOS_2026-07-02.md`
- **Scope:** nguyenai.net, nguyenai-console, nguyenai-academy, nguyenai-invest, Gen1 (computer.iai.one), Gen2 (maytinhai.org)

---

## 0. Phán quyết chính thức

**CONDITIONAL PASS FOR ARCHITECTURE — NO-GO FOR PRODUCTION**

Bốn repo đã tạo được nền móng sản phẩm, build thành công và có cấu trúc tương đối đồng bộ. Tuy nhiên, chưa repo tương tác nào đủ điều kiện production vì thiếu ba năng lực nền tảng:

1. Identity và authentication thật
2. Backend và persistent data thật
3. Security gate có thể kiểm chứng

Sprint tiếp theo không được tiếp tục mở thêm trang, track, Super App hoặc tính năng trình diễn trước khi xử lý xong P0.

### Scoring

| Hạng mục | Điểm |
|---|---|
| Clone/build inspection | 9.0 |
| Repo-level issue discovery | 8.8 |
| Brand consistency | 8.3 |
| Auth discovery | 8.5 |
| Dependency findings | 8.5 |
| Academy review | 8.0 |
| Investor review | 8.5 |
| Cross-repo product architecture | 6.2 |
| Identity/tenancy design | 5.5 |
| Runtime architecture | 5.0 |
| Data/privacy architecture | 6.0 |
| Commercial/entitlement boundaries | 5.8 |
| **Tổng hợp** | **7.5/10** |

| Gate | Verdict |
|---|---|
| AUDIT REPORT | ACCEPT WITH CORRECTIONS |
| P0 FIX PLAN | REQUIRES EXPANSION |
| ADD MORE PAGES | REJECTED |
| PUBLIC DEPLOYMENT | HOLD |
| INTERNAL UI DEMO | ALLOWED |
| ACADEMY CLOSED CONTENT PILOT | ALLOWED AFTER AUTH/PERSISTENCE |
| INVESTOR PRIVATE ROOM | BLOCKED |
| FULL NGUYEN AI BETA | BLOCKED |

---

## 1. Sửa lỗi trong báo cáo Devin

### 1.1 Mâu thuẫn vulnerabilities

Báo cáo viết "All 4 repos have npm audit vulnerabilities" nhưng bảng ghi `nguyenai.net: 0`.

**Câu đúng:** Ba repo console, academy và invest còn dependency vulnerabilities; nguyenai.net không có vulnerability theo lần npm audit này.

### 1.2 Claim Gen1 chưa verify

Báo cáo nói "Actual Gen1 engine runtime — only docs and plans exist" mà không clone/verify Gen1.

**Câu đúng:** Gen 1 runtime was not independently cloned, executed, or verified as part of this four-repository audit.

### 1.3 "Không production-ready" quá rộng

Phải phân biệt: technical readiness / brand readiness / legal readiness / runtime readiness / operational readiness.

| Repo | Trạng thái chính xác hơn |
|---|---|
| nguyenai.net | Technical build pass, brand-governance hold |
| nguyenai-console | UI prototype, runtime integration blocked |
| nguyenai-academy | Content/MVP foundation, identity + persistence blocked |
| nguyenai-invest | Public scaffold, security + workflow blocked |

### 1.4 Qdrant + LlamaIndex + Mem0 không phải canonical architecture

Các công nghệ này phải là **candidate implementation stack**, không phải canonical architecture. Architecture decision phải dựa trên benchmark, không dựa trên tên công nghệ trong kế hoạch.

---

## 2. Kiến trúc đúng — Gen1 + Gen2 + Nguyen AI

### 2.1 Vai trò chuẩn

| Lớp | Domain / repo | Vai trò |
|---|---|---|
| Core technology | computer.iai.one | Gen 1 runtime và orchestration |
| Public AI Computer | maytinhai.org | Gen 2 product, plans, onboarding |
| Nguyen AI public brand | nguyenai.net | Brand vertical, public narrative, discovery |
| Nguyen AI console | app.nguyenai.net | Branded console sử dụng Gen 2 app shell + Gen 1 runtime |
| Nguyen AI Academy | academy.nguyenai.net | Branded academy surface trên Academy engine chung |
| Nguyen AI Invest | invest.nguyenai.net | Strategic review portal + private room |
| Identity | service chung | SSO, sessions, roles, organizations |
| Proof / Verify | service chung | Proof, rubric, certificate, evidence |
| Billing | Gen 2/shared service | Plans, entitlement, payment state |

### 2.2 Nguyen AI là gì

> **FOUNDER OVERRIDE 2026-07-02:** Phần này bị override bởi `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`. Xem §2.2-revised bên dưới.

**Nguyen AI = Brand layer + Vertical product configuration + Content/academy experience + Strategic distribution + Independent backend monorepo (`nguyenai.net/` với `apps/api/`, `packages/@nai/*`)**

**FOUNDER OVERRIDE 2026-07-02 (revised):** `nguyenai.net` **sở hữu backend riêng độc lập** cho vertical Nguyen AI. Không phụ thuộc runtime Gen1 (`computer.iai.one`) hay Gen2 (`maytinhai.org`) lúc chạy. Gen1 và Gen2 đóng băng (reference only, không sửa, không deploy). Được phép copy có chọn lọc package từ `maytinhai-os` (fix security khi copy).

**Bị override (không còn đúng):**
- ~~"Không nên là một runtime mới"~~ → `nguyenai.net` sở hữu runtime riêng
- ~~"Không nên là một auth system mới"~~ → `@nai/auth` build trong `nguyenai.net/packages/`
- ~~"Không nên là một billing engine mới"~~ → `@nai/billing` build trong `nguyenai.net/packages/`
- ~~"Không nên là một certificate engine mới"~~ → `@nai/evidence` build trong `nguyenai.net/packages/`

**Vẫn đúng:**
- Không fork Gen1 hay Gen2 (build fresh, reference only)
- Không thay thế brand cho `maytinhai.org` (Gen2 đóng băng, không rebrand)
- Không vertical sở hữu user database riêng ngoài `nguyenai.net` monorepo

### 2.3 Console không có backend riêng

> **FOUNDER OVERRIDE 2026-07-02:** Console (`app.nguyenai.net`) giờ là `apps/console/` trong `nguyenai.net/` monorepo. Backend đến từ `apps/api/` (Hono on Workers) + `packages/@nai/*` trong cùng monorepo. Không còn phụ thuộc Gen1/Gen2 API.

Console chỉ chịu trách nhiệm: UI, session-aware navigation, command composer, job status, approval view, usage/cost view, settings surface.

Backend phải đến từ: `apps/api/` (command, job, approval), `@nai/auth` (identity), `@nai/entitlement` (entitlement), `@nai/billing` (billing) — tất cả trong `nguyenai.net/` monorepo.

LocalStorage chỉ dùng cho: theme, dismissed UI notices, unsent draft command, harmless local preferences.

### 2.4 Academy không có engine riêng

academy.nguyenai.net là branded academy surface sử dụng cùng lesson schema, proof engine, certification service và entitlement service của academy.iai.one.

### 2.5 Invest không có identity system riêng

Dùng shared identity service + qualification workflow + expiring access + audit log.

---

## 3. Brand Lock — Quyết định chính thức

### 3.1 Quy tắc chuẩn

| Ngữ cảnh | Cách dùng được duyệt |
|---|---|
| Brand chính | Nguyen AI Computer |
| Tên tiếng Việt trong nội dung | Máy Tính AI Nguyen AI hoặc Nguyen AI Computer |
| Loại sản phẩm | máy tính AI đám mây / Cloud AI Computer |
| Hero | Máy Tính AI của thế hệ Nguyễn toàn cầu |
| Product title | Nguyen AI Computer |
| App console | Nguyen AI Computer |
| Không được dùng | "Máy Tính AI" đứng độc lập như brand riêng |

### 3.2 Brand Surface Classification Matrix

| Context | Nguyen AI Computer | Máy Tính AI | Gen1/Gen2 | Domain nền |
|---|---|---|---|---|
| Homepage | ✅ | ❌ brand label | ❌ | ❌ |
| Product page | ✅ | Chỉ mô tả thường | Có thể giải thích ngắn | ❌ |
| Docs kỹ thuật | ✅ | Có thể dùng mô tả | ✅ | ✅ |
| Public investor page | ✅ | Hạn chế | Có thể ở mức khái quát | Hạn chế |
| Private data room | ✅ | Có thể | ✅ | ✅ |
| Academy lesson | ✅ | Có thể giải thích | ✅ khi cần học thuật | Có thể dẫn nguồn |

### 3.3 Domain kỹ thuật

`computer.iai.one` và `maytinhai.org` được phép xuất hiện có kiểm soát tại:
- trang /technology/ hoặc /how-it-works/
- tài liệu kiến trúc
- docs dành cho developer
- hồ sơ đầu tư / data room
- legal/IP disclosure

Không nên xuất hiện tại:
- hero, pricing, CTA, onboarding, checkout, dashboard chính, quảng cáo, SEO title, meta description, social OG mặc định.

### 3.4 AGENTS.md replacement rule

```
## Nguyen AI Brand and Product Category Lock
- Canonical public brand: `Nguyen AI Computer`.
- Vietnamese product-category wording `Máy Tính AI` is approved.
- `Máy Tính AI` must not be used as a standalone replacement brand for
  `Nguyen AI Computer`.
- Approved Vietnamese pattern:
  `Nguyen AI Computer là Máy Tính AI đám mây chuyên biệt...`
- `computer.iai.one` and `maytinhai.org` may appear only in architecture,
  technology, documentation, legal/IP and private investor contexts.
- They must not appear in hero copy, pricing labels, checkout, primary CTA,
  default SEO metadata or the primary app identity.
- Heritage and genealogy are specialized Super Apps, not the full product.
```

Không cần xóa toàn bộ 18 lần xuất hiện. Team dev phải phân loại từng occurrence theo ngữ cảnh.

---

## 4. 10 P0 Gates (mở rộng từ 5)

| # | Gate | Mô tả |
|---|---|---|
| P0-1 | Source-of-truth và brand surface | sửa brand contradiction, tạo brand surface matrix, khóa copy scanner CI |
| P0-2 | Product boundary | Gen1/Gen2/Nguyen vertical/Academy/Invest ownership và contracts |
| P0-3 | Identity platform | dedicated identity service, OIDC, MFA/passkey, session/revoke, tenant context |
| P0-4 | Authorization and tenancy | RBAC/ABAC, data-level access, cross-domain policy, no client-only gate |
| P0-5 | Runtime control plane | command, orchestration, policy, approval, trace, tool gateway, cost/quota |
| P0-6 | Persistent data architecture | PostgreSQL, object store, vector index, event/audit, backup/restore, deletion propagation |
| P0-7 | Dependency security | advisory remediation, lockfile, SCA, CI gate |
| P0-8 | Academy entitlement separation | machine plan ≠ Academy pass, learning DB, assessment, certificate lifecycle |
| P0-9 | Investor legal/private-room gate | entity/IP review, qualification, expiring access, forms backend, audit |
| P0-10 | Release evidence | live deployment, runtime SHA, security tests, privacy tests, backup restore, critical journey, rollback |

---

## 5. Shared Identity Architecture

### 5.1 Kiến trúc

```
auth.nguyenai.net (hoặc identity.nguyenai.net)
        │
        ├── app.nguyenai.net
        ├── academy.nguyenai.net
        ├── invest.nguyenai.net/private
        └── admin.nguyenai.net
```

`app.nguyenai.net` là relying party/client, KHÔNG phải Identity Provider.

### 5.2 Bắt buộc có

- passkey hoặc magic link trước
- OAuth tùy chọn
- server-side session validation
- HttpOnly, Secure, SameSite cookie
- session expiration, rotation, revocation
- CSRF protection
- audit log
- rate limiting
- account lock/risk control
- organization membership
- role and permission
- logout toàn hệ thống

### 5.3 Role tối thiểu

```
PUBLIC, USER, MEMBER, STUDENT, FOUNDER, BUSINESS_MEMBER,
CHAPTER_MEMBER, INVESTOR_APPLICANT, QUALIFIED_INVESTOR,
REVIEWER, ADMIN, SUPER_ADMIN
```

### 5.4 Permission examples

```
machine:read, machine:operate, memory:read, memory:write,
vault:upload, vault:download, academy:learn, academy:submit,
academy:review, invest:request, invest:private-read,
invest:financial-read, invest:download, admin:user-manage,
admin:access-revoke
```

### 5.5 Audience / app permissions

| App | Roles |
|---|---|
| app.nguyenai.net | user, operator, admin |
| academy.nguyenai.net | student, mentor, reviewer, admin |
| invest.nguyenai.net/private | investor_qualified, data_room_member, admin |

### 5.6 Không dùng

- cookie chỉ cần tồn tại là hợp lệ
- localStorage làm session authority
- login giả
- client-side route guard
- mỗi repo tự tạo một auth system riêng
- shared secret viết trong source code

---

## 6. Integration Contracts (phải khóa trước khi fix UI)

### 6.1 Identity contract
```
GET  /v1/session
POST /v1/auth/magic-link
POST /v1/auth/passkey/*
POST /v1/logout
GET  /v1/me
```

### 6.2 Entitlement contract
```
GET /v1/entitlements
GET /v1/plans
GET /v1/usage
```

### 6.3 Command runtime contract
```
POST /v1/commands
GET  /v1/commands/:id
GET  /v1/jobs/:id
POST /v1/jobs/:id/cancel
```

### 6.4 Approval contract
```
GET  /v1/approvals
POST /v1/approvals/:id/approve
POST /v1/approvals/:id/reject
```

### 6.5 Academy contract
```
GET  /v1/tracks
GET  /v1/lessons/:id
POST /v1/progress
POST /v1/quiz/attempts
POST /v1/proofs
GET  /v1/certificates/:id
```

### 6.6 Investor qualification contract
```
POST /v1/investor-interest
GET  /v1/private-access
POST /v1/private-access/request
GET  /v1/data-room/documents
```

---

## 7. Sprint Order (chính thức)

### Sprint 0 — Governance Lock (không code thêm page)

Deliverables:
- `ECOSYSTEM_SOURCE_OF_TRUTH.md`
- `BRAND_SURFACE_MATRIX.md`
- `PRODUCT_BOUNDARY_CONTRACT.md`
- `IDENTITY_AND_TENANCY_RFC.md`
- `ENTITLEMENT_MODEL.md`
- `DATA_CLASSIFICATION_AND_RETENTION.md`
- `INVESTOR_ACCESS_POLICY.md`

Exit gate:
- Không còn repo nào tự định nghĩa lại bản chất Gen 1/Gen 2.
- Không còn pricing duplicated không kiểm soát.
- Không còn auth placeholder được xem như production design.

### Sprint 1 — Security and dependency stabilization

1. Fix dependency vulnerabilities (không mặc định Astro 7 cho tất cả ngay).
2. Lập migration matrix: current dependency / advisory / patched target / breaking changes / Cloudflare adapter compatibility.
3. Sửa: _headers, CORS, sitemap, hreflang, robots.
4. Thêm CI gate: build, lint, typecheck, test, dependency audit, route validation.

### Sprint 2 — Shared identity

1. Xây identity service thật.
2. Console dùng auth thật.
3. Academy dùng SSO thật.
4. Invest private room dùng role-gated access.
5. Thêm revoke + expiry + audit log.

Exit gate:
- Không cookie giả nào bypass được.
- User không có role không mở được private route.
- Session revoke có hiệu lực ngay hoặc trong TTL ngắn đã khóa.

### Sprint 3 — Gen 1 runtime integration

Console phải bỏ localStorage state nghiệp vụ. Kết nối: command submission, job status, routing result, cost estimate, approval state, evidence, error/retry status.

Exit gate: Một command thật phải đi được chuỗi:
```
Nguyen AI Console
→ Gen 2 entitlement check
→ Gen 1 runtime
→ model/tool execution
→ evidence
→ result
→ audit trail
```

### Sprint 4 — Academy persistence + proof

1. Persistent progress. 2. Quiz đúng theo track. 3. Proof submission. 4. Rubric. 5. Certificate issuance. 6. Verify route. 7. Gen 1 commands chạy từ lesson.

Exit gate: Một học viên phải đi được:
```
login → enroll → open lesson → execute command → submit proof
→ review → completion → certificate → public verify
```

### Sprint 5 — Investor workflow

1. Public request form gửi thật. 2. Qualification state. 3. Invitation. 4. Expiring access. 5. Private data room. 6. Audit log. 7. Revoke. 8. Disclosure version tracking.

Exit gate:
- Anonymous user không đọc được private content.
- URL bị chia sẻ lại không đủ để truy cập.
- Mọi lần mở tài liệu đều có access event.

### Sprint 6 — Memory/RAG pilot (chỉ sau identity, tenancy, data classification, policy)

- PostgreSQL metadata, object store, Qdrant derived index, ingestion security, one Knowledge pilot, no global family index yet.

### Sprint 7 — Closed beta

10–30 invited users, one or two Super Apps, cost tracking, abuse tests, deletion/export, incident process.

---

## 8. Release Waves

Không phát hành đồng thời cả bốn repo.

| Wave | Repo | Điều kiện |
|---|---|---|
| 1 | nguyenai.net | Brand Lock sửa, live crawl pass, Lighthouse pass, a11y pass, legal/contact verified |
| 2 | invest.nguyenai.net public | forms thật, disclosure đúng, hreflang/sitemap đúng, không private data, private routes chặn server-side |
| 3 | academy.nguyenai.net beta | auth, progress DB, quiz đúng, certificate registry, vulnerability high = 0 |
| 4 | app.nguyenai.net private beta | real auth, real backend, session validation, command persistence, machine isolation, audit, usage/cost tracking |

Console là sản phẩm có rủi ro lớn nhất, phát hành sau cùng.

---

## 9. Academy Domain Decision

| Domain | Vai trò |
|---|---|
| academy.nguyenai.net | Product-facing Academy portal cho người dùng Nguyen AI |
| academy.iai.one | Academy platform cấp hệ sinh thái: credential engine, curriculum infrastructure, certification registry, shared learning platform |

Kiến trúc:
```
academy.nguyenai.net  (Nguyen AI branded learning experience)
        ↓
academy.iai.one  (Shared Academy engine and credential infrastructure)
```

---

## 10. Entitlement Separation

```
AI COMPUTER SUBSCRIPTION ≠ ACADEMY PASS ≠ CERTIFICATION FEE
≠ SME DEPLOYMENT ≠ MARKETPLACE PURCHASE
```

Một gói AI Computer có thể kèm một số bài Academy, nhưng không đồng nghĩa tự động sở hữu toàn bộ Academy.

---

## 11. Pricing Source of Truth

Tạo catalog dùng chung:
```
packages/product-catalog/
├── plans.json
├── entitlements.json
├── limits.json
├── prices.json
├── academy-access.json
└── catalog.schema.json
```

Các repo chỉ được render từ catalog này, không hardcode giá độc lập.

---

## 12. Console Backend Schema (tối thiểu)

```
users, sessions, organizations, memberships, machines,
machine_entitlements, commands, command_runs, agent_runs,
model_routes, workflows, approvals, memories, vault_objects,
evidence_records, usage_events, audit_logs
```

---

## 13. Certificate ID Format

Không dùng `Math.random()`. Dùng:
```
NGUYENAI-{PROGRAM}-{YEAR}-{SEQUENCE}-{CHECKSUM}
```
Ví dụ: `NGUYENAI-OPERATOR-2026-000124-8F2C`

Chứng nhận phải có: credential record, holder, program, issue date, evidence, status, revoked state, public verify URL, audit log.

---

## 14. Investor Access Object

```
grant_id:
user_id:
investor_profile_id:
room_scope:
document_scope:
issued_at:
expires_at:
revoked_at:
approved_by:
qualification_version:
disclosure_version:
watermark_id:
```

Flow:
```
Unauthenticated → Request access → Email verification → Qualification review
→ NDA/consent → Access grant with expiry → Scoped private room
→ Audit every read/download
```

---

## 15. Data/Memory Architecture Principles

### 15.1 Vector store
- Standard tier: shared collections phân vùng bằng tenant_id, user_id, computer_instance_id, data_class, region, privacy_level, source_id. Bắt buộc filter server-side.
- Enterprise/Dedicated: namespace riêng, collection riêng, database/region riêng, customer-managed key.
- Không để client truyền filter user_id tùy ý.

### 15.2 Roots privacy
Tách: `roots_private_records`, `roots_consent_shared`, `roots_public_sources`, `roots_reference_index`.
Chỉ public_sources và dữ liệu đã có consent cụ thể mới được search liên tenant.

### 15.3 Retention
Không Infinity mặc định. Cần: retention theo loại dữ liệu, retention theo purpose, user-configurable memory, expiration, "do not remember" mode, review queue, export, selective deletion, propagation deletion sang vector index/cache/derived summary/backup.

### 15.4 Prompt injection
Data Vault ingestion và RAG phải coi tài liệu tải lên là untrusted content. Cần: content sanitization, active-content removal, malware scan, prompt-injection classifier, source trust score, tool execution isolation, "retrieved content cannot override system policy", URL fetch allowlist, SSRF protection, citation grounding, chunk-level ACL.

### 15.5 Source of truth
- PostgreSQL = canonical metadata, ACL, source records
- Qdrant = derived retrieval index
- Object store = canonical file bytes
- Audit store = immutable events

Không dual-write embeddings sang cả pgvector và Qdrant ở MVP nếu chưa có nhu cầu rõ.

---

## 16. Source of Truth packages

```
packages/
  brand-contract
  identity-contract
  pricing-contract
  entitlement-contract
  academy-schema
  proof-schema
  investor-access-schema
  ui-tokens
```

Shared chỉ: tokens, typography, buttons, form primitives, legal footer, analytics helpers. Không ép mọi site dùng cùng một layout.

---

## 17. Bằng chứng bắt buộc sau sprint

Team dev không chỉ báo "đã sửa". Cần cung cấp:
- HEAD của từng repo
- danh sách file thay đổi
- npm ci, npm run build, npm audit
- test logs
- auth flow screenshots
- cookie attributes
- private-route unauthenticated test
- expired-access test
- revoked-access test
- permission matrix
- database migrations
- API contract
- live smoke test
- security headers
- sitemap
- hreflang crawl
- release evidence packet

---

## 18. Chỉ thị cho team dev

Không tiếp tục thêm trang hoặc feature trước khi hoàn thành:

1. Nguyen AI là brand/product vertical, không phải engine thứ ba.
2. Gen 1 là runtime duy nhất.
3. Gen 2 là product/account/entitlement layer dùng chung.
4. Console không có backend riêng.
5. Academy không có progress/certificate engine riêng.
6. Invest không có identity system riêng.
7. Pricing chỉ có một source of truth.
8. Public/private boundaries được enforce server-side.
9. Mọi claim "Gen 1 đã chạy" hoặc "chưa có runtime" phải đi kèm bằng chứng repo/runtime.
10. Chỉ đánh dấu production-ready sau test live, không chỉ sau npm run build.

---

## Kết luận

Audit Devin có giá trị và đã phát hiện đúng nhiều lỗi quan trọng, nhưng kế hoạch sửa hiện tại vẫn mang tư duy bốn repo độc lập.

Hướng đúng là: **Nguyen AI phải được hợp nhất với Gen 1 và Gen 2 ở tầng kiến trúc, dữ liệu, identity, entitlement, runtime, proof và investor access — trong khi vẫn giữ bốn giao diện thương hiệu riêng theo mục đích.**

Sprint tiếp theo phải bắt đầu bằng **Architecture Lock + Shared Contracts + Identity**, sau đó mới nối runtime, Academy và private room.
