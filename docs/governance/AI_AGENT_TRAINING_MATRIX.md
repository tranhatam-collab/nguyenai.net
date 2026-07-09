# AI Agent Training Matrix

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`, `PRODUCT_BOUNDARY_CONTRACT.md`
- **Source of truth for agent definitions:** `apps/web/src/data/pages.ts`, `apps/api/src/routes/agents.ts`

---

## 1. Purpose

Lock the 9-agent team definition, their roles, capabilities, default tiers, and training boundaries. No agent may be added, removed, or renamed without Founder approval. This matrix defines which agent handles which task, what data it may access, and what guardrails apply.

---

## 2. The 9 agents (locked)

| # | Agent (EN) | Agent (VI) | Tag | Role | Default tier |
|---|------------|------------|-----|------|-------------|
| 1 | Nguyen Guide | Nguyễn Điều Phối | Lõi | Primary coordinator — receives commands, plans, distributes work, synthesizes results | all |
| 2 | Nguyen Researcher | Nguyễn Nghiên Cứu | Nghiên cứu | Research — web search, PDF, source comparison, document synthesis | standard+ |
| 3 | Nguyen Archivist | Nguyễn Lưu Trữ | Lưu trữ | Document and artifact management, genealogy, archive, metadata | standard+ |
| 4 | Nguyen Verifier | Nguyễn Kiểm Chứng | Minh chứng | Evidence verification, claim checking, fact-checking, confidence labels | standard+ |
| 5 | Nguyen Family Steward | Nguyễn Quản Gia | Gia đình | Family memory, oral history, generational permissions, family vault | standard+ |
| 6 | Nguyen Founder | Nguyễn Sáng Lập | Sáng lập | Strategy, pitch deck, fundraising, decision log, founder OS | pro+ |
| 7 | Nguyen Business Operator | Nguyễn Vận Hành | Doanh nghiệp | Business operations, SOP, CRM, automation, business OS | business+ |
| 8 | Nguyen Global Connector | Nguyễn Kết Nối | Kết nối | Diaspora, network, global community connection, chapter websites | business+ |
| 9 | Nguyen Guardian | Nguyễn Thủ Hộ | Bảo mật | Security, permissions, approvals, audit log, data governance | all |

### 2.1 Naming rules

- English name: `Nguyen [Role]` (e.g., `Nguyen Guide`)
- Vietnamese name: `Nguyễn [Role VI]` (e.g., `Nguyễn Điều Phối`)
- Code identifier: `nguyen-[kebab-role]` (e.g., `nguyen-guide`)
- Agent names are product names — protected by `FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md`

---

## 3. Capabilities by agent

| Agent | Capabilities |
|-------|-------------|
| Nguyen Guide | `planning`, `coordination`, `task_distribution`, `synthesis`, `onboarding` |
| Nguyen Researcher | `web_search`, `pdf_analysis`, `source_comparison`, `document_synthesis`, `bibliography` |
| Nguyen Archivist | `document_management`, `genealogy`, `archive`, `metadata`, `digitization` |
| Nguyen Verifier | `fact_checking`, `evidence_labeling`, `confidence_scoring`, `claim_verification` |
| Nguyen Family Steward | `family_memory`, `oral_history`, `generational_permissions`, `family_vault`, `interview` |
| Nguyen Founder | `strategy`, `pitch_deck`, `fundraising`, `decision_log`, `founder_os` |
| Nguyen Business Operator | `business_operations`, `sop`, `crm`, `automation`, `business_os` |
| Nguyen Global Connector | `diaspora`, `network`, `community_building`, `chapter_websites` |
| Nguyen Guardian | `security`, `permissions`, `approvals`, `audit_log`, `data_governance` |

---

## 4. Data access matrix

| Agent | Public | Internal | Confidential | Restricted |
|-------|--------|----------|---------------|------------|
| Nguyen Guide | ✅ | ✅ | ❌ | ❌ |
| Nguyen Researcher | ✅ | ✅ | with consent | ❌ |
| Nguyen Archivist | ✅ | ✅ | with consent | with owner consent |
| Nguyen Verifier | ✅ | ✅ | ✅ (verify only, no export) | with owner consent |
| Nguyen Family Steward | ✅ | ✅ | ✅ | ✅ (family scope only) |
| Nguyen Founder | ✅ | ✅ | ✅ | ❌ |
| Nguyen Business Operator | ✅ | ✅ | ✅ (business scope) | ❌ |
| Nguyen Global Connector | ✅ | ✅ | ❌ | ❌ |
| Nguyen Guardian | ✅ | ✅ | ✅ (audit only) | ✅ (audit only) |

### 4.1 Restricted data rules

- **Restricted** = living-person data, family trees, private family documents
- Only Nguyen Family Steward (family scope) and Nguyen Guardian (audit only) may access
- All restricted access is logged in audit trail
- Restricted data never leaves the user's tenant boundary

---

## 5. Agent role selection in training gateway

The training gateway selects an agent role based on `task_hint` (see `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md` §4). The selected agent role is metadata — it influences system prompt and capability routing, but does not override model selection.

### 5.1 Task hint mapping

| task_hint contains | Agent selected |
|---|---|
| code, technical, program | Nguyễn Kỹ Thuật* |
| research, study, investigate | Nguyễn Nghiên Cứu |
| write, content, edit | Nguyễn Biên Tập* |
| plan, strategy, roadmap | Nguyễn Chiến Lược* |
| family, genealogy, roots | Nguyễn Gia Phả* |
| invest, finance, stock | Nguyễn Đầu Tư* |
| edu, teach, scholarship | Nguyễn Giáo Dục* |
| verify, fact, check | Nguyễn Kiểm Chứng |
| (default) | Nguyễn Điều Phối |

*Note: Some agent roles in the training gateway code (Nguyễn Kỹ Thuật, Nguyễn Biên Tập, Nguyễn Chiến Lược, Nguyễn Gia Phả, Nguyễn Đầu Tư, Nguyễn Giáo Dục) are functional aliases that map to the 9 locked agents. Phase 2 will reconcile these aliases with the canonical 9-agent team.

### 5.2 Reconciliation plan (Phase 2)

| Training gateway alias | Canonical agent |
|---|---|
| Nguyễn Kỹ Thuật | Nguyen Guide (with code capability) |
| Nguyễn Biên Tập | Nguyen Researcher (with content capability) |
| Nguyễn Chiến Lược | Nguyen Founder |
| Nguyễn Gia Phả | Nguyen Archivist + Nguyen Family Steward |
| Nguyễn Đầu Tư | Nguyen Founder (with finance capability) |
| Nguyễn Giáo Dục | Nguyen Guide (with edu capability) |

---

## 6. Training boundaries

### 6.1 What agents may do

- Process user commands within their capability set
- Access data within their data access matrix
- Generate responses in the detected language
- Create evidence labels (Nguyen Verifier only)
- Log audit events (Nguyen Guardian only)

### 6.2 What agents may NOT do

- Cross tenant boundaries (no accessing other users' data)
- Make financial/legal/tax decisions (analysis only — see `AGENTS.md` Ethics section)
- Claim AI can confirm ancestry, royal lineage, or bloodline
- Bypass output guard or input policy
- Call LLM providers directly

---

## 7. Agent lifecycle

| Phase | Status | Description |
|-------|--------|-------------|
| Definition | ✅ Done | This matrix (9 agents locked) |
| API endpoint | ✅ Done | `GET /v1/agents` returns all 9 agents |
| Console UI | ✅ Done | `apps/console/src/pages/agents.astro` + `AgentList.tsx` |
| System prompts | Phase 2 | Versioned prompts in `@nai/prism/src/prompts/` |
| Capability routing | Phase 2 | Agent capabilities map to tool families |
| E2E tests | Phase 9 | Verify each agent responds correctly for its task type |

---

## 8. Amendment

Adding, removing, or renaming an agent requires Founder approval. Any change to the data access matrix requires Founder approval + security review by Nguyen Guardian role definition.

This matrix is the source of truth for agent definitions. `apps/web/src/data/pages.ts` and `apps/api/src/routes/agents.ts` must match this document. Discrepancies are bugs.
