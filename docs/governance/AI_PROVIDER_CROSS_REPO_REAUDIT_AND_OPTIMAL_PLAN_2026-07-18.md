# QA Re-audit Cross-Repo va Phuong An Toi Uu

**Ngay:** 2026-07-18  
**Trang thai tai lieu:** `PROPOSED_FOR_FOUNDER_APPROVAL`  
**Pham vi:** `nguyenai.net` + `aiagent.iai.one` + live read-only probes  
**Nguyen AI HEAD:** `0bad2ad688b5473de4a3a4ee6d6c1058fa230e46` (`main`, khop `origin/main`)  
**AI Provider source HEAD:** `80607bd5372a2e80d291032c11ac3485fcc41ed7` tren branch `OMCODE/upload-bien-tap-sach-2026-06-20` cua repo cha `AI.OMDALA.COM`  
**Verdict:** `HOLD` cho commercial/full production; `NO_GO` cho AI Provider cutover; chi `PARTIAL_PASS` cho repo gates Nguyen AI.

Tai lieu nay la ket qua QA doc lap. No khong tu cap Founder approval, khong tu thay doi production va khong duoc dung de claim `all green`, `production-ready` hoac `P0=0`.

## 1. Phan quyet do truoc

Bao cao `aiagent.iai.one/QA_AUDIT_2026-07-18.md` dung o mot so inventory route/model, nhung verdict `CONDITIONAL_GO` khong du co so. Production hien tai con mot auth bypass da verify live, source-to-deploy lineage khong chung minh duoc, CI cua AI Provider khong phai workflow hop le o git root, va contract voi Nguyen AI chua tuong thich.

Commit Nguyen AI `0bad2ad` cai thien nhieu diem, nhung 7 muc P0 duoc claim `fixed` khong dong nghia 7 exit gate da dong. Fresh source review phat hien nhieu loi logic ma 152 Turbo test va 19 static audits khong bat duoc.

## 2. Evidence da verify trong phien nay

| Layer | Evidence | Ket qua |
|---|---|---|
| Nguyen AI source | `git rev-parse HEAD`, `git status`, `git show 0bad2ad` | HEAD/origin main = `0bad2ad`; worktree clean luc audit |
| Nguyen AI typecheck | `pnpm typecheck` | PASS, 182/182 Turbo tasks; phan lon cache hit |
| Nguyen AI test | `turbo test --output-logs=errors-only` | PASS, 152/152 Turbo tasks; coverage logic van thieu |
| Targeted tests | training gateway, AI provider client, model gateway | PASS; deu local/mock, khong goi provider live |
| Static gates | AI provider, Edu plan, production durability | PASS |
| Production secret-name gate | `pnpm audit:secrets:production` | FAIL: `JWT_SECRET` auth+api, commerce group thieu |
| Secret-name hygiene | `wrangler secret list` name-only | API co alias `AUTH_SECRET` kem 2 x `U+2028` va `EVIDENCE_SIGNING_KEY` kem `U+2028` |
| AI Provider local | typecheck, 9 tests, web build | PASS; 9 tests chi la helper/source-regex, khong E2E |
| AI Provider git identity | git root/remote/branch/HEAD | Source nam trong repo cha `AI.OMDALA.COM`; subproject khong co release lineage doc lap |
| AI Provider live health | GET `/v1/health`, `/v1/health/deep`, `/v1/models` | HTTP 200; CORS `*`; deep health van co `providers: []` |
| AI Provider live auth guard | unauthenticated GET service-key list | **HTTP 200**, auth bypass production con ton tai |
| Nguyen AI live | GET `/health`, `/v1/health`, `/v1/models` | `/health` 200; `/v1/health` 404; model response van expose direct vendor mapping |
| Hamicode live | GET `/v1/health` | HTTP 404; khong phai Nguyen AI release blocker |

Fresh `audit:all` duoc khoi chay nhung session output khong thu duoc exit cuoi sau khi chay dai. QA Loop #32 trong commit ghi PASS 19/19, nhung tai lieu nay khong nang no thanh fresh independent proof. Cac targeted gate tren moi la ket qua co exit code doc duoc trong phien nay.

### 2.1 Concurrent worktree addendum

Trong khi audit dang chay, mot agent/phase khac tao `CROSS_REPO_AUDIT_aiagent_nguyenai_2026-07-18.md` va sua `apps/api/wrangler.jsonc` sang `https://api.aiagent.iai.one`. Thay doi URL nay dung huong nhung dang la **dirty uncommitted worktree**, khong phai commit, CI artifact hay deployed proof.

Bao cao song song khong duoc chap nhan lam status-of-record vi co cac loi:

- claim `nguyenai-auth` khong co route bi live GET `https://auth.nguyenai.net/health` bac bo: HTTP 200, service `nai-auth`;
- claim toan bo `aiagent.iai.one` untracked da stale: 225 source files trong `apps/packages/services/scripts/tools` dang tracked trong repo cha;
- coi `academy.pass="custom"` la standalone-paid hop le, trai rule bat buoc khong bundled;
- coi route receipt la internal chi vi body co `gateway_response`, trong khi route van chi require user session;
- coi replay claim la da dong ma bo qua stuck `processing`, refund va reconciliation;
- ghi `Founder decisions (da xac nhan)` va map `orion-research` khi khong co decision evidence trong phien nay;
- ghi `P0-A FIXED trong commit nay` trong khi file sua van uncommitted.

Vi vay worktree sau concurrent change khong con clean. Tai lieu nay tiep tuc dung committed HEAD `0bad2ad` lam baseline va ghi dirty delta rieng, khong tron hai lop truth.

## 3. Dinh chinh bao cao AI Provider hien tai

### P0-A1. Production service-key admin route van bypass auth

Read-only probe khong co `X-Admin-Key`:

```text
GET /v1/admin/tenants/audit-probe-nonexistent/service-keys
HTTP 200
{"ok":true,...,"keys":[]}
```

Local source moi da them `adminAuthorized`, nhung live bundle chua co guard tuong ung. Day la bang chung truc tiep rang local source va deployed Worker khong cung release truth.

**Action:** containment ngay; chan route tai edge/feature flag hoac deploy ban guard da verify qua staging. Khong duoc cho phep tao/revoke key tren live cho toi khi negative tests PASS.

### P0-A2. AI Provider CI khong phai CI hop le cua repo

- Git root thuc te la `/Users/tranhatam/Documents/Devnewproject`.
- Workflow nam tai `aiagent.iai.one/.github/workflows/ci.yml`; GitHub chi doc `.github/workflows` o git root.
- Git root chi co workflow `deploy-maytinhai.yml`; vi vay workflow AI Provider dang khong duoc GitHub chay nhu team tuong.
- Workflow con co placeholder cho accessibility, P0 security, independence va performance.
- Workflow tu dong migrate/deploy khi push `main`, khong co protected manual production approval.
- `audit-direct-calls` cam direct vendor URL ngay trong provider core, trai vai tro Team A la noi duy nhat duoc phep giu vendor adapters.

**Action:** tach `aiagent.iai.one` thanh canonical repo doc lap co lich su, hoac chuyen workflow len git root voi working-directory dung. Phuong an toi uu la repo doc lap de co branch protection, artifact provenance va release SHA ro rang.

### P0-A3. Tenant resolution fail-open

`resolveTenant()` fallback ve tenant `aiagent` neu host/origin khong khop. Host la tenant boundary thi unknown host phai bi tu choi, khong duoc gan vao tenant mac dinh.

**Action:** fail closed `421/403`; tenant phai duoc resolve tu authenticated service credential + host/audience allowlist. Them `nguyenai-net` sau khi contract lock, khong merge authority cua Nguyen AI vao Provider Gateway.

### P0-A4. Provider credential model bi trung va chua wire

Code co hai he key:

- `sk-aiagent-*` duoc middleware `/v1/chat` validate va dung de service-to-service;
- `iai-svc-*` duoc admin route tao, nhung `validateServiceKey()` khong co call site trong chat path.

**Action:** chon mot canonical credential format; hash, scope, tenant, audience, expiry, rotate, revoke va audit phai chung mot store/contract. Xoa hoac migrate he key con lai.

### P0-A5. Contract Team A va Team B khong tuong thich

| Contract point | Nguyen AI dang lam | AI Provider dang nhan/tra | Gap |
|---|---|---|---|
| URL | default `https://aiagent.iai.one` | canonical API `https://api.aiagent.iai.one` | Sai host |
| Route | `/v1/chat` trong client; test lai hard-code `/v1/chat/completions` | `/v1/chat` | Test khong test route that |
| Auth | `Authorization: Bearer AI_PROVIDER_API_KEY` | chi validate prefix `sk-aiagent-*` | Chua lock credential contract |
| Tenant | `X-Tenant-ID` + body `tenant_id` | tenant theo host/origin; khong dung header nay nhu authority | Chua co tenant isolation contract |
| Model | client gui `model: nguyen-*` | handler doc `model_preference: iai-one/*` | Field va namespace mismatch |
| Limits | client gui `max_tokens`, `temperature` | handler khong doc hai field nay trong request type | Input bi ignore |
| Usage | client doi `usage.prompt_tokens/completion_tokens/total_tokens` | live/local response khong co object contract nay | Client default 0, receipt/cost sai |
| Trace | client doi request/provider response ID + latency | response khong cung cap day du | Khong reconcile evidence |

**Action:** lock OpenAPI/JSON Schema `provider-contract/v1`; Team A publish contract tests, Team B consume generated types. Khong them route OpenAI-compatible chi vi design doc neu Nguyen AI khong can no.

### P0-A6. Live/source drift va health false-green

- Live deep health response khong giong local `handlers/health.ts`.
- Local deep health chi tao Durable Object stub, khong goi DO.
- Local health tra HTTP 200 ke ca `degraded`.
- Live deep health bao `status=ok` trong khi `providers=[]`.
- Khong co build SHA/deployment ID trong health response.

**Action:** health phai co `build_sha`, deployment ID, migration version, dependency status; readiness tra non-2xx khi dependency bat buoc khong san sang.

### P0-A7. Environment isolation va privacy config sai

Production, staging va development dang dung chung D1 ID, KV ID/R2 bucket va Durable Object classes; production con `REDACTION_ENABLED=false`. Live CORS tra `Access-Control-Allow-Origin: *` va cho phep cac header nhay cam.

**Action:** tach resources theo environment; redaction fail-closed; CORS allowlist theo tenant; khong cho `X-User-Id`, `X-Tier`, `X-Admin-Key` tu browser lam authority.

### P1-A8. Run object, usage, cost va audit chua dong vong

`createRunObject()` co implementation nhung khong co call site trong chat/stream. Chat audit la fire-and-forget; run lifecycle, usage, provider cost, retry/failover va receipt khong co mot transaction/evidence chain.

**Action:** wire `queued -> running -> success/error`; idempotency key; usage/cost actual; provider response reference; audit/evidence receipt; reconciliation job.

## 4. Re-audit commit Nguyen AI `0bad2ad`

| Claim | Verdict moi | Ly do |
|---|---|---|
| P0-1 training smoke fixed | `PARTIAL_PASS` | Test da bat error, nhung dung `GatewayMockLLMProvider` export trong package production; khong phai contract/live E2E |
| P0-2 invoke internal-only | `FAIL` | Route chi require user session; moi authenticated user van gui duoc `gateway_response` va tu khai usage/cost ben trong object. Khong co service auth/signature/binding |
| P0-3 provider/signing/policy fixed | `FAIL` | `MODEL_GATEWAY_SIGNING_KEY` khong co trong secret inventory/live names; init thieu key lai giu InMemory store; SQL INSERT co 19 bind values nhung 18 placeholders; policy flags van lay `enforce*`, khong phai policy result |
| P0-4 block output fallback fixed | `PASS_CODE_ONLY` | Source va targeted test path hop ly; chua co adversarial E2E tren deployed SHA |
| P0-6 Academy standalone fixed | `FAIL` | `plans.json` false, nhung `entitlements.json` van `academy.pass="custom"` cho Enterprise/Sovereign; validator chi cam `true`, khong ep `false` |
| P0-7 replay atomic fixed | `FAIL` | Claim bi ket `processing` toi 72h neu side effect fail; khong lease/retry; ignored/refund dung UPDATE khi chua co row; refund webhook khong claim; ledger/grant best-effort van ack success |
| P0-8 MFA fixed | `PARTIAL_FAIL` | Consume-after-success dung; nhung sai code khong tang `attempt_count`, khong lockout/rate limit duoc verify; comment thua nhan la future work |
| QA Loop 32 all green | `VERIFIED_HISTORICAL_GATE` | Log co trong exact commit; fresh tests/typecheck PASS, nhung gate khong cover cac loi logic tren |

### P0-B1. Model gateway fail-open va SQL runtime error

`initModelGatewayStore()` ghi FATAL nhung `return` va giu singleton InMemory. Production secret list khong co `MODEL_GATEWAY_SIGNING_KEY`, nen deploy commit nay co the tao receipt khong durable thay vi tu choi.

`D1ModelGatewayStore.createInvocation()` khai 19 cot/bind values nhung SQL chi co 18 placeholder. Day la loi runtime D1 ma in-memory tests khong bat.

**Action:** production init fail hard/503; inventory bat buoc signing key; D1 integration test chay migration that va invoke/get receipt end-to-end.

### P0-B2. Receipt callback van cho phep gia mao

Kiem tra co `gateway_response` khong bien route thanh internal. Authenticated user co the gui object nay va tu tao receipt zero/fake cost. Metadata provider phai di truc tiep tu Team A response da xac thuc hoac duoc Nguyen AI server record trong cung `/v1/chat` transaction.

**Action toi uu:** xoa public callback. `/v1/chat` server-owned goi Team A, validate schema/signature, roi ghi invocation + receipt. Neu bat buoc callback, dung Worker service binding hoac HMAC service credential co replay/nonce/audience.

### P0-B3. Commerce chua an toan

- Ledger update dung `WHERE payment_id = result.gateway_payment_id`, de sai correlation voi payment row noi bo.
- Loi ledger va entitlement bi nuot; webhook van `processed:true`.
- Row `processing` khong co lease/attempt/error/next_retry; retry provider co the bi chan 72h.
- Refund webhook chua atomic claim, chua update ledger/revoke entitlement day du.
- Test payment tu mo phong Map/function rieng, khong goi Worker route/D1/provider sandbox.

**Action:** payment event inbox state machine `received -> processing -> applied -> failed_retryable/dead_letter`; transaction/outbox; provider event ID unique; internal payment ID mapping; reconciliation worker; sandbox E2E va refund/revoke proof. Truoc do commerce phai OFF tren UI/API.

### P0-B4. Secret gate va secret-name corruption

Fresh production secret-name audit FAIL:

- `JWT_SECRET` con tren auth va api;
- khong co payment group hoan chinh;
- API co malformed duplicate names chua `U+2028`;
- `MODEL_GATEWAY_SIGNING_KEY` chua nam trong governance inventory va production names.

**Action:** Founder/Ops xoa malformed aliases va `JWT_SECRET`, rotate neu nghi ngo gia tri bi lo, them signing secret dung ten, sau do verify name/value-consumer/E2E theo tung lop. Khong ghi gia tri secret vao evidence.

## 5. Phuong an kien truc toi uu de Founder duyet

### Decision D1 - Giu hai gateway rieng

**De xuat: APPROVE.** Giu `api.nguyenai.net` la Nguyen AI product/API gateway. `api.aiagent.iai.one` la AI Provider Gateway. Khong merge codebase, identity, entitlement, billing, receipt authority hay user data.

```text
Nguyen AI user
  -> api.nguyenai.net (session, entitlement, policy, evidence, billing)
  -> provider-contract/v1 (service credential, tenant nguyenai-net)
  -> api.aiagent.iai.one (model routing + vendor adapters)
  -> Nguyen AI validates usage/result
  -> Nguyen AI persists receipt/audit
```

### Decision D2 - Canonical AI Provider source

**De xuat: APPROVE.** Tach `aiagent.iai.one` thanh repo doc lap, bao toan history bang subtree split/filter-repo plan da review. Truoc khi tach xong: freeze production deploy, khong claim CI/provenance.

### Decision D3 - Contract va credential

**De xuat: APPROVE.** Canonical endpoint `https://api.aiagent.iai.one/provider/v1/chat` hoac versioned route tuong duong; mot service-key format; tenant/audience/scope/expiry/revoke; JSON Schema/OpenAPI; idempotency + trace; usage/cost/error envelope bat buoc.

### Decision D4 - `orion-research`

**De xuat: DEFER.** Khong them ten model ao vao runtime truoc khi co capability contract, provider mapping, evaluation, latency/cost budget va fallback policy. Neu can, dinh nghia no la capability/profile alias, khong phai vendor model.

### Decision D5 - Hamicodeviet

**De xuat: OUT_OF_SCOPE.** Tao workstream rieng sau khi Nguyen AI cutover PASS. Khong de domain/tenant Hamicode chan release Nguyen AI.

### Decision D6 - Commerce

**Founder phai chon:** `COMMERCE_OFF` cho toi khi merchant/legal/secrets/E2E day du, hoac cap dung mot payment group va owner de team dong P0. Khong co phuong an an toan o giua.

## 6. Thu tu thuc thi hai team

### Wave 0 - Containment va contract lock

Chay song song, khong them feature/page:

| ID | Owner | Viec | Exit gate |
|---|---|---|---|
| A-P0-00 | Team A | Chan live service-key admin bypass | Unauth create/list/revoke deu 401/403; regression evidence |
| A-P0-01 | Team A + DevOps | Canonical repo/CI/release lineage | Workflow o git root; protected branch/env; exact SHA artifact |
| A-P0-02 | Team A + Team B | Lock provider contract v1 | Schema + examples + auth + model alias + usage/error/trace signed-off |
| B-P0-00 | Team B | Commerce OFF neu Founder chua cap group | Checkout khong tao false-success; UI disclosure dung |
| OPS-P0-00 | Founder/Ops | Secret cleanup name-only | Khong JWT/malformed names; required groups present; no value in logs |

### Wave 1 - Team A Provider Gateway

Team B khong duoc claim integrated truoc exit gate nay.

1. Tenant fail-closed; them `nguyenai-net` voi allowlist/audience.
2. Unify service credentials; rotate/revoke/audit; bo query-param admin key.
3. CORS allowlist; redaction ON; tach prod/staging/dev resources.
4. Implement provider contract v1 va model capability map.
5. Wire run object, usage, cost, retry/failover, receipt references va audit.
6. Real readiness health co SHA/migration/dependency; non-2xx khi dependency bat buoc down.
7. Staging E2E: valid key, invalid/revoked key, wrong tenant, model error, timeout, rate limit, provider outage, usage reconciliation.
8. Manual production deploy qua protected environment; post-deploy negative probes.

**Team A exit:** local source = committed SHA = CI artifact = deployed version; auth bypass dong; contract suite PASS; staging/prod owner sign-off.

### Wave 2 - Team B Nguyen AI Core

Cac muc khong phu thuoc provider co the lam song song voi Wave 1; provider E2E chi bat dau sau Team A exit.

1. Sua AI Provider URL/model/request/response theo contract v1; xoa test hard-code route khong ton tai.
2. Thay mock journey bang Worker integration test + staging authenticated chat.
3. Xoa/bao ve model callback; metadata va receipt server-owned.
4. Fix D1 placeholder count; signing key required; migration/integration/tenant ownership tests.
5. Persist actual policy outcomes, khong dung config booleans lam proof.
6. `academy.pass=false` bat buoc cho moi machine plan; Academy Pass la commercial object rieng.
7. Payment inbox/outbox/reconciliation/refund/replay state machine.
8. MFA attempt counter, lockout/rate-limit, replay/concurrency tests.
9. Xoa malformed/JWT secret names va chay regression.
10. Them build SHA/deployment ID cho API/Auth health va release packet.

**Team B exit:** session -> entitlement -> Team A -> result -> actual usage/cost -> Nguyen AI receipt/evidence/audit PASS tren staging, sau do production can Founder approval.

### Wave 3 - Product operation P1

Chi sau P0:

1. Authz production E2E: register, verify, OAuth repeat/link, login, MFA, logout, revoke/expiry, role/tenant denial.
2. Academy standalone purchase -> enroll -> lesson -> proof -> review -> certificate -> verify.
3. Scholarship 9-step process, 7 support options, project grant va investment tach rieng.
4. Monitoring alert delivery, D1/R2 backup va mot restore drill, rollback drill.
5. Founder analytics tu reconciled data; telemetry semantic, khong raw prompt mac dinh.
6. Ba product proof journeys va evidence library; exact SHA/deployment/evidence ID.

### Wave 4 - P2 controlled launch

1. Launch cohort co stop criteria; khong mo traffic dai tra truoc support/incident owner.
2. KPI co denominator/cohort/source query: activation, retention, paid users, receipts, AI cost, refunds.
3. Growth/referral anti-fraud va Customer Success.
4. Investor traction track chi dung reconciled metrics; legal/IP/security data room track tiep tuc tu P0.

## 7. Kill criteria

Bat ky dieu nao duoi day xay ra thi release van `HOLD`:

- unauthenticated service/admin route tra 2xx;
- deployed version khong map duoc exact committed SHA;
- unknown tenant fallback sang tenant khac;
- Nguyen AI co direct vendor credential/call;
- provider usage/cost bi default 0 khi upstream khong tra contract;
- receipt metadata do client tu khai;
- payment side effect co the apply hai lan hoac mat retry;
- payment/refund ack success khi ledger/entitlement khong reconcile;
- MFA khong co attempt limit/replay protection;
- Academy bi bundle vao machine subscription;
- secret name malformed/JWT thua/payment group thieu;
- health 200 khi dependency bat buoc down;
- khong co monitoring/restore/rollback evidence;
- khong co Founder release sign-off.

## 8. Founder approval packet

Founder chi can duyet sau muc:

1. `D1 APPROVE`: giu `api.nguyenai.net` va `api.aiagent.iai.one` tach rieng.
2. `D2 APPROVE`: tach `aiagent.iai.one` thanh canonical repo doc lap.
3. `D3 APPROVE`: versioned provider contract + mot service credential scheme.
4. `D4 DEFER`: chua them `orion-research`.
5. `D5 OUT_OF_SCOPE`: Hamicodeviet la workstream rieng.
6. `D6`: chon `COMMERCE_OFF` hoac cap owner/merchant/secrets de dong commerce P0.

Neu duyet 1-5 va chon D6, team co the thuc thi ngay theo Wave 0 -> Team A exit -> Team B provider exit, trong khi Team B sua commerce/MFA/Academy/D1 song song. Toan bo catalog hien co duoc giu nguyen; chi release/activation bi gate theo evidence.
