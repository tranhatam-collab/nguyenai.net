# NAI — Dev Execution Checklist

- **Status:** BINDING — Founder Build Directive
- **Date:** 2026-07-02
- **Owner:** Dev lead
- **Companion to:** `DEV_TEAM_INTEGRATION_PLAN.md`, `DEV_WORK_ITEMS_P0_P1.md`
- **Rule:** Check từng task theo thứ tự. Không skip task trước khi task phụ thuộc hoàn thành. Mỗi task phải có evidence (commit hash, test pass, screenshot, audit report).

---

## P0-A — Truth Lock & Dependency Remediation

### P0-A.1 Setup monorepo
- [ ] Tạo `pnpm-workspace.yaml` (apps/*, packages/*, tools/*)
- [ ] Tạo `turbo.json` (build, lint, test, typecheck pipeline)
- [ ] Tạo `tsconfig.base.json` (shared TS config)
- [ ] Tạo `package.json` root với scripts: `dev`, `build`, `lint`, `test`, `typecheck`
- [ ] Verify: `pnpm install` chạy không lỗi
- [ ] Evidence: commit hash + `pnpm install` output

### P0-A.2 Rebrand script
- [ ] Tạo `tools/rebrand/rebrand.ts` — input: tool dir, output: rebrand package name, binary, UI string
- [ ] Tạo `tools/rebrand/rebrand.config.json` — map tool gốc → `@nai/*` name
- [ ] Tạo `tools/rebrand/test-rebrand.ts` — test trên 1 tool mẫu
- [ ] Verify: test pass
- [ ] Evidence: commit hash + test output

### P0-A.3 Rebrand 41 tool
- [ ] Rebrand `better-auth` → `@nai/auth`
- [ ] Rebrand `openfga` → `@nai/policy-fga`
- [ ] Rebrand `opa` → `@nai/policy-engine`
- [ ] Rebrand `mem0` → `@nai/memory`
- [ ] Rebrand `qdrant` → `@nai/vector`
- [ ] Rebrand `langgraph` → `@nai/agent-graph`
- [ ] Rebrand `llama_index` → `@nai/rag`
- [ ] Rebrand `crewAI` → `@nai/crew`
- [ ] Rebrand `haystack` → `@nai/pipeline`
- [ ] Rebrand `software-agent-sdk` → `@nai/agent-sdk`
- [ ] Rebrand `dify` → `@nai/llm-platform`
- [ ] Rebrand `browser-use` → `@nai/browser`
- [ ] Rebrand `skyvern` → `@nai/browser-visual`
- [ ] Rebrand `n8n` → `@nai/workflow`
- [ ] Rebrand `helicone` → `@nai/observe-llm`
- [ ] Rebrand `langfuse` → `@nai/trace`
- [ ] Rebrand `opik` → `@nai/eval`
- [ ] Rebrand `phoenix` → `@nai/observe-phoenix`
- [ ] Rebrand `deepeval` → `@nai/test-llm`
- [ ] Rebrand `promptfoo` → `@nai/test-prompt`
- [ ] Rebrand `semgrep` → `@nai/security-sast`
- [ ] Rebrand `trivy` → `@nai/security-image`
- [ ] Rebrand `grype` → `@nai/security-vuln`
- [ ] Rebrand `gitleaks` → `@nai/security-secret`
- [ ] Rebrand `cosign` → `@nai/security-sign`
- [ ] Rebrand `slsa` → `@nai/security-provenance`
- [ ] Rebrand `terraform` → `@nai/infra-tf`
- [ ] Rebrand `kubernetes` → `@nai/infra-k8s`
- [ ] Rebrand `argo-cd` → `@nai/cd`
- [ ] Rebrand `grafana` → `@nai/dashboard`
- [ ] Rebrand `loki` → `@nai/logs`
- [ ] Rebrand `opentelemetry-collector` → `@nai/telemetry`
- [ ] Rebrand `awesome-mcp-servers` → `@nai/mcp-catalog` (curated only)
- [ ] Rebrand `servers` → `@nai/mcp-servers`
- [ ] Rebrand `sdk-typescript` → `@nai/sdk`
- [ ] Rebrand `openhands` → `@nai/dev-agent` (internal only)
- [ ] Verify: 36 packages trong `packages/` (sau khi loại bỏ bare clone)
- [ ] Evidence: commit hash + `ls packages/` output

### P0-A.4 Loại bỏ bare clone + rỗng
- [ ] Xóa `dify.git/` (bare clone)
- [ ] Xóa `langgraph.git/` (bare clone)
- [ ] Xóa `phoenix.git/` (bare clone)
- [ ] Xóa `langgraph2/` (rỗng)
- [ ] Verify: không còn `.git/` suffix dir
- [ ] Evidence: commit hash

### P0-A.5 Sync governance docs
- [ ] Verify 9 governance docs + catalog + dev plan trong `docs/governance/`
- [ ] Verify `AGENTS.md` source-of-truth list cập nhật
- [ ] Evidence: `ls docs/governance/` output

### P0-A.6 Lock AGENTS.md
- [ ] Founder review + sign-off `AGENTS.md`
- [ ] Evidence: commit hash

### P0-A.7 Clone contamination audit
- [ ] Grep `maytinhai` trong user-facing file (src/, public/, docs/ trừ governance audit docs)
- [ ] Grep `computer.iai.one` trong user-facing file
- [ ] Grep `Máy Tính AI` trong user-facing file
- [ ] Grep `IAI` trong user-facing file (trừ LICENSE/NOTICE)
- [ ] Tạo CI gate: `tools/audit-clone-contamination.sh` — fail build nếu tìm thấy
- [ ] Evidence: audit report + CI gate commit

---

## P0-B — Identity & Access Foundation

### P0-B.1 Auth service
- [ ] Setup `@nai/auth` (better-auth rebrand) với email/pass
- [ ] Thêm OAuth (Google, GitHub)
- [ ] Thêm session management
- [ ] Thêm MFA (TOTP)
- [ ] Thêm API key support
- [ ] Verify: register → login → session → logout E2E
- [ ] Evidence: test pass + commit hash

### P0-B.2 FGA service
- [ ] Setup `@nai/policy-fga` (openfga rebrand)
- [ ] Define authorization model: owner, family-member, chapter-member, admin, investor-qualified
- [ ] Write relationship tuples test
- [ ] Verify: check permission E2E
- [ ] Evidence: test pass

### P0-B.3 Policy engine
- [ ] Setup `@nai/policy-engine` (opa rebrand)
- [ ] Write policy: sensitive action approval gate
- [ ] Write policy: data classification enforcement
- [ ] Write policy: entitlement check
- [ ] Verify: policy eval E2E
- [ ] Evidence: test pass

### P0-B.4 Identity schema
- [ ] Tạo DB schema per `IDENTITY_AND_TENANCY_RFC.md`
- [ ] Tables: users, tenants, tenant_memberships, identities, sessions
- [ ] Migration script
- [ ] Verify: migration chạy không lỗi
- [ ] Evidence: migration output

### P0-B.5 Entitlement engine
- [ ] Build `@nai/entitlement` — đọc `PRODUCT_CATALOG_9x9.md` → JSON
- [ ] Implement entitlement key resolution: user → plan → entitlements
- [ ] Implement quota enforcement (command/day, token/month)
- [ ] Implement model tier gate (free/standard/pro/enterprise)
- [ ] Verify: user Start → 10 command/day gate works
- [ ] Evidence: test pass

### P0-B.6 Audit service
- [ ] Build `@nai/audit` — append-only R2 + Postgres index
- [ ] Schema: audit_log (id, tenant, user, action, target, timestamp, evidence_ref)
- [ ] Write API: `logAuditEvent()`, `queryAuditLog()`
- [ ] Verify: log + query E2E
- [ ] Evidence: test pass

### P0-B.7 Approval gate
- [ ] Build `@nai/approval` — UI + backend
- [ ] Flow: request → notify approver → approve/deny → audit
- [ ] Integrate với `@nai/policy-engine`
- [ ] Verify: sensitive action → approval → audit E2E
- [ ] Evidence: test pass

### P0-B.8 E2E integration test
- [ ] Test: register → login → tenant created → entitlement loaded → sensitive action → approval → audit
- [ ] Verify: toàn bộ chain pass
- [ ] Evidence: E2E test output

---

## P1-A — Core Runtime (Gen1 integration)

### P1-A.1 Gen1 API integration
- [ ] Clone/inspect `Computer.iai.one/` runtime
- [ ] Migrate API logic vào `apps/api/` (Hono on Workers)
- [ ] Verify: `apps/api/` chạy local
- [ ] Evidence: local run output

### P1-A.2 Fix Gen1 issues
- [ ] Fix build broken (missing files, type errors)
- [ ] Fix simulated `/api/command` → real implementation
- [ ] Fix missing memory/data vault object storage
- [ ] Fix stub secrets vault
- [ ] Remove exposed secret trong `.env.local`
- [ ] Verify: `pnpm build` pass + `pnpm typecheck` pass
- [ ] Evidence: build + typecheck output

### P1-A.3 Agent graph
- [ ] Setup `@nai/agent-graph` (langgraph rebrand)
- [ ] Define 9 NAI Agents: Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian
- [ ] Define agent state machine
- [ ] Verify: agent dispatch E2E
- [ ] Evidence: test pass

### P1-A.4 Agent SDK
- [ ] Setup `@nai/agent-sdk` (software-agent-sdk rebrand)
- [ ] Implement tool call interface
- [ ] Implement approval integration
- [ ] Implement evidence generation
- [ ] Verify: tool call → approval → evidence E2E
- [ ] Evidence: test pass

### P1-A.5 LLM platform
- [ ] Setup `@nai/llm-platform` (dify rebrand)
- [ ] Configure model routing: free/standard/pro/enterprise tier
- [ ] Configure prompt management + versioning
- [ ] Verify: model call per tier E2E
- [ ] Evidence: test pass

### P1-A.6 Memory service
- [ ] Setup `@nai/memory` (mem0 rebrand)
- [ ] Implement 6 memory types: session, preference, project, decision, family, founder
- [ ] Implement memory CRUD + search
- [ ] Verify: memory write → read → search E2E
- [ ] Evidence: test pass

### P1-A.7 Vector service
- [ ] Setup `@nai/vector` (qdrant rebrand)
- [ ] Create collections: evidence, knowledge, memory
- [ ] Implement upsert + search
- [ ] Verify: upsert → search E2E
- [ ] Evidence: test pass

### P1-A.8 RAG pipeline
- [ ] Setup `@nai/rag` (llama_index rebrand)
- [ ] Implement document indexing
- [ ] Implement source synthesis + citation
- [ ] Verify: index → query → cited answer E2E
- [ ] Evidence: test pass

### P1-A.9 Evidence engine
- [ ] Build `@nai/evidence` — proof record, audit trail, evidence pack export
- [ ] Schema: evidence (id, tenant, command, agent, tool, input, output, proof_hash, timestamp)
- [ ] Implement evidence pack export (JSON + signed)
- [ ] Verify: command → evidence → export E2E
- [ ] Evidence: test pass

### P1-A.10 Console MVP
- [ ] Build `apps/console/` (app.nguyenai.net)
- [ ] Chat UI (command input + response)
- [ ] Agent panel (9 agents status)
- [ ] Memory panel (view/search memory)
- [ ] Vault panel (file list + upload)
- [ ] Approval panel (pending approvals)
- [ ] Verify: console chạy local + kết nối API
- [ ] Evidence: screenshot + local run

### P1-A.11 E2E runtime test
- [ ] Test: user gửi command → agent chạy → tool call → evidence → audit
- [ ] Verify: toàn bộ chain pass
- [ ] Evidence: E2E test output

---

## P1-B — Product System (Gen2 integration)

> **Gen2 audit status:** NOT independently cloned/executed. Trước khi migrate, dev team phải clone Gen2 repo, build, audit. Không claim production-ready cho Gen2 cho đến khi audit pass.

### P1-B.0 Gen2 pre-integration audit (NEW — prerequisite)
- [ ] Clone Gen2 repo (`maytinhai.org` / `maytinhai-os`)
- [ ] Build Gen2 local
- [ ] Audit: package structure, dependency, broken code, stub
- [ ] Audit: entitlement/billing SDK — verify không violate governance (Gen2 own entitlement + billing)
- [ ] Document audit result
- [ ] Evidence: audit report + commit hash

### P1-B.1 Gen2 migration
- [ ] Migrate `maytinhai.org/packages/` → `nguyenai.net/packages/` với rebrand `@maytinhai/*` → `@nai/*`
- [ ] Migrate `maytinhai-os/packages/`: app-registry, auth, billing, command-system, design-system, email, file-system, fulfillment, integrations, legal, machine-state, security
- [ ] Rebrand tất cả package name
- [ ] Verify: `pnpm install` + `pnpm build` pass sau migration
- [ ] Evidence: build output

### P1-B.2 Catalog service
- [ ] Build `@nai/catalog` — đọc `PRODUCT_CATALOG_9x9.md` → JSON
- [ ] Output: `models.json`, `functional-products.json`, `entitlements.json`, `limits.json`, `prices.json`, `compatibility.json`, `academy-access.json`, `catalog.schema.json`
- [ ] Implement JSON schema validation
- [ ] Verify: catalog load + validate E2E
- [ ] Evidence: test pass

### P1-B.3 Billing service
- [ ] Build `@nai/billing` — subscription recurring
- [ ] Implement: create subscription, upgrade, downgrade, cancel, dunning, proration
- [ ] Integrate với `@nai/entitlement` (subscription change → entitlement change)
- [ ] Verify: subscribe → upgrade → entitlement update E2E
- [ ] Evidence: test pass

### P1-B.4 Payment gateway
- [ ] Tích hợp VNPay (VND) — subscription Model 2-7
- [ ] Tích hợp Stripe (USD) — Enterprise/Sovereign
- [ ] Implement webhook handler
- [ ] Verify: test payment + webhook E2E (sandbox)
- [ ] Evidence: sandbox test output

### P1-B.5 Invoice service
- [ ] Build `@nai/invoice` — VAT VN (10%) + international invoice
- [ ] Implement invoice generation sau payment success
- [ ] Implement invoice PDF export
- [ ] Verify: payment → invoice → PDF E2E
- [ ] Evidence: test pass

### P1-B.6 Vault crypto
- [ ] Build `@nai/vault-crypto` — AES-256-GCM per-tenant key
- [ ] Implement key management (generate, rotate, revoke)
- [ ] Implement encrypt/decrypt file
- [ ] Verify: encrypt → store → decrypt E2E
- [ ] Evidence: test pass

### P1-B.7 Backup
- [ ] Build `@nai/backup` — R2 replication + snapshot
- [ ] Implement scheduled backup
- [ ] Implement restore
- [ ] Verify: backup → restore E2E
- [ ] Evidence: test pass

### P1-B.8 Super Apps (6 AI tools)
- [ ] AI Office — documents, spreadsheets, presentations, reports, minutes, summaries
- [ ] AI Research — web search, PDF reading, source comparison, bibliography
- [ ] AI Content — articles, bilingual, SEO, social media, newsletter
- [ ] AI Browser — controlled web access, page reading, data extraction
- [ ] AI Code — repository audit, write, test, fix, deploy
- [ ] AI Automation — workflow, trigger, scheduled task, notification
- [ ] Verify: mỗi Super App có test cơ bản
- [ ] Evidence: test pass per Super App

### P1-B.9 Nguyen Super Apps (7 Nguyen tools)
- [ ] Nguyen Roots — family graph, family tree, branches, relationships, timeline
- [ ] Nguyen Memory — photos, documents, journals, interviews, oral history, archive
- [ ] Nguyen Knowledge — history, culture, research library, sourced Q&A, bilingual articles
- [ ] Nguyen Trust — claim, source, evidence, verification, dispute, confidence, audit
- [ ] Nguyen Network — individuals, experts, founders, chapters, diaspora, events
- [ ] Nguyen Founders — founder profiles, businesses, projects, mentorship, partnership
- [ ] Nguyen Chapter OS — membership, governance, archive, events, communication, chapter website
- [ ] Verify: mỗi Nguyen App có test cơ bản
- [ ] Evidence: test pass per Nguyen App

### P1-B.10 E2E product test
- [ ] Test: subscribe Personal → mua Office Pro → dùng AI Office → evidence → invoice
- [ ] Verify: toàn bộ chain pass
- [ ] Evidence: E2E test output

---

## P1-C — Automation & Browser

### P1-C.1 Workflow engine
- [ ] Setup `@nai/workflow` (n8n rebrand)
- [ ] Configure scheduled task + trigger
- [ ] Verify: trigger → task E2E
- [ ] Evidence: test pass

### P1-C.2 Browser agent
- [ ] Setup `@nai/browser` (browser-use rebrand)
- [ ] Configure controlled web access (allowlist, denylist)
- [ ] Verify: navigate → read page E2E
- [ ] Evidence: test pass

### P1-C.3 Visual browser
- [ ] Setup `@nai/browser-visual` (skyvern rebrand)
- [ ] Configure form fill, multi-step web workflow
- [ ] Verify: form fill E2E (sandbox site)
- [ ] Evidence: test pass

### P1-C.4 Crew runtime
- [ ] Setup `@nai/crew` (crewAI rebrand)
- [ ] Define crew cho Founder Suite (Founder + Business Operator + Researcher)
- [ ] Define crew cho Business Pack (Business Operator + Global Connector + Sales)
- [ ] Verify: crew collaboration E2E
- [ ] Evidence: test pass

### P1-C.5 Pipeline
- [ ] Setup `@nai/pipeline` (haystack rebrand)
- [ ] Build research pipeline (search → read → synthesize → cite)
- [ ] Build evidence pipeline (collect → verify → pack → export)
- [ ] Verify: pipeline E2E
- [ ] Evidence: test pass

### P1-C.6 Approval gate integration
- [ ] Integrate approval gate vào browser + workflow
- [ ] Mọi external action cần approval
- [ ] Verify: workflow → external action → approval → audit E2E
- [ ] Evidence: test pass

### P1-C.7 E2E automation test
- [ ] Test: workflow trigger → browser agent → data extraction → evidence → audit
- [ ] Verify: toàn bộ chain pass
- [ ] Evidence: E2E test output

---

## P1-D — Observability & Eval

### P1-D.1 LLM observability
- [ ] Setup `@nai/observe-llm` (helicone rebrand)
- [ ] Instrument mọi LLM call → log cost, latency, token
- [ ] Verify: LLM call → observability dashboard E2E
- [ ] Evidence: test pass

### P1-D.2 Tracing
- [ ] Setup `@nai/trace` (langfuse rebrand)
- [ ] Instrument prompt version + session trace
- [ ] Verify: trace E2E
- [ ] Evidence: test pass

### P1-D.3 Eval platform
- [ ] Setup `@nai/eval` (opik rebrand)
- [ ] Define eval dataset + metric
- [ ] Verify: eval run E2E
- [ ] Evidence: test pass

### P1-D.4 Drift monitor
- [ ] Setup `@nai/observe-phoenix` (phoenix rebrand)
- [ ] Configure drift detection
- [ ] Verify: drift alert E2E
- [ ] Evidence: test pass

### P1-D.5 LLM unit test
- [ ] Setup `@nai/test-llm` (deepeval rebrand)
- [ ] Write unit test cho 9 NAI Agents
- [ ] Verify: test pass
- [ ] Evidence: test output

### P1-D.6 Prompt test
- [ ] Setup `@nai/test-prompt` (promptfoo rebrand)
- [ ] Write prompt regression test
- [ ] Write red-team test (jailbreak, PII leak)
- [ ] Verify: test pass
- [ ] Evidence: test output

### P1-D.7 Telemetry pipeline
- [ ] Setup `@nai/telemetry` (opentelemetry-collector rebrand)
- [ ] Configure traces + metrics + logs pipeline
- [ ] Verify: telemetry flow E2E
- [ ] Evidence: test pass

### P1-D.8 Log aggregation
- [ ] Setup `@nai/logs` (loki rebrand)
- [ ] Configure log ingestion + query
- [ ] Verify: log query E2E
- [ ] Evidence: test pass

### P1-D.9 Dashboard
- [ ] Setup `@nai/dashboard` (grafana rebrand)
- [ ] Build system metrics dashboard (latency, error, uptime)
- [ ] Build business KPI dashboard (subscription, revenue, usage)
- [ ] Verify: dashboard render E2E
- [ ] Evidence: screenshot

### P1-D.10 E2E observability test
- [ ] Test: command → trace → cost → eval → dashboard
- [ ] Verify: toàn bộ chain pass
- [ ] Evidence: E2E test output

---

## P1-E — Security & Supply Chain

### P1-E.1 SAST
- [ ] Setup `@nai/security-sast` (semgrep rebrand)
- [ ] Configure CI gate: fail merge on SAST finding
- [ ] Verify: CI gate works
- [ ] Evidence: CI output

### P1-E.2 Image scan
- [ ] Setup `@nai/security-image` (trivy rebrand)
- [ ] Scan mọi container image trước deploy
- [ ] Verify: scan report
- [ ] Evidence: scan output

### P1-E.3 Vuln scan
- [ ] Setup `@nai/security-vuln` (grype rebrand)
- [ ] Configure CI gate: fail on critical vuln
- [ ] Verify: CI gate works
- [ ] Evidence: CI output

### P1-E.4 Secret scan
- [ ] Setup `@nai/security-secret` (gitleaks rebrand)
- [ ] Configure CI gate: fail on secret leak
- [ ] Verify: CI gate works (test với fake secret)
- [ ] Evidence: CI output

### P1-E.5 Artifact signing
- [ ] Setup `@nai/security-sign` (cosign rebrand)
- [ ] Sign mọi container image + package
- [ ] Verify: signature verify E2E
- [ ] Evidence: sign + verify output

### P1-E.6 Provenance
- [ ] Setup `@nai/security-provenance` (slsa rebrand)
- [ ] Generate build provenance attestation
- [ ] Verify: provenance verify E2E
- [ ] Evidence: provenance output

### P1-E.7 Safety classifier
- [ ] Build `@nai/safety` — harmful content + PII leak classifier
- [ ] Rule-based + LLM classifier
- [ ] Integrate vào agent output gate
- [ ] Verify: harmful content blocked E2E
- [ ] Evidence: test pass

### P1-E.8 Security audit
- [ ] Full security audit per `NGUYEN_AI_AI_SAFETY_POLICY.md`
- [ ] External audit (nếu cần)
- [ ] Evidence: audit report

---

## P2-A — Public Site & SEO

### P2-A.1 Bilingual routes
- [ ] Hoàn thiện 24 bilingual routes (VI + EN)
- [ ] Verify: mỗi route render HTML server-side
- [ ] Evidence: build output + screenshot

### P2-A.2 i18n
- [ ] Setup `@nai/i18n` (paraglide)
- [ ] Configure VI/EN
- [ ] Verify: language switch E2E
- [ ] Evidence: test pass

### P2-A.3 SEO schema
- [ ] Implement `@nai/seo-schema` — schema.org
- [ ] Add structured data cho research, founder profile, product
- [ ] Verify: Google Rich Results test pass
- [ ] Evidence: test output

### P2-A.4 Search
- [ ] Implement `@nai/search` — Pagefind (static) + qdrant (semantic)
- [ ] Verify: search E2E
- [ ] Evidence: test pass

### P2-A.5 Sitemap + hreflang
- [ ] Generate sitemap.xml (bilingual)
- [ ] Add hreflang (reciprocal, self-referencing, x-default)
- [ ] Add robots.txt
- [ ] Verify: sitemap valid + hreflang correct
- [ ] Evidence: sitemap + hreflang check

### P2-A.6 SEO audit
- [ ] Bilingual SEO audit per `NGUYEN_AI_SEO_SPEC.md`
- [ ] Evidence: audit report

### P2-A.7 Accessibility audit
- [ ] WCAG 2.1 AA audit
- [ ] Evidence: audit report

### P2-A.8 Deploy
- [ ] Deploy Cloudflare Pages
- [ ] Verify: live URL accessible
- [ ] Evidence: live URL

---

## P2-B — Investor & Academy

### P2-B.1 Investor site
- [ ] Build `apps/investor/` — public + private room
- [ ] Public pages: indexable, canonical, hreflang
- [ ] Private room: noindex, nofollow, noarchive, excluded from sitemap
- [ ] Verify: public page indexable + private room noindex
- [ ] Evidence: HTML check

### P2-B.2 Google OAuth login
- [ ] Implement Google OAuth login cho investor site
- [ ] Capture: Google email, verified email status, profile name (reference only)
- [ ] No password stored — OAuth only
- [ ] Verify: login → session E2E
- [ ] Evidence: test pass

### P2-B.3 Identity declaration
- [ ] Implement identity declaration form: full legal name + date of birth
- [ ] Store encrypted in Neon Postgres
- [ ] This is legal identity of record, not Google profile name
- [ ] Verify: form submit → encrypted store E2E
- [ ] Evidence: test pass

### P2-B.4 verify.iai.one integration
- [ ] Integrate verify.iai.one — document check (ID/passport) + liveness + name/DOB match
- [ ] Redirect to verify.iai.one, receive signed verification token
- [ ] On success: store token in audit log
- [ ] On failure: allow retry (max 3, then manual review)
- [ ] Verify: verification flow E2E
- [ ] Evidence: test pass

### P2-B.5 VN QR checkout
- [ ] Implement VietQR standard QR code generation
- [ ] Pre-fill: account 3051378, ACB HCM, Kasan JSC, memo "INVEST NGUYENAI.NET"
- [ ] Investor specifies amount (min 25K USD equivalent in VND)
- [ ] Verify: QR scan → pre-filled transfer E2E
- [ ] Evidence: QR test

### P2-B.6 USD wire transfer
- [ ] Display VIET CAN NEW CORP wire details (after verification only)
- [ ] Implement wire confirmation upload
- [ ] Founder manually confirms receipt
- [ ] Verify: wire flow E2E
- [ ] Evidence: test pass

### P2-B.7 Receipt matching
- [ ] Implement receipt upload + OCR matching (memo + amount)
- [ ] Match against expected memo: "INVEST NGUYENAI.NET" or "Tiền Việt Đầu tư CP vào cty cùng NguyenAI.net"
- [ ] On match: payment confirmed
- [ ] On mismatch: manual review by founder
- [ ] Verify: match + mismatch E2E
- [ ] Evidence: test pass

### P2-B.8 2FA activation
- [ ] Implement 2FA: TOTP (Google Authenticator, Authy) + SMS
- [ ] TOTP preferred
- [ ] 2FA secret stored encrypted, recovery codes generated
- [ ] User must verify 2FA code to complete activation
- [ ] Verify: 2FA setup + verify E2E
- [ ] Evidence: test pass

### P2-B.9 Private room access
- [ ] Implement room access: 90-day expiry, revocable, audit log, 2FA gate
- [ ] Every access requires 2FA code
- [ ] Every access logged in audit trail
- [ ] Access revocable by founder
- [ ] Verify: access → 2FA → audit E2E
- [ ] Evidence: test pass

### P2-B.10 Academy site
- [ ] Build `apps/academy/` — course platform
- [ ] Course list, course detail, lesson, quiz
- [ ] Verify: course render E2E
- [ ] Evidence: screenshot

### P2-B.11 Academy billing
- [ ] Implement Academy Pass entitlement (separate)
- [ ] Implement certification fee (per attempt)
- [ ] Verify: buy Academy Pass → access course E2E
- [ ] Evidence: test pass

### P2-B.12 Email template
- [ ] Build `@nai/email-template` (react-email)
- [ ] Templates: welcome, verification, payment confirmation, 2FA, room access, expiry notice
- [ ] Bilingual VI/EN
- [ ] Verify: email render E2E
- [ ] Evidence: email screenshot

### P2-B.13 Email service
- [ ] Tích hợp Resend (temporary — founder provides API key when needed)
- [ ] Verify: send email E2E (sandbox)
- [ ] Evidence: sandbox output

### P2-B.14 Push notification
- [ ] Build `@nai/push` — Web Push + FCM
- [ ] Verify: push E2E
- [ ] Evidence: test pass

### P2-B.15 Legal sign-off
- [ ] Legal review invest.nguyenai.net trước publish
- [ ] Founder + Legal sign-off
- [ ] Evidence: sign-off doc

---

## P2-C — Infra & Deploy

### P2-C.1 Terraform
- [ ] Setup `@nai/infra-tf` (terraform rebrand)
- [ ] Provision: Cloudflare Pages, Workers, R2, KV, D1
- [ ] Provision: Neon Postgres
- [ ] Verify: `terraform plan` clean
- [ ] Evidence: plan output

### P2-C.2 Kubernetes
- [ ] Setup `@nai/infra-k8s` (kubernetes rebrand)
- [ ] Manifests cho Sovereign/Enterprise on-prem
- [ ] Verify: `kubectl apply --dry-run` pass
- [ ] Evidence: dry-run output

### P2-C.3 ArgoCD
- [ ] Setup `@nai/cd` (argo-cd rebrand)
- [ ] Configure GitOps: git push → auto deploy
- [ ] Verify: GitOps E2E
- [ ] Evidence: deploy log

### P2-C.4 CI/CD
- [ ] Setup GitHub Actions: build → test → scan → sign → deploy
- [ ] Configure preview environment per PR
- [ ] Verify: PR → preview URL E2E
- [ ] Evidence: PR + preview URL

### P2-C.5 Preview env
- [ ] Cloudflare Pages preview per PR
- [ ] Verify: preview URL accessible
- [ ] Evidence: preview URL

### P2-C.6 Feature flag
- [ ] Implement `@nai/flag` — feature flag
- [ ] Verify: flag toggle E2E
- [ ] Evidence: test pass

### P2-C.7 Production deploy
- [ ] Deploy nguyenai.net + app.nguyenai.net + api.nguyenai.net
- [ ] Verify: all live URLs accessible
- [ ] Evidence: live URLs

### P2-C.8 Status page
- [ ] Build `apps/status/` (status.nguyenai.net)
- [ ] Verify: status page live
- [ ] Evidence: live URL

---

## P3 — Hardening & Release

### P3.1 Security audit
- [ ] Full security audit (internal + external)
- [ ] Evidence: audit report

### P3.2 Privacy/data audit
- [ ] Full privacy/data audit per `DATA_CLASSIFICATION_AND_RETENTION.md`
- [ ] Verify: 15 data classes enforced
- [ ] Evidence: audit report

### P3.3 Commerce audit
- [ ] Payment, invoice, billing audit
- [ ] Evidence: audit report

### P3.4 Load test
- [ ] Load test (k6 hoặc tương đương)
- [ ] Chaos test
- [ ] Evidence: test report

### P3.5 Release evidence pack
- [ ] Compile: security audit + privacy audit + commerce audit + load test + E2E test
- [ ] Evidence: evidence pack

### P3.6 Founder sign-off
- [ ] Founder review + sign-off production release
- [ ] Evidence: sign-off doc

---

## Summary

- **Total tasks:** 103
- **P0-A:** 7 tasks (tuần 1-2)
- **P0-B:** 8 tasks (tuần 2-4)
- **P1-A:** 11 tasks (tuần 4-8)
- **P1-B:** 11 tasks (tuần 6-10, gồm P1-B.0 Gen2 pre-audit)
- **P1-C:** 7 tasks (tuần 8-12)
- **P1-D:** 10 tasks (tuần 10-12)
- **P1-E:** 8 tasks (tuần 10-12)
- **P2-A:** 8 tasks (tuần 12-14)
- **P2-B:** 15 tasks (tuần 14-16, gồm Google OAuth + verify.iai.one + QR checkout + 2FA + room)
- **P2-C:** 8 tasks (tuần 14-16)
- **P3:** 6 tasks (tuần 16-18)

---

## Change log

| Date | Version | Change | By |
|---|---|---|---|
| 2026-07-02 | V1.0 | Initial execution checklist — 103 tasks | Founder |
