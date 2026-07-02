# NAI — Dev Team Integration Plan

- **Status:** BINDING — Founder Build Directive
- **Date:** 2026-07-02
- **Owner:** Founder
- **Project code:** `NAI` (Nguyen AI)
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `PRODUCT_CATALOG_9x9.md`, `ENTITLEMENT_MODEL.md`, `NGUYEN_AI_TECHNICAL_ARCHITECTURE.md`, `NGUYEN_AI_GEN2_INTEGRATION_PLAN.md`

> **Brand lock (strict):** Toàn bộ tool tích hợp phải được rebrand về `Nguyen AI` / `NAI`. KHÔNG dùng bất kỳ tên thương hiệu ngoài NAI trong bất kỳ surface nào (UI, package name, domain, email, docs public). Tên tool gốc chỉ được giữ ở (a) internal package.json dependency declaration, (b) LICENSE/NOTICE file, (c) internal code comment ghi nguồn. Mọi user-facing string phải là `NAI <function>` (ví dụ: `NAI Auth`, `NAI Memory`, `NAI Vector`, `NAI Workflow`, `NAI Observability`, `NAI Browser`, `NAI Policy`).

---

## 1. Mục tiêu kế hoạch

Đưa NAI từ trạng thái hiện tại (governance lock + Astro public scaffold + Gen1/Gen2 partial) lên **production-ready MVP** cho 4 lớp:

1. **Layer 1 — Gen1 core runtime** (computer.iai.one) — runtime, agent, model routing, memory, tool, workflow, evidence
2. **Layer 2 — Gen2 product system** (maytinhai-os) — package, sell, operate AI Computers
3. **Layer 3 — NAI product line** (nguyenai.net) — specialized line + Nguyen Operating Profile
4. **Layer 4 — Academy** (academy.nguyenai.net) — paid Academy Pass + certification

Kế hoạch này:
- Liệt kê toàn bộ tool có sẵn trong `ai-dev-stack-repos/` (41 repos)
- Map từng tool vào vai trò kiến trúc NAI
- Đánh dấu: **Đã tích hợp** / **Chưa tích hợp** / **Cần rebrand**
- Chia sprint cho dev team
- Liệt kê tool còn thiếu cần dev team thêm vào

---

## 2. Inventory tool có sẵn — `ai-dev-stack-repos/` (41 repos)

### 2.1 Identity & Access

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `better-auth` | Authentication framework (email/pass, OAuth, API key, session, MFA) | `@nai/auth` | Chưa tích hợp |
| `openfga` | Fine-grained authorization (RBAC + relationship-based, dùng cho entitlement gate, family/chapter permission) | `@nai/policy-fga` | Chưa tích hợp |
| `opa` | Policy engine (approval gate, sensitive action policy, data classification policy) | `@nai/policy-engine` | Chưa tích hợp |

### 2.2 Memory & Vector

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `mem0` | Long-term memory layer (session, preference, project, decision, family, founder memory) | `@nai/memory` | Chưa tích hợp |
| `qdrant` | Vector database (semantic search, evidence retrieval, knowledge base) | `@nai/vector` | Chưa tích hợp |

### 2.3 AI / Agent framework

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `langgraph` | Agent orchestration (graph-based workflow, state machine cho 9 NAI Agents) | `@nai/agent-graph` | Chưa tích hợp |
| `llama_index` | RAG framework (document indexing, retrieval, source synthesis) | `@nai/rag` | Chưa tích hợp |
| `crewAI` | Multi-agent collaboration (cho Founder Suite, Business Pack — nhiều agent phối hợp) | `@nai/crew` | Chưa tích hợp |
| `haystack` | Pipeline framework (research pipeline, evidence pipeline) | `@nai/pipeline` | Chưa tích hợp |
| `software-agent-sdk` | Agent SDK base (gọi tool, approval, evidence) | `@nai/agent-sdk` | Chưa tích hợp |
| `dify` / `dify-new` | LLM platform (prompt management, model routing, dataset) | `@nai/llm-platform` | Chưa tích hợp |

### 2.4 Browser & Automation

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `browser-use` | Browser agent (controlled web access, page reading, data extraction) | `@nai/browser` | Chưa tích hợp |
| `skyvern` | Visual browser automation (form fill, multi-step web workflow) | `@nai/browser-visual` | Chưa tích hợp |
| `n8n` | Workflow automation (scheduled task, trigger, integration 400+ connectors) | `@nai/workflow` | Chưa tích hợp |

### 2.5 Observability & LLM eval

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `helicone` | LLM observability (cost, latency, token, trace) | `@nai/observe-llm` | Chưa tích hợp |
| `langfuse` | LLM tracing + eval (prompt version, session trace) | `@nai/trace` | Chưa tích hợp |
| `opik` | LLM eval + experiment tracking | `@nai/eval` | Chưa tích hợp |
| `phoenix` | LLM observability + drift detection | `@nai/observe-phoenix` | Chưa tích hợp |
| `deepeval` | LLM unit test + assertion | `@nai/test-llm` | Chưa tích hợp |
| `promptfoo` | Prompt regression test + red-team | `@nai/test-prompt` | Chưa tích hợp |

### 2.6 Security & Supply chain

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `semgrep` | SAST — static code analysis | `@nai/security-sast` | Chưa tích hợp |
| `trivy` | Container + IaC scan | `@nai/security-image` | Chưa tích hợp |
| `grype` | Container vulnerability scan | `@nai/security-vuln` | Chưa tích hợp |
| `gitleaks` | Secret scan (chống leak API key, token) | `@nai/security-secret` | Chưa tích hợp |
| `cosign` | Artifact signing (SBOM, image signature) | `@nai/security-sign` | Chưa tích hợp |
| `slsa` | Supply chain level (provenance, build attestation) | `@nai/security-provenance` | Chưa tích hợp |

### 2.7 Infra & Deploy

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `terraform` | IaC (Cloudflare, Neon, R2, KV, D1, Workers config) | `@nai/infra-tf` | Chưa tích hợp |
| `kubernetes` | K8s manifests (cho Sovereign/Enterprise on-prem) | `@nai/infra-k8s` | Chưa tích hợp |
| `argo-cd` | GitOps deploy (CD cho K8s) | `@nai/cd` | Chưa tích hợp |
| `grafana` | Dashboard (system metrics, business KPI) | `@nai/dashboard` | Chưa tích hợp |
| `loki` | Log aggregation | `@nai/logs` | Chưa tích hợp |
| `opentelemetry-collector` | Telemetry pipeline (traces, metrics, logs) | `@nai/telemetry` | Chưa tích hợp |

### 2.8 MCP & SDK

| Tool gốc | Vai trò trong NAI | Rebrand thành | Trạng thái |
|---|---|---|---|
| `awesome-mcp-servers` | MCP server catalog (chọn lọc, không dùng toàn bộ) | `@nai/mcp-catalog` | Chưa tích hợp |
| `servers` | MCP server implementations | `@nai/mcp-servers` | Chưa tích hợp |
| `sdk-typescript` | TypeScript SDK base (cho NAI SDK public) | `@nai/sdk` | Chưa tích hợp |
| `openhands` | Open source coding agent (dùng nội bộ cho dev team, không ship cho end user) | `@nai/dev-agent` | Chưa tích hợp |

### 2.9 Tổng kết inventory

- **Tổng tool có sẵn:** 41 repos
- **Đã tích hợp vào NAI runtime:** 0 (chưa tích hợp cái nào)
- **Cần rebrand trước khi tích hợp:** 41/41
- **Tool loại bỏ / không ship:** `awesome-mcp-servers` (chỉ tham khảo), `dify.git`/`langgraph.git`/`phoenix.git` (bare clone, bỏ), `langgraph2` (rỗng, bỏ)

---

## 3. Tool còn thiếu — dev team cần thêm vào

Đây là tool KHÔNG có trong `ai-dev-stack-repos/` nhưng NAI cần theo governance + product catalog:

### 3.1 Payment & Billing

| Cần | Lý do | Đề xuất |
|---|---|---|
| Payment gateway VN | Thu phí subscription Model 2-7 (VND) | Tích hợp VNPay + Stripe (cho USD Enterprise/Sovereign) |
| Subscription engine | Quản lý recurring billing, dunning, proration | Build `@nai/billing` trên better-auth + Stripe Billing |
| Invoice & tax | Hóa đơn VAT VN, invoice quốc tế | Build `@nai/invoice` |

### 3.2 Storage & Data

| Cần | Lý do | Đề xuất |
|---|---|---|
| Object storage SDK | Vault (file, photo, document, oral history) | Cloudflare R2 SDK (đã có trong wrangler) |
| Relational DB | Identity, entitlement, billing, audit | Neon Postgres (production) + Cloudflare D1 (edge) |
| Blob encryption | Vault at-rest encryption | Build `@nai/vault-crypto` (AES-256-GCM, per-tenant key) |
| Backup & DR | Vault backup, disaster recovery | Build `@nai/backup` (R2 replication + snapshot) |

### 3.3 Email & Notification

| Cần | Lý do | Đề xuất |
|---|---|---|
| Transactional email | Welcome, password reset, invoice, approval | Resend hoặc Cloudflare Email Routing |
| Email template engine | Bilingual VI/EN email | Build `@nai/email-template` (react-email) |
| Push notification | Mobile app, approval request | Build `@nai/push` (Web Push + FCM) |

### 3.4 Frontend & Console

| Cần | Lý do | Đề xuất |
|---|---|---|
| AI Computer Console (app.nguyenai.net) | UI cho user vận hành máy | Build `@nai/console` (Astro + React islands + Hono API) |
| Admin console (admin.nguyenai.net) | Quản trị tenant, entitlement, audit | Build `@nai/admin` |
| Investor site (invest.nguyenai.net) | Public + private room | Build `@nai/investor` (đã có scaffold `nguyenai-invest`) |
| Academy site (academy.nguyenai.net) | Course, certification | Build `@nai/academy` |
| Status page (status.nguyenai.net) | Service status | Build `@nai/status` (Atlassian Statuspage hoặc self-host) |
| Mobile app | iOS/Android companion | Build `@nai/mobile` (React Native, sau MVP) |

### 3.5 AI Safety & Evidence

| Cần | Lý do | Đề xuất |
|---|---|---|
| Evidence engine | Proof record, audit trail, evidence pack export | Build `@nai/evidence` (per `DATA_CLASSIFICATION_AND_RETENTION.md`) |
| Approval gate UI | Sensitive action approval flow | Build `@nai/approval` (UI + backend) |
| Safety classifier | Detect harmful content, PII leak | Build `@nai/safety` (rule + LLM classifier) |
| Audit log service | Immutable audit log | Build `@nai/audit` (append-only, R2 + Postgres index) |

### 3.6 Search & SEO

| Cần | Lý do | Đề xuất |
|---|---|---|
| Public search | Search public research, knowledge base | Build `@nai/search` (Pagefind cho static + qdrant cho semantic) |
| Sitemap generator | Bilingual sitemap, hreflang | Astro integration (đã có scaffold) |
| Schema.org structured data | SEO cho research, founder profile | Build `@nai/seo-schema` |

### 3.7 Localization

| Cần | Lý do | Đề xuất |
|---|---|---|
| i18n engine | VI/EN, sau này thêm zh, ko, fr | Build `@nai/i18n` (paraglide hoặc i18next) |
| Translation memory | Giữ consistency thuật ngữ | Build `@nai/translation-memory` (qdrant-backed) |

### 3.8 DevOps nội bộ

| Cần | Lý do | Đề xuất |
|---|---|---|
| CI/CD pipeline | Build, test, scan, deploy | GitHub Actions + `@nai/security-*` stack |
| Preview environment | Mỗi PR có preview URL | Cloudflare Pages preview |
| Feature flag | Rollout dần | Build `@nai/flag` hoặc dùng Cloudflare Flagship |

---

## 4. Kiến trúc đích — NAI monorepo

```
nguyenai.net/                          (monorepo root, pnpm workspace)
├── apps/
│   ├── public-site/                   (Astro — nguyenai.net, đã có scaffold)
│   ├── console/                       (app.nguyenai.net — AI Computer Console)
│   ├── admin/                         (admin.nguyenai.net)
│   ├── investor/                      (invest.nguyenai.net)
│   ├── academy/                       (academy.nguyenai.net)
│   ├── status/                        (status.nguyenai.net)
│   └── api/                           (api.nguyenai.net — Hono on Workers)
├── packages/
│   ├── auth/                          (@nai/auth — better-auth rebrand)
│   ├── policy-fga/                    (@nai/policy-fga — openfga rebrand)
│   ├── policy-engine/                 (@nai/policy-engine — opa rebrand)
│   ├── memory/                        (@nai/memory — mem0 rebrand)
│   ├── vector/                        (@nai/vector — qdrant rebrand)
│   ├── agent-graph/                   (@nai/agent-graph — langgraph rebrand)
│   ├── rag/                           (@nai/rag — llama_index rebrand)
│   ├── crew/                          (@nai/crew — crewAI rebrand)
│   ├── pipeline/                      (@nai/pipeline — haystack rebrand)
│   ├── agent-sdk/                     (@nai/agent-sdk — software-agent-sdk rebrand)
│   ├── llm-platform/                  (@nai/llm-platform — dify rebrand)
│   ├── browser/                       (@nai/browser — browser-use rebrand)
│   ├── browser-visual/                (@nai/browser-visual — skyvern rebrand)
│   ├── workflow/                      (@nai/workflow — n8n rebrand)
│   ├── observe-llm/                   (@nai/observe-llm — helicone rebrand)
│   ├── trace/                         (@nai/trace — langfuse rebrand)
│   ├── eval/                          (@nai/eval — opik rebrand)
│   ├── observe-phoenix/               (@nai/observe-phoenix — phoenix rebrand)
│   ├── test-llm/                      (@nai/test-llm — deepeval rebrand)
│   ├── test-prompt/                   (@nai/test-prompt — promptfoo rebrand)
│   ├── security-sast/                 (@nai/security-sast — semgrep rebrand)
│   ├── security-image/                (@nai/security-image — trivy rebrand)
│   ├── security-vuln/                 (@nai/security-vuln — grype rebrand)
│   ├── security-secret/               (@nai/security-secret — gitleaks rebrand)
│   ├── security-sign/                 (@nai/security-sign — cosign rebrand)
│   ├── security-provenance/           (@nai/security-provenance — slsa rebrand)
│   ├── infra-tf/                      (@nai/infra-tf — terraform rebrand)
│   ├── infra-k8s/                     (@nai/infra-k8s — kubernetes rebrand)
│   ├── cd/                            (@nai/cd — argo-cd rebrand)
│   ├── dashboard/                     (@nai/dashboard — grafana rebrand)
│   ├── logs/                          (@nai/logs — loki rebrand)
│   ├── telemetry/                     (@nai/telemetry — opentelemetry-collector rebrand)
│   ├── mcp-catalog/                   (@nai/mcp-catalog — curated MCP)
│   ├── mcp-servers/                   (@nai/mcp-servers — servers rebrand)
│   ├── sdk/                           (@nai/sdk — sdk-typescript rebrand)
│   ├── dev-agent/                     (@nai/dev-agent — openhands rebrand, internal only)
│   ├── product-catalog/               (@nai/catalog — 9×9 catalog impl)
│   ├── entitlement/                   (@nai/entitlement — plan→entitlement engine)
│   ├── billing/                       (@nai/billing — subscription + invoice)
│   ├── invoice/                       (@nai/invoice — VAT + international)
│   ├── vault-crypto/                  (@nai/vault-crypto — encryption)
│   ├── backup/                        (@nai/backup — DR)
│   ├── email-template/                (@nai/email-template — react-email)
│   ├── push/                          (@nai/push — Web Push + FCM)
│   ├── evidence/                      (@nai/evidence — proof engine)
│   ├── approval/                      (@nai/approval — approval gate)
│   ├── safety/                        (@nai/safety — classifier)
│   ├── audit/                         (@nai/audit — immutable log)
│   ├── search/                        (@nai/search — Pagefind + qdrant)
│   ├── seo-schema/                    (@nai/seo-schema — structured data)
│   ├── i18n/                          (@nai/i18n — paraglide)
│   ├── translation-memory/            (@nai/translation-memory)
│   ├── flag/                          (@nai/flag — feature flag)
│   └── design-system/                 (@nai/design-system — UI components)
├── infra/
│   ├── terraform/                     (Cloudflare, Neon, R2)
│   ├── kubernetes/                    (Sovereign/Enterprise on-prem)
│   └── gitops/                        (ArgoCD manifests)
├── docs/
│   ├── governance/                    (đã có 9 docs + catalog)
│   ├── architecture/
│   ├── brand/
│   ├── investor/
│   ├── legal/
│   ├── privacy/
│   ├── product/
│   ├── security/
│   ├── seo/
│   └── dev/                           (runbook, API reference, SDK docs)
├── tools/
│   ├── rebrand/                       (script rebrand tool gốc → @nai/*)
│   └── codegen/                       (generate catalog, entitlement từ docs)
├── .github/workflows/                 (CI/CD)
├── AGENTS.md
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── turbo.json
```

---

## 5. Sprint plan cho dev team

### Sprint P0-A — Truth Lock & Dependency Remediation (tuần 1-2)

**Mục tiêu:** Lock source of truth, rebrand tool, setup monorepo.

| Task | Owner | Output |
|---|---|---|
| P0-A.1 Setup pnpm workspace + turbo cho `nguyenai.net/` | Dev lead | `pnpm-workspace.yaml`, `turbo.json` |
| P0-A.2 Tạo `tools/rebrand/` script — auto rebrand package name, binary, UI string → `@nai/*` | Dev | Script + test |
| P0-A.3 Rebrand 41 tool từ `ai-dev-stack-repos/` → `packages/@nai/*` | Dev | 41 packages |
| P0-A.4 Loại bỏ `dify.git`, `langgraph.git`, `phoenix.git`, `langgraph2` (bare clone/rỗng) | Dev | Clean |
| P0-A.5 Sync governance docs vào `docs/governance/` (đã có 9 + catalog) | Dev | Verified |
| P0-A.6 Lock `AGENTS.md` source-of-truth list | Founder | Updated |
| P0-A.7 Audit clone contamination — không để tên `maytinhai`, `computer.iai.one`, `Máy Tính AI` trong user-facing surface | Dev | Audit report |

### Sprint P0-B — Identity & Access Foundation (tuần 2-4)

**Mục tiêu:** User có thể đăng ký, đăng nhập, có tenant, có entitlement gate.

| Task | Owner | Output |
|---|---|---|
| P0-B.1 Tích hợp `@nai/auth` (better-auth rebrand) — email/pass, OAuth, session, MFA | Dev | Auth service |
| P0-B.2 Tích hợp `@nai/policy-fga` (openfga rebrand) — RBAC + relationship (owner, family-member, chapter-member, admin) | Dev | FGA service |
| P0-B.3 Tích hợp `@nai/policy-engine` (opa rebrand) — approval gate policy, sensitive action, data classification | Dev | Policy service |
| P0-B.4 Implement identity schema per `IDENTITY_AND_TENANCY_RFC.md` | Dev | DB schema |
| P0-B.5 Implement entitlement engine `@nai/entitlement` — đọc `PRODUCT_CATALOG_9x9.md` → entitlement keys | Dev | Entitlement service |
| P0-B.6 Build `@nai/audit` — immutable audit log (append-only R2 + Postgres index) | Dev | Audit service |
| P0-B.7 Build `@nai/approval` — approval gate UI + backend | Dev | Approval flow |
| P0-B.8 E2E test: register → login → tenant → entitlement check → sensitive action → approval → audit | Dev | Test pass |

### Sprint P1-A — Core Runtime (Gen1 integration) (tuần 4-8)

**Mục tiêu:** AI Computer Console chạy được command cơ bản với 9 Agents.

| Task | Owner | Output |
|---|---|---|
| P1-A.1 Integrate Gen1 runtime từ `Computer.iai.one/` vào `apps/api/` (Hono on Workers) | Dev | API chạy |
| P1-A.2 Fix Gen1 issues: build broken, missing files, simulated `/api/command` | Dev | Build pass |
| P1-A.3 Tích hợp `@nai/agent-graph` (langgraph) — orchestrate 9 NAI Agents | Dev | Agent runtime |
| P1-A.4 Tích hợp `@nai/agent-sdk` (software-agent-sdk) — tool call, approval, evidence | Dev | SDK |
| P1-A.5 Tích hợp `@nai/llm-platform` (dify) — prompt management, model routing (free/standard/pro/enterprise tier) | Dev | LLM platform |
| P1-A.6 Tích hợp `@nai/memory` (mem0) — 6 memory types (session, preference, project, decision, family, founder) | Dev | Memory service |
| P1-A.7 Tích hợp `@nai/vector` (qdrant) — semantic search, evidence retrieval | Dev | Vector service |
| P1-A.8 Tích hợp `@nai/rag` (llama_index) — document indexing, source synthesis | Dev | RAG pipeline |
| P1-A.9 Build `@nai/evidence` — proof record, audit trail, evidence pack export | Dev | Evidence engine |
| P1-A.10 Build `apps/console/` (app.nguyenai.net) — chat UI, agent panel, memory panel, vault panel, approval panel | Dev | Console MVP |
| P1-A.11 E2E: user gửi command → agent chạy → tool call → evidence → audit | Dev | Test pass |

### Sprint P1-B — Product System (Gen2 integration) (tuần 6-10)

**Mục tiêu:** User có thể subscribe Model, mua Functional Product, dùng Super App.

| Task | Owner | Output |
|---|---|---|
| P1-B.1 Migrate `maytinhai-os/packages/` vào `nguyenai.net/packages/` với rebrand `@maytinhai/*` → `@nai/*` | Dev | Packages migrated |
| P1-B.2 Implement `@nai/catalog` — đọc `PRODUCT_CATALOG_9x9.md` → JSON catalog (models, functional products, compatibility matrix) | Dev | Catalog service |
| P1-B.3 Implement `@nai/billing` — subscription recurring, dunning, proration | Dev | Billing service |
| P1-B.4 Tích hợp payment: VNPay (VND) + Stripe (USD) | Dev | Payment gateway |
| P1-B.5 Implement `@nai/invoice` — VAT VN + international invoice | Dev | Invoice service |
| P1-B.6 Build `@nai/vault-crypto` — AES-256-GCM per-tenant key | Dev | Vault crypto |
| P1-B.7 Build `@nai/backup` — R2 replication + snapshot | Dev | Backup |
| P1-B.8 Implement Super Apps: AI Office, AI Research, AI Content, AI Browser, AI Code, AI Automation | Dev | 6 Super Apps |
| P1-B.9 Implement Nguyen Super Apps: Roots, Memory, Knowledge, Trust, Network, Founders, Chapter OS | Dev | 7 Nguyen Apps |
| P1-B.10 E2E: subscribe Personal → mua Office Pro → dùng AI Office → evidence → invoice | Dev | Test pass |

### Sprint P1-C — Automation & Browser (tuần 8-12)

**Mục tiêu:** Workflow automation + browser agent hoạt động.

| Task | Owner | Output |
|---|---|---|
| P1-C.1 Tích hợp `@nai/workflow` (n8n) — scheduled task, trigger, 400+ connectors | Dev | Workflow engine |
| P1-C.2 Tích hợp `@nai/browser` (browser-use) — controlled web access, page reading | Dev | Browser agent |
| P1-C.3 Tích hợp `@nai/browser-visual` (skyvern) — visual form fill, multi-step web | Dev | Visual browser |
| P1-C.4 Tích hợp `@nai/crew` (crewAI) — multi-agent cho Founder Suite, Business Pack | Dev | Crew runtime |
| P1-C.5 Tích hợp `@nai/pipeline` (haystack) — research pipeline, evidence pipeline | Dev | Pipeline |
| P1-C.6 Build approval gate cho browser + workflow (mọi external action cần approval) | Dev | Approval integrated |
| P1-C.7 E2E: workflow trigger → browser agent → data extraction → evidence → audit | Dev | Test pass |

### Sprint P1-D — Observability & Eval (tuần 10-12)

**Mục tiêu:** Toàn bộ LLM call có trace, cost, eval.

| Task | Owner | Output |
|---|---|---|
| P1-D.1 Tích hợp `@nai/observe-llm` (helicone) — cost, latency, token | Dev | LLM observability |
| P1-D.2 Tích hợp `@nai/trace` (langfuse) — prompt version, session trace | Dev | Tracing |
| P1-D.3 Tích hợp `@nai/eval` (opik) — eval + experiment | Dev | Eval platform |
| P1-D.4 Tích hợp `@nai/observe-phoenix` (phoenix) — drift detection | Dev | Drift monitor |
| P1-D.5 Tích hợp `@nai/test-llm` (deepeval) — LLM unit test | Dev | Test suite |
| P1-D.6 Tích hợp `@nai/test-prompt` (promptfoo) — prompt regression + red-team | Dev | Prompt test |
| P1-D.7 Tích hợp `@nai/telemetry` (opentelemetry-collector) — traces, metrics, logs pipeline | Dev | Telemetry |
| P1-D.8 Tích hợp `@nai/logs` (loki) — log aggregation | Dev | Log system |
| P1-D.9 Tích hợp `@nai/dashboard` (grafana) — system + business KPI dashboard | Dev | Dashboard |
| P1-D.10 E2E: command → trace → cost → eval → dashboard | Dev | Test pass |

### Sprint P1-E — Security & Supply Chain (tuần 10-12, song song P1-D)

**Mục tiêu:** CI/CD có security scan, artifact signing, provenance.

| Task | Owner | Output |
|---|---|---|
| P1-E.1 Tích hợp `@nai/security-sast` (semgrep) — SAST trong CI | Dev | SAST gate |
| P1-E.2 Tích hợp `@nai/security-image` (trivy) — container scan | Dev | Image scan |
| P1-E.3 Tích hợp `@nai/security-vuln` (grype) — vuln scan | Dev | Vuln gate |
| P1-E.4 Tích hợp `@nai/security-secret` (gitleaks) — secret scan | Dev | Secret gate |
| P1-E.5 Tích hợp `@nai/security-sign` (cosign) — artifact signing | Dev | Signing |
| P1-E.6 Tích hợp `@nai/security-provenance` (slsa) — build provenance | Dev | Provenance |
| P1-E.7 Build `@nai/safety` — harmful content + PII leak classifier | Dev | Safety service |
| P1-E.8 Security audit full per `NGUYEN_AI_AI_SAFETY_POLICY.md` | Dev | Audit report |

### Sprint P2-A — Public Site & SEO (tuần 12-14)

**Mục tiêu:** nguyenai.net public site production-ready, bilingual SEO.

| Task | Owner | Output |
|---|---|---|
| P2-A.1 Hoàn thiện 24 bilingual routes (đã có scaffold Astro) | Dev | Pages live |
| P2-A.2 Implement `@nai/i18n` (paraglide) — VI/EN | Dev | i18n |
| P2-A.3 Implement `@nai/seo-schema` — schema.org structured data | Dev | SEO schema |
| P2-A.4 Implement `@nai/search` — Pagefind static + qdrant semantic | Dev | Search |
| P2-A.5 Sitemap + hreflang + robots.txt per `NGUYEN_AI_SEO_SPEC.md` | Dev | SEO complete |
| P2-A.6 Bilingual SEO audit | Dev | Audit pass |
| P2-A.7 Accessibility audit (WCAG 2.1 AA) | Dev | Audit pass |
| P2-A.8 Deploy Cloudflare Pages | Dev | Live |

### Sprint P2-B — Investor & Academy (tuần 14-16)

**Mục tiêu:** invest.nguyenai.net + academy.nguyenai.net live.

| Task | Owner | Output |
|---|---|---|
| P2-B.1 Build `apps/investor/` — public + private room per `INVESTOR_ACCESS_POLICY.md` | Dev | Investor site |
| P2-B.2 Implement investor qualification + private room gating + audit log | Dev | Gating |
| P2-B.3 Build `apps/academy/` — course platform + certification | Dev | Academy |
| P2-B.4 Implement Academy Pass entitlement + certification fee | Dev | Academy billing |
| P2-B.5 Build `@nai/email-template` (react-email) — bilingual transactional | Dev | Email |
| P2-B.6 Tích hợp Resend hoặc Cloudflare Email Routing | Dev | Email service |
| P2-B.7 Build `@nai/push` — Web Push + FCM | Dev | Push |
| P2-B.8 Legal review trước publish invest.nguyenai.net | Founder + Legal | Sign-off |

### Sprint P2-C — Infra & Deploy (tuần 14-16, song song P2-B)

**Mục tiêu:** Production deploy GitOps, Sovereign ready.

| Task | Owner | Output |
|---|---|---|
| P2-C.1 Tích hợp `@nai/infra-tf` (terraform) — Cloudflare, Neon, R2, KV, D1 | Dev | IaC |
| P2-C.2 Tích hợp `@nai/infra-k8s` (kubernetes) — Sovereign/Enterprise on-prem manifests | Dev | K8s |
| P2-C.3 Tích hợp `@nai/cd` (argo-cd) — GitOps CD | Dev | CD |
| P2-C.4 Setup GitHub Actions CI/CD — build, test, scan, sign, deploy | Dev | CI/CD |
| P2-C.5 Preview environment per PR (Cloudflare Pages preview) | Dev | Preview |
| P2-C.6 Implement `@nai/flag` — feature flag (Cloudflare Flagship hoặc self-host) | Dev | Flag |
| P2-C.7 Production deploy nguyenai.net + app + api | Dev | Live |
| P2-C.8 Status page (status.nguyenai.net) | Dev | Status |

### Sprint P3 — Hardening & Release (tuần 16-18)

**Mục tiêu:** Production release approved.

| Task | Owner | Output |
|---|---|---|
| P3.1 Full security audit | Dev + External | Audit pass |
| P3.2 Full privacy/data audit per `DATA_CLASSIFICATION_AND_RETENTION.md` | Dev | Audit pass |
| P3.3 Commerce audit (payment, invoice, billing) | Dev + External | Audit pass |
| P3.4 Load test + chaos test | Dev | Test pass |
| P3.5 Release evidence pack | Dev | Evidence pack |
| P3.6 Founder sign-off production release | Founder | Sign-off |

---

## 6. Rebrand checklist (strict, cho dev team)

Mỗi tool khi tích hợp phải:

- [ ] Đổi `package.json` `name` → `@nai/<function>`
- [ ] Đổi binary/CLI name → `nai-<function>`
- [ ] Đổi mọi user-facing string (UI, log, email) → `NAI <function>`
- [ ] Đổi domain reference → `*.nguyenai.net`
- [ ] Giữ LICENSE + NOTICE file gốc (legal compliance)
- [ ] Thêm `NOTICE.nai.md` ghi rõ rebrand + nguồn
- [ ] Không để tên tool gốc trong: UI, public docs, email, sitemap, SEO meta
- [ ] Không để tên `maytinhai`, `computer.iai.one`, `Máy Tính AI`, `IAI` trong user-facing surface
- [ ] Tên tool gốc chỉ xuất hiện trong: `package.json` dependency (nếu publish), `NOTICE`, internal code comment

---

## 7. Dependency graph (tích hợp theo thứ tự)

```
P0-A (rebrand + monorepo)
  └→ P0-B (auth + policy + entitlement + audit)
       └→ P1-A (runtime: agent + memory + vector + rag + evidence + console)
            └→ P1-B (product: catalog + billing + vault + super apps)
                 ├→ P1-C (automation: workflow + browser + crew + pipeline)
                 ├→ P1-D (observability: trace + eval + dashboard)
                 ├→ P1-E (security: sast + image + secret + sign)
                 └→ P2-A (public site + SEO)
                      └→ P2-B (investor + academy)
                      └→ P2-C (infra + deploy)
                           └→ P3 (hardening + release)
```

P1-C, P1-D, P1-E chạy song song. P2-B, P2-C chạy song song.

---

## 8. Definition of Done — từng sprint

| Sprint | DoD |
|---|---|
| P0-A | Monorepo setup, 41 tool rebrand, governance docs synced, clone contamination audit pass |
| P0-B | Register → login → tenant → entitlement → approval → audit E2E pass |
| P1-A | Command → agent → tool → evidence → audit E2E pass |
| P1-B | Subscribe → buy add-on → use Super App → invoice E2E pass |
| P1-C | Workflow → browser → extraction → evidence E2E pass |
| P1-D | Every LLM call has trace + cost + eval |
| P1-E | CI blocks merge on: SAST, secret, vuln, unsigned artifact |
| P2-A | Public site live, bilingual SEO audit pass, accessibility pass |
| P2-B | Investor + Academy live, legal sign-off |
| P2-C | Production deploy via GitOps, Sovereign manifests ready |
| P3 | All audits pass, release evidence pack, Founder sign-off |

---

## 9. Risk & mitigation

| Risk | Mitigation |
|---|---|
| Rebrand 41 tool tốn nhiều thời gian | Ưu tiên 12 tool critical path (auth, policy, memory, vector, agent-graph, rag, llm-platform, evidence, billing, catalog, audit, console) trước, 29 tool còn lại theo sprint |
| Tool gốc có license không tương thích | Legal review LICENSE từng tool trước khi tích hợp. Loại bỏ tool copyleft nếu ship closed-source |
| Gen1 runtime broken | P1-A.2 fix build trước, rồi mới integrate |
| Payment VN phức tạp | VNPay + manual invoice cho MVP, Stripe cho international |
| Cost LLM cao | Helicone monitor + quota enforcement per `ENTITLEMENT_MODEL.md` |
| Brand leak | CI gate: grep `maytinhai\|computer.iai.one\|IAI\|Máy Tính AI` trong user-facing file → fail build |

---

## 10. Tool priority — critical path (12 tool đầu tiên)

Dev team tích hợp 12 tool này trước, 29 tool còn lại theo sprint:

1. `@nai/auth` (better-auth) — P0-B
2. `@nai/policy-fga` (openfga) — P0-B
3. `@nai/policy-engine` (opa) — P0-B
4. `@nai/entitlement` (build mới) — P0-B
5. `@nai/audit` (build mới) — P0-B
6. `@nai/agent-graph` (langgraph) — P1-A
7. `@nai/memory` (mem0) — P1-A
8. `@nai/vector` (qdrant) — P1-A
9. `@nai/rag` (llama_index) — P1-A
10. `@nai/llm-platform` (dify) — P1-A
11. `@nai/evidence` (build mới) — P1-A
12. `@nai/catalog` (build mới) — P1-B

---

## 11. Change log

| Date | Version | Change | By |
|---|---|---|---|
| 2026-07-02 | V1.0 | Initial dev team integration plan — 41 tool inventory + sprint plan | Founder |
