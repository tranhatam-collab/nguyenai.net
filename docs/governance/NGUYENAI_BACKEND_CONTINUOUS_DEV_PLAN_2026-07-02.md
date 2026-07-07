# Nguyen AI — Backend Continuous Dev Build Plan

- **Status:** BINDING — Founder Build Directive (supersedes conflicting clauses)
- **Date:** 2026-07-02
- **Owner:** Dev lead
- **Founder decision (2026-07-02):** `nguyenai.net` sẽ có **backend riêng độc lập**. Không sửa Gen1 (`Computer.iai.one`) và Gen2 (`maytinhai-os`). Được phép **copy có chọn lọc** package từ `maytinhai-os` vào `nguyenai.net`, fix security trong quá trình copy.
- **Supersedes (các mâu thuẫn cụ thể):**
  - `ECOSYSTEM_SOURCE_OF_TRUTH.md` §2.3, §3 (hàng "nguyenai.net — No (static)") → thay bằng "nguyenai.net — independent backend monorepo"
  - `NGUYEN_AI_FOUNDER_VERDICT_2026-07-02.md` §2.2 ("không nên là runtime mới") → thay bằng "nguyenai.net sở hữu runtime riêng cho vertical Nguyen AI"
  - `DEV_WORK_ITEMS_P0_P1.md` WI-P1-A.1/A.2 ("migrate Gen1 từ Computer.iai.one") → thay bằng "build fresh, reference only"
- **Giữ nguyên:** `DEV_WORK_ITEMS_P0_P1.md` phần còn lại, `DEV_EXECUTION_CHECKLIST.md`, `DEV_TEAM_INTEGRATION_PLAN.md`, `PRODUCT_CATALOG_9x9.md`, `IDENTITY_AND_TENANCY_RFC.md`, `ENTITLEMENT_MODEL.md`.

---

## 0. Quyết định Founder (lock)

| # | Quyết định | Hệ quả |
|---|---|---|
| D1 | `nguyenai.net` có backend riêng độc lập | Monorepo `nguyenai.net/` chứa `apps/api/` + `packages/@nai/*`. Không phụ thuộc runtime Gen1/Gen2 lúc chạy. |
| D2 | Không sửa Gen1 (`Computer.iai.one`) và Gen2 (`maytinhai-os`) | Hai repo kia đóng băng (reference only). Không deploy, không edit. |
| D3 | Copy có chọn lọc package từ `maytinhai-os` | Package an toàn copy nguyên; package có security issue fix khi copy; package có violation nghiêm trọng rewrite sạch. |
| D4 | `ai-dev-stack-repos/` tại `/Users/tranhatam/Documents/Devnewproject/ai-dev-stack-repos/` | 41 tool rebrand thành `@nai/*` theo `DEV_TEAM_INTEGRATION_PLAN.md`. |

> **Yêu cầu Founder:** sign-off bản này để override 2 mâu thuẫn BINDING trong `ECOSYSTEM_SOURCE_OF_TRUTH.md` và `FOUNDER_VERDICT.md`. Không sign-off = không được build.

---

## 1. Trạng thái hiện tại (verified 2026-07-02)

| Hạng mục | Trạng thái thật |
|---|---|
| `nguyenai.net/` | Astro static, 24 route VI/EN, `output: 'static'`, không có backend |
| `apps/`, `packages/`, `workers/`, `migrations/` | KHÔNG tồn tại |
| `Computer.iai.one/` (Gen1) | Có `apps/api` + 15 packages, build BROKEN per Founder verdict, `.env.local` có secret exposed |
| `maytinhai-os/` (Gen2) | Có 12 packages + 4 apps; audit report claim 100/100 nhưng code có CORS `*` (dòng 36) + SQLi `SELECT * FROM ${table}` (dòng 165) → audit FABRICATED |
| `ai-dev-stack-repos/` | 44 mục (41 tool + bare clone + script) tại `/Users/tranhatam/Documents/Devnewproject/ai-dev-stack-repos/` |
| `auth.nguyenai.net` | KHÔNG tồn tại |
| `packages/product-catalog/` | KHÔNG tồn tại |
| Legal entity / IP agreement / cap table | KHÔNG form (QA_AUDIT §D.3-D.5) |

---

## 2. Kiến trúc backend mục tiêu (nguyenai.net độc lập)

```
nguyenai.net/  (monorepo — pnpm workspace + turbo)
├── apps/
│   ├── web/          ← Astro static hiện tại (chuyển từ src/ vào)
│   ├── api/          ← Hono on Cloudflare Workers (backend chính)
│   ├── console/      ← app.nguyenai.net (Astro + React islands)
│   ├── admin/        ← admin.nguyenai.net
│   ├── invest/       ← invest.nguyenai.net (copy từ nguyenai-invest/)
│   └── academy/      ← academy.nguyenai.net
├── packages/
│   ├── @nai/auth          (better-auth rebrand)
│   ├── @nai/policy-fga    (openfga rebrand)
│   ├── @nai/policy-engine (opa rebrand)
│   ├── @nai/entitlement
│   ├── @nai/audit
│   ├── @nai/approval
│   ├── @nai/agent-graph   (langgraph rebrand)
│   ├── @nai/agent-sdk
│   ├── @nai/llm-platform  (dify rebrand)
│   ├── @nai/memory        (mem0 rebrand)
│   ├── @nai/vector        (qdrant rebrand)
│   ├── @nai/rag           (llama_index rebrand)
│   ├── @nai/evidence
│   ├── @nai/catalog
│   ├── @nai/billing
│   ├── @nai/invoice
│   ├── @nai/browser       (browser-use rebrand)
│   ├── @nai/browser-visual (skyvern rebrand)
│   ├── @nai/crew          (crewAI rebrand)
│   ├── @nai/pipeline      (haystack rebrand)
│   ├── @nai/workflow      (n8n rebrand)
│   ├── @nai/observe-llm, trace, eval, observe-phoenix, test-llm, test-prompt
│   ├── @nai/security-sast, image, vuln, secret, sign, provenance
│   ├── @nai/safety
│   ├── @nai/infra-tf, infra-k8s, cd, dashboard, logs, telemetry
│   ├── @nai/mcp-catalog, mcp-servers, sdk, dev-agent
│   ├── product-catalog/   (plans.json, entitlements.json, prices.json — source of truth pricing)
│   ├── ui/, brand/, i18n/, seo/, schemas/, database/
│   └── (selective copy từ maytinhai-os: design-system, email, legal, app-registry, fulfillment, integrations)
├── workers/
│   ├── gateway/       ← api.nguyenai.net gateway
│   ├── search/
│   ├── media/
│   └── scheduled-jobs/
├── migrations/        ← Postgres/D1 migrations
├── tests/             ← unit, integration, e2e, accessibility, seo
├── tools/
│   ├── rebrand/       ← rebrand script
│   └── audit-clone-contamination.sh
├── content/vi/, content/en/
├── public/, brand/, docs/
└── infra/             ← Cloudflare, Neon, R2 config
```

**Stack (lock):**
- API: Cloudflare Workers + Hono
- DB: Neon PostgreSQL (primary) + Cloudflare D1 (edge) — quyết định chọn Neon vì cần pgvector + transaction
- Storage: Cloudflare R2 (vault, audit archive)
- Cache/KV: Cloudflare KV
- Vector: Qdrant Cloud (dev) → dedicated (prod)
- Email: Resend
- Auth: `@nai/auth` (better-auth) — chạy trong Workers
- Hosting web: Cloudflare Pages

---

## 3. Phân loại package từ `maytinhai-os` (copy / fix / rewrite)

| Package `maytinhai-os` | Hành động | Lý do |
|---|---|---|
| `design-system` | **Copy** | UI only, không có security surface |
| `email` | **Copy** | Template only |
| `legal` | **Copy** | Static content |
| `app-registry` | **Copy** | Metadata |
| `fulfillment` | **Copy** | Logic thuần |
| `integrations` | **Copy + review** | Kiểm tra secret handling |
| `auth` | **Rewrite** | Dùng `@nai/auth` (better-auth) thay vì copy auth tự chế |
| `billing` | **Fix + copy** | Review webhook signature, idempotency |
| `command-system` | **Fix + copy** | Review auth middleware |
| `machine-state` | **Fix + copy** | Review tenant isolation |
| `security` | **Rewrite** | Package security của maytinhai-os không đáng tin (CORS *, SQLi cùng repo) |
| `file-system` | **Fix + copy** | Review upload validation, path traversal |
| `apps/api` (Worker) | **Rewrite sạch** | CORS `*`, SQLi `${table}` — không copy, build `apps/api/` fresh bằng Hono |

> **Rule:** Mọi package copy từ `maytinhai-os` phải pass `@nai/security-sast` (semgrep) + `@nai/security-secret` (gitleaks) trước khi merge vào `packages/`.

---

## 4. Phases — Continuous Dev Build

> Mỗi phase có **exit gate**: phải pass verification thật (lệnh chạy + output đọc) trước khi sang phase sau. Không claim "done" dựa trên memory.

### Phase 0 — Governance reconciliation + monorepo setup (1-2 ngày)

**Mục tiêu:** giải quyết mâu thuẫn BINDING + setup monorepo skeleton.

| Task | Output | Verify |
|---|---|---|
| 0.1 Founder sign-off bản plan này | Commit sign-off | commit hash |
| 0.2 Update `ECOSYSTEM_SOURCE_OF_TRUTH.md` §2.3, §3 | nguyenai.net = independent backend | diff |
| 0.3 Update `FOUNDER_VERDICT.md` §2.2 | nguyenai.net sở hữu runtime riêng | diff |
| 0.4 Update `AGENTS.md` technical status | "backend: independent, in-progress" | diff |
| 0.5 Setup `pnpm-workspace.yaml` (apps/*, packages/*, tools/*, workers/*) | file | `pnpm install` pass |
| 0.6 Setup `turbo.json` (build, lint, test, typecheck) | file | `pnpm build` pass |
| 0.7 `tsconfig.base.json` + root `package.json` scripts | files | `pnpm typecheck` pass |
| 0.8 Chuyển `src/` hiện tại → `apps/web/` (giữ Astro static) | `apps/web/` | `pnpm --filter ./apps/web dev` chạy |

**Exit gate:** `pnpm install && pnpm build && pnpm typecheck` pass. `apps/web/` serve 24 route.

---

### Phase 1 — Foundation packages: rebrand 41 tool (3-4 ngày)

**Mục tiêu:** có 36 package `@nai/*` trong `packages/`.

| Task | Output | Verify |
|---|---|---|
| 1.1 `tools/rebrand/rebrand.ts` + config + test | script | test pass trên better-auth mẫu |
| 1.2 Rebrand 41 tool từ `ai-dev-stack-repos/` → `packages/@nai/*` | 36 packages | `ls packages/` = 36 |
| 1.3 Loại bare clone (`dify.git`, `langgraph.git`, `phoenix.git`, `langgraph2`) | clean | 0 `.git/` suffix dir |
| 1.4 Mỗi package có `NOTICE.nai.md` + giữ LICENSE gốc | files | grep pass |
| 1.5 Clone contamination audit + CI gate `tools/audit-clone-contamination.sh` | gate | grep `maytinhai`/`computer.iai.one`/`Máy Tính AI` trong user-facing = 0 |
| 1.6 `pnpm install` pass sau rebrand | — | output |

**Exit gate:** 36 packages tồn tại, `pnpm install` pass, contamination CI gate chạy pass.

---

### Phase 2 — Identity & Access (P0-B) (10-12 ngày)

**Mục tiêu:** auth + RBAC + policy + entitlement + audit + approval chạy E2E.

| Task | Package | Verify E2E |
|---|---|---|
| 2.1 DB schema per `IDENTITY_AND_TENANCY_RFC.md` | `migrations/` | migration chạy không lỗi |
| 2.2 `@nai/auth` (better-auth): email/pass, OAuth Google+GitHub, session, MFA TOTP, API key | `@nai/auth` | register→login→session→logout; OAuth; MFA; API key |
| 2.3 `@nai/policy-fga` (openfga): owner, family-member, chapter-member, admin, investor-qualified | `@nai/policy-fga` | check permission + tuple test |
| 2.4 `@nai/entitlement`: load `PRODUCT_CATALOG_9x9.md` → entitlement keys, quota, model tier gate | `@nai/entitlement` | Start plan → 10 command/day gate works |
| 2.5 `@nai/policy-engine` (opa): sensitive action approval, data classification, entitlement check | `@nai/policy-engine` | policy eval pass |
| 2.6 `@nai/audit`: append-only R2 + Postgres index, `logAuditEvent()`, `queryAuditLog()` | `@nai/audit` | log + query, no update/delete |
| 2.7 `@nai/approval`: request → notify → approve/deny → audit | `@nai/approval` | sensitive action → approval → audit |
| 2.8 `packages/product-catalog/`: plans.json, entitlements.json, limits.json, prices.json, academy-access.json, catalog.schema.json | `product-catalog/` | schema validate pass |
| 2.9 P0-B E2E: register→login→tenant→entitlement→sensitive action→approval→audit | `tests/e2e/` | toàn chain pass |

**Exit gate:** E2E test P0-B pass thật (chạy lệnh, đọc output).

---

### Phase 3 — Core Runtime (P1-A) (15-18 ngày)

**Mục tiêu:** AI Computer runtime chạy trong `apps/api/` (build fresh, KHÔNG migrate từ Gen1).

| Task | Package | Verify E2E |
|---|---|---|
| 3.1 `apps/api/` (Hono on Workers): health, `/api/command` real | `apps/api/` | `wrangler dev` serve health + command |
| 3.2 `@nai/agent-graph` (langgraph): 9 NAI Agents (Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian) + state machine | `@nai/agent-graph` | agent dispatch |
| 3.3 `@nai/agent-sdk`: tool call, approval integration, evidence generation | `@nai/agent-sdk` | tool→approval→evidence |
| 3.4 `@nai/llm-platform` (dify): model routing free/standard/pro/enterprise, prompt versioning | `@nai/llm-platform` | Start→free, Founder→pro |
| 3.5 `@nai/memory` (mem0): 6 types (session, preference, project, decision, family, founder) | `@nai/memory` | write→read→search |
| 3.6 `@nai/vector` (qdrant): collections evidence, knowledge, memory | `@nai/vector` | upsert→search |
| 3.7 `@nai/rag` (llama_index): document indexing, source synthesis + citation | `@nai/rag` | index→query→cited answer |
| 3.8 `@nai/evidence`: proof record, audit trail, evidence pack export (JSON + signed) | `@nai/evidence` | command→evidence→export |
| 3.9 `apps/console/` (app.nguyenai.net): chat UI, agent panel, memory panel, vault panel, approval panel | `apps/console/` | console chạy local + kết nối API |
| 3.10 P1-A E2E: user gửi command → agent chạy → tool call → evidence → audit | `tests/e2e/` | toàn chain pass |

**Exit gate:** E2E test P1-A pass. Console chạy local kết nối `apps/api`.

---

### Phase 4 — Product System (P1-B) (12-15 ngày)

**Mục tiêu:** catalog + billing + payment + invoice chạy.

| Task | Package | Verify E2E |
|---|---|---|
| 4.1 **Gen2 pre-integration audit (selective)**: audit từng package `maytinhai-os` theo §3 bảng trên, ra go/no-go từng package | audit report | report + quyết định từng package |
| 4.2 Copy package an toàn (design-system, email, legal, app-registry, fulfillment) → `packages/` | packages | `pnpm install` pass |
| 4.3 Fix + copy package (billing, command-system, machine-state, file-system, integrations) — fix security trước merge | packages | semgrep + gitleaks pass |
| 4.4 `@nai/catalog`: đọc `PRODUCT_CATALOG_9x9.md` → JSON (models, functional-products, entitlements, limits, prices, compatibility, academy-access) | `@nai/catalog` | schema validate |
| 4.5 `@nai/billing`: subscription recurring, dunning, proration; integrate `@nai/entitlement` | `@nai/billing` | subscribe→upgrade→entitlement update |
| 4.6 Payment gateway: VNPay sandbox (VND) + Stripe sandbox (USD) | `apps/api/routes/payment` | webhook E2E cả 2 |
| 4.7 `@nai/invoice`: VAT VN 10% (VND) + international invoice (USD) | `@nai/invoice` | invoice gen + VAT calc |
| 4.8 P1-B E2E: subscribe → payment → invoice → entitlement update → audit | `tests/e2e/` | toàn chain pass |

**Exit gate:** E2E test P1-B pass. Payment sandbox cả VNPay + Stripe.

---

### Phase 5 — Automation (P1-C) (8-10 ngày)

| Task | Package | Verify |
|---|---|---|
| 5.1 `@nai/browser` (browser-use): controlled web access, page read, data extract | `@nai/browser` | fetch + extract E2E |
| 5.2 `@nai/browser-visual` (skyvern): form fill, multi-step workflow | `@nai/browser-visual` | form fill sandbox |
| 5.3 `@nai/crew` (crewAI): Founder Suite crew, Business Pack crew | `@nai/crew` | crew collaboration |
| 5.4 `@nai/pipeline` (haystack): research pipeline, evidence pipeline | `@nai/pipeline` | pipeline E2E |
| 5.5 `@nai/workflow` (n8n): scheduled task, trigger, connector | `@nai/workflow` | workflow trigger |
| 5.6 Approval gate integration vào browser + workflow | — | external action → approval → audit |
| 5.7 P1-C E2E: workflow trigger → browser agent → data extract → evidence → audit | `tests/e2e/` | pass |

---

### Phase 6 — Observability & Eval (P1-D) (10-12 ngày)

| Task | Package | Verify |
|---|---|---|
| 6.1 `@nai/observe-llm` (helicone): instrument mọi LLM call (cost, latency, token) | `@nai/observe-llm` | dashboard |
| 6.2 `@nai/trace` (langfuse): prompt version + session trace | `@nai/trace` | trace |
| 6.3 `@nai/eval` (opik): eval dataset + metric | `@nai/eval` | eval run |
| 6.4 `@nai/observe-phoenix` (phoenix): drift detection | `@nai/observe-phoenix` | drift alert |
| 6.5 `@nai/test-llm` (deepeval): unit test 9 Agents | `@nai/test-llm` | test pass |
| 6.6 `@nai/test-prompt` (promptfoo): regression + red-team (jailbreak, PII leak) | `@nai/test-prompt` | test pass |
| 6.7 `@nai/telemetry` (opentelemetry): traces + metrics + logs pipeline | `@nai/telemetry` | flow |
| 6.8 `@nai/logs` (loki): log ingestion + query | `@nai/logs` | query |
| 6.9 `@nai/dashboard` (grafana): system metrics + business KPI | `@nai/dashboard` | render |
| 6.10 P1-D E2E: command → trace → cost → eval → dashboard | `tests/e2e/` | pass |

---

### Phase 7 — Security & Supply Chain (P1-E) (6-8 ngày)

| Task | Package | Verify |
|---|---|---|
| 7.1 `@nai/security-sast` (semgrep) CI gate | — | fail merge on finding |
| 7.2 `@nai/security-image` (trivy) | — | scan report |
| 7.3 `@nai/security-vuln` (grype) CI gate | — | fail on critical |
| 7.4 `@nai/security-secret` (gitleaks) CI gate | — | fail on secret (test fake secret) |
| 7.5 `@nai/security-sign` (cosign): sign image + package | — | signature verify |
| 7.6 `@nai/security-provenance` (slsa): build provenance attestation | — | provenance verify |
| 7.7 `@nai/safety`: harmful content + PII leak classifier, integrate vào agent output gate | `@nai/safety` | harmful blocked |
| 7.8 Security audit per `NGUYEN_AI_AI_SAFETY_POLICY.md` | report | internal audit |

---

### Phase 8 — Deploy + Release Evidence (3-5 ngày)

| Task | Verify |
|---|---|
| 8.1 Cloudflare Pages deploy `apps/web/` (nguyenai.net static) | live URL |
| 8.2 Cloudflare Workers deploy `apps/api/` (api.nguyenai.net) | live health |
| 8.3 Cloudflare Workers deploy `apps/console/` (app.nguyenai.net) | live console |
| 8.4 Neon Postgres + R2 + KV + Qdrant provisioning | bindings work |
| 8.5 9 audit gates (Gate 0-9 per `NGUYEN_AI_TECHNICAL_ARCHITECTURE.md`) | report từng gate |
| 8.6 Release evidence pack: build log, test log, Lighthouse, a11y, security headers, broken-link, SEO crawl, payment test, email test, backup restore, screenshots | pack |

---

## 5. Critical path

```
Phase 0 (governance + monorepo)
  → Phase 1 (rebrand 41 tool)
       → Phase 2 (identity & access)  ← P0-B, blocker cho mọi runtime
            → Phase 3 (core runtime)  ← P1-A, blocker cho product
                 → Phase 4 (product system)  ← P1-B, cần runtime + identity
            → Phase 5 (automation)  ← song song với Phase 4 sau Phase 3
       → Phase 6 (observability)  ← song song sau Phase 3
       → Phase 7 (security)  ← song song từ Phase 1
            → Phase 8 (deploy + release evidence)
```

**Song song hóa:** Phase 5, 6, 7 có thể chạy parallel sau khi Phase 3 xong. Phase 4 cần Phase 2 + 3.

---

## 6. Tổng kết effort

| Phase | Work items | Estimate (ngày) | Blocker |
|---|---|---|---|
| 0 | 8 | 1-2 | Founder sign-off |
| 1 | 6 | 3-4 | — |
| 2 | 9 | 10-12 | DB decision (Neon) |
| 3 | 10 | 15-18 | Phase 2 |
| 4 | 8 | 12-15 | Phase 2 + 3 |
| 5 | 7 | 8-10 | Phase 3 |
| 6 | 10 | 10-12 | Phase 3 |
| 7 | 8 | 6-8 | Phase 1 |
| 8 | 6 | 3-5 | Phase 2-7 |
| **Total** | **72** | **~68-86 ngày effort** | |

> Với continuous dev 1 agent: ~68-86 ngày. Với 3-4 dev parallel (Phase 5/6/7 song song): ~45-55 ngày calendar.

---

## 7. Quy tắc continuous dev (ràng buộc mỗi session)

1. **Verify trước khi báo cáo:** mỗi task phải chạy lệnh verify + đọc output. Không báo "done" dựa memory.
2. **Báo đỏ trước:** nói cái chưa xong/sai/chưa verify trước, cái xong sau.
3. **End-to-end trước unit:** mỗi phase phải có E2E test thật (user flow), không chỉ build green.
4. **Không tự khen:** mô tả việc đã làm + kết quả verify, không nói "hoàn hảo/production-ready".
5. **Exit gate:** không sang phase sau khi phase trước chưa pass exit gate thật.
6. **Evidence:** mỗi task ghi commit hash + lệnh verify + output thật vào `DEV_LOG.md`.
7. **Không sửa Gen1/Gen2:** `Computer.iai.one/`, `maytinhai-os/` chỉ reference, không edit.
8. **Contamination gate:** mọi commit pass `tools/audit-clone-contamination.sh`.

---

## 8. Quyết định Founder — SIGN-OFF 2026-07-02

| # | Quyết định | Trả lời Founder | Trạng thái |
|---|---|---|---|
| Q1 | DB chính: Neon Postgres hay Cloudflare D1? | **Cả hai** — Neon Postgres (primary, pgvector + transaction) + Cloudflare D1 (edge cache) | LOCKED |
| Q2 | Sign-off override `ECOSYSTEM_SOURCE_OF_TRUTH` + `FOUNDER_VERDICT`? | **SIGN-OFF** — nguyenai.net có backend riêng độc lập | LOCKED |
| Q3 | Academy pricing: free cho subscriber hay freemium? | **Freemium** — free cơ bản + Pass trả phí | LOCKED |
| Q4 | Payment: VNPay + Stripe hay chỉ Stripe? | **VNPay (VND) + Stripe (USD)** | LOCKED |
| Q5 | Vector: Qdrant Cloud (dev) → dedicated (prod) hay self-host? | **Qdrant Cloud dev → dedicated prod** (default) | LOCKED |

> **Founder sign-off timestamp:** 2026-07-02. Override có hiệu lực ngay. Phase 0 bắt đầu.
