# NAI — AI Tool Orchestration Matrix & Gen2 Application Plan

- **Status:** BINDING — Dev Build Directive
- **Date:** 2026-07-02
- **Owner:** Dev lead
- **Companion to:** `NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md`, `DEV_TEAM_INTEGRATION_PLAN.md`, `APP_BUILD_PLAN_ADMIN_INVEST_ACADEMY_2026-07-02.md`
- **Scope:** 
  1. Ma trận phối hợp 36 tool (7 lớp) — orchestration end-to-end
  2. Kế hoạch áp dụng toàn bộ cho Gen2 (`maytinhai.org`) trước, rồi inherit vào NAI
- **Prerequisite:** Phase 0 PASS, Founder sign-off Q1-Q5

---

## 1. Ma trận 7 lớp — 36 tool phối hợp

### 1.1 Lớp chức năng

| Lớp | Vai trò | Tools | Output |
|---|---|---|---|
| **L1 — Identity** | Ai? Có quyền gì? | better-auth, openfga, opa | Session + RBAC + Policy decision |
| **L2 — Runtime** | Chạy gì? Thuê agent nào? | langgraph, crewAI, software-agent-sdk, dify | Agent graph + model routing + tool dispatch |
| **L3 — Knowledge** | Nhớ gì? Tìm gì? | mem0, qdrant, llama_index, haystack | Memory + vector search + RAG pipeline |
| **L4 — Automation** | Làm thay gì? | n8n, browser-use, skyvern | Workflow + browser action + integration |
| **L5 — Quality** | Đúng không? Tốt không? | deepeval, promptfoo, opik, phoenix | Eval + regression + drift detection |
| **L6 — Observability** | Có sao không? | helicone, langfuse, grafana, loki, otel-collector | Trace + metrics + logs + dashboard |
| **L7 — Security** | An toàn không? | semgrep, trivy, grype, gitleaks, cosign, slsa | SAST + container scan + secret scan + signing |

### 1.2 Chuỗi phối hợp end-to-end (10 bước)

```
User Command
  → L1: Auth (better-auth) → RBAC (openfga) → Policy (opa)
  → L1: Entitlement check (plan, quota, model tier)
  → L2: Agent orchestration (langgraph graph + crewAI multi-agent + dify model routing)
  → L3: Knowledge (mem0 recall + qdrant search + llama_index RAG + haystack pipeline)
  → L4: Automation (browser-use crawl + skyvern visual + n8n workflow)
  → L2: Evidence + Approval (@nai/evidence + @nai/approval + opa policy)
  → L5: Quality (deepeval assert + promptfoo regression + opik experiment + phoenix drift)
  → L6: Observability (helicone cost + langfuse trace + otel + grafana + loki)
  → L7: Security (semgrep SAST + trivy/grype container + gitleaks secret + cosign sign + slsa provenance)
  → Audit + Deploy (@nai/audit + terraform + argo-cd + kubernetes)
```

### 1.3 10 cặp phối hợp mạnh nhất

| Cặp | Phối hợp | Tự động hóa |
|---|---|---|
| langgraph + crewAI | langgraph = graph state machine, crewAI = multi-agent brainstorm | Agent tự chọn: task đơn → langgraph, cần brainstorm → crewAI |
| mem0 + qdrant | mem0 = structured memory, qdrant = semantic search | Memory hybrid: structured + semantic |
| llama_index + haystack | llama_index = RAG indexing, haystack = pipeline orchestrate | RAG tự động: ingest → index → retrieve → synthesize |
| browser-use + skyvern | browser-use = programmatic (API/DOM), skyvern = visual (screenshot) | Browser tự chọn: có API → browser-use, chỉ UI → skyvern |
| helicone + langfuse | helicone = cost/token, langfuse = trace/eval | Dual observability: cost + trace song song |
| deepeval + promptfoo | deepeval = unit test LLM, promptfoo = regression + red-team | Quality gate: CI block nếu eval fail |
| semgrep + gitleaks | semgrep = code pattern, gitleaks = secret pattern | Pre-commit gate: code + secret |
| trivy + grype | trivy = container + IaC + OS, grype = container deep CVE | Container scan: 2 engine song song |
| cosign + slsa | cosign = ký artifact, slsa = chứng minh build process | Supply chain: signed + provenanced |
| grafana + loki + otel | Grafana = dashboard, loki = logs, otel = traces+metrics | Unified observability stack CNCF |

### 1.4 Mỗi tool chạy độc lập

Mỗi tool có standalone role — không bắt buộc phối hợp:

| Lớp | Tool | Standalone: Input → Output |
|---|---|---|
| L1 | better-auth | email/pass → session cookie |
| L1 | openfga | (user, relation, object) → allow/deny |
| L1 | opa | (input, policy.rego) → decision JSON |
| L2 | langgraph | task → graph execution → result |
| L2 | crewAI | task → agent collaboration → result |
| L2 | software-agent-sdk | command → tool execution → result |
| L2 | dify | prompt → model call → response |
| L3 | mem0 | (user_id, memory_type) → stored/retrieved |
| L3 | qdrant | (collection, vector) → top-K results |
| L3 | llama_index | documents → indexed → query → answer |
| L3 | haystack | pipeline config → data transform |
| L4 | n8n | trigger → workflow → action |
| L4 | browser-use | instruction → browser action → result |
| L4 | skyvern | instruction → visual action → result |
| L5 | deepeval | (input, expected) → pass/fail |
| L5 | promptfoo | prompt change → eval matrix → score |
| L5 | opik | (run, config) → tracked experiment |
| L5 | phoenix | production traces → drift alert |
| L6 | helicone | LLM call → cost + latency log |
| L6 | langfuse | session → full trace tree |
| L6 | grafana | metrics → visual dashboard |
| L6 | loki | logs → searchable log store |
| L6 | otel-collector | (traces, metrics, logs) → exported |
| L7 | semgrep | source code → vulnerability list |
| L7 | trivy | image/terraform → CVE list |
| L7 | grype | image → CVE list |
| L7 | gitleaks | git history → secret leaks |
| L7 | cosign | image → signature |
| L7 | slsa | build → attestation |
| Infra | terraform | config → cloud resources |
| Infra | kubernetes | manifests → container orchestration |
| Infra | argo-cd | git → continuous delivery |
| Infra | openhands | code task → dev agent result |
| Infra | mcp-sdk / mcp-servers | MCP protocol server/client |
| Infra | awesome-mcp-servers | MCP catalog (reference only) |

---

## 2. Kiến trúc orchestration 100% tự động

### 2.1 Event-driven mesh (không hub-and-spoke)

```
                    ┌──────────────┐
                    │  Event Bus   │
                    │ (CF Queues)  │
                    └──────┬───────┘
                           │
        ┌──────────┬───────┼────────┬──────────┐
        ▼          ▼       ▼        ▼          ▼
    Auth/FGA   Agent    Memory   Browser    Observability
    (L1)       (L2)     (L3)     (L4)       (L6)
        │          │       │        │          │
        ▼          ▼       ▼        ▼          ▼
    Policy     Evidence  Vector   Workflow   Security
    (L1)       (L2)      (L3)     (L4)       (L7)
```

Mỗi tool subscribe event, không gọi nhau trực tiếp. Cloudflare Queues route.

### 2.2 Trigger → chuỗi tool tự khởi động

| Trigger | Tools tự khởi động | Chuỗi |
|---|---|---|
| User command | auth → entitlement → agent → memory → vector → evidence → audit | L1→L2→L3→L2 |
| Code push | semgrep → gitleaks → trivy → grype → cosign → slsa | L7 |
| Prompt change | dify → langfuse → deepeval → promptfoo | L2→L6→L5 |
| Model call | dify → helicone → langfuse → otel → grafana | L2→L6 |
| Container build | trivy → grype → cosign → slsa → argo-cd | L7→Infra |
| Scheduled task | n8n → browser-use → llama_index → evidence → audit | L4→L3→L2 |
| Drift detected | phoenix → opik → alert → n8n (retrain workflow) | L5→L4 |
| Security alert | grype → alert → n8n (patch workflow) → cosign (re-sign) | L7→L4→L7 |

### 2.3 Intelligent routing — agent tự chọn tool

```
Agent nhận task → phân tích:
  - Cần search web? → browser-use (có API) hoặc skyvern (chỉ UI)
  - Cần nhớ user? → mem0 (structured) hoặc qdrant (semantic)
  - Cần RAG? → llama_index (index) + haystack (pipeline)
  - Cần multi-agent? → crewAI (brainstorm) hoặc langgraph (conditional)
  - Cần model nào? → dify route: free/standard/pro/enterprise tier
  - Cần approval? → opa evaluate → @nai/approval
  - Cần evidence? → @nai/evidence record
  - Cần quality check? → deepeval (unit) + promptfoo (regression)
```

Agent không hardcode tool — nó có tool registry, tự chọn dựa trên task type + entitlement + model tier.

### 2.4 Feedback loop (tự cải thiện)

```
Production → helicone/langfuse collect → phoenix detect drift
  → opik compare experiments → deepeval identify weakness
  → n8n trigger retrain/re-prompt → dify update prompt
  → langfuse track new version → phoenix monitor improvement
```

### 2.5 Dependency matrix

| Tool | Phụ thuộc vào | Được phụ thuộc bởi |
|---|---|---|
| better-auth | — | openfga, opa, tất cả L2-L7 |
| openfga | better-auth | opa, entitlement, agent |
| opa | openfga | approval, agent, evidence |
| mem0 | — | agent, rag, evidence |
| qdrant | — | mem0, llama_index, search |
| langgraph | dify, mem0, qdrant | crewAI, agent-sdk |
| crewAI | dify | — (complement langgraph) |
| dify | — | langgraph, crewAI, helicone, langfuse |
| llama_index | qdrant | haystack, agent |
| haystack | llama_index | n8n |
| n8n | — | browser-use, skyvern |
| browser-use | — | n8n |
| skyvern | — | n8n |
| deepeval | — | promptfoo, CI |
| promptfoo | deepeval | CI |
| helicone | dify | grafana |
| langfuse | dify | otel-collector, grafana |
| otel-collector | — | grafana, loki |
| grafana | otel, loki, helicone, langfuse | — |
| loki | otel-collector | grafana |
| semgrep | — | CI, gitleaks |
| trivy | — | cosign |
| grype | — | cosign |
| gitleaks | — | CI |
| cosign | trivy, grype | slsa |
| slsa | cosign | argo-cd |
| terraform | — | argo-cd |
| kubernetes | terraform | argo-cd |
| argo-cd | terraform, k8s, cosign, slsa | — |

---

## 3. Gap — cần thêm cho 100% tự động

| Gap | Package cần build | Ưu tiên | Phase |
|---|---|---|---|
| Event bus | Cloudflare Queues (đã có trong stack) | P0 | Phase 3 |
| Tool registry | `@nai/tool-registry` — metadata + capability + entitlement gate | P1 | Phase 3 |
| Orchestrator | `@nai/orchestrator` — dựa trên langgraph, route task → tool chain | P1 | Phase 3 |
| Feedback loop | `@nai/feedback-loop` — phoenix drift → n8n trigger → dify update | P2 | Phase 6 |
| Cost optimizer | `@nai/cost-optimizer` — helicone data → dify route cheaper model | P2 | Phase 6 |
| Self-healing | `@nai/self-heal` — grype CVE → n8n patch → cosign re-sign → argo-cd redeploy | P2 | Phase 7 |

---

## 4. Kế hoạch áp dụng cho Gen2 (`maytinhai.org`) trước

> **Founder directive 2026-07-02:** Áp dụng toàn bộ ma trận 36 tool cho Gen2 (`maytinhai.org`) trước. Gen2 là "thử lửa" — nếu chạy ổn thì inherit vào NAI.

### 4.1 Gen2 hiện trạng (verified)

| Hạng mục | Trạng thái |
|---|---|
| Repo | `maytinhai-os/` (12 packages + 4 apps) |
| Audit report | Claim 100/100 nhưng FABRICATED — CORS `*` (dòng 36) + SQLi `SELECT * FROM ${table}` (dòng 165) |
| Packages | app-registry, auth, billing, command-system, design-system, email, file-system, fulfillment, integrations, legal, machine-state, security |
| Apps | api (Worker), marketing (Vite+React), web-os (Vite+React+PWA), mobile (shell) |
| Services | activity, approvals, fulfillment-worker, memory, orchestration |
| Tests | Claim 147 tests, cần verify thật |
| Security | CORS `*`, SQLi, JWT stub — KHÔNG production-ready |

### 4.2 Chiến lược áp dụng

```
BƯỚC 1 — FIX Gen2 security (không thêm tool trước)
  → Fix CORS allowlist (dòng 36)
  → Fix SQLi table whitelist (dòng 165)
  → Fix JWT verify (HMAC thật, không base64 stub)
  → Re-run audit thật (không fabricate)

BƯỚC 2 — Tích hợp 36 tool vào Gen2 (theo 7 lớp)
  → L1: better-auth (thay auth tự chế), openfga, opa
  → L2: langgraph, crewAI, software-agent-sdk, dify
  → L3: mem0, qdrant, llama_index, haystack
  → L4: n8n, browser-use, skyvern
  → L5: deepeval, promptfoo, opik, phoenix
  → L6: helicone, langfuse, grafana, loki, otel-collector
  → L7: semgrep, trivy, grype, gitleaks, cosign, slsa

BƯỚC 3 — Build 3 package orchestration mới
  → @maytinhai/tool-registry (sau inherit thành @nai/tool-registry)
  → @maytinhai/orchestrator
  → @maytinhai/feedback-loop

BƯỚC 4 — Wire event bus (Cloudflare Queues)
  → Mỗi tool subscribe event
  → Trigger → chuỗi tool tự khởi động

BƯỚC 5 — Verify Gen2 chạy thật
  → E2E: user command → 10 bước → output
  → Security scan pass
  → Observability dashboard live
  → Feedback loop active

BƯỚC 6 — Inherit vào NAI
  → Copy packages từ Gen2 → NAI (fix security khi copy)
  → Rebrand @maytinhai/* → @nai/*
  → NAI chạy độc lập, không phụ thuộc Gen2 runtime
```

### 4.3 Phân công tool theo package Gen2

| Tool gốc | Gen2 package | NAI package (inherit) | Loại |
|---|---|---|---|
| better-auth | `@maytinhai/auth` (rewrite) | `@nai/auth` | Rewrite |
| openfga | `@maytinhai/authz-fga` (new) | `@nai/policy-fga` | New |
| opa | `@maytinhai/policy-engine` (new) | `@nai/policy-engine` | New |
| langgraph | `@maytinhai/agent-graph` (new) | `@nai/agent-graph` | New |
| crewAI | `@maytinhai/crew` (new) | `@nai/crew` | New |
| software-agent-sdk | `@maytinhai/agent-sdk` (new) | `@nai/agent-sdk` | New |
| dify | `@maytinhai/llm-platform` (new) | `@nai/llm-platform` | New |
| mem0 | `@maytinhai/memory` (rewrite existing) | `@nai/memory` | Rewrite |
| qdrant | `@maytinhai/vector` (new) | `@nai/vector` | New |
| llama_index | `@maytinhai/rag` (new) | `@nai/rag` | New |
| haystack | `@maytinhai/pipeline` (new) | `@nai/pipeline` | New |
| n8n | `@maytinhai/workflow` (new) | `@nai/workflow` | New |
| browser-use | `@maytinhai/browser` (new) | `@nai/browser` | New |
| skyvern | `@maytinhai/browser-visual` (new) | `@nai/browser-visual` | New |
| deepeval | `@maytinhai/test-llm` (new) | `@nai/test-llm` | New |
| promptfoo | `@maytinhai/test-prompt` (new) | `@nai/test-prompt` | New |
| opik | `@maytinhai/eval` (new) | `@nai/eval` | New |
| phoenix | `@maytinhai/observe-phoenix` (new) | `@nai/observe-phoenix` | New |
| helicone | `@maytinhai/observe-llm` (new) | `@nai/observe-llm` | New |
| langfuse | `@maytinhai/trace` (new) | `@nai/trace` | New |
| grafana | `@maytinhai/dashboard` (new) | `@nai/dashboard` | New |
| loki | `@maytinhai/logs` (new) | `@nai/logs` | New |
| otel-collector | `@maytinhai/telemetry` (new) | `@nai/telemetry` | New |
| semgrep | `@maytinhai/security-sast` (new) | `@nai/security-sast` | New |
| trivy | `@maytinhai/security-image` (new) | `@nai/security-image` | New |
| grype | `@maytinhai/security-vuln` (new) | `@nai/security-vuln` | New |
| gitleaks | `@maytinhai/security-secret` (new) | `@nai/security-secret` | New |
| cosign | `@maytinhai/security-sign` (new) | `@nai/security-sign` | New |
| slsa | `@maytinhai/security-provenance` (new) | `@nai/security-provenance` | New |
| terraform | `@maytinhai/infra-tf` (new) | `@nai/infra-tf` | New |
| kubernetes | `@maytinhai/infra-k8s` (new) | `@nai/infra-k8s` | New |
| argo-cd | `@maytinhai/cd` (new) | `@nai/cd` | New |
| openhands | `@maytinhai/dev-agent` (new, internal) | `@nai/dev-agent` | New |
| mcp-sdk | `@maytinhai/sdk` (new) | `@nai/sdk` | New |
| mcp-servers | `@maytinhai/mcp-servers` (new) | `@nai/mcp-servers` | New |

### 4.4 Sprint plan Gen2

#### Sprint G2-0 — Security Fix (2 ngày)

| Task | File | Fix |
|---|---|---|
| G2-0.1 | `apps/api/src/index.ts:36` | CORS `*` → allowlist `maytinhai.org`, `app.maytinhai.org` |
| G2-0.2 | `apps/api/src/index.ts:165` | SQLi `${table}` → table whitelist + parameterized |
| G2-0.3 | `apps/api/src/index.ts` | JWT verify → HMAC thật (không base64 stub) |
| G2-0.4 | Re-run audit | `pnpm test` thật, ghi kết quả thật, không fabricate |

**Exit gate:** `pnpm test` pass + security scan (semgrep + gitleaks) pass + audit report thật.

#### Sprint G2-1 — L1 Identity (5 ngày)

| Task | Package | Tool |
|---|---|---|
| G2-1.1 | `@maytinhai/auth` rewrite | better-auth |
| G2-1.2 | `@maytinhai/authz-fga` new | openfga |
| G2-1.3 | `@maytinhai/policy-engine` new | opa |
| G2-1.4 | Wire vào `apps/api/` | Auth middleware + RBAC + policy |

**Exit gate:** E2E register → login → RBAC check → policy decision → audit.

#### Sprint G2-2 — L2 Runtime (8 ngày)

| Task | Package | Tool |
|---|---|---|
| G2-2.1 | `@maytinhai/agent-graph` new | langgraph |
| G2-2.2 | `@maytinhai/crew` new | crewAI |
| G2-2.3 | `@maytinhai/agent-sdk` new | software-agent-sdk |
| G2-2.4 | `@maytinhai/llm-platform` new | dify |
| G2-2.5 | Wire vào `apps/api/` | Agent orchestration + model routing |

**Exit gate:** E2E command → agent graph → model call → tool dispatch → result.

#### Sprint G2-3 — L3 Knowledge (6 ngày)

| Task | Package | Tool |
|---|---|---|
| G2-3.1 | `@maytinhai/memory` rewrite | mem0 |
| G2-3.2 | `@maytinhai/vector` new | qdrant |
| G2-3.3 | `@maytinhai/rag` new | llama_index |
| G2-3.4 | `@maytinhai/pipeline` new | haystack |
| G2-3.5 | Wire vào agent | Memory recall + vector search + RAG |

**Exit gate:** E2E command → memory recall → vector search → RAG → synthesized answer.

#### Sprint G2-4 — L4 Automation (5 ngày)

| Task | Package | Tool |
|---|---|---|
| G2-4.1 | `@maytinhai/workflow` new | n8n |
| G2-4.2 | `@maytinhai/browser` new | browser-use |
| G2-4.3 | `@maytinhai/browser-visual` new | skyvern |
| G2-4.4 | Wire vào agent | Browser action + workflow trigger |

**Exit gate:** E2E scheduled workflow → browser crawl → data extract → evidence.

#### Sprint G2-5 — L5 Quality (4 ngày)

| Task | Package | Tool |
|---|---|---|
| G2-5.1 | `@maytinhai/test-llm` new | deepeval |
| G2-5.2 | `@maytinhai/test-prompt` new | promptfoo |
| G2-5.3 | `@maytinhai/eval` new | opik |
| G2-5.4 | `@maytinhai/observe-phoenix` new | phoenix |
| G2-5.5 | Wire vào CI | Eval gate block merge nếu fail |

**Exit gate:** CI chạy deepeval + promptfoo → pass → merge. Phoenix drift alert active.

#### Sprint G2-6 — L6 Observability (5 ngày)

| Task | Package | Tool |
|---|---|---|
| G2-6.1 | `@maytinhai/observe-llm` new | helicone |
| G2-6.2 | `@maytinhai/trace` new | langfuse |
| G2-6.3 | `@maytinhai/telemetry` new | otel-collector |
| G2-6.4 | `@maytinhai/dashboard` new | grafana |
| G2-6.5 | `@maytinhai/logs` new | loki |
| G2-6.6 | Wire vào tất cả L2-L4 | Trace + metrics + logs + dashboard |

**Exit gate:** Grafana dashboard live — cost, latency, trace, logs visible.

#### Sprint G2-7 — L7 Security (4 ngày)

| Task | Package | Tool |
|---|---|---|
| G2-7.1 | `@maytinhai/security-sast` new | semgrep |
| G2-7.2 | `@maytinhai/security-image` new | trivy |
| G2-7.3 | `@maytinhai/security-vuln` new | grype |
| G2-7.4 | `@maytinhai/security-secret` new | gitleaks |
| G2-7.5 | `@maytinhai/security-sign` new | cosign |
| G2-7.6 | `@maytinhai/security-provenance` new | slsa |
| G2-7.7 | Wire vào CI/CD | Pre-commit + CI + deploy gate |

**Exit gate:** CI: semgrep + gitleaks pass → trivy + grype pass → cosign sign → slsa attestation → deploy.

#### Sprint G2-8 — Orchestration (5 ngày)

| Task | Package | Mô tả |
|---|---|---|
| G2-8.1 | `@maytinhai/tool-registry` | Metadata + capability + entitlement gate |
| G2-8.2 | `@maytinhai/orchestrator` | Route task → tool chain (langgraph-based) |
| G2-8.3 | Cloudflare Queues | Event bus — mỗi tool subscribe |
| G2-8.4 | Wire intelligent routing | Agent tự chọn tool qua registry |

**Exit gate:** E2E command → orchestrator chọn tool chain → 10 bước tự động → output + evidence + audit.

#### Sprint G2-9 — Feedback Loop (3 ngày)

| Task | Package | Mô tả |
|---|---|---|
| G2-9.1 | `@maytinhai/feedback-loop` | phoenix drift → n8n trigger → dify update |
| G2-9.2 | `@maytinhai/cost-optimizer` | helicone data → dify route cheaper model |
| G2-9.3 | `@maytinhai/self-heal` | grype CVE → n8n patch → cosign re-sign → argo-cd redeploy |

**Exit gate:** Feedback loop active — drift detected → auto re-prompt → monitor improvement.

#### Sprint G2-10 — Inherit vào NAI (3 ngày)

| Task | Mô tả |
|---|---|
| G2-10.1 | Copy packages từ Gen2 → NAI (fix security khi copy) |
| G2-10.2 | Rebrand `@maytinhai/*` → `@nai/*` |
| G2-10.3 | Contamination gate — không để `maytinhai` trong NAI user-facing |
| G2-10.4 | NAI chạy độc lập, không phụ thuộc Gen2 runtime |

**Exit gate:** NAI `pnpm install && pnpm build && pnpm typecheck` pass. Contamination scan clean.

### 4.5 Tổng effort Gen2

| Sprint | Days | Cumulative |
|--------|------|------------|
| G2-0 Security Fix | 2 | 2 |
| G2-1 L1 Identity | 5 | 7 |
| G2-2 L2 Runtime | 8 | 15 |
| G2-3 L3 Knowledge | 6 | 21 |
| G2-4 L4 Automation | 5 | 26 |
| G2-5 L5 Quality | 4 | 30 |
| G2-6 L6 Observability | 5 | 35 |
| G2-7 L7 Security | 4 | 39 |
| G2-8 Orchestration | 5 | 44 |
| G2-9 Feedback Loop | 3 | 47 |
| G2-10 Inherit NAI | 3 | 50 |
| **Total** | **50 dev-days** | **~25 calendar days (2 dev parallel)** |

---

## 5. Verification — Gen2 phải pass trước khi inherit

| # | Check | Command | Criteria |
|---|-------|---------|----------|
| 1 | Security fix | `pnpm --filter ./apps/api test` | CORS allowlist, SQLi whitelist, JWT HMAC — all pass |
| 2 | L1 Identity E2E | `pnpm test:e2e -- --grep "identity"` | register → login → RBAC → policy → audit |
| 3 | L2 Runtime E2E | `pnpm test:e2e -- --grep "runtime"` | command → agent → model → tool → result |
| 4 | L3 Knowledge E2E | `pnpm test:e2e -- --grep "knowledge"` | memory recall + vector search + RAG |
| 5 | L4 Automation E2E | `pnpm test:e2e -- --grep "automation"` | workflow → browser → extract → evidence |
| 6 | L5 Quality CI | `pnpm test:eval` | deepeval + promptfoo pass |
| 7 | L6 Observability | `curl https://grafana.maytinhai.org/api/health` | 200 OK |
| 8 | L7 Security CI | `pnpm test:security` | semgrep + gitleaks + trivy + grype pass |
| 9 | Orchestration E2E | `pnpm test:e2e -- --grep "orchestration"` | 10 bước tự động end-to-end |
| 10 | Feedback loop | Trigger drift → verify auto re-prompt | Drift detected → dify updated → langfuse tracked |
| 11 | Audit report thật | `pnpm test -- --reporter=json` | JSON output, không fabricate |
| 12 | Contamination gate | `bash tools/audit-clone-contamination.sh` | 0 `maytinhai` string trong NAI user-facing |

---

## 6. Tổng kết

| Metric | Value |
|--------|-------|
| Tổng tool | 36 (7 lớp) |
| Cặp phối hợp mạnh | 10 |
| Tool độc lập | 36/36 (mỗi tool chạy riêng được) |
| Package mới Gen2 | 30 (6 rewrite + 24 new) |
| Package mới NAI (inherit) | 36 (rebrand @maytinhai/* → @nai/*) |
| Sprint Gen2 | 11 sprints (G2-0 → G2-10) |
| Effort Gen2 | 50 dev-days |
| Calendar Gen2 | ~25 days (2 dev parallel) |
| Gap packages | 6 (tool-registry, orchestrator, feedback-loop, cost-optimizer, self-heal, event bus) |
| Trigger → auto chain | 8 (user command, code push, prompt change, model call, container build, scheduled, drift, security alert) |

**Quy tắc (strict):**
1. Gen2 phải pass 12 verification checks trước khi inherit vào NAI
2. Mọi package copy sang NAI phải pass security scan (semgrep + gitleaks)
3. NAI chạy độc lập sau inherit — không phụ thuộc Gen2 runtime
4. Audit report phải thật — chạy lệnh, đọc output, không fabricate
5. Contamination gate: không để `maytinhai` trong NAI user-facing surface

---

_End of plan. Dev team bắt đầu Sprint G2-0 (Security Fix) trước._
