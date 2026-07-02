# NAI — Dev Work Items P0 + P1

- **Status:** BINDING — Founder Build Directive
- **Date:** 2026-07-02
- **Owner:** Dev lead
- **Companion to:** `DEV_TEAM_INTEGRATION_PLAN.md`, `DEV_EXECUTION_CHECKLIST.md`
- **Scope:** Chi tiết P0 (foundation) + P1 (runtime + product). P2/P3 xem trong `DEV_TEAM_INTEGRATION_PLAN.md`.

> **Format mỗi work item:** ID, tên, mô tả, input, output, acceptance criteria, dependency, estimate, owner.

---

## P0 — Foundation

### P0-A — Truth Lock & Dependency Remediation

#### WI-P0-A.1 — Setup monorepo

- **Mô tả:** Setup pnpm workspace + turbo cho `nguyenai.net/`
- **Input:** `nguyenai.net/` hiện tại (Astro scaffold, có `pnpm-workspace.yaml` cơ bản)
- **Output:**
  - `pnpm-workspace.yaml` (apps/*, packages/*, tools/*)
  - `turbo.json` (build, lint, test, typecheck pipeline)
  - `tsconfig.base.json` (shared TS config)
  - `package.json` root với scripts
- **Acceptance criteria:**
  - `pnpm install` chạy không lỗi
  - `pnpm build` chạy (kể cả khi packages rỗng)
  - `pnpm typecheck` chạy
- **Dependency:** none
- **Estimate:** 1 day
- **Owner:** Dev lead

#### WI-P0-A.2 — Rebrand script

- **Mô tả:** Tạo script auto rebrand tool gốc → `@nai/*`
- **Input:** `ai-dev-stack-repos/` (41 tool)
- **Output:**
  - `tools/rebrand/rebrand.ts`
  - `tools/rebrand/rebrand.config.json` (map tool → `@nai/*` name)
  - `tools/rebrand/test-rebrand.ts`
- **Acceptance criteria:**
  - Script chạy trên 1 tool mẫu (better-auth) → output `@nai/auth` package
  - Test pass
  - Script handle: package.json name, binary name, UI string, domain reference
- **Dependency:** WI-P0-A.1
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P0-A.3 — Rebrand 41 tool

- **Mô tả:** Rebrand toàn bộ 41 tool từ `ai-dev-stack-repos/` → `packages/@nai/*`
- **Input:** `tools/rebrand/rebrand.ts` (WI-P0-A.2)
- **Output:** 36 packages trong `packages/` (sau khi loại bỏ bare clone)
- **Acceptance criteria:**
  - 36 packages tồn tại trong `packages/`
  - Mỗi package có `package.json` với `name: @nai/<function>`
  - Mỗi package có `NOTICE.nai.md` ghi rõ rebrand + nguồn
  - Mỗi package giữ LICENSE gốc
  - Không có tên tool gốc trong user-facing string
  - `pnpm install` pass
- **Dependency:** WI-P0-A.2
- **Estimate:** 5 days
- **Owner:** Dev team (parallel)

#### WI-P0-A.4 — Loại bỏ bare clone + rỗng

- **Mô tả:** Xóa `dify.git/`, `langgraph.git/`, `phoenix.git/`, `langgraph2/`
- **Input:** `ai-dev-stack-repos/`
- **Output:** Clean directory
- **Acceptance criteria:**
  - Không còn `.git/` suffix dir
  - Không còn rỗng dir
- **Dependency:** none
- **Estimate:** 0.5 day
- **Owner:** Dev

#### WI-P0-A.5 — Sync governance docs

- **Mô tả:** Verify 9 governance docs + catalog + dev plan trong `docs/governance/`
- **Input:** `docs/governance/`
- **Output:** Verified
- **Acceptance criteria:**
  - 12 docs tồn tại: 9 governance + catalog + dev plan + QA audit
  - `AGENTS.md` source-of-truth list cập nhật
- **Dependency:** none
- **Estimate:** 0.5 day
- **Owner:** Dev

#### WI-P0-A.6 — Lock AGENTS.md

- **Mô tả:** Founder review + sign-off `AGENTS.md`
- **Input:** `AGENTS.md`
- **Output:** Locked
- **Acceptance criteria:**
  - Founder sign-off (commit message hoặc doc)
- **Dependency:** WI-P0-A.5
- **Estimate:** 0.5 day
- **Owner:** Founder

#### WI-P0-A.7 — Clone contamination audit

- **Mô tả:** Audit không để tên `maytinhai`, `computer.iai.one`, `Máy Tính AI`, `IAI` trong user-facing surface
- **Input:** `nguyenai.net/` source
- **Output:**
  - Audit report
  - `tools/audit-clone-contamination.sh` CI gate
- **Acceptance criteria:**
  - Grep user-facing file (src/, public/, docs/ trừ governance audit docs) → 0 match
  - CI gate: fail build nếu tìm thấy
- **Dependency:** WI-P0-A.3
- **Estimate:** 1 day
- **Owner:** Dev

---

### P0-B — Identity & Access Foundation

#### WI-P0-B.1 — Auth service

- **Mô tả:** Setup `@nai/auth` (better-auth rebrand) với email/pass, OAuth, session, MFA, API key
- **Input:** `@nai/auth` package (WI-P0-A.3)
- **Output:** Auth service chạy
- **Acceptance criteria:**
  - Register → login → session → logout E2E pass
  - OAuth (Google, GitHub) E2E pass
  - MFA (TOTP) E2E pass
  - API key generate + verify pass
- **Dependency:** WI-P0-A.3, WI-P0-B.4
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P0-B.2 — FGA service

- **Mô tả:** Setup `@nai/policy-fga` (openfga rebrand) — RBAC + relationship-based
- **Input:** `@nai/policy-fga` package
- **Output:** FGA service chạy
- **Acceptance criteria:**
  - Authorization model defined: owner, family-member, chapter-member, admin, investor-qualified
  - Check permission E2E pass
  - Relationship tuple test pass
- **Dependency:** WI-P0-A.3, WI-P0-B.4
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P0-B.3 — Policy engine

- **Mô tả:** Setup `@nai/policy-engine` (opa rebrand) — approval gate, sensitive action, data classification
- **Input:** `@nai/policy-engine` package
- **Output:** Policy service chạy
- **Acceptance criteria:**
  - Policy: sensitive action approval gate — eval pass
  - Policy: data classification enforcement — eval pass
  - Policy: entitlement check — eval pass
- **Dependency:** WI-P0-A.3, WI-P0-B.5
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P0-B.4 — Identity schema

- **Mô tả:** Implement DB schema per `IDENTITY_AND_TENANCY_RFC.md`
- **Input:** `IDENTITY_AND_TENANCY_RFC.md`
- **Output:** DB schema + migration
- **Acceptance criteria:**
  - Tables: users, tenants, tenant_memberships, identities, sessions
  - Migration chạy không lỗi
  - Schema match RFC
- **Dependency:** WI-P0-A.1
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P0-B.5 — Entitlement engine

- **Mô tả:** Build `@nai/entitlement` — đọc `PRODUCT_CATALOG_9x9.md` → entitlement keys
- **Input:** `PRODUCT_CATALOG_9x9.md`
- **Output:** Entitlement service chạy
- **Acceptance criteria:**
  - Catalog JSON load + validate pass
  - User → plan → entitlements resolution pass
  - Quota enforcement (command/day, token/month) pass
  - Model tier gate (free/standard/pro/enterprise) pass
  - User Start → 10 command/day gate works
- **Dependency:** WI-P0-A.3, WI-P0-B.4
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P0-B.6 — Audit service

- **Mô tả:** Build `@nai/audit` — append-only R2 + Postgres index
- **Input:** none
- **Output:** Audit service chạy
- **Acceptance criteria:**
  - Schema: audit_log (id, tenant, user, action, target, timestamp, evidence_ref)
  - `logAuditEvent()` write to R2 + Postgres
  - `queryAuditLog()` query from Postgres
  - Append-only enforced (no update/delete)
  - Log + query E2E pass
- **Dependency:** WI-P0-B.4
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P0-B.7 — Approval gate

- **Mô tả:** Build `@nai/approval` — UI + backend
- **Input:** `@nai/policy-engine` (WI-P0-B.3)
- **Output:** Approval flow chạy
- **Acceptance criteria:**
  - Flow: request → notify approver → approve/deny → audit
  - Integrate với `@nai/policy-engine`
  - Sensitive action → approval → audit E2E pass
- **Dependency:** WI-P0-B.3, WI-P0-B.6
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P0-B.8 — P0-B E2E integration test

- **Mô tả:** E2E test toàn bộ P0-B chain
- **Input:** WI-P0-B.1 đến WI-P0-B.7
- **Output:** E2E test pass
- **Acceptance criteria:**
  - Test: register → login → tenant created → entitlement loaded → sensitive action → approval → audit
  - Toàn bộ chain pass
- **Dependency:** WI-P0-B.1 đến WI-P0-B.7
- **Estimate:** 1 day
- **Owner:** Dev

---

## P1 — Runtime + Product

### P1-A — Core Runtime (Gen1 integration)

#### WI-P1-A.1 — Gen1 API integration

- **Mô tả:** Migrate Gen1 runtime từ `Computer.iai.one/` vào `apps/api/` (Hono on Workers)
- **Input:** `Computer.iai.one/` source
- **Output:** `apps/api/` chạy local
- **Acceptance criteria:**
  - `apps/api/` serve health check
  - `apps/api/` serve `/api/command` (real, không simulated)
- **Dependency:** WI-P0-A.1
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-A.2 — Fix Gen1 issues

- **Mô tả:** Fix build broken, missing files, simulated endpoint, missing storage, exposed secret
- **Input:** `Computer.iai.one/` audit report
- **Output:** Build pass
- **Acceptance criteria:**
  - `pnpm build` pass
  - `pnpm typecheck` pass
  - `/api/command` real implementation
  - Memory/data vault object storage implemented
  - Secrets vault implemented
  - No exposed secret trong `.env.local`
- **Dependency:** WI-P1-A.1
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-A.3 — Agent graph

- **Mô tả:** Setup `@nai/agent-graph` (langgraph rebrand) — orchestrate 9 NAI Agents
- **Input:** `@nai/agent-graph` package
- **Output:** Agent runtime chạy
- **Acceptance criteria:**
  - 9 NAI Agents defined: Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian
  - Agent state machine defined
  - Agent dispatch E2E pass
- **Dependency:** WI-P1-A.1
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-A.4 — Agent SDK

- **Mô tả:** Setup `@nai/agent-sdk` (software-agent-sdk rebrand) — tool call, approval, evidence
- **Input:** `@nai/agent-sdk` package
- **Output:** SDK chạy
- **Acceptance criteria:**
  - Tool call interface implemented
  - Approval integration (gọi `@nai/approval`)
  - Evidence generation (gọi `@nai/evidence`)
  - Tool call → approval → evidence E2E pass
- **Dependency:** WI-P1-A.3, WI-P0-B.7, WI-P1-A.9
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-A.5 — LLM platform

- **Mô tả:** Setup `@nai/llm-platform` (dify rebrand) — prompt management, model routing
- **Input:** `@nai/llm-platform` package
- **Output:** LLM platform chạy
- **Acceptance criteria:**
  - Model routing: free/standard/pro/enterprise tier
  - Prompt management + versioning
  - Model call per tier E2E pass (Start → free model, Founder → pro model)
- **Dependency:** WI-P0-B.5
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-A.6 — Memory service

- **Mô tả:** Setup `@nai/memory` (mem0 rebrand) — 6 memory types
- **Input:** `@nai/memory` package
- **Output:** Memory service chạy
- **Acceptance criteria:**
  - 6 memory types: session, preference, project, decision, family, founder
  - Memory CRUD + search
  - Memory write → read → search E2E pass
- **Dependency:** WI-P0-B.4
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-A.7 — Vector service

- **Mô tả:** Setup `@nai/vector` (qdrant rebrand) — semantic search, evidence retrieval
- **Input:** `@nai/vector` package
- **Output:** Vector service chạy
- **Acceptance criteria:**
  - Collections: evidence, knowledge, memory
  - Upsert + search
  - Upsert → search E2E pass
- **Dependency:** WI-P0-A.3
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-A.8 — RAG pipeline

- **Mô tả:** Setup `@nai/rag` (llama_index rebrand) — document indexing, source synthesis
- **Input:** `@nai/rag` package, `@nai/vector` (WI-P1-A.7)
- **Output:** RAG pipeline chạy
- **Acceptance criteria:**
  - Document indexing
  - Source synthesis + citation
  - Index → query → cited answer E2E pass
- **Dependency:** WI-P1-A.7
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-A.9 — Evidence engine

- **Mô tả:** Build `@nai/evidence` — proof record, audit trail, evidence pack export
- **Input:** none
- **Output:** Evidence engine chạy
- **Acceptance criteria:**
  - Schema: evidence (id, tenant, command, agent, tool, input, output, proof_hash, timestamp)
  - Evidence pack export (JSON + signed)
  - Command → evidence → export E2E pass
- **Dependency:** WI-P0-B.6
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-A.10 — Console MVP

- **Mô tả:** Build `apps/console/` (app.nguyenai.net) — chat UI, agent panel, memory panel, vault panel, approval panel
- **Input:** `apps/api/` (WI-P1-A.1)
- **Output:** Console chạy local
- **Acceptance criteria:**
  - Chat UI (command input + response)
  - Agent panel (9 agents status)
  - Memory panel (view/search memory)
  - Vault panel (file list + upload)
  - Approval panel (pending approvals)
  - Console chạy local + kết nối API
- **Dependency:** WI-P1-A.1, WI-P1-A.3, WI-P1-A.6, WI-P1-A.9, WI-P0-B.7
- **Estimate:** 5 days
- **Owner:** Dev

#### WI-P1-A.11 — P1-A E2E test

- **Mô tả:** E2E test toàn bộ P1-A chain
- **Input:** WI-P1-A.1 đến WI-P1-A.10
- **Output:** E2E test pass
- **Acceptance criteria:**
  - Test: user gửi command → agent chạy → tool call → evidence → audit
  - Toàn bộ chain pass
- **Dependency:** WI-P1-A.1 đến WI-P1-A.10
- **Estimate:** 1 day
- **Owner:** Dev

---

### P1-B — Product System (Gen2 integration)

> **Gen2 audit status:** NOT independently cloned/executed. WI-P1-B.0 là prerequisite bắt buộc trước khi migrate.

#### WI-P1-B.0 — Gen2 pre-integration audit (NEW)

- **Mô tả:** Clone Gen2 repo, build, audit trước khi migrate
- **Input:** Gen2 repo (`maytinhai.org` / `maytinhai-os`)
- **Output:** Audit report
- **Acceptance criteria:**
  - Gen2 repo cloned
  - Build local (document result: pass/fail + issues)
  - Audit: package structure, dependency, broken code, stub
  - Audit: entitlement/billing SDK — verify không violate governance (Gen2 own entitlement + billing)
  - Audit: clone contamination (tên `maytinhai`, `computer.iai.one` trong code)
  - Document: list package cần migrate, package cần loại bỏ, package cần fix
  - Go/no-go decision cho migration
- **Dependency:** WI-P0-A.7
- **Estimate:** 2 days
- **Owner:** Dev lead
- **Note:** Nếu Gen2 build broken hoặc có violation nghiêm trọng, STOP và escalate Founder trước khi tiếp tục.

#### WI-P1-B.1 — Gen2 migration

- **Mô tả:** Migrate Gen2 packages vào `nguyenai.net/packages/` với rebrand
- **Input:** Gen2 audit report (WI-P1-B.0)
- **Output:** Packages migrated
- **Acceptance criteria:**
  - Migrate packages từ `maytinhai-os/packages/`: app-registry, auth, billing, command-system, design-system, email, file-system, fulfillment, integrations, legal, machine-state, security
  - Rebrand `@maytinhai/*` → `@nai/*`
  - `pnpm install` + `pnpm build` pass sau migration
  - Không conflict với package đã có từ P0-A.3
- **Dependency:** WI-P1-B.0, WI-P0-A.3
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-B.2 — Catalog service

- **Mô tả:** Build `@nai/catalog` — đọc `PRODUCT_CATALOG_9x9.md` → JSON
- **Input:** `PRODUCT_CATALOG_9x9.md`
- **Output:** Catalog service + JSON files
- **Acceptance criteria:**
  - Output files: `models.json`, `functional-products.json`, `entitlements.json`, `limits.json`, `prices.json`, `compatibility.json`, `academy-access.json`, `catalog.schema.json`
  - JSON schema validation pass
  - Catalog load + validate E2E pass
- **Dependency:** WI-P0-A.5
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-B.3 — Billing service

- **Mô tả:** Build `@nai/billing` — subscription recurring, dunning, proration
- **Input:** `@nai/catalog` (WI-P1-B.2)
- **Output:** Billing service chạy
- **Acceptance criteria:**
  - Create subscription, upgrade, downgrade, cancel
  - Dunning (retry failed payment)
  - Proration (upgrade/downgrade tính prorated)
  - Integrate với `@nai/entitlement` (subscription change → entitlement change)
  - Subscribe → upgrade → entitlement update E2E pass
- **Dependency:** WI-P0-B.5, WI-P1-B.2
- **Estimate:** 4 days
- **Owner:** Dev

#### WI-P1-B.4 — Payment gateway

- **Mô tả:** Tích hợp VNPay (VND) + Stripe (USD)
- **Input:** `@nai/billing` (WI-P1-B.3)
- **Output:** Payment gateway chạy
- **Acceptance criteria:**
  - VNPay sandbox: test payment + webhook E2E pass
  - Stripe sandbox: test payment + webhook E2E pass
  - Payment success → trigger billing subscription
- **Dependency:** WI-P1-B.3
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-B.5 — Invoice service

- **Mô tả:** Build `@nai/invoice` — VAT VN + international invoice
- **Input:** `@nai/billing` (WI-P1-B.3)
- **Output:** Invoice service chạy
- **Acceptance criteria:**
  - VAT VN (10%) cho VND payment
  - International invoice cho USD payment
  - Invoice generation sau payment success
  - Invoice PDF export
  - Payment → invoice → PDF E2E pass
- **Dependency:** WI-P1-B.3, WI-P1-B.4
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-B.6 — Vault crypto

- **Mô tả:** Build `@nai/vault-crypto` — AES-256-GCM per-tenant key
- **Input:** none
- **Output:** Vault crypto chạy
- **Acceptance criteria:**
  - Key management (generate, rotate, revoke)
  - Encrypt/decrypt file
  - Encrypt → store → decrypt E2E pass
  - Key isolation per tenant
- **Dependency:** WI-P0-B.4
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-B.7 — Backup

- **Mô tả:** Build `@nai/backup` — R2 replication + snapshot
- **Input:** `@nai/vault-crypto` (WI-P1-B.6)
- **Output:** Backup service chạy
- **Acceptance criteria:**
  - Scheduled backup (daily)
  - R2 replication
  - Restore
  - Backup → restore E2E pass
- **Dependency:** WI-P1-B.6
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-B.8 — Super Apps (6 AI tools)

- **Mô tả:** Implement 6 AI Super Apps
- **Input:** `@nai/agent-graph` (WI-P1-A.3), `@nai/agent-sdk` (WI-P1-A.4)
- **Output:** 6 Super Apps chạy
- **Acceptance criteria:**
  - AI Office — documents, spreadsheets, presentations, reports, minutes, summaries
  - AI Research — web search, PDF reading, source comparison, bibliography
  - AI Content — articles, bilingual, SEO, social media, newsletter
  - AI Browser — controlled web access, page reading, data extraction
  - AI Code — repository audit, write, test, fix, deploy
  - AI Automation — workflow, trigger, scheduled task, notification
  - Mỗi Super App có test cơ bản pass
- **Dependency:** WI-P1-A.3, WI-P1-A.4
- **Estimate:** 8 days
- **Owner:** Dev team (parallel)

#### WI-P1-B.9 — Nguyen Super Apps (7 Nguyen tools)

- **Mô tả:** Implement 7 Nguyen Super Apps
- **Input:** `@nai/agent-graph` (WI-P1-A.3), `@nai/agent-sdk` (WI-P1-A.4)
- **Output:** 7 Nguyen Apps chạy
- **Acceptance criteria:**
  - Nguyen Roots — family graph, family tree, branches, relationships, timeline
  - Nguyen Memory — photos, documents, journals, interviews, oral history, archive
  - Nguyen Knowledge — history, culture, research library, sourced Q&A, bilingual articles
  - Nguyen Trust — claim, source, evidence, verification, dispute, confidence, audit
  - Nguyen Network — individuals, experts, founders, chapters, diaspora, events
  - Nguyen Founders — founder profiles, businesses, projects, mentorship, partnership
  - Nguyen Chapter OS — membership, governance, archive, events, communication, chapter website
  - Mỗi Nguyen App có test cơ bản pass
- **Dependency:** WI-P1-A.3, WI-P1-A.4
- **Estimate:** 8 days
- **Owner:** Dev team (parallel)

#### WI-P1-B.10 — P1-B E2E test

- **Mô tả:** E2E test toàn bộ P1-B chain
- **Input:** WI-P1-B.1 đến WI-P1-B.9
- **Output:** E2E test pass
- **Acceptance criteria:**
  - Test: subscribe Personal → mua Office Pro → dùng AI Office → evidence → invoice
  - Toàn bộ chain pass
- **Dependency:** WI-P1-B.1 đến WI-P1-B.9
- **Estimate:** 1 day
- **Owner:** Dev

---

### P1-C — Automation & Browser

#### WI-P1-C.1 — Workflow engine

- **Mô tả:** Setup `@nai/workflow` (n8n rebrand)
- **Input:** `@nai/workflow` package
- **Output:** Workflow engine chạy
- **Acceptance criteria:**
  - Scheduled task + trigger
  - Trigger → task E2E pass
- **Dependency:** WI-P0-A.3
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-C.2 — Browser agent

- **Mô tả:** Setup `@nai/browser` (browser-use rebrand)
- **Input:** `@nai/browser` package
- **Output:** Browser agent chạy
- **Acceptance criteria:**
  - Controlled web access (allowlist, denylist)
  - Navigate → read page E2E pass
- **Dependency:** WI-P0-A.3
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-C.3 — Visual browser

- **Mô tả:** Setup `@nai/browser-visual` (skyvern rebrand)
- **Input:** `@nai/browser-visual` package
- **Output:** Visual browser chạy
- **Acceptance criteria:**
  - Form fill, multi-step web workflow
  - Form fill E2E pass (sandbox site)
- **Dependency:** WI-P1-C.2
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-C.4 — Crew runtime

- **Mô tả:** Setup `@nai/crew` (crewAI rebrand)
- **Input:** `@nai/crew` package
- **Output:** Crew runtime chạy
- **Acceptance criteria:**
  - Crew cho Founder Suite (Founder + Business Operator + Researcher)
  - Crew cho Business Pack (Business Operator + Global Connector + Sales)
  - Crew collaboration E2E pass
- **Dependency:** WI-P1-A.3
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-C.5 — Pipeline

- **Mô tả:** Setup `@nai/pipeline` (haystack rebrand)
- **Input:** `@nai/pipeline` package
- **Output:** Pipeline chạy
- **Acceptance criteria:**
  - Research pipeline (search → read → synthesize → cite)
  - Evidence pipeline (collect → verify → pack → export)
  - Pipeline E2E pass
- **Dependency:** WI-P1-A.8
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-C.6 — Approval gate integration

- **Mô tả:** Integrate approval gate vào browser + workflow
- **Input:** `@nai/approval` (WI-P0-B.7)
- **Output:** Approval integrated
- **Acceptance criteria:**
  - Mọi external action cần approval
  - Workflow → external action → approval → audit E2E pass
- **Dependency:** WI-P1-C.1, WI-P1-C.2, WI-P0-B.7
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-C.7 — P1-C E2E test

- **Mô tả:** E2E test toàn bộ P1-C chain
- **Acceptance criteria:**
  - Test: workflow trigger → browser agent → data extraction → evidence → audit
  - Toàn bộ chain pass
- **Dependency:** WI-P1-C.1 đến WI-P1-C.6
- **Estimate:** 1 day
- **Owner:** Dev

---

### P1-D — Observability & Eval

#### WI-P1-D.1 — LLM observability

- **Mô tả:** Setup `@nai/observe-llm` (helicone rebrand)
- **Acceptance criteria:**
  - Instrument mọi LLM call → log cost, latency, token
  - LLM call → observability dashboard E2E pass
- **Dependency:** WI-P1-A.5
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-D.2 — Tracing

- **Mô tả:** Setup `@nai/trace` (langfuse rebrand)
- **Acceptance criteria:**
  - Prompt version + session trace
  - Trace E2E pass
- **Dependency:** WI-P1-A.5
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-D.3 — Eval platform

- **Mô tả:** Setup `@nai/eval` (opik rebrand)
- **Acceptance criteria:**
  - Eval dataset + metric
  - Eval run E2E pass
- **Dependency:** WI-P1-A.5
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-D.4 — Drift monitor

- **Mô tả:** Setup `@nai/observe-phoenix` (phoenix rebrand)
- **Acceptance criteria:**
  - Drift detection
  - Drift alert E2E pass
- **Dependency:** WI-P1-D.1
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-D.5 — LLM unit test

- **Mô tả:** Setup `@nai/test-llm` (deepeval rebrand)
- **Acceptance criteria:**
  - Unit test cho 9 NAI Agents
  - Test pass
- **Dependency:** WI-P1-A.3
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-D.6 — Prompt test

- **Mô tả:** Setup `@nai/test-prompt` (promptfoo rebrand)
- **Acceptance criteria:**
  - Prompt regression test
  - Red-team test (jailbreak, PII leak)
  - Test pass
- **Dependency:** WI-P1-A.5
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-D.7 — Telemetry pipeline

- **Mô tả:** Setup `@nai/telemetry` (opentelemetry-collector rebrand)
- **Acceptance criteria:**
  - Traces + metrics + logs pipeline
  - Telemetry flow E2E pass
- **Dependency:** WI-P0-A.3
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-D.8 — Log aggregation

- **Mô tả:** Setup `@nai/logs` (loki rebrand)
- **Acceptance criteria:**
  - Log ingestion + query
  - Log query E2E pass
- **Dependency:** WI-P1-D.7
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-D.9 — Dashboard

- **Mô tả:** Setup `@nai/dashboard` (grafana rebrand)
- **Acceptance criteria:**
  - System metrics dashboard (latency, error, uptime)
  - Business KPI dashboard (subscription, revenue, usage)
  - Dashboard render E2E pass
- **Dependency:** WI-P1-D.7
- **Estimate:** 2 days
- **Owner:** Dev

#### WI-P1-D.10 — P1-D E2E test

- **Mô tả:** E2E test toàn bộ P1-D chain
- **Acceptance criteria:**
  - Test: command → trace → cost → eval → dashboard
  - Toàn bộ chain pass
- **Dependency:** WI-P1-D.1 đến WI-P1-D.9
- **Estimate:** 1 day
- **Owner:** Dev

---

### P1-E — Security & Supply Chain

#### WI-P1-E.1 — SAST

- **Mô tả:** Setup `@nai/security-sast` (semgrep rebrand) trong CI
- **Acceptance criteria:**
  - CI gate: fail merge on SAST finding
  - CI gate works
- **Dependency:** WI-P0-A.3
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-E.2 — Image scan

- **Mô tả:** Setup `@nai/security-image` (trivy rebrand)
- **Acceptance criteria:**
  - Scan mọi container image trước deploy
  - Scan report
- **Dependency:** WI-P0-A.3
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-E.3 — Vuln scan

- **Mô tả:** Setup `@nai/security-vuln` (grype rebrand)
- **Acceptance criteria:**
  - CI gate: fail on critical vuln
  - CI gate works
- **Dependency:** WI-P0-A.3
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-E.4 — Secret scan

- **Mô tả:** Setup `@nai/security-secret` (gitleaks rebrand)
- **Acceptance criteria:**
  - CI gate: fail on secret leak
  - CI gate works (test với fake secret)
- **Dependency:** WI-P0-A.3
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-E.5 — Artifact signing

- **Mô tả:** Setup `@nai/security-sign` (cosign rebrand)
- **Acceptance criteria:**
  - Sign mọi container image + package
  - Signature verify E2E pass
- **Dependency:** WI-P0-A.3
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-E.6 — Provenance

- **Mô tả:** Setup `@nai/security-provenance` (slsa rebrand)
- **Acceptance criteria:**
  - Build provenance attestation
  - Provenance verify E2E pass
- **Dependency:** WI-P1-E.5
- **Estimate:** 1 day
- **Owner:** Dev

#### WI-P1-E.7 — Safety classifier

- **Mô tả:** Build `@nai/safety` — harmful content + PII leak classifier
- **Acceptance criteria:**
  - Rule-based + LLM classifier
  - Integrate vào agent output gate
  - Harmful content blocked E2E pass
- **Dependency:** WI-P1-A.5
- **Estimate:** 3 days
- **Owner:** Dev

#### WI-P1-E.8 — Security audit

- **Mô tả:** Full security audit per `NGUYEN_AI_AI_SAFETY_POLICY.md`
- **Acceptance criteria:**
  - Internal audit report
  - External audit (nếu cần)
- **Dependency:** WI-P1-E.1 đến WI-P1-E.7
- **Estimate:** 2 days
- **Owner:** Dev + External

---

## P0 + P1 summary

| Sprint | Work items | Estimate (days) | Critical path |
|---|---|---|---|
| P0-A | 7 | 10.5 | WI-P0-A.1 → A.2 → A.3 → A.7 |
| P0-B | 8 | 18 | WI-P0-B.4 → B.1/B.2/B.5 → B.3 → B.7 → B.8 |
| P1-A | 11 | 28 | WI-P1-A.1 → A.2 → A.3 → A.4 → A.10 → A.11 |
| P1-B | 11 (gồm B.0) | 37 | WI-P1-B.0 → B.1 → B.2 → B.3 → B.4 → B.5 → B.10 |
| P1-C | 7 | 13 | WI-P1-C.1 → C.2 → C.3 → C.6 → C.7 |
| P1-D | 10 | 17 | WI-P1-D.7 → D.8/D.9 → D.10 |
| P1-E | 8 | 11 | WI-P1-E.1 → E.5 → E.6 → E.8 |
| **Total** | **62** | **134.5** | |

> **Note:** Estimate là effort days, không phải calendar days. Với dev team 3-4 người parallel, calendar time ~8-10 tuần cho P0+P1.

---

## Critical path (P0 + P1)

```
WI-P0-A.1 (monorepo)
  → WI-P0-A.2 (rebrand script)
       → WI-P0-A.3 (rebrand 41 tool)
            → WI-P0-A.7 (contamination audit)
            → WI-P0-B.4 (identity schema)
                 → WI-P0-B.1 (auth)
                 → WI-P0-B.2 (FGA)
                 → WI-P0-B.5 (entitlement)
                      → WI-P0-B.3 (policy engine)
                           → WI-P0-B.7 (approval gate)
                                → WI-P0-B.8 (P0-B E2E)
                                     → WI-P1-A.1 (Gen1 API)
                                          → WI-P1-A.2 (fix Gen1)
                                          → WI-P1-A.3 (agent graph)
                                               → WI-P1-A.4 (agent SDK)
                                               → WI-P1-B.8 (Super Apps)
                                               → WI-P1-B.9 (Nguyen Apps)
                                          → WI-P1-A.6 (memory)
                                          → WI-P1-A.7 (vector)
                                               → WI-P1-A.8 (RAG)
                                          → WI-P1-A.9 (evidence)
                                          → WI-P1-A.10 (console)
                                               → WI-P1-A.11 (P1-A E2E)
                                     → WI-P1-B.0 (Gen2 pre-audit) ← NEW prerequisite
                                          → WI-P1-B.1 (Gen2 migration)
                                               → WI-P1-B.2 (catalog)
                                                    → WI-P1-B.3 (billing)
                                                         → WI-P1-B.4 (payment)
                                                         → WI-P1-B.5 (invoice)
                                                    → WI-P1-B.10 (P1-B E2E)
```

---

## Parallelization (dev team 4 người)

| Person | P0 (tuần 1-4) | P1 (tuần 4-12) |
|---|---|---|
| Dev 1 (lead) | P0-A.1, A.2, A.6, P0-B.4, B.5, B.8 | P1-A.1, A.2, A.11, P1-B.0, B.1, B.10 |
| Dev 2 | P0-A.3 (rebrand), A.4, A.7 | P1-A.3, A.4, P1-B.8 (Super Apps) |
| Dev 3 | P0-B.1, B.2, B.3 | P1-A.5, A.6, A.7, A.8, P1-B.9 (Nguyen Apps) |
| Dev 4 | P0-B.6, B.7 | P1-A.9, A.10, P1-B.2, B.3, B.4, B.5, B.6, B.7 |

P1-C, P1-D, P1-E chạy song song P1-A/P1-B với dev team mở rộng hoặc sau khi P1-A/B xong.

---

## Change log

| Date | Version | Change | By |
|---|---|---|---|
| 2026-07-02 | V1.0 | Initial P0+P1 work items — 62 items, 134.5 effort days | Founder |
