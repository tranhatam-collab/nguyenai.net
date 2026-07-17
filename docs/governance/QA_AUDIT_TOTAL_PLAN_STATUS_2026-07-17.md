# QA Audit — Toàn bộ kế hoạch dự án nguyenai.net

**Ngày audit:** 2026-07-17  
**Phạm vi:** đối chiếu kế hoạch master + governance locks + backlog Edu/Auth/AI Provider với trạng thái repo + evidence tươi  
**Verdict phát hành:** **HOLD / NO full commercial GO**  
**Tính ràng buộc:** báo cáo trạng thái; không thay thế các plan BINDING mới hơn nếu Founder khóa decision khác sau ngày này.

---

## 0. SOURCE_VERIFICATION

| Field | Value |
|---|---|
| Repo | `nguyenai.net` |
| Branch | `main` |
| HEAD (verify tươi) | `5a2106374aca1cfe8ac88762fbd9137942303101` |
| Working tree | clean tại thời điểm audit |
| Cloudflare prod account (canonical) | `62d57eaa548617aeecac766e5a1cb98e` (Anhhatam) |
| Method | Doc map (Binding hierarchy) + gate scripts tươi + production HTTP smoke + production secret-name audit |
| Không chạy trong phiên này | Full `pnpm typecheck` / `pnpm build` / `pnpm test` / full `pnpm audit:all` end-to-end (chỉ chạy subset gates) |

### Evidence tươi (2026-07-17)

| Check | Result | Note |
|---|---|---|
| `tools/production-smoke.sh` | **11/11 PASS** | Health/surfaces only — không phải journey E2E |
| `pnpm audit:independence` | PASS | Independence lock code/CI |
| `pnpm audit:ai-provider` | PASS | Code path: direct vendor removed; gate static |
| `pnpm audit:secret-governance` | PASS | Static inventory/rules |
| `pnpm audit:edu-plan` | PASS | Catalog/claim lock — không chứng minh Edu runtime E2E |
| `pnpm audit:brand` | PASS | Naming lock |
| `pnpm audit:accessibility` | PASS (shell gate) | 0 violations theo script hiện tại; **không** = full WCAG/manual |
| `pnpm audit:security-p0` | PASS | Static P0 patterns |
| `pnpm audit:secrets:production` | **FAIL** | `JWT_SECRET` thừa trên auth+api; **không có payment secret group hoàn chỉnh** |
| OAuth begin live | HTTP 200 + Google authorize URL | Probe redirect URI/client_id — **không** = repeated-login E2E |
| `/v1/chat` live (no session) | HTTP 401 unauthorized | Chưa chứng minh provider gateway E2E |
| `edu.nguyenai.net/verify` | HTTP 308 | Product certificate verify vẫn chưa đóng theo plan Edu |

Log: `.audit-evidence/prod-smoke-2026-07-17.log`, `.audit-evidence/qa-plan-audit-gates-2026-07-17.log`, `.audit-evidence/secrets-prod-2026-07-17.log`, `.audit-evidence/a11y-2026-07-17.log`

---

## 1. PHÁN QUYẾT ĐỎ TRƯỚC

**Không được claim:** “production-ready”, “all green”, “P0=0”, “go-live 10/10”, “A-to-Z completed”, “AI runtime live”, “commerce live”.

### Vì sao HOLD

1. **Release authority hiện tại = HOLD** — `JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md` vẫn là BINDING cho security/auth/payment/deploy/release.
2. **Payment E2E chưa có** — production secret-name audit FAIL: không có commerce secret group hoàn chỉnh.
3. **Authz E2E chưa đóng** — OAuth begin live ≠ signup/verify/login/logout/revoke/role/tenant E2E có evidence gắn deployment.
4. **AI Provider cutover chưa đóng** — code gate `audit:ai-provider` PASS và `AI_PROVIDER_API_KEY` đã xuất hiện trên API; thiếu Team A contract exit + Team B staging/prod chat E2E + Founder cutover sign-off.
5. **Edu Final Exit Gate chưa đạt** — backlog P0 PARTIAL/OPEN (certificate placeholder, scholarship process, entitlement Academy, 5 cấp, content thiếu).
6. **Sprint 0 governance lock vẫn OPEN** trong master/go-live docs; Founder sign-off commercial GO chưa có.
7. **Observability / backup-restore / controlled launch** — NOT VERIFIED theo ma trận A-to-Z.
8. **QA_LOOP_LOG stale** — entry cuối 2026-07-10 (#21 HAS FAILURES). Không có loop xanh chứng minh HEAD hôm nay.

### Claim cũ bị đánh dấu historical / mâu thuẫn

| Claim | Nguồn | Phán quyết 2026-07-17 |
|---|---|---|
| PARTIAL GO-LIVE + P0=0 + P1=0 | `FINAL_QA_REPORT_2026-07-13.md`, `SIGN_OFF_2026-07-13.md` | **HISTORICAL** — chính file đã ghi HOLD supersedes |
| Accessibility 0 / 10/10 | Master 07-10, go-live 10-point | Shell gate hôm nay PASS; manual/axe chưa; Edu backlog từng ghi 107 — **không claim WCAG done** |
| Cần `OPENAI_*` / DirectLLM cho chat | Master / checklist cũ | **CONTRADICTED** bởi QD-2026-07-16-01 |
| Gen1 adapter Phase 1 complete | `REPO_STRUCTURE_AND_MASTER_PLAN.md` | **STALE** vs Independence + AI Provider |
| 61/62 work items done | Binding Verdict 07-06 | **MISLEADING** vs checklist 0/469 + release HOLD |
| `JWT_SECRET` = auth ready | FINAL_QA 07-13 | **WRONG model** — opaque session + `AUTH_SECRET`; `JWT_SECRET` thừa phải gỡ |

---

## 2. HIERARCHY KẾ HOẠCH (cái gì thắng cái gì)

```text
FOUNDER BINDING (mới hơn thắng khi xung đột)
├── QD-2026-07-16-01 AI Provider Single Source (aiagent.iai.one)
│   ├── AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md
│   └── AI_PROVIDER_TWO_TEAM_BUILD_PLAN_2026-07-16.md
├── JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md  ← HOLD release
├── Education lock 2026-07-14
│   ├── YOUTH_FUTURE_MASTER_CHARTER.md
│   ├── NGUOI_TRE_LAM_PRODUCT_CATALOG_2026-07-14.md
│   ├── KE_HOACH_TONG_BUILD_NGUOI_TRE_LAM_V2.md
│   └── EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md
├── Brand UI tokens + sync commit 2026-07-09
├── QD-2026-07-08-01 Independence (provider routing superseded 07-16)
├── FOUNDER BRAND NAMING LOCK 2026-07-04
└── Sprint 0 governance locks (ECOSYSTEM_SOT, PRODUCT_BOUNDARY, …)

OPERATIONAL / HISTORICAL (không override BINDING)
├── GO_LIVE_10_POINT_FRAMEWORK_2026-07-10.md
├── MASTER_PROJECT_PLAN_2026-07-07.md (còn Part Gen2 + secret wording stale)
├── FINAL_* / SIGN_OFF 2026-07-11…13 → historical
├── QA_AUDIT_TOTAL_PLAN_2026-07-02.md (doc-consistency snapshot)
└── DEV_EXECUTION_CHECKLIST.md (469 unchecked — spec backlog, không phải ledger sống)
```

---

## 3. BẢN ĐỒ KẾ HOẠCH → TRẠNG THÁI

| Domain | Kế hoạch chính | Trạng thái 2026-07-17 | Ghi chú |
|---|---|---|---|
| Sprint 0 governance | ECOSYSTEM_SOT + exit gate | **OPEN** | Chưa Founder lock đầy đủ |
| Independence | Independence Plan Phase 0 | **PASS (code)** | `audit:independence` PASS; Phase 1–4 runtime còn mở |
| Brand / SEO surfaces | Naming + UI tokens + bilingual audits | **PARTIAL PASS** | Brand gate PASS; live SEO/indexation không re-audit full |
| Auth session | Opaque D1 + `AUTH_SECRET` | **PARTIAL** | Model đúng; Authz E2E chưa |
| OAuth Google | Auth worker | **PARTIAL** | Secrets set; begin URL live; repeated E2E thiếu |
| Email | mail gateway / Resend fallback | **PARTIAL** | `RESEND_API_KEY` có; MAIL gateway primary optional |
| Payments / entitlement | AZ-P0-07 | **BLOCKED** | Secret group commerce thiếu; webhook/refund E2E thiếu |
| Chat / AI runtime | Team A → Team B | **PARTIAL code / BLOCKED product** | Static ai-provider PASS; `AI_PROVIDER_API_KEY` name có; thiếu contract E2E cutover |
| Web public | apps/web | **LIVE HTTP** | Smoke 200 — không = commercial GO |
| Console | apps/console | **LIVE HTTP** | 302 login — journey chưa E2E |
| Edu / Người Trẻ Làm | V2 + backlog P0–P2 | **BLOCKED release** | Plan lock PASS; product journeys / cert / content chưa đóng |
| Invest | Investor policy + legal | **CONDITIONAL** | HTTP live vs “không deploy trước legal” — Founder phải quyết |
| Deploy / CI | deploy.yml + CF Pages/Workers | **PARTIAL** | Manual production gate claimed in secret-governance; Founder env reviewer cần xác nhận |
| QA loop | tools/qa-loop.sh | **STALE** | Không có entry sau 2026-07-10 |
| Monitoring / DR | A-to-Z 17–18 | **NOT VERIFIED** | |
| Controlled launch | A-to-Z 21 | **NOT IMPLEMENTED** | Surfaces đã public trước cohort plan |

---

## 4. MA TRẬN A-TO-Z (tóm tắt 23 giai đoạn)

Nguồn: JWT plan 2026-07-15, đối chiếu evidence 2026-07-17.

| # | Giai đoạn | 15/7 | 17/7 delta | Status |
|---|---|---|---|---|
| 0 | Governance/SOT | PARTIAL | Docs nhiều; authority phân tán | PARTIAL |
| 1 | Product definition | PARTIAL | Catalog Edu locked | PARTIAL |
| 2 | Architecture | PARTIAL | AI Provider decision + independence | PARTIAL |
| 3 | Security foundation | FAIL | security-p0 PASS; secrets prod FAIL (`JWT_SECRET`) | FAIL |
| 4 | Data governance | PARTIAL | D1 có; restore drill thiếu | PARTIAL |
| 5 | Design/UX | PARTIAL | shell a11y PASS; manual thiếu | PARTIAL |
| 6 | Content/bilingual | PARTIAL | Edu content/curriculum thiếu | PARTIAL |
| 7 | Dev workflow | FAIL→? | Manual deploy gate trong governance audit PASS static | PARTIAL* |
| 8 | Code quality | FAIL | Full typecheck/test/audit:all chưa re-run HEAD | NOT RE-VERIFIED |
| 9 | API/integration | FAIL | Provider client code tiến bộ; payment/provider E2E thiếu | FAIL |
| 10 | Database | PARTIAL | Migrations; rollback/restore thiếu | PARTIAL |
| 11 | Auth/Authz E2E | FAIL | OAuth begin only | FAIL |
| 12 | Frontend QA | FAIL | Smoke ≠ browser matrix | FAIL |
| 13 | Accessibility | FAIL | Shell gate PASS; axe/manual chưa | PARTIAL |
| 14 | SEO | PARTIAL | Không full re-run | PARTIAL |
| 15 | Performance | NOT VERIFIED | — | NOT VERIFIED |
| 16 | Infra/deploy | PARTIAL | 6 surfaces live | PARTIAL |
| 17 | Observability | NOT VERIFIED | — | NOT VERIFIED |
| 18 | Backup/restore | FAIL | Export lịch sử ≠ drill | FAIL |
| 19 | Legal/compliance | PARTIAL | Invest/entity/payment | PARTIAL |
| 20 | Release readiness | FAIL | HOLD | FAIL |
| 21 | Controlled launch | NOT IMPLEMENTED | — | NOT IMPLEMENTED |
| 22 | Operations | PARTIAL | Runbooks thiếu drill | PARTIAL |

\* Cần xác nhận GitHub `production` environment reviewer thật sự bật.

---

## 5. BACKLOG P0 CÒN MỞ (hợp nhất)

### 5.1 Release / Auth / Secret / Deploy (JWT AZ-P0)

| ID | Việc | Owner | Block vì sao |
|---|---|---|---|
| AZ-P0-03 | Gỡ `JWT_SECRET` thừa khỏi auth+api | Founder/Ops | Secret-name audit FAIL hôm nay |
| AZ-P0-04 | Payment secret group hoàn chỉnh + AI Provider ops | Founder/Ops | Commerce group thiếu; AI key name có ≠ E2E |
| AZ-P0-06 | Auth/Authz production E2E đầy đủ | Auth/QA | Chưa có evidence packet |
| AZ-P0-07 | Checkout → webhook ký → entitlement → refund/replay | Payment/Legal/QA | Chưa merchant + E2E |
| AZ-P0-08 | Trivy/Grype fail-closed chứng minh bằng CI run | DevOps | Cần CI evidence trên HEAD |
| AZ-P0-09 | Manual production deploy + reviewer | DevOps/Founder | Xác nhận GitHub env |
| AZ-P0-10 | Release packet đúng SHA `5a21063…` | Release/QA | Chưa |
| AZ-P0-02 | OAuth D1 repeated login/link E2E | Auth | Probe begin ≠ E2E |
| AZ-P0-05 | A11y manual + critical routes | Frontend/QA | Shell PASS chưa đủ |

### 5.2 AI Provider (Team A → Team B)

| Team | Status | Block |
|---|---|---|
| Team A exit gate | **Chưa đóng trong evidence này** | Contract versioned, staging URL/key, model map, privacy review, owner sign-off |
| Team B code | **Tiến bộ** | Commits xóa DirectLLM; `audit:ai-provider` PASS; `@nai/ai-provider-client` |
| Team B exit | **Chưa** | Staging/prod chat E2E, usage/evidence reconciliation, Founder cutover |

### 5.3 Edu / Người Trẻ Làm (P0 backlog)

| P0 | Status (per 07-14 backlog) | Còn thiếu |
|---|---|---|
| P0-01…05, 10–11 | PARTIAL | Sign-off, form/API/DB E2E, live claim audit |
| P0-13 a11y | OPEN trong backlog | Shell gate hiện PASS — **cập nhật backlog khi Founder chấp nhận gate mới**; vẫn cần manual |
| Certificate verify | OPEN | Placeholder / không phải email verify |
| 5 cấp + 60 bài + 25 E2E flows | OPEN | Final Exit Gate |

### 5.4 Checklist 469 / Work items 62

- `DEV_EXECUTION_CHECKLIST.md`: **0 checked / 469 open** — không dùng làm % hoàn thành.
- `DEV_WORK_ITEMS_P0_P1.md`: spec 62 items; claim “61/62 done” từ 07-06 **không còn authoritative** so với release HOLD.

---

## 6. NHỮNG GÌ ĐÃ LÀM ĐƯỢC (xanh có điều kiện)

Báo đỏ trước rồi mới xanh — các mục dưới đây **có evidence**, nhưng **không đủ** để GO:

1. Monorepo apps: web, edu, console, invest, academy, admin, api, auth.
2. Independence Phase 0 + CI `audit:independence` PASS.
3. Production surfaces HTTP sống (smoke 11/11 hôm nay).
4. Session auth model đúng (D1 opaque + `AUTH_SECRET`), không JWT runtime.
5. Google OAuth secrets + begin URL production.
6. Email path có Resend; verify hardening đã có kế hoạch/code lịch sử.
7. AI Provider decision + static code cleanup (direct vendor path gỡ theo commits gần đây).
8. `AI_PROVIDER_API_KEY` **tên secret** đã có trên API (verify 17/7).
9. Edu plan lock + brand naming + security-p0 + secret-governance static PASS.
10. Account production Anhhatam khóa trong AGENTS / deploy pattern.

---

## 7. NHỮNG GÌ BỊ KHÓA / NGOÀI PHẠM VI AGENT

| Hạng mục | Vì sao khóa | Cần ai làm |
|---|---|---|
| Payment merchant (PayOS/Stripe/VNPay) + bank/entity | Tài khoản + pháp lý merchant | Founder / Legal / Finance |
| Entity / IP / invest public claim | Counsel + Founder decision | Founder / Legal |
| Team A `aiagent.iai.one` contract + staging/prod gateway ops | Ownership ngoài monorepo NAI | Founder + Team Provider |
| `AI_PROVIDER_API_KEY` value correctness + chat E2E | Secret value + live provider | Founder/Ops + QA |
| Gỡ `JWT_SECRET` production | Wrangler secret delete | Founder/Ops |
| GitHub `production` environment reviewers | Org settings | Founder/DevOps |
| Sprint 0 Founder lock + commercial GO sign-off | Authority Founder | Founder |
| Neon Postgres (nếu vẫn required) | Account provision | Founder |
| Rotate bất kỳ key từng lộ chat | Security ops | Founder |
| Full browser E2E / VoiceOver / CWV lab | Thời gian + tooling + accounts | QA team |

---

## 8. VIỆC CẦN LÀM SAU PHIÊN NÀY (thứ tự)

### Ngay (P0)

1. Founder/Ops: **xóa `JWT_SECRET`** khỏi auth + api sau khi xác nhận không consumer → `pnpm audit:secrets:production` phải PASS phần unused.
2. Founder/Ops: cấu hình **một payment secret group hoàn chỉnh** (đúng inventory `config/secret-governance.json`) hoặc giữ commerce OFF rõ ràng trên UI/API.
3. Xác nhận `AI_PROVIDER_API_KEY` + gateway URL staging/prod; chạy **chat E2E có session** (auth → entitlement → provider → usage → evidence).
4. Auth team: packet **Authz E2E** (register → verify → login → OAuth lần 2 → logout → revoke → role deny).
5. Chạy lại **`bash tools/qa-loop.sh`** trên HEAD; append `QA_LOOP_LOG.md` — không dùng log 07-10.

### Song song (Edu)

6. Đóng Edu P0 còn PARTIAL/OPEN theo `EDU_REMEDIATION_BACKLOG_P0_P2_2026-07-14.md` — ưu tiên certificate verify thật, scholarship process, Academy entitlement.
7. Cập nhật backlog a11y cho khớp gate shell hiện tại + bổ sung axe/manual evidence.

### Trước khi nói GO

8. Monitoring alert + 1 restore drill D1/R2 có biên bản.
9. Release packet đúng SHA + CI URLs + live E2E + **Founder sign-off**.
10. Cập nhật/stale-clean: `MASTER_PROJECT_PLAN`, `REPO_STRUCTURE`, `KNOWN_LIMITATIONS`, `FOUNDER_GO_LIVE_CHECKLIST` (bỏ DirectLLM keys; ghi AI Provider; invest legal decision).

### Không làm

- Không publish claim “all green / P0=0”.
- Không bật lại direct OpenAI/Anthropic/Google keys trong NAI.
- Không coi smoke HTTP = go-live commercial.

---

## 9. CÂU ĐƯỢC PHÉP NÓI CÔNG KHAI (đề xuất)

> “Các bề mặt nguyenai.net đang online cho kiểm thử; phát hành thương mại đầy đủ vẫn **HOLD** cho đến khi đóng payment E2E, Authz E2E, AI Provider cutover, Edu exit gate và Founder sign-off.”

---

## 10. VERDICT CUỐI

| Câu hỏi | Trả lời |
|---|---|
| Kế hoạch có đủ bản đồ không? | **Có** — nhưng nhiều lớp chồng; phải đọc theo hierarchy 07-15/16 |
| Repo có tiến bộ kỹ thuật thật không? | **Có** — independence, surfaces live, provider code cleanup, một số gate PASS |
| Đủ commercial / full GO chưa? | **Chưa — HOLD** |
| Điểm đỏ cứng hôm nay? | Payment secrets thiếu; JWT_SECRET thừa; Authz/payment/AI E2E thiếu; Edu exit chưa; QA loop stale; monitoring/DR thiếu; Founder GO chưa ký |

**FINAL VERDICT: HOLD**

---

*Báo cáo này ghi nhận facts verify được ngày 2026-07-17. Mọi claim “đã xong” sau ngày này phải kèm lệnh + output + SHA mới.*

---

## 11. REVERIFICATION ADDENDUM — 2026-07-17

Addendum này được chạy lại trên cùng HEAD `5a21063` sau khi report ban đầu được lập. Nó không xóa lịch sử; chỉ thay thế các trạng thái đã có bằng chứng mới hơn.

### Evidence mới

| Check | Kết quả mới | Ý nghĩa |
|---|---|---|
| `bash tools/qa-loop.sh` | **ALL GREEN** | typecheck 0 errors; build 91/91; audit:all 18/18; SEO build PASS; test 152/152 |
| `bash tools/production-smoke.sh` | **11/11 PASS** | HTTP/surface health; không phải authenticated journey |
| `node tools/audit-ai-provider-source.mjs` | **PASS** | Static scope hiện gồm `apps/`, `packages/@nai/*`, `tools/`, `config/`; không thay cho Team A/B E2E |
| `node tools/audit-production-secret-names.mjs` | **FAIL** | `AI_PROVIDER_API_KEY` đã có; `JWT_SECRET` vẫn thừa trên auth/api; payment group vẫn thiếu |
| OAuth begin live | **HTTP 200** | Google authorize URL/state tạo được; chưa phải login/revoke/role/tenant E2E |
| `/v1/chat` không session | **HTTP 401** | Auth boundary hoạt động; chưa chứng minh chat qua provider với session thật |
| `https://edu.nguyenai.net/verify/` | **HTTP 200** | Route live; HTML vẫn ghi API verify đầy đủ là placeholder |

### Điều chỉnh so với report ban đầu

- `QA_LOOP_LOG stale` đã được xử lý bằng QA Loop #22; log hiện có entry mới **ALL GREEN**. File `QA_LOOP_LOG.md` là generated evidence chưa commit.
- Full typecheck/build/test đã được verify tươi; không còn trạng thái `NOT RE-VERIFIED` cho repo/build gate.
- `AI_PROVIDER_API_KEY` đã có tên trên production API. Giá trị hợp lệ, provider accepted và authenticated chat E2E vẫn **chưa được chứng minh**.
- AI provider static audit đã mở rộng scope; các reference còn lại chỉ là audit pattern/test fixture được allowlist. Không dùng kết quả này để đóng provider cutover.
- `/verify` đã qua redirect về HTTP 200, nhưng product behavior vẫn **OPEN** vì API certificate verification là placeholder.
- Verdict commercial vẫn không đổi: **HOLD**.

### Backlog bắt buộc để chuyển từ HOLD sang GO

#### P0 — phải đóng trước mọi P1/P2

1. **Payment:** Founder/Legal chốt merchant/entity/refund/disclosure; cấu hình một commerce secret group hoàn chỉnh; chạy checkout → signed webhook → order → entitlement → receipt → refund/revoke → replay E2E.
2. **JWT:** gỡ `JWT_SECRET` khỏi auth và api; chạy lại production secret audit; chạy auth regression sau thay đổi.
3. **Authz:** có evidence production cho register, verify, Google OAuth lần hai, login, logout, revoke/expiry, role deny và tenant isolation.
4. **AI Provider:** Team A cung cấp versioned contract, staging/prod evidence, model catalog, usage/error/trace, privacy/security review và owner sign-off; Team B chạy authenticated chat E2E và usage/evidence/audit reconciliation; Founder ký cutover.
5. **Edu Final Exit:** certificate verify thật, scholarship process chín bước, Academy Pass entitlement riêng, 5 cấp, content/journey E2E và owner/evidence cho project/job/mentor.
6. **Operational release:** monitoring alert test event, D1/R2 backup policy, một restore drill, rollback evidence, GitHub production reviewer và release packet đúng SHA.
7. **Governance/legal:** Sprint 0 lock, entity/IP/payment/investor disclosure review và Founder commercial GO.

#### P1 — chỉ bắt đầu sau P0

- Browser E2E matrix, manual keyboard/focus and WCAG evidence, performance/CWV.
- Data deletion/export/consent, backup reconciliation, observability/cost alerts.
- Certificate/proof audit trail, investor access expiry/revoke/audit log.
- Incident, payment replay, account recovery and rollback drills.

#### P2 — sau P1

- Controlled cohort launch, traffic ramp and stop criteria.
- Quarterly restore/auth/payment/security drills.
- Recurring legal, dependency, cost and product-metric review.

### Current release sentence

> Repo/build gates và HTTP surfaces đang xanh trên HEAD `5a21063`; hệ thống chưa đủ điều kiện commercial/full production GO vì payment, JWT cleanup, authenticated Authz/AI/Edu journeys, operations evidence và Founder sign-off còn mở.

**REVERIFICATION VERDICT: HOLD**

---

## 12. CURRENT HEAD AUDIT ADDENDUM — 2026-07-17

Addendum này thay thế trạng thái kỹ thuật của các snapshot `5a21063` ở trên bằng evidence mới hơn. Nó không thay đổi lịch sử và không tự cấp commercial GO.

### Source verification

| Field | Value |
|---|---|
| Repo/branch | `nguyenai.net` / `main` |
| Audited HEAD | `cca4d43f856bf9dcc79be5aece855da9b28d4771` |
| `origin/main` | cùng SHA tại thời điểm kiểm tra |
| Worktree trước QA loop | clean |
| Worktree sau QA loop | `QA_LOOP_LOG.md` modified bởi generated evidence |

### Fresh evidence

| Check | Result | Boundary |
|---|---|---|
| `bash tools/qa-loop.sh` | **PASS**: typecheck 0; build 91/91; audit 18/18; SEO build PASS; test 152/152 | Repo gate only |
| `pnpm run audit:ai-provider` | **PASS** | Static; không phải authenticated provider E2E |
| `pnpm run audit:security-p0` | **PASS** | Static security patterns |
| `node tools/audit-production-secret-names.mjs` | **FAIL** | `JWT_SECRET` thừa trên auth/api; chưa có commerce group hoàn chỉnh |
| `node --import tsx tests/e2e/payment-entitlement-refund-e2e.ts` | **PASS 47/47** | Test tự khai báo in-memory stores + simulated gateways |
| Deploy workflow source | manual dispatch + `production` environment | Reviewer/live deployment của SHA này chưa verify trong addendum |

### New P0 findings not covered by the green repo loop

1. `apps/api/src/webhook-replay.ts` vẫn dùng module-level `Map`; replay protection không durable/atomic giữa Worker isolates.
2. `@nai/entitlement` vẫn dùng `InMemorySubscriptionStore` mặc định; API `initStores()` chưa nối subscription store vào D1.
3. VNPay refund trả `status: refunded` mà chưa gọi hoặc ký provider request.
4. PayOS refund khi thiếu config/network/provider failure rơi xuống simulated `status: refunded`.
5. Payment completion test là code/simulation E2E, không phải sandbox/production payment E2E.
6. Authz, authenticated AI Provider, Edu certificate/scholarship, monitoring, restore, legal và Founder gates vẫn mở.

### Founder scope direction

Toàn bộ product catalog hiện có được giữ nguyên. Ba youth workflows được dùng làm integration/traction spearheads, không được dùng để xóa hoặc giảm 9 Models, 9 Functional Products, Super Apps, Academy, scholarship hoặc các product surfaces khác.

### Execution authority

Kế hoạch team thực thi tiếp theo: `docs/governance/FULL_SCOPE_FAST_OPERATION_EXECUTION_PLAN_2026-07-17.md`.

**CURRENT HEAD VERDICT: REPO GATES PASS / COMMERCIAL OPERATION HOLD**
