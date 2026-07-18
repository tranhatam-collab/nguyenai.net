# QA Audit — Nguyen AI Product Roadmap 5 Giai Đoạn

**Ngày audit:** 2026-07-18  
**Repo:** `nguyenai.net`  
**Branch:** `main`  
**HEAD khi audit:** `597c2dfa5a2026e8e1773970bd9b626e7f71eed7`  
**Worktree snapshot:** tracked code clean; có hai QA/report files untracked, kiểm tra lúc 2026-07-18 (Asia/Ho_Chi_Minh)  
**Verdict roadmap:** **APPROVE WITH P0 CORRECTIONS**  
**Verdict sản phẩm/commercial:** **HOLD**  
**Loại tài liệu:** QA report; chưa phải Founder lock và không tự thay thế các source-of-truth hiện hành.

---

## 1. Phán quyết điều hành

Roadmap 5 giai đoạn đúng ở cấp Product: kiểm kê thực tế, đơn giản hóa lời hứa, chứng minh sản phẩm, tạo traction rồi mới dùng dữ liệu vận hành để gọi vốn.

Roadmap chưa được duyệt nguyên văn vì có sáu điểm phải sửa trước khi giao team:

1. `Product Simplification` phải là đơn giản hóa lời hứa bán hàng và thứ tự kích hoạt, không xóa catalog hoặc phủ định Founder direction giữ nguyên toàn bộ phạm vi.
2. Không được log “mọi nút, mọi prompt” theo nghĩa raw data. Telemetry phải tối thiểu hóa dữ liệu, có event taxonomy, redaction, consent và retention.
3. Academy phải tiếp tục là sản phẩm trả phí riêng; repo hiện còn entitlement/test trái lock này.
4. Legal, IP, security và data-room governance phải chuẩn bị từ đầu; chỉ traction/revenue metrics được bổ sung sau khi có số liệu thật.
5. Điểm số “sau khi thực hiện = 9.2/10” là mục tiêu chủ quan, không phải evidence và không được dùng trong investor material.
6. Audience expansion ra ngoài global Nguyen community cần Founder brand/market decision; không được đổi target audience ngầm qua campaign.

Roadmap đúng sau khi áp dụng các correction trong báo cáo này.

---

## 2. Source truth hiện tại

### 2.1 Repo và worktree

| Field | Evidence |
|---|---|
| HEAD và `origin/main` | `597c2dfa5a2026e8e1773970bd9b626e7f71eed7` |
| Commit code P0 gần nhất | `597c2df` — model gateway D1, correlation IDs, ops scaffolds và verify UI; parent `68d5e89` chứa Authz/MFA/payment ledger |
| Commit audit gần nhất | `41f6ef0` — independent audit report |
| Tracked worktree | Clean tại snapshot cuối; model/training gateway, telemetry, API, Edu verify, migration và ops tools đã vào `597c2df` |
| Untracked | Báo cáo audit này và `PROJECT_STATUS_REPORT_2026-07-17.md` |

Không được dùng kết quả của HEAD clean để claim các thay đổi dirty đã deploy hoặc đã production-ready.

### 2.2 Evidence chạy tươi trên worktree

| Check | Result | Boundary |
|---|---|---|
| `pnpm typecheck` | **PASS** trên `597c2df` | Lần chạy trong lúc team đang đổi worktree từng fail dependency link; rerun sau khi HEAD ổn định đã pass |
| `pnpm test` | **PASS 152/152 task** nhưng có false positive | Training gateway trả `finish_reason=error`, `tier_allowed=false`, model `auto-route` không có trong registry nhưng test vẫn in `Smoke test passed` |
| `audit:production-durability` | **PASS** | Static pattern gate; không kiểm tra atomic webhook claim |
| `audit:security-p0` | **PASS** qua `node --import tsx` | Static patterns; không kiểm tra tenant logic/MFA state machine |
| `audit:ai-provider` | **PASS** | Static source gate; không chứng minh live authenticated provider call |
| Production secret-name audit | **FAIL** | Không list được secret names; thiếu auth, OAuth, email, API signing, AI provider và commerce groups theo output hiện tại |
| Live HTTP probe | **PASS 6/6 surfaces** | Web, app login redirect, Edu, Invest, API health và Auth health trả 200; chỉ chứng minh availability |
| Current HEAD production deployment | **NOT VERIFIED** | Smoke/QA log local không chứng minh production đang chạy exact SHA `597c2df` |

### 2.3 Logic defects chưa được gate bắt

| Severity | Finding | Evidence |
|---|---|---|
| P0 | Webhook replay chưa atomic | Flow `checkReplay -> side effects -> recordProcessed`; D1 `INSERT OR REPLACE` sau side effect cho phép hai request đồng thời cùng xử lý |
| P0 | Academy entitlement trái Founder lock | `plans.json`, `entitlements.json`, validator, `ENTITLEMENT_MODEL.md` và P0-B test vẫn grant Academy Pass cho Founder/Chapter |
| P0 | Production secrets chưa đạt | Production secret-name audit FAIL |
| P0 | AI smoke test false-positive | Response lỗi `auto-route not found` vẫn được test coi là pass; không chứng minh provider journey |
| P0 | MFA challenge bị consume trước khi verify | Committed auth code set `used_at` trước khi kiểm tra TOTP; một code sai làm challenge không dùng lại được; update chưa atomic |
| P0 | Authz/payment fixes chưa có targeted tests | Test tổng pass nhưng không có test mới chứng minh concurrent replay, tenant mutation, MFA replay/attempt limit hoặc ledger reconciliation |
| P0 | Payment ledger có thể không reconcile Stripe row | Webhook update dùng `WHERE payment_id = gateway_payment_id`, nuốt lỗi như best-effort rồi vẫn có thể grant entitlement |
| P0 | Model gateway vi phạm provider single source | Code đã commit vẫn có provider type/default allowlist gồm vendor trực tiếp + Gen1/Gen2; test cũng gọi OpenAI/Anthropic như provider canonical |
| P0 | Provider happy path không khớp type/allowlist | Training gateway cast `served_by=ai-provider-gateway` thành `ModelProvider`, nhưng union/allowlist không chứa giá trị này; provider response thật sẽ bị `invokeModel` từ chối |
| P0 | Authenticated user có thể tự mint model receipt | Mounted `/v1/model-gateway/invoke` tin `provider`, `model`, token counts và `cost_usd` từ request body rồi tạo receipt, không gắn với provider execution đã xác minh |
| P0 | Receipt lookup thiếu tenant ownership check | `/v1/model-gateway/invocations/:id/receipt` chỉ require session rồi lookup theo invocation ID; không ràng buộc receipt với `session.user_id` và `tenant_id` |
| P0 | Model gateway migration không khớp runtime | Runtime update `receipt_id`, nhưng `model_invocations` trong committed migration `0012` không có cột này; deploy có nguy cơ lỗi D1 |
| P0 | Receipt signing không fail-closed | `MODEL_GATEWAY_SIGNING_KEY` optional và chưa có trong secret inventory; khi thiếu key, D1 store dùng hash yếu thay vì từ chối production |
| P0 | Policy receipt flags không phản ánh policy result | `identity/language/safety_check_passed` được gán bằng cờ `enforce*`; migration không lưu các cột này và mapper default chúng thành `true` |
| P0 | Output guard có thể trả lại nội dung đã block | Final content dùng `modified_output ?? result.content`; nếu action là `block` mà không có modified output, original provider content vẫn đi ra response |
| P1 | Ops drill đã commit nhưng chỉ là scaffold | Alert test dùng counter in-memory/condition luôn true; backup và rollback scripts chạy dry-run, không chứng minh alert delivery, restore hoặc rollback thật |
| P1 | Founder dashboard chưa operational | `@nai/dashboard` dùng in-memory `Map`; `apps/admin` chỉ echo Phase 2 placeholder |
| P1 | Telemetry chưa operational | Worktree thêm correlation/log context, nhưng metric state vẫn in-memory và OTLP exporter vẫn no-op |
| P1 | Evidence library chưa operational | `@nai/evidence` mặc định InMemory; chưa có production evidence store/library access model |

### 2.4 Không được nâng scaffold thành evidence

Các output sau không được dùng để đóng roadmap gate:

- `PRODUCTION DURABILITY AUDIT PASSED` chỉ chứng minh pattern/static wiring, không chứng minh webhook claim atomic dưới concurrency.
- `SECURITY P0 AUDIT PASSED` không chứng minh MFA challenge state machine, tenant mutation hoặc session revocation live.
- `AI PROVIDER SOURCE AUDIT PASSED` không chứng minh model alias hợp lệ, provider response thành công, cost/receipt đúng hoặc production secret có giá trị.
- `Smoke test passed` không hợp lệ nếu chính response chứa `finish_reason=error` hoặc `tier_allowed=false` cho happy path. `QA Loop #30 ALL GREEN` vì vậy chỉ là machine-run status, không phải product proof.
- Script backup/restore/rollback chạy `dryRun=true` chỉ là runbook scaffold, không phải drill receipt.

---

## 3. QA từng giai đoạn roadmap

### Giai đoạn 1 — Product Reality Audit

**Verdict:** APPROVED, với correction.

Đúng:

- Dừng feature expansion để kiểm kê capability thực tế.
- Mỗi capability atomic chỉ có một status canonical.
- Route tồn tại không được tự động mang status `LIVE`.

Correction bắt buộc:

- Feature freeze không chặn P0 security, privacy, payment-integrity hoặc incident containment.
- Audit phải hoàn thành trong 24–48 giờ; không kéo dài thành một sprint viết tài liệu.
- Source canonical phải machine-readable, sau đó mới generate Markdown/dashboard.
- Mỗi record phải có `feature_id`, owner, surface, environment, status, evidence, last_verified_at, exact SHA, deployment ID, dependency, risk và next gate.
- Product lớn phải chia thành capability atomic. Ví dụ `Invest` không có một status duy nhất nếu public pages và private room có trạng thái khác nhau.

Status taxonomy được duyệt:

```text
LIVE_VERIFIED
LIVE_UNVERIFIED
BETA
PREVIEW
SIMULATED
PLANNED
BLOCKED
DISABLED
```

`LIVE` không có deployment/evidence phải bị hạ thành `LIVE_UNVERIFIED`.

### Giai đoạn 2 — Product Promise and Packaging

**Verdict:** APPROVED AFTER REWORDING.

Không dùng câu “cắt sản phẩm” theo nghĩa xóa 9 Models, 9 Functional Products, Super Apps, Academy, scholarship hoặc các surface đã khóa.

Định nghĩa đúng:

> Giữ nguyên toàn bộ product architecture; chỉ đưa một lời hứa và ba proof journeys ra trước thị trường. Các capability chưa qua gate vẫn tồn tại nhưng mang trạng thái Preview, Planned, Blocked hoặc Disabled.

Launch promise được chấp nhận làm mũi nhọn:

> Máy Tính AI Nguyễn giúp người trẻ xây năng lực, tạo sản phẩm và có hồ sơ kiểm chứng.

UI launch phải trả lời sáu câu hỏi:

1. Người dùng giải quyết việc gì?
2. Kết quả nhận được là gì?
3. Thời gian và giới hạn là gì?
4. Dữ liệu được bảo vệ thế nào?
5. Giá/entitlement nào áp dụng?
6. Hỗ trợ và khiếu nại ở đâu?

Không xóa catalog. Không đưa toàn bộ catalog lên cùng một conversion path.

### Giai đoạn 3 — Product Proof

**Verdict:** APPROVED WITH EVIDENCE AND PRIVACY GATES.

Mười video là hợp lý hơn số lượng lớn video yếu. Video phải chứng minh live journey, không phải video marketing.

Danh sách 10 video chuẩn:

1. Register, verify, real sandbox/authorized payment, entitlement, AI result, receipt và verify.
2. Career journey: assessment, 90-day map, portfolio, export và receipt.
3. Product journey: research, create, review, revise, publish và verify.
4. Small-project journey: problem, users, prototype, budget, test và report.
5. Family journey: consented upload, memory, search, timeline, access control và QR.
6. Academy: standalone purchase, enroll, lesson, quiz, proof, certificate và verify.
7. Refund: provider confirmation, ledger reconciliation, entitlement revoke và receipt/audit.
8. Authz: tenant denial, role denial, logout/revoke và MFA replay protection.
9. Provider outage: fail-closed, no mock/direct-vendor fallback, incident và user notification.
10. Founder analytics/evidence: source metrics, cost, incident, release evidence và drill-down.

Mỗi video bắt buộc có:

- exact SHA and deployment ID;
- production-beta or provider-sandbox environment;
- timestamp and feature status;
- consented test account;
- receipt/evidence IDs;
- expected and actual results;
- known limitation and failure behavior;
- redaction review before publication.

Không dùng raw dữ liệu gia đình, trẻ vị thành niên, investor, payment credential hoặc private prompt trong video. Dùng consented fixture/test account nhưng flow và backend phải thật.

### Giai đoạn 4 — Community Traction

**Verdict:** APPROVED WITH BRAND AND OPERATIONS GATES.

Thứ tự wave hợp lý:

| Wave | Product focus | Gate mở wave |
|---|---|---|
| 1 | Người trẻ, Academy standalone, Career, AI proof journeys | P0 auth/payment/provider + three journeys + support operational |
| 2 | Family, Roots, Memory, Guardian | Consent/privacy, durable vault/evidence, family role model và deletion/export |
| 3 | Founder, Startup, Business, Enterprise | Org tenancy, billing seats, audit, SLA, cost và legal gate |

Correction:

- Academy vẫn là entitlement trả phí riêng, dù được đặt trong Wave 1.
- `Nguyen AI` hiện được khóa cho global Nguyen ecosystem. Mở rộng sang toàn bộ người Việt hoặc vertical khác cần Founder cập nhật positioning/market lock.
- Growth reward cần anti-fraud, anti-spam, terms, tax/accounting treatment và revoke policy.
- Không mở traffic nếu Customer Success, incident owner và support capacity chưa đạt gate.

### Giai đoạn 5 — Investment Readiness

**Verdict:** SPLIT INTO TWO TRACKS.

Không chờ có traction mới bắt đầu toàn bộ Data Room.

Track A phải chuẩn bị ngay từ Giai đoạn 1:

- entity and cap-table authority;
- IP ownership and contributor agreements;
- legal/privacy/security policies;
- architecture and data map;
- incident, backup, restore and audit evidence;
- document versioning, access expiry, revoke and access logs.

Track B chỉ bổ sung sau khi có dữ liệu vận hành thật:

- reconciled revenue and refunds;
- activation and retention cohorts;
- churn and customer-success evidence;
- CAC and channel attribution;
- LTV with documented assumptions;
- AI/provider/infra/support COGS;
- gross and contribution margin;
- product usage and workflow completion;
- enterprise pilots and case studies.

Không publish Data Room hoặc valuation claim chỉ vì folder/document đã tồn tại.

---

## 4. QA bảy hệ thống bổ sung

| System | Current repo truth | Correct status | Required product deliverable |
|---|---|---|---|
| Founder Analytics | Dashboard package có definitions nhưng in-memory; Admin app chưa implement | `PREVIEW` | Founder-only dashboard từ reconciled sources, RBAC, drill-down, freshness/SLO |
| Growth Loop | Không có operational referral/reward loop được chứng minh | `PLANNED` | Shareable artifact/receipt, invite attribution, reward ledger, fraud/terms controls |
| Product Telemetry | Package tồn tại; không được apps dùng; OTLP exporter no-op | `PREVIEW` | Event taxonomy, durable pipeline, warehouse/query, privacy controls, QA |
| Experiment Platform | Không có assignment/exposure/analysis platform | `PLANNED` | Server-side allocation, exposure event, guardrails, stop rule, Founder approval |
| Customer Success | Có entitlement naming cho support nhưng không có ticket/CS workflow | `PLANNED` | Inbox/tickets, owner, SLA, health score, playbooks, churn/cancel follow-up |
| Founder Content Engine | Chưa có operational editorial/release workflow | `PLANNED` | Weekly cadence, source/evidence review, release/case-study templates |
| Evidence Library | Evidence/receipt scaffolds có; store mặc định in-memory; không có library UI/access model | `PREVIEW` | Durable classified store, immutable index, search, retention, access, public-safe views |

Kết luận: bảy điểm bổ sung là đúng, nhưng ba điểm đã có scaffold chứ không phải hoàn toàn chưa tồn tại. Không được nâng scaffold thành operational.

---

## 5. Telemetry privacy correction

Câu “mỗi nút, mỗi Agent, mỗi Prompt đều phải log” không được dùng làm implementation rule.

Rule đúng:

```text
Log semantic product events, not indiscriminate raw user content.
```

Được log mặc định:

- event name/version;
- pseudonymous user/tenant ID;
- surface, feature, plan and experiment IDs;
- timestamp, duration, status and error class;
- model alias, token/cost totals and policy outcome;
- receipt/evidence reference;
- consent and data-classification flags.

Không log mặc định:

- raw prompt or model response;
- document/file contents;
- family-tree/living-person data;
- identity/payment credentials;
- secrets, session tokens or full IP where unnecessary;
- private investor or scholarship evidence.

Raw content chỉ được capture khi có purpose, explicit consent hoặc approved operational need, redaction, encryption, scoped access, retention và deletion policy.

---

## 6. Experiment governance correction

Không hard-code experiment không đồng nghĩa mọi thứ được A/B tự do.

| Experiment | Allowed condition |
|---|---|
| Hero/CTA/onboarding | Có event taxonomy, accessibility check và stop rule |
| Prompt/model policy | Offline eval + safety/cost guardrail trước exposure |
| Pricing | Founder/commercial/legal approval, eligibility disclosure, ledger consistency |
| Academy entitlement | Không được experiment làm sai standalone-paid boundary |
| Security/privacy/consent | Không A/B làm suy yếu protection hoặc legal rights |

Mỗi experiment cần hypothesis, primary metric, guardrail metrics, cohort, sample rule, start/end, owner, variant version, exposure log và decision record.

---

## 7. KPI definitions có thể kiểm toán

Các KPI dưới đây là target, không phải forecast hoặc valuation guarantee.

| KPI | Canonical definition | Proposed target |
|---|---|---|
| Paid users | Unique non-test accounts có payment `paid` đã reconcile, trừ refunded/fraud | 300 |
| Activation | Paid/eligible user hoàn thành core value event trong 7 ngày từ entitlement activation | 70% |
| M1 retention | Activated paid cohort hoàn thành meaningful value event trong ngày 22–30 | 60% |
| Products created | Unique final artifact có valid non-test receipt và completion status | 100 |
| Receipts | Valid, unique, non-test, non-revoked receipt records | 1,000 |
| Case studies | Consented, evidence-backed, redacted and Founder-approved cases | 30 |
| Enterprise trials | Signed/approved pilot có active users và meaningful weekly usage | 10 |
| AI cost | Reconciled provider cost/account and cost/core-value-event; threshold Founder khóa theo plan | Under approved threshold |

Phải báo cả numerator, denominator, cohort window, exclusions, source table/query version và last refresh.

CAC/LTV không được report khi attribution hoặc cohort còn thiếu. LTV phải ghi model/assumption và không được trình bày như actual lifetime revenue khi chưa đủ thời gian.

---

## 8. Initial Product Reality snapshot

Đây là snapshot khởi tạo để Team Product Reality kiểm chứng tiếp; không thay final matrix.

| Atomic capability | Initial status | Reason |
|---|---|---|
| Public web routes | `LIVE_UNVERIFIED` | Surface từng smoke pass; exact current SHA deployment chưa verify |
| Console shell/login redirect | `LIVE_UNVERIFIED` | Surface online trước đó; authenticated journey chưa pass production |
| Career/product/project journeys | `BLOCKED` | Chưa có three production E2E proof journeys |
| Nguyen Roots/Family demo | `SIMULATED` | Public page tự gắn `Simulated demo`; runtime persistence chưa chứng minh |
| Memory UI/runtime | `PREVIEW` | UI/package logic có; production durable memory journey chưa chứng minh |
| Vault UI/runtime | `PREVIEW` | UI/policy/crypto scaffolds có; operational R2 vault chưa chứng minh |
| Chat/AI Provider | `BLOCKED` | Typecheck pass nhưng smoke test false-positive; live authenticated provider/cost/evidence chưa pass |
| Agents | `PREVIEW` | UI/packages có; live multi-agent product journey chưa chứng minh |
| Academy public content | `LIVE_UNVERIFIED` | Public surface có; exact deployment chưa verify |
| Academy paid learning | `BLOCKED` | Founder/Chapter vẫn được grant Academy Pass trái standalone-paid lock; payment/certificate/live E2E open |
| Invest public pages | `LIVE_UNVERIFIED` | Surface có; current SHA/legal claim packet chưa verify |
| Invest private room | `BLOCKED` | Production Authz/access-expiry/revoke/access-log E2E chưa chứng minh |
| Billing/checkout/refund | `BLOCKED` | Secret audit fail; real gateway E2E/reconciliation open |
| Referral/rewards | `PLANNED` | Không có operational loop evidence |
| Certificate issuance/verify | `PREVIEW` | D1/API/proxy code exists; migration, real issued certificate, public verify và exact deployment chưa verify |
| Founder Analytics | `PREVIEW` | Package scaffold only; Admin app placeholder |
| Product Telemetry | `PREVIEW` | Package scaffold/no-op exporter; no runtime integration |
| Evidence Library | `PREVIEW` | Evidence package/receipt pages exist; production store/library absent |

Team không được copy snapshot này thành “verified final” nếu chưa chạy route/source/store/deploy/E2E checks cho từng record.

---

## 9. Corrected 5-stage exit gates

| Stage | Exit gate |
|---|---|
| 1 Reality | 100% atomic capabilities có owner/status/evidence/SHA/environment; public claims reconciled |
| 2 Promise | One launch promise + three journeys; catalog preserved; UI/pricing/entitlement copy consistent |
| 3 Proof | P0=0 cho journeys; 10 videos meet evidence/privacy standard; receipts verify |
| 4 Traction | Telemetry, analytics, CS, growth controls operational; targets calculated from reconciled data |
| 5 Investment | Baseline legal/security/IP room approved; operational metrics actual; access controls audited |

Không dùng deadline để tự đóng stage.

---

## 10. Immediate execution order

1. Không deploy `597c2df` như commercial release; thay false-positive training-gateway smoke test bằng success/failure assertions thật.
2. Đóng hoặc đổi `/v1/model-gateway/invoke` thành internal-only trusted callback; cấm client tự khai token/cost/provider; scope mọi receipt lookup theo user + tenant.
3. Gỡ direct vendor + Gen1/Gen2 khỏi model gateway contract; chỉ nhận provider identity của `aiagent.iai.one`; fail-closed khi thiếu signing key; sửa policy-result persistence và migration/schema rồi thêm D1 integration test.
4. Sửa output guard để action `block` không bao giờ fallback về original content; thêm tests cho allow/modify/block/error.
5. Team 0 hoàn thành Product Reality matrix trong 24–48 giờ; không code feature mới ngoài P0 containment.
6. Sửa Academy entitlement/catalog/validator/test về standalone-paid trước mọi pricing/Academy proof.
7. Đổi webhook replay thành atomic claim-before-side-effect; thêm targeted concurrency test và ledger-entitlement reconciliation.
8. Sửa MFA consume-after-success bằng conditional atomic update; thêm attempt/rate-limit/replay/expiry tests và Authz tenant mutation tests.
9. Cấu hình/verify production secret groups không lộ giá trị; chạy authenticated payment/provider/Authz E2E trên exact SHA.
10. Khóa event taxonomy/privacy trước khi tích hợp Founder Analytics hoặc Growth Loop; triển khai durable telemetry, không chỉ console/in-memory.
11. Thực hiện alert delivery test, backup restore drill và rollback drill thật; lưu timestamp, operator, environment, RTO/RPO và artifact hash.
12. Xây ba journey trên cùng platform; sau exact-SHA beta deployment mới quay 10 video proof.
13. Chạy controlled cohort; Founder dashboard và Customer Success phải hoạt động trước traffic ramp.
14. Chuẩn bị legal/IP/security data-room baseline ngay; chỉ bổ sung actual traction sau reconciliation và Founder/Legal investor release.

---

## 11. Claims được phép

Hiện được phép nói:

> Nguyen AI đã có nhiều public/product surfaces và repo gates đang tiến bộ; Product Reality Audit, production journeys, commercial evidence và traction vẫn chưa đóng.

Chưa được phép nói:

- Product Roadmap đã hoàn thành.
- Founder dashboard hoặc telemetry đang operational.
- Payment/AI/Academy đang vận hành thương mại.
- 9.2/10 readiness.
- Verified traction.
- Data Room investment-ready.
- Machine gates green đồng nghĩa roadmap/product E2E green.
- AI Provider E2E passed dựa trên smoke test hiện tại.

**FINAL QA VERDICT:** Roadmap Product 5 giai đoạn được chấp thuận có điều kiện sau các P0 corrections nêu trên. HEAD đã chứa một số P0 improvements và local machine gates đang pass, nhưng test/contract coverage còn false-positive cùng các lỗi P0 logic ở Academy, payment, MFA và provider gateway. Commercial release vẫn **HOLD**.
