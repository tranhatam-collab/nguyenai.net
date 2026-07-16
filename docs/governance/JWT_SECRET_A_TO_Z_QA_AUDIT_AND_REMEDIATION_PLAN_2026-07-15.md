# JWT/Secret and A-to-Z QA Audit + Remediation Plan

**Ngày kiểm tra:** 2026-07-15  
**Phạm vi:** monorepo `nguyenai.net`, CI GitHub Actions, Workers `nguyenai-auth` và `nguyenai-api-gateway`, các production domain  
**Trạng thái phát hành:** **HOLD**  
**Tính ràng buộc:** BINDING cho mọi task security, auth, payment, deploy và release cho đến khi tài liệu này được thay thế bằng Founder decision mới.

**AI provider amendment:** Từ 2026-07-16, AI provider single source là `aiagent.iai.one`; xem `AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md` và `AI_PROVIDER_TWO_TEAM_BUILD_PLAN_2026-07-16.md`. Direct vendor keys trong Nguyen AI là blocker.

## 1. Phán quyết đỏ trước

Quy trình A-to-Z trong tài liệu Founder **chưa được áp dụng đầy đủ**. Repo có nhiều thành phần và gate tốt, nhưng chưa đạt điều kiện FULL PRODUCTION GO.

Các blocker đã được xác minh tươi:

1. Worktree hiện tại ở `91d0fa5`, đi trước `origin/main` (`cc580fb`) và còn nhiều file chưa commit. CI xanh của `cc580fb` không chứng minh worktree hiện tại xanh.
2. `pnpm audit:all` dừng ở accessibility với **107 violations**. Release gate hiện tại là đỏ.
3. Auth runtime dùng **opaque session trong D1 + cookie HMAC bằng `AUTH_SECRET`**, không dùng JWT. `JWT_SECRET` tồn tại trên Auth Worker nhưng không có runtime consumer.
4. OAuth callback có ba stub che implementation D1 thật (`findOAuthAccount`, `createOAuthAccount`, `findUserByEmailVerified`). Bản sửa đã nối lại implementation D1 trong worktree này, nhưng chưa được deploy và chưa có production E2E lặp lại.
5. Sau khi khóa đúng production account, API Worker có `AUTH_SECRET`, `EVIDENCE_SIGNING_KEY`, `RESEND_API_KEY`. Chưa có một payment group hoàn chỉnh hoặc LLM provider key.
6. Workflow trên `origin/main` dùng Trivy `exit-code: 0` và Grype `fail-build: false`. Worktree này đã đổi sang fail-closed, nhưng chưa có CI run chứng minh cấu hình mới hoạt động.
7. Chưa có bằng chứng tươi cho payment E2E, auth revoke/role/tenant E2E, performance/Core Web Vitals, browser matrix, monitoring alert thật, restore drill hoặc rollback drill.
8. Push vào `main` trước đây tự deploy production trong khi `AGENTS.md` ghi production chưa approved. Workflow đã được đổi trong worktree này để deploy chỉ chạy khi manual dispatch có `deploy_production=true` và protected `production` environment; thay đổi chưa có hiệu lực cho đến khi merge và cấu hình reviewer trên GitHub.
9. AI provider audit ngày 2026-07-16 FAIL: direct vendor path còn trong API/`@nai/prism`; chưa có `AI_PROVIDER_GATEWAY_URL` hoặc `AI_PROVIDER_API_KEY`; chưa có Team A provider contract và Team B integration E2E.

Không được dùng các câu “JWT auth ready”, “A-to-Z completed”, “all green”, “go-live ready” hoặc “production-ready” cho trạng thái hiện tại.

### Thay đổi thực hiện trong phiên audit này

| Thay đổi | Trạng thái verify tươi |
|---|---|
| Thay ba OAuth persistence stub bằng implementation D1 thật | Auth TypeScript PASS; test module 2/2 PASS; Wrangler dry-run PASS; production OAuth E2E chưa chạy |
| Khóa `account_id` cho API Worker | Static secret-governance PASS; production secret list đọc đúng account |
| Thêm secret inventory + static/dynamic audit | Static PASS; production audit FAIL đúng 3 blocker |
| Chuyển deploy production sang manual approval input + `production` environment | YAML parse PASS; chưa merge/chưa kiểm tra GitHub environment reviewer |
| Chuyển Trivy/Grype sang fail-closed | YAML parse PASS; chưa có CI run mới |
| Đánh dấu các báo cáo 11-13/7 là historical | Diff check trên các file audit PASS |
| Live availability smoke | 11 checks PASS; không phải critical-journey E2E |

Full monorepo typecheck/test đã được khởi chạy nhưng Turbo không phát task output và không hoàn tất trong cửa sổ kiểm tra; tiến trình đã bị dừng. Không được ghi full typecheck/test PASS cho worktree này. Full `audit:all` đã FAIL trước đó ở accessibility với 107 violations.

## 2. Bản đồ auth và secret chuẩn

### 2.1 Auth model canonical

```text
Browser
  -> nguyenai_session=<opaque session_id>.<HMAC>
  -> AUTH_SECRET verifies cookie integrity
  -> D1 sessions verifies existence, expiry, revocation, audience and roles
  -> protected API performs server-side authorization
```

`JWT_SECRET` không thuộc auth model này. Nếu sau này chuyển sang JWT, team phải có Founder architecture decision, threat model, claim contract, key rotation/overlap plan, revocation model, migration và E2E riêng trước khi thêm runtime consumer.

### 2.2 Production secret names xác minh ngày 2026-07-15

Không ghi hoặc xuất secret values trong evidence.

| Worker | Secret names quan sát được | Phán quyết |
|---|---|---|
| `nguyenai-auth` | `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `RESEND_API_KEY` | Core/OAuth/email có tên; `JWT_SECRET` thừa và phải gỡ sau khi xác nhận không có consumer |
| `nguyenai-api-gateway` | `AUTH_SECRET`, `EVIDENCE_SIGNING_KEY`, `RESEND_API_KEY` | Core/email fallback có; commerce/AI chưa đủ |

Lần list đầu tiên trước khi sửa `apps/api/wrangler.jsonc` trả về một account khác và cho thấy `PAY_NAI_HMAC`. Đây không phải evidence production. Sau khi thêm locked `account_id`, list production mới cho kết quả trong bảng trên. Bài học bắt buộc: mọi Cloudflare evidence phải chứng minh account ID trước khi đọc project/secret state.

Nguồn chuẩn machine-readable: `config/secret-governance.json`.

### 2.3 Quy tắc secret bắt buộc

- Không lưu secret trong Git, `.env` tracked, `wrangler.jsonc`, log, chat, screenshot, ticket hoặc release evidence.
- “Secret name có trên dashboard” chỉ chứng minh cấu hình tên, không chứng minh giá trị đúng hoặc flow hoạt động.
- `AUTH_SECRET` phải cùng giá trị trên Auth và API, nhưng evidence không được in giá trị.
- Mỗi mục đích phải có key riêng. Cấm tái dùng auth, evidence, webhook, payment hoặc provider key.
- Rotation phải ghi owner, reason, timestamp, affected environments, invalidation behavior, smoke result và incident link nếu có.
- Secret thừa phải xóa. Secret bắt buộc nhưng thiếu phải chặn feature/release tương ứng.
- Production secret audit: `pnpm audit:secrets:production`.
- Static governance audit: `pnpm audit:secret-governance`.

## 3. Ma trận áp dụng 23 giai đoạn A-to-Z

| Giai đoạn | Trạng thái | Bằng chứng hiện có | Thiếu để PASS |
|---|---|---|---|
| 0 Governance/SOT | PARTIAL | `AGENTS.md`, decision log, governance locks | Ownership/change-control/release authority còn phân tán; worktree chưa baseline |
| 1 Product definition | PARTIAL | product catalog, pricing, education plans | AC + owner + test method chưa map đủ cho mọi feature; commerce/legal chưa sign-off |
| 2 Architecture | PARTIAL | unified subdomain, technical architecture, independence plan | C4/data/API/auth diagrams chưa đồng bộ hoàn toàn với independence lock và runtime hiện tại |
| 3 Security foundation | FAIL | security P0 audit, gitleaks/semgrep workflows | OAuth stub; unused JWT secret; vuln gates fail-open; full threat model/E2E authz chưa đóng |
| 4 Data governance | PARTIAL | classification, retention, privacy map, D1 migrations | deletion/export E2E; restore drill; encryption/backup evidence |
| 5 Design/UX | PARTIAL | brand V3, UI token lock | 107 accessibility violations; UX state registry và device QA chưa đủ |
| 6 Content/bilingual | PARTIAL | bilingual routes and audits | Current dirty Edu content chưa qua full gate; manual language quality chưa sign-off |
| 7 Development workflow | FAIL | CI, pnpm/turbo, audit scripts | Direct push previously auto-deployed; dirty baseline; review/staging/feature-flag gates chưa enforce đầy đủ |
| 8 Code quality | FAIL | typecheck/test/build infrastructure | Current full audit đỏ; lint ở nhiều package chỉ `echo noop`; dependency gates chưa fail-closed |
| 9 API/integration | FAIL | route tests and local contract tests | timeout/retry/idempotency/provider-down/payment webhook/replay/refund E2E chưa đủ |
| 10 Database verification | PARTIAL | D1 migrations and schema | down/rollback, checksum/reconciliation, concurrency and restore evidence thiếu |
| 11 Auth/Authz E2E | FAIL | session-auth regression; OAuth redirect probe | real repeated OAuth, logout/revoke, expired session, role change, disable, escalation and tenant isolation chưa có evidence |
| 12 Frontend QA | FAIL | static audits and HTTP probes | browser/device matrix, real form flows, offline/loading/error states and screen-reader checks thiếu |
| 13 Accessibility | FAIL | automated script | 107 current violations; axe/Pa11y/Lighthouse + manual keyboard/VoiceOver chưa pass |
| 14 SEO/discoverability | PARTIAL | hreflang/canonical/sitemap audits on older CI | re-run on current commit; live broken-link/indexation evidence; current Edu changes chưa verified |
| 15 Performance | NOT VERIFIED | no current evidence pack | CWV, bundle/image/API/DB/cache measurements and budgets |
| 16 Infra/deployment | PARTIAL | Cloudflare Pages/Workers live, CI deploy | staging parity, readiness, immutable promotion, verified rollback; manual production gate must be merged |
| 17 Observability | NOT VERIFIED | health endpoints and manual smoke | uptime/error/log/trace/payment/auth/DB/backup/cost alerts with test event |
| 18 Backup/restore/DR | FAIL | historical D1 export claim | daily/off-site/encrypted policy, retention, staging restore, RPO/RTO and drill evidence |
| 19 Legal/compliance | PARTIAL | privacy/legal/investor docs | counsel/entity/IP/payment/refund/cookie/age/data-deletion sign-off; public investor gate review |
| 20 Release readiness | FAIL | historical evidence packets | current SHA evidence, known risks, rollback/support plans, all P0/P1 closed, Founder verdict |
| 21 Controlled launch | NOT IMPLEMENTED | production surfaces are already public | cohort stages, traffic ramp, metrics thresholds, stop/rollback criteria |
| 22 Operations | PARTIAL | incident policies and some runbooks | account/payment recovery, backup restore, support escalation, schedules and named on-call owner |

## 4. Backlog bắt buộc P0 -> P1 -> P2

P0 phải đóng trước P1. P1 phải đóng trước P2. Không dùng build pass hoặc sprint date để bỏ thứ tự.

### P0 - Chặn sai auth, secret, deploy và release

| ID | Nhiệm vụ | Owner | Verify/DoD |
|---|---|---|---|
| AZ-P0-01 | Baseline repo: quyết định phạm vi các commit Edu local, commit/review hoặc tách branch; không để dirty worktree làm release source | Tech lead | `git status --short` sạch; SHA khớp review và CI |
| AZ-P0-02 | Merge OAuth D1 fix; thêm test login Google lần 1, lần 2, link email đã verify, không tạo duplicate user | Auth team | D1 row assertions + browser E2E + logout/relogin pass |
| AZ-P0-03 | Gỡ `JWT_SECRET` khỏi production Auth Worker sau Founder/ops confirmation; cập nhật evidence là unused removal, không gọi là JWT rotation | Founder/Ops | `wrangler secret list` không còn `JWT_SECRET`; auth login/session vẫn pass |
| AZ-P0-04 | Cấu hình secret group đúng sản phẩm: API email; một payment group hoàn chỉnh; AI Provider Gateway group (`AI_PROVIDER_API_KEY`) do `aiagent.iai.one` cấp; không có vendor key trực tiếp trong Nguyen AI | Founder/Ops | `pnpm audit:secrets:production` pass, `pnpm audit:ai-provider` pass, không lộ values |
| AZ-P0-05 | Sửa toàn bộ 107 accessibility violations và chạy manual keyboard/focus smoke cho critical routes | Frontend/QA | `pnpm audit:accessibility` exit 0 + manual evidence |
| AZ-P0-06 | Auth/Authz production E2E: signup, email verify, Google OAuth, protected route, logout, expiry, revoke, role deny, tenant isolation | Auth/Security/QA | evidence gắn production deployment ID và test accounts |
| AZ-P0-07 | Commerce/legal gate: xác nhận merchant/entity/refund/disclosure; checkout -> signed webhook -> order -> entitlement -> receipt -> refund/revoke, replay-safe | Payment/Legal/QA | real provider test-mode E2E, duplicate/replay/invalid signature tests |
| AZ-P0-08 | Chuyển Trivy/Grype sang fail-closed; scanner unavailable hoặc result missing phải fail | Security/DevOps | intentional vulnerable fixture bị CI chặn; clean branch pass |
| AZ-P0-09 | Merge manual production deploy gate; cấu hình GitHub `production` environment reviewer; cấm push auto-deploy | DevOps/Founder | push chỉ verify; manual approved dispatch mới deploy |
| AZ-P0-10 | Tạo release packet mới cho đúng SHA/environment; xóa claim kế thừa từ `d7a9c67`/`cc580fb` | Release/QA | six required release docs + exact CI URLs + live E2E + Founder verdict |

### P1 - Chất lượng vận hành và dữ liệu

| ID | Nhiệm vụ | Owner | Verify/DoD |
|---|---|---|---|
| AZ-P1-01 | Hoàn thiện lint thật, environment validation, dead-code/duplicate/complexity policy | Platform | không còn `lint: echo noop` trong release scope; lint exit 0 |
| AZ-P1-02 | DB migration rollback/reconciliation, unique constraints, transaction/race/duplicate tests | Data | migration staging + rollback + row count/checksum evidence |
| AZ-P1-03 | D1/R2 backup policy, encrypted off-site copy, retention, staging restore, RPO/RTO | Data/Ops | restore drill đọc được business records và audit archive |
| AZ-P1-04 | Observability: structured request/trace IDs, uptime, error, auth, payment, webhook, DB, backup and cost alerts | SRE | synthetic incident tạo alert, owner nhận và ack trong SLA |
| AZ-P1-05 | Browser/device/frontend state matrix cho web/edu/app/invest | Frontend/QA | Chrome/Safari/Firefox/Edge/iOS/Android evidence; no critical UX defect |
| AZ-P1-06 | Performance budgets và live CWV/API/DB measurements | Performance | LCP/INP/CLS budgets pass hoặc risk accepted có owner/date |
| AZ-P1-07 | Data deletion/export/consent/age/cookie flows | Privacy/Legal/Engineering | user request E2E + audit record + retention deletion proof |
| AZ-P1-08 | Certificate/proof issuance và public verify không placeholder | Edu/Proof/QA | issue -> verify -> revoke -> verify revoked E2E |
| AZ-P1-09 | Sửa project-name drift `nai-invest`/`nguyenai-invest` trong AGENTS, deploy scripts và Cloudflare bằng Founder decision duy nhất | DevOps/Governance | one canonical name in config/docs/dashboard evidence |

### P2 - Controlled launch và vận hành liên tục

| ID | Nhiệm vụ | Owner | Verify/DoD |
|---|---|---|---|
| AZ-P2-01 | Controlled launch stages: internal -> team -> Founder -> pilot -> soft launch -> gradual -> full | Product/SRE | mỗi stage có cohort, metric, stop and rollback criteria |
| AZ-P2-02 | Hoàn thiện incident, payment/account recovery, support escalation and public status runbooks | Ops/Support/Security | tabletop exercise và owner acknowledgement |
| AZ-P2-03 | Lịch rotation, dependency update, access review, vuln scan, content/legal/cost review | Ops/Governance | recurring calendar + evidence retention location |
| AZ-P2-04 | Quarterly restore, rollback, auth compromise and payment replay drills | Security/SRE/Data | drill reports gắn commit/environment, findings có owner/due date |
| AZ-P2-05 | Post-launch product metrics và feedback loop theo từng user journey | Product/Data | dashboard có denominator và decision rule, không dùng phần trăm mơ hồ |

## 5. Release kill criteria

Phán quyết bắt buộc là `NO-GO` hoặc `HOLD` nếu có một trong các điều kiện:

- `audit:all`, typecheck, build, test hoặc security scan đỏ;
- dirty/unreviewed release baseline;
- auth hoặc authorization critical journey chưa E2E;
- payment launch nhưng chưa signed-webhook/replay/refund E2E;
- hard-coded/leaked/unused ambiguous secret chưa xử lý;
- 1 P0/P1 security hoặc legal blocker còn mở;
- không có monitoring alert, restore evidence hoặc rollback path;
- evidence không gắn đúng commit, deployment và environment;
- Founder chưa sign-off.

## 6. Lệnh verify chuẩn

```bash
pnpm audit:secret-governance
pnpm audit:secrets:production
pnpm audit:security-p0
pnpm audit:all
pnpm typecheck
pnpm build
pnpm test
pnpm go-live:live
```

`pnpm go-live:live` chỉ là HTTP/smoke gate hiện tại, không thay cho auth, payment, backup, monitoring hoặc browser E2E.

## 7. Điều kiện đóng tài liệu này

Chỉ thay `HOLD` bằng `GO` khi:

1. P0 và P1 trong release scope đều đóng bằng evidence tươi;
2. release packet gắn exact SHA + Cloudflare deployment IDs + production timestamp;
3. critical journeys pass trên production;
4. monitoring, restore và rollback được thử thật;
5. legal/payment/privacy sign-off hoàn tất;
6. Founder ký verdict.

Không có quy trình trung thực nào bảo đảm phần mềm “không còn bất kỳ lỗi nào”. Chuẩn chấp nhận là: không còn lỗi nghiêm trọng đã biết trong release scope, rủi ro còn lại có owner/mitigation, và hệ thống có khả năng phát hiện, phục hồi, rollback và hỗ trợ người dùng.
