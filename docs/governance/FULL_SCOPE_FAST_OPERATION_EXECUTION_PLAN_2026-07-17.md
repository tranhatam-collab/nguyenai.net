# Nguyen AI Full-Scope Fast Operation Execution Plan

**Ngày lập:** 2026-07-17  
**Repo:** `nguyenai.net`  
**HEAD được audit:** `cca4d43f856bf9dcc79be5aece855da9b28d4771`  
**Trạng thái phát hành khi lập plan:** **HOLD**  
**Tính ràng buộc:** BINDING FOR EXECUTION; không thay thế các Founder lock, product catalog, Education lock, Academy standalone-paid rule, legal review hoặc release approval hiện hành.

---

## 1. Founder execution direction

### 1.1 Giữ nguyên toàn bộ phạm vi

Không cắt, xóa, thu hẹp hoặc hạ cấp các phần đã có trong hệ thống:

- 9 AI Computer Models;
- 9 Functional Products;
- các Super Apps, Agent team và tool families đã được duyệt;
- các nhóm Personal, Family, Creator, Founder, Business, Chapter, Enterprise và Sovereign;
- Nguyen AI Edu, Academy Pass trả phí riêng, certification, học bổng, dự án, việc làm và mentor;
- Web, Console, Edu, Invest, API, Auth và các surface Phase 2 đã khóa;
- privacy, evidence, approval, audit, memory, vault, receipt, verify, billing và investor access.

Ba hành trình người trẻ trong kế hoạch go-to-market là **mũi nhọn tích hợp và bằng chứng vận hành đầu tiên**, không phải giới hạn sản phẩm:

1. Hồ sơ năng lực và tìm việc.
2. Làm một sản phẩm thật.
3. Khởi động một dự án nhỏ.

### 1.2 Tăng tốc bằng nền tảng dùng chung

Team không được tăng tốc bằng cách tạo backend, auth, billing, certificate hoặc data store riêng cho từng surface. Tốc độ phải đến từ việc đóng một lần các dịch vụ dùng chung rồi tái sử dụng cho toàn bộ catalog:

```text
Identity + Tenancy
  -> Payment + Entitlement
  -> AI Provider Gateway
  -> Workflow + Job + Approval
  -> Memory + Vault
  -> Evidence + Receipt + Verify
  -> Analytics + Cost + Support + Incident
  -> Web / Console / Edu / Invest / future surfaces
```

### 1.3 Không đổi các lock hiện hành

- Nguyen AI là hệ độc lập theo QD-2026-07-08-01.
- Mọi model AI chỉ đi qua `aiagent.iai.one` theo decision 2026-07-16.
- Không có direct OpenAI, Anthropic, Google hoặc vendor credential trong Nguyen AI runtime.
- Academy trả phí riêng hoàn toàn; không gắn mặc định vào AI Computer subscription.
- Scholarship, project grant và investment là ba luồng riêng.
- Production deploy chỉ qua manual gate, protected environment và Founder/release approval.

---

## 2. Current truth audit

### 2.1 Đỏ trước

| ID | Finding hiện tại | Evidence tươi | Release impact |
|---|---|---|---|
| R-P0-01 | Production secret audit FAIL | `audit:secrets:production`: `JWT_SECRET` thừa trên auth/api; chưa có commerce secret group hoàn chỉnh | Cấm commercial GO |
| R-P0-02 | Webhook replay không durable | `apps/api/src/webhook-replay.ts` dùng module-level `Map`; comment yêu cầu KV cho production | Có nguy cơ xử lý trùng và grant entitlement trùng |
| R-P0-03 | Subscription store chưa persistent | `@nai/entitlement` mặc định `InMemorySubscriptionStore`; `initStores()` chỉ nối D1 cho entitlement, không nối subscription | Subscription mất hoặc lệch giữa Worker isolates |
| R-P0-04 | VNPay refund là simulated success | `createVnPayRefund()` trả `status: refunded` mà không gọi/sign provider | Có thể ghi hoàn tiền giả |
| R-P0-05 | PayOS refund fail-open | Lỗi/missing config rơi xuống simulated `status: refunded` | Có thể xác nhận refund khi provider thất bại |
| R-P0-06 | Payment E2E hiện là simulation | `tests/e2e/payment-entitlement-refund-e2e.ts` dùng in-memory stores và simulated gateway responses | 47 test pass không chứng minh giao dịch production |
| R-P0-07 | Authz production journey chưa có packet | OAuth begin/HTTP boundary không chứng minh verify, role, tenant, revoke | Cấm private/commercial claims |
| R-P0-08 | AI Provider mới xanh static | `audit:ai-provider` PASS; chưa có Team A exit + authenticated chat + usage/evidence reconciliation | Chưa được claim AI runtime operational |
| R-P0-09 | Edu final exit còn mở | Certificate verify placeholder; scholarship/Academy entitlement/content journey chưa đủ E2E | Không publish Edu operational claim |
| R-P0-10 | Monitoring và restore chưa chứng minh | Chưa có alert test + D1/R2 restore drill gắn SHA/deployment | Không có operational GO |
| R-P0-11 | Product reality/traction evidence chưa có | Chưa có canonical feature matrix, six live demos, paid-user evidence và unit economics | Không claim traction hoặc production feature |
| R-P0-12 | Legal/merchant/Founder gates còn mở | Merchant, entity/IP, refund/disclosure và commercial sign-off cần external approval | Cấm bật commerce công khai |

### 2.2 Xanh có giới hạn

| Check | Kết quả trên HEAD audit | Giới hạn của evidence |
|---|---|---|
| `bash tools/qa-loop.sh` | PASS: typecheck 0; build 91/91; audit 18/18; SEO build PASS; test 152/152 | Repo gate, không phải production journey |
| `pnpm run audit:ai-provider` | PASS | Static source gate, không xác minh gateway key/model/provider runtime |
| `pnpm run audit:security-p0` | PASS | Static P0 patterns, không thay pentest/live abuse test |
| Payment simulation test | PASS: 47/47 | In-memory + simulated gateways |
| Deploy workflow source | Có manual dispatch + `production` environment | Chưa chứng minh reviewer configuration và production run của HEAD này |
| HEAD và `origin/main` | Cùng `cca4d43...` tại thời điểm audit | Không chứng minh production đang chạy đúng SHA |

### 2.3 Phán quyết

Repo/build hiện xanh. Vận hành thương mại vẫn **HOLD**. Không dùng cụm “all green” nếu không ghi rõ “repo gates only”.

---

## 3. Status model bắt buộc

Mỗi feature chỉ có một trạng thái canonical trong release packet:

| Status | Định nghĩa |
|---|---|
| `LIVE_VERIFIED` | Production journey pass, có SHA, deployment ID, timestamp và evidence |
| `LIVE_UNVERIFIED` | Route/service online nhưng chưa qua journey tương ứng |
| `BETA` | Có user thật, giới hạn/cohort/support/known limitations công khai |
| `PREVIEW` | Có UI/code nhưng chưa được bán hoặc claim operational |
| `SIMULATED` | Mock, fixture, fake provider hoặc in-memory test path |
| `PLANNED` | Có kế hoạch nhưng chưa có implementation evidence |
| `BLOCKED` | Không được tiến hành/activate vì dependency hoặc external gate |
| `DISABLED` | Có code nhưng feature flag/kill switch đang tắt |

Không dùng một status chung cho cả repo. Phải tách source, test, deploy, live, commercial và legal truth.

---

## 4. Team topology và quyền chạy song song

| Team | Trách nhiệm | Có thể bắt đầu ngay | Không được tự quyết |
|---|---|---|---|
| Team 0 — Release/QA | Truth matrix, gates, evidence, release packet, stop/go | Có | Không tự ký Founder GO |
| Team 1 — Identity/Security | D1 session, OAuth, roles, tenancy, revoke, 2FA/private access | Có | Không tạo JWT auth mới |
| Team 2 — Commerce | Checkout, webhook, durable replay, subscription, refund, ledger, entitlement | Có | Không bật payment khi merchant/legal/secrets chưa đủ |
| Team 3 — AI Runtime/Data | Provider client, workflow/job, memory, vault, evidence, receipt, cost | Có | Không gọi vendor trực tiếp hoặc dùng Gen1 bridge giả provider |
| Team 4 — Product Journeys | Console/mobile/desktop flows và integration UI | Có, bằng feature flag | Không đánh dấu live nếu backend còn simulated |
| Team 5 — Edu/Scholarship | Academy Pass, content, progress, proof, certificate, scholarship | Có | Không bundle Academy vào subscription; không nhập nhằng grant/investment |
| Team 6 — SRE/DevSecOps | CI, observability, alert, backup, restore, rollback, incidents | Có | Không deploy production ngoài manual gate |
| Team 7 — Growth/Support | Onboarding, referral, CRM, support, demo, traction evidence | Chuẩn bị ngay | Không ghi paid user/revenue nếu thiếu payment record |
| Founder/Legal/Ops | Merchant, entity/IP, secrets, provider approval, protected env, GO | Song song | Là external authority |

Mỗi team phải dùng branch/PR riêng, khai báo files owned và dependency trước khi code để tránh ghi đè.

---

## 5. P0 — Operational foundation

P0 được chạy song song theo dependency graph. Không chờ một team hoàn thành toàn bộ mới cho team khác chuẩn bị, nhưng không activate downstream trước upstream exit gate.

### P0-A — Truth and release control

| ID | Việc | Owner | Dependency | Definition of Done |
|---|---|---|---|---|
| OP-P0-01 | Tạo `PRODUCT_REALITY_AUDIT.md` | Team 0 | None | Mọi public/console/edu/invest feature có một status canonical + evidence link |
| OP-P0-02 | Tạo `API_REALITY_MATRIX.md` | Team 0 | None | Route, auth, role, store, external dependency, test, prod status được map |
| OP-P0-03 | Tạo `FEATURE_STATUS_MATRIX.md` | Team 0 | OP-P0-01/02 | Không còn planned/simulated được render như live |
| OP-P0-04 | Thêm production durability audit | Team 0 + 2 + 3 | None | CI fail nếu production path dùng in-memory, simulated success hoặc silent fallback |
| OP-P0-05 | Thêm payment production audit | Team 0 + 2 | None | CI phát hiện refund mock, unsigned webhook, non-durable replay, incomplete state machine |
| OP-P0-06 | Bật protected production reviewers | Team 6 + Founder | GitHub admin | Có screenshot/settings evidence không lộ secret và test denied deployment |
| OP-P0-07 | Chuẩn hóa evidence packet | Team 0 | None | Template bắt buộc SHA, deployment ID, environment, command, output, journey, rollback |

### P0-B — Identity, authz and secrets

| ID | Việc | Owner | Dependency | Definition of Done |
|---|---|---|---|---|
| AUTH-P0-01 | Xác nhận không runtime consumer rồi gỡ `JWT_SECRET` khỏi auth/api production | Team 1 + Founder/Ops | Secret inventory | Production secret audit không còn unused/forbidden JWT; regression pass |
| AUTH-P0-02 | Email registration/verification/login E2E | Team 1 + QA | Valid email provider | User thật verify và tạo D1 session; token replay/expiry bị từ chối |
| AUTH-P0-03 | Google OAuth repeated login/linking E2E | Team 1 + QA | OAuth config | Lần 2 không tạo duplicate identity; state/nonce/redirect được validate |
| AUTH-P0-04 | Logout, revoke, expiry and immediate denial | Team 1 + QA | AUTH-P0-02 | Session cũ không truy cập API/private route sau revoke trong TTL đã khóa |
| AUTH-P0-05 | Role and tenant isolation matrix | Team 1 + QA | Roles + org data | Cross-tenant deny; private investor/Edu/admin roles deny đúng |
| AUTH-P0-06 | Cookie/CORS/CSRF production browser test | Team 1 + 4 | Deployed auth/api | Các subdomain hợp lệ hoạt động; origin ngoài allowlist và CSRF bị chặn |

### P0-C — Commerce and entitlement

| ID | Việc | Owner | Dependency | Definition of Done |
|---|---|---|---|---|
| PAY-P0-01 | Thay webhook replay `Map` bằng durable atomic store | Team 2 | KV/D1/DO decision | Hai request concurrent cùng event chỉ có một side effect; TTL 72h; multi-isolate test pass |
| PAY-P0-02 | Viết và nối persistent subscription store | Team 2 | D1 schema/migration | Restart/isolate change không mất subscription; lifecycle query/update pass |
| PAY-P0-03 | Xóa simulated refund success khỏi production | Team 2 | None | Missing config/network/provider error trả failed/pending, không bao giờ `refunded` giả |
| PAY-P0-04 | Hoàn thiện VNPay refund signing/API | Team 2 | Merchant sandbox | Request ký đúng, response/error mapped, webhook/reconciliation test pass |
| PAY-P0-05 | Hoàn thiện PayOS refund fail-closed | Team 2 | Gateway contract | Không fallback mock; idempotency và reconciliation pass |
| PAY-P0-06 | Payment/order/refund ledger persistent | Team 2 | DB migration | State transition hợp lệ, append-only audit, amount/currency/provider IDs lưu đầy đủ |
| PAY-P0-07 | Commerce secret group hoặc commerce OFF | Founder/Ops + Team 2 | Merchant decision | Secret-name audit PASS; nếu OFF thì checkout/API/claims bị tắt rõ ràng |
| PAY-P0-08 | Real sandbox checkout E2E | Team 2 + QA | PAY-P0-01..07 | Checkout -> signed webhook -> order paid -> entitlement -> receipt, không manual DB edit |
| PAY-P0-09 | Real sandbox refund/revoke E2E | Team 2 + QA | PAY-P0-08 | Provider refund confirmed -> ledger -> entitlement revoke -> receipt/audit |
| PAY-P0-10 | Academy standalone entitlement test | Team 2 + 5 | Persistent entitlement | AI Computer plan không tự grant Academy; Academy purchase không tự grant machine plan |

### P0-D — AI Provider and product data plane

| ID | Việc | Owner | Dependency | Definition of Done |
|---|---|---|---|---|
| AI-P0-01 | Team A versioned gateway contract | Team A | Provider ownership | Auth, request/response, error, model map, quota, usage, timeout, trace, privacy documented |
| AI-P0-02 | Team A staging/prod exit packet | Team A + Founder | AI-P0-01 | Gateway health, key validity, model call, outage behavior, owner sign-off |
| AI-P0-03 | Authenticated chat E2E | Team 3 + QA | AUTH-P0 + AI-P0-02 | Session -> entitlement -> provider -> result -> usage -> evidence -> audit |
| AI-P0-04 | Cost and quota reconciliation | Team 3 + 2 | AI-P0-03 | Provider usage, internal usage and account entitlement reconcile deterministically |
| AI-P0-05 | Provider outage fail-closed | Team 3 + 6 | AI-P0-03 | No mock/Gen1/direct vendor fallback; user sees safe error; incident emitted |
| DATA-P0-01 | Durable workflow/job state | Team 3 | DB/queue | Retry/cancel/status survive Worker restart; idempotent job creation |
| DATA-P0-02 | Durable memory and vault | Team 3 | D1/R2 + encryption | Tenant isolation, retention, upload/download/delete and malware/size policy pass |
| DATA-P0-03 | Evidence/receipt/verify chain | Team 3 | Signing key + persistent records | Receipt immutable, public verify exposes allowed metadata only, revoke works |
| DATA-P0-04 | Remove production in-memory rate limiting/circuit state where correctness depends on it | Team 3 + 6 | KV/DO decision | Multi-isolate tests; no bypass from isolate rotation |

### P0-E — Edu, scholarship and certificate

| ID | Việc | Owner | Dependency | Definition of Done |
|---|---|---|---|---|
| EDU-P0-01 | Academy Pass checkout and entitlement boundary | Team 5 + 2 | PAY-P0 | Standalone purchase, deny without pass, no bundled subscriber copy |
| EDU-P0-02 | Persistent enrollment/progress/quiz/proof | Team 5 | DATA-P0 | Correct track/lesson; attempts, score, proof, cohort and reviewer survive restart |
| EDU-P0-03 | Certificate issuance and verify | Team 5 + 3 | EDU-P0-02 + DATA-P0-03 | Deterministic ID, evidence/rubric/version/revoke status, public verify E2E |
| EDU-P0-04 | Scholarship seven-choice/nine-step workflow | Team 5 | Identity + DB | Application, evidence, review, decision, grant, audit and appeal statuses pass |
| EDU-P0-05 | Separate scholarship/project grant/investment | Team 5 + Legal | EDU-P0-04 | API/data/copy/role/reporting do not merge the three flows |
| EDU-P0-06 | Five levels and selected pilot mapping | Team 5 | Education locks | Journey maps level, pillar, program, route, API, data, role, evidence and claim |
| EDU-P0-07 | Remove placeholder/free operational claims | Team 5 + 0 | Reality matrix | Public copy matches current status; Academy remains standalone-paid |

### P0-F — Operations, legal and release

| ID | Việc | Owner | Dependency | Definition of Done |
|---|---|---|---|---|
| SRE-P0-01 | Structured logs, traces and key metrics | Team 6 | Services deployed | Auth/payment/provider/job/error/latency/cost have correlation IDs and dashboards |
| SRE-P0-02 | Alert test | Team 6 | SRE-P0-01 | Synthetic failure creates alert, owner acknowledges, incident record closes |
| SRE-P0-03 | D1/R2 backup policy and restore drill | Team 6 | Data inventory | Restore into isolated env, integrity checks pass, RTO/RPO recorded |
| SRE-P0-04 | Rollback drill | Team 6 + 0 | Manual deploy gate | Exact deployment rollback tested without deleting production data |
| LEGAL-P0-01 | Merchant/entity/IP/refund/privacy/disclosure review | Founder + Legal | Canonical legal docs | Written decision and public copy approved; unresolved claims disabled |
| RELEASE-P0-01 | Six critical production journeys | Team 0 + all | All P0 lanes | Auth, payment, AI, workflow, Edu cert, refund/incident pass on same deployment |
| RELEASE-P0-02 | Founder release verdict | Founder | RELEASE-P0-01 | Signed GO/BETA/HOLD tied to exact SHA and deployment IDs |

---

## 6. P1 — Three proof journeys and shared product shell

P1 implementation may be prepared behind feature flags while P0 runs. P1 cannot be marked live before the P0 services it consumes pass.

### Journey A — Hồ sơ năng lực và tìm việc

```text
register -> verify -> assessment -> 90-day map -> portfolio
-> application/interview -> export -> receipt -> verify
```

DoD:

- mobile and desktop pass;
- autosave and resume pass;
- user owns/export/deletes their data;
- result links back to source/evidence where applicable;
- entitlement/quota/cost recorded;
- receipt publicly verifiable without exposing private content;
- accessibility keyboard/focus/screen-reader evidence attached.

### Journey B — Làm một sản phẩm thật

```text
choose field/task -> research -> create -> feedback -> revise
-> submit/publish -> receipt -> verify
```

DoD:

- every AI call goes through `aiagent.iai.one`;
- job and draft state survive restart;
- approval is required before destructive/public action;
- evidence distinguishes generated, user-provided and sourced material;
- publish failure is retryable and idempotent;
- final artifact and receipt can be revoked/versioned.

### Journey C — Khởi động một dự án nhỏ

```text
describe problem -> identify users -> prototype -> 30-day plan
-> content -> budget -> test -> report -> receipt
```

DoD:

- budget is analysis, not licensed financial advice;
- project membership and tenant boundaries pass;
- tasks, files, decisions and approvals are persistent;
- report contains assumptions, evidence and unresolved risks;
- support/escalation path is visible;
- end-to-end runs on mobile and desktop.

### Shared journey gate

Không duplicate logic giữa ba journeys. Chúng phải dùng chung identity, entitlement, provider, job, memory, vault, evidence, receipt, analytics và support services.

---

## 7. P2 — Activate the full catalog without reduction

Sau khi shared platform và ba proof journeys đạt gate, team kích hoạt theo wave. Wave là thứ tự vận hành, không phải thay đổi phạm vi.

| Wave | Scope giữ nguyên | Điều kiện mở |
|---|---|---|
| Wave 1 | Start, Personal, Creator; Office/Research/Content/Evidence; three youth journeys | P0 + P1 pass; unit economics cho các entitlement này |
| Wave 2 | Family, Founder; Family/heritage, Founder OS, Code, Media, Browser | Privacy/multi-member/project evidence + support capacity |
| Wave 3 | Business, Chapter; Business OS, Sales, Automation, Community/Trust/Network | Organization roles, seats, billing, audit, SLA and data isolation |
| Wave 4 | Enterprise, Sovereign, custom integrations | Security/legal/procurement/SLA/dedicated deployment review |
| Parallel Edu | Full Education catalog, Academy, certification, scholarship | Edu P0 gate per each published program/level |
| Parallel Invest | Public portal + qualified private room | Legal review + server-side authz + expiry/revoke/audit |

Không xóa code hoặc product entries chỉ vì chưa tới activation wave. Các mục chưa qua gate mang status `PREVIEW`, `PLANNED`, `BLOCKED` hoặc `DISABLED`, không mang status live.

---

## 8. P3 — Beta, traction and commercial proof

### 8.1 30-day controlled beta

- 50 users invited;
- tối thiểu 20 payment records hợp lệ trước khi claim paid beta evidence;
- daily P0/P1 triage;
- weekly user interview and release review;
- activation, completion, retention, cost, refund and support tracked;
- stop criteria apply immediately when security, privacy, payment or data-integrity incident occurs.

### 8.2 Unit economics

Theo account/plan/product phải theo dõi:

- gross revenue and tax/fee treatment;
- payment gateway fees and refunds;
- AI provider cost;
- storage, queue, database and delivery cost;
- support/reviewer/mentor cost;
- contribution margin;
- quota and abuse cost.

Giá trong catalog được giữ nguyên làm source-of-truth hiện hành. Việc mở bán từng giá cần unit economics và Founder/commercial approval; team không tự thay giá để “tăng tốc”.

### 8.3 Live proof

Tối thiểu sáu video uncut trên production beta:

1. Signup, verification and real payment.
2. Journey A completion and receipt verify.
3. Journey B completion and artifact verify.
4. AI Provider controlled failure behavior.
5. Session revoke/role/tenant denial.
6. Refund, entitlement revoke and incident/audit trail.

Mỗi video ghi SHA, deployment ID, live URL, timestamp, anonymized account, receipt/payment evidence reference và feature status. Không quay prototype hoặc che lỗi quan trọng.

### 8.4 Traction claims

- Registration chỉ tính identity record hợp lệ.
- Activated user phải hoàn thành activation event đã định nghĩa.
- Paid user phải có reconciled payment record, không phải form submit.
- Revenue lấy từ ledger đã reconcile, không lấy từ checkout intent.
- Completed product phải có receipt/evidence.
- Retention tính theo cohort và thời gian khóa trước.
- Không dùng page view làm user, paid user hoặc traction.

---

## 9. Execution schedule

| Window | Must finish | Parallel work allowed |
|---|---|---|
| 0-24 giờ | Reality/API/feature matrix; owners; dependencies; commerce OFF until safe; open P0 PRs | All teams prepare tests/migrations/runbooks |
| 24-72 giờ | Durable replay/subscription; refund fail-closed; JWT removal packet; Team A contract packet; missing CI audits | Journey UI behind flags; Edu schema/content mapping |
| Ngày 4-7 | Authz E2E; payment sandbox E2E; authenticated AI E2E; memory/vault/receipt persistence | Observability, support, growth assets |
| Ngày 8-14 | Three journeys staging E2E; Edu cert/scholarship E2E; restore/rollback drills | Full catalog Wave 2 preparation |
| Ngày 15-30 | Controlled paid beta, six videos, support/incident operation, unit economics | Wave 2/3 readiness work behind gates |
| Ngày 31-90 | 300-user target execution only if evidence supports ramp; activate more catalog by wave gates | Enterprise/Chapter/Family/Edu expansion |

Ngày tháng không tự đóng task. Chỉ evidence và exit gate mới đóng task.

---

## 10. Verification commands

### 10.1 Commands đã tồn tại

```bash
pnpm install --frozen-lockfile
pnpm qa:loop
pnpm audit:secrets:production
pnpm audit:ai-provider
pnpm audit:security-p0
pnpm audit:edu-plan
pnpm audit:production-smoke
node --import tsx tests/e2e/payment-entitlement-refund-e2e.ts
```

Payment test cuối chỉ là simulation cho tới khi test file và evidence chỉ rõ real sandbox/live provider.

### 10.2 Gates team phải bổ sung

```text
audit:durability
audit:payment:production
audit:feature-status
test:e2e:authz
test:e2e:payment:sandbox
test:e2e:provider
test:e2e:journeys
test:e2e:academy-entitlement
test:e2e:certificate-verify
test:e2e:scholarship
test:e2e:receipt
test:e2e:restore
test:e2e:rollback
audit:traction-evidence
```

Các tên trên là required deliverables, chưa được claim là command đang tồn tại cho tới khi được thêm vào `package.json`, CI và pass trên clean checkout.

---

## 11. Mandatory handoff contract

Mỗi PR/team handoff phải có:

| Field | Required evidence |
|---|---|
| Scope | Work item IDs và user journey được phục vụ |
| Source | Branch, commit SHA, changed files |
| Architecture | Service/store/contract dùng chung; không tạo authority mới |
| Data | Schema/migration/rollback/retention/tenant policy |
| Security | Authn/authz/abuse/privacy/secret-name impact |
| Tests | Commands và output thật; phân loại unit/integration/sandbox/live |
| Deploy | Environment, project/account, deployment ID, timestamp |
| E2E | Actor, precondition, steps, expected/actual result, evidence |
| Failure | Known limitations, remaining blockers, kill switch |
| Rollback | Command/process và data consequence |
| Claims | Status/copy được phép publish |

Không đưa secret value, access token, bank credential hoặc private user data vào evidence.

---

## 12. Release kill criteria

Giữ hoặc chuyển về HOLD ngay nếu có một trong các điều kiện:

- production path còn simulated success hoặc correctness-critical in-memory state;
- payment webhook không durable/idempotent hoặc refund không reconcile;
- auth/session/role/tenant bypass;
- direct vendor AI call/key hoặc unauthorized fallback;
- Academy entitlement bị bundle sai;
- certificate/proof có thể giả, sửa hoặc verify sai;
- private investor/user data xuất hiện ở public route/log/sitemap;
- không restore được dữ liệu hoặc không rollback được deployment;
- production secrets audit fail;
- P0 security/privacy/legal unresolved;
- release packet không gắn exact SHA/deployment;
- Founder chưa ký verdict.

---

## 13. Final exit gates

### Paid beta operational

Chỉ được nói **“Nguyen AI paid beta is operational”** khi:

- P0 security/privacy correctness = 0 unresolved;
- auth/authz, payment/refund, AI, receipt và critical data persistence pass;
- three journeys pass mobile + desktop;
- at least 20 reconciled paid beta records;
- support, incident, monitoring, restore and rollback operational;
- no simulated feature marked live;
- Founder beta approval recorded.

### Verified early traction

Chỉ được nói **“Nguyen AI has verified early traction”** khi:

- payment records, revenue and refunds reconciled;
- cohort activation/completion/retention definitions locked;
- 300 paid records đạt mục tiêu hoặc Founder duyệt threshold thay thế;
- unit economics and support load reported;
- traction evidence passes audit;
- Founder approves the public claim.

### Full commercial GO

Full commercial GO cần toàn bộ P0/P1 release gates, legal/commercial approval và activation gate tương ứng cho từng product wave. Không có một lệnh build hoặc một workflow xanh nào tự cấp quyền GO cho toàn bộ catalog.

---

## 14. Immediate team command

Team bắt đầu ngay theo thứ tự:

1. Team 0 mở truth matrices và ba CI gates còn thiếu.
2. Team 1, 2, 3, 5 và 6 chạy song song các P0 lanes.
3. Team 4 xây ba journeys trên shared contracts, chỉ bật staging flags.
4. Founder/Ops/Legal đóng merchant, secrets, provider, protected environment và legal decisions song song.
5. Mỗi lane nộp evidence packet; Team 0 re-audit độc lập.
6. Chỉ sau P0 exit mới chạy production beta deployment.
7. Giữ toàn bộ catalog; kích hoạt nhanh theo wave khi shared platform đủ bằng chứng.

**Current allowed statement:** Repo gates pass on `cca4d43`; commercial operation remains HOLD while durable commerce, Authz, AI Provider, Edu, operations, legal and Founder gates are open.
